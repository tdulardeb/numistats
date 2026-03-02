import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

interface TestCase {
  question: string;
  expected?: string;
}

interface TestConfig {
  apiUrl?: string;
  apiKey?: string;
  bearerToken?: string;
  threshold?: number;
  skipValidation?: boolean;
}

interface TestResult {
  index: number;
  question: string;
  expected: string;
  response: string;
  status: 'PASS' | 'FAIL' | 'ERROR' | 'SKIP' | 'NO_VALIDADO';
  reason: string;
  latencyMs: number;
  httpStatus?: number;
}

interface TestMetrics {
  total: number;
  success: number;
  failed: number;
  errors: number;
  skipped: number;
  validated: number;
  successRate: number;
  threshold: number;
  passed: boolean;
  avgLatencyMs: number;
}

function buildPayload(question: string) {
  return {
    input_value: question,
    output_type: 'chat',
    input_type: 'chat',
    session_id: 'Testing RAG',
  };
}

function extractText(respJson: Record<string, unknown>): string {
  const candidates: string[] = [];

  try {
    const outputs = respJson['outputs'] as Array<Record<string, unknown>>;
    const first = outputs[0]['outputs'] as Array<Record<string, unknown>>;
    const results = first[0]['results'] as Record<string, unknown>;
    const message = results['message'] as Record<string, unknown>;
    candidates.push(message['text'] as string);
  } catch {
    // ignore
  }

  const paths: Array<Array<string | number>> = [
    ['outputs', 0, 'outputs', 0, 'results', 'text'],
    ['outputs', 0, 'outputs', 0, 'results', 'message', 'text'],
    ['result', 'text'],
    ['message', 'text'],
    ['text'],
    ['output'],
    ['answer'],
    ['response'],
  ];

  for (const path of paths) {
    let cur: unknown = respJson;
    let ok = true;
    for (const p of path) {
      try {
        if (typeof p === 'number' && Array.isArray(cur)) {
          cur = (cur as unknown[])[p];
        } else if (typeof p === 'string' && cur && typeof cur === 'object') {
          cur = (cur as Record<string, unknown>)[p];
        } else {
          ok = false;
          break;
        }
      } catch {
        ok = false;
        break;
      }
    }
    if (ok && typeof cur === 'string') {
      candidates.push(cur);
    }
  }

  if (respJson['messages'] && Array.isArray(respJson['messages'])) {
    for (const m of respJson['messages'] as Array<Record<string, unknown>>) {
      if (m && typeof m['text'] === 'string') {
        candidates.push(m['text'] as string);
      }
    }
  }

  for (const c of candidates) {
    if (c && c.trim()) return c.trim();
  }
  return '';
}

async function postWithRetries(
  url: string,
  headers: Record<string, string>,
  body: unknown,
  retries = 2
): Promise<{ status: number; json: () => Promise<Record<string, unknown>> }> {
  let lastErr: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(120_000),
      });
      return res as unknown as { status: number; json: () => Promise<Record<string, unknown>> };
    } catch (e) {
      lastErr = e as Error;
      await new Promise((r) => setTimeout(r, Math.min(2 ** attempt * 1000, 10_000)));
    }
  }
  throw lastErr;
}

