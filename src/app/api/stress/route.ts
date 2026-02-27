import { NextRequest, NextResponse } from 'next/server';

export interface StressRequestResult {
  index: number;
  status: 'success' | 'error';
  latencyMs: number;
  httpStatus?: number;
  error?: string;
}

export interface StressStats {
  total: number;
  success: number;
  errors: number;
  avgLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  p95LatencyMs: number;
}

export async function POST(req: NextRequest) {
  const { webhookUrl, apiKey, concurrency, message } = await req.json();

  if (!webhookUrl?.trim()) {
    return NextResponse.json({ error: 'webhookUrl es requerido.' }, { status: 400 });
  }

  const count = Math.max(1, Math.min(200, Number(concurrency) || 10));

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey?.trim()) {
    headers['x-api-key'] = apiKey.trim();
  }

  const body = JSON.stringify({
    input_value: message?.trim() || 'stress test',
    output_type: 'chat',
    input_type: 'chat',
    session_id: 'Testing RAG',
  });

  const tasks = Array.from({ length: count }, async (_, i): Promise<StressRequestResult> => {
    const start = Date.now();
    try {
      const res = await fetch(webhookUrl.trim(), {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(60_000),
      });
      const latencyMs = Date.now() - start;
      return {
        index: i + 1,
        status: res.ok ? 'success' : 'error',
        httpStatus: res.status,
        latencyMs,
      };
    } catch (e) {
      return {
        index: i + 1,
        status: 'error',
        latencyMs: Date.now() - start,
        error: (e as Error).message,
      };
    }
  });

  const results = await Promise.all(tasks);

  const latencies = results.map((r) => r.latencyMs).sort((a, b) => a - b);
  const sum = latencies.reduce((acc, v) => acc + v, 0);
  const p95Index = Math.min(Math.floor(latencies.length * 0.95), latencies.length - 1);

  const stats: StressStats = {
    total: results.length,
    success: results.filter((r) => r.status === 'success').length,
    errors: results.filter((r) => r.status === 'error').length,
    avgLatencyMs: Math.round(sum / latencies.length),
    minLatencyMs: latencies[0],
    maxLatencyMs: latencies[latencies.length - 1],
    p95LatencyMs: latencies[p95Index],
  };

  return NextResponse.json({ results, stats });
}