async function validateResponse(
  apiUrl: string,
  headers: Record<string, string>,
  expected: string,
  actual: string
): Promise<{ valid: boolean; reason: string }> {
  if (!expected.trim() || !actual.trim()) {
    return { valid: false, reason: 'Respuesta vacía' };
  }

  const validationPrompt = `Sos un evaluador de respuestas de un agente de soporte. 
Compará la respuesta esperada con la respuesta del agente y determiná si son EQUIVALENTES en contenido y significado.
No es necesario que sean idénticas, pero deben transmitir la misma información clave.

RESPUESTA ESPERADA:
${expected}

RESPUESTA DEL AGENTE:
${actual}

Respondé ÚNICAMENTE con un JSON en este formato exacto (sin texto adicional):
{"valida": true/false, "razon": "explicación breve"}`;

  try {
    const res = await postWithRetries(apiUrl, headers, buildPayload(validationPrompt));
    if (res.status >= 400) {
      return { valid: false, reason: `Error HTTP ${res.status}` };
    }

    const respJson = await res.json();
    const answer = extractText(respJson);

    try {
      const start = answer.indexOf('{');
      const end = answer.lastIndexOf('}') + 1;
      if (start >= 0 && end > start) {
        const parsed = JSON.parse(answer.slice(start, end));
        return { valid: !!parsed['valida'], reason: String(parsed['razon'] || 'Sin razón') };
      }
    } catch {
      // fallback
    }

    const lower = answer.toLowerCase();
    if (
      lower.includes('true') ||
      lower.includes('válida') ||
      lower.includes('valida') ||
      lower.includes('correcta') ||
      lower.includes('equivalente')
    ) {
      return { valid: true, reason: 'Validación positiva detectada' };
    }
    return { valid: false, reason: 'Validación negativa o no determinada' };
  } catch (e) {
    return { valid: false, reason: `Error: ${(e as Error).constructor?.name ?? 'Unknown'}` };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const testCases: TestCase[] = body.testCases ?? [];
    const config: TestConfig = body.config ?? {};

    const apiUrl = config.apiUrl || process.env.LANGFLOW_API_URL || '';
    const apiKey = config.apiKey || process.env.LANGFLOW_API_KEY || '';
    const rawBearer = config.bearerToken || process.env.BEARER_TOKEN || '';
    const threshold = config.threshold ?? 90;
    const skipValidation = config.skipValidation ?? false;

    if (!apiUrl || !apiKey) {
      return NextResponse.json(
        { error: 'Falta API URL o API Key. Configurá las variables de entorno o ingresalas manualmente.' },
        { status: 400 }
      );
    }

    const bearerToken = rawBearer.toLowerCase().startsWith('bearer ')
      ? rawBearer
      : rawBearer
      ? `Bearer ${rawBearer}`
      : '';

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Origin: 'https://api.journeybuilder.numia.co',
      Referer: 'https://journeybuilder.desa.numia.co/',
      'x-api-key': apiKey,
    };
    if (bearerToken) {
      headers['Authorization'] = bearerToken;
    }

    const results: TestResult[] = [];
    let successCount = 0;
    let failedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    let totalLatency = 0;

    for (let i = 0; i < testCases.length; i++) {
      const { question, expected = '' } = testCases[i];

      if (!question.trim()) {
        results.push({
          index: i + 1,
          question,
          expected,
          response: '',
          status: 'SKIP',
          reason: 'Pregunta vacía',
          latencyMs: 0,
        });
        skippedCount++;
        continue;
      }

      const t0 = Date.now();
      try {
        const res = await postWithRetries(apiUrl, headers, buildPayload(question));
        const latencyMs = Date.now() - t0;
        totalLatency += latencyMs;

        if (res.status >= 400) {
          results.push({
            index: i + 1,
            question,
            expected,
            response: '',
            status: 'ERROR',
            reason: `HTTP ${res.status}`,
            latencyMs,
            httpStatus: res.status,
          });
          errorCount++;
          continue;
        }

        const respJson = await res.json();
        const responseText = extractText(respJson);

        if (!responseText) {
          results.push({
            index: i + 1,
            question,
            expected,
            response: '',
            status: 'ERROR',
            reason: 'Sin respuesta del agente',
            latencyMs,
          });
          errorCount++;
          continue;
        }

        if (skipValidation || !expected.trim()) {
          results.push({
            index: i + 1,
            question,
            expected,
            response: responseText,
            status: 'NO_VALIDADO',
            reason: 'Sin respuesta esperada para validar',
            latencyMs,
          });
        } else {
          const { valid, reason } = await validateResponse(apiUrl, headers, expected, responseText);
          results.push({
            index: i + 1,
            question,
            expected,
            response: responseText,
            status: valid ? 'PASS' : 'FAIL',
            reason,
            latencyMs,
          });
          if (valid) successCount++;
          else failedCount++;
        }
      } catch (e) {
        const latencyMs = Date.now() - t0;
        results.push({
          index: i + 1,
          question,
          expected,
          response: '',
          status: 'ERROR',
          reason: `Excepción: ${(e as Error).message?.slice(0, 100) ?? 'Unknown'}`,
          latencyMs,
        });
        errorCount++;
      }
    }

    const validated = successCount + failedCount;
    const successRate = validated > 0 ? (successCount / validated) * 100 : 0;
    const validatedCount = results.filter((r) => r.latencyMs > 0).length;
    const avgLatencyMs = validatedCount > 0 ? Math.round(totalLatency / validatedCount) : 0;

    const metrics: TestMetrics = {
      total: testCases.length,
      success: successCount,
      failed: failedCount,
      errors: errorCount,
      skipped: skippedCount,
      validated,
      successRate: Math.round(successRate * 10) / 10,
      threshold,
      passed: validated > 0 && successRate >= threshold,
      avgLatencyMs,
    };

    return NextResponse.json({ results, metrics });
  } catch (e) {
    return NextResponse.json({ error: `Error interno: ${(e as Error).message}` }, { status: 500 });
  }
}
