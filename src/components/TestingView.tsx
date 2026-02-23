'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  Paper,
  Slider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TokenIcon from '@mui/icons-material/Token';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import DownloadIcon from '@mui/icons-material/Download';
import SettingsIcon from '@mui/icons-material/Settings';
import BiotechIcon from '@mui/icons-material/Biotech';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

interface TestCase {
  id: string;
  question: string;
  expected: string;
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

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function parseCSV(text: string): TestCase[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];

  const sep = lines[0].includes(';') ? ';' : ',';

  const rawHeaders = lines[0].split(sep).map((h) => h.replace(/^["']|["']$/g, '').trim());

  const questionIdx = rawHeaders.findIndex((h) =>
    /pregunta|question|query/i.test(h)
  );
  const expectedIdx = rawHeaders.findIndex((h) =>
    /esperada|expected|answer|respuesta/i.test(h)
  );

  if (questionIdx === -1) {
    // No header row detected – treat first column as question
    return lines.map((l) => {
      const cols = l.split(sep).map((c) => c.replace(/^["']|["']$/g, '').trim());
      return { id: generateId(), question: cols[0] ?? '', expected: cols[1] ?? '' };
    });
  }

  return lines.slice(1).map((l) => {
    const cols = l.split(sep).map((c) => c.replace(/^["']|["']$/g, '').trim());
    return {
      id: generateId(),
      question: cols[questionIdx] ?? '',
      expected: expectedIdx >= 0 ? cols[expectedIdx] ?? '' : '',
    };
  });
}

function StatusChip({ status }: { status: TestResult['status'] }) {
  const map: Record<
    TestResult['status'],
    { label: string; color: 'success' | 'error' | 'warning' | 'default'; icon: React.ReactNode }
  > = {
    PASS: { label: 'PASS', color: 'success', icon: <CheckCircleIcon sx={{ fontSize: 14 }} /> },
    FAIL: { label: 'FAIL', color: 'error', icon: <CancelIcon sx={{ fontSize: 14 }} /> },
    ERROR: { label: 'ERROR', color: 'error', icon: <ErrorIcon sx={{ fontSize: 14 }} /> },
    SKIP: { label: 'SKIP', color: 'default', icon: <InfoIcon sx={{ fontSize: 14 }} /> },
    NO_VALIDADO: { label: 'OK (sin validar)', color: 'warning', icon: <InfoIcon sx={{ fontSize: 14 }} /> },
  };
  const { label, color, icon } = map[status];
  return (
    <Chip
      label={label}
      color={color}
      size="small"
      icon={icon as React.ReactElement}
      sx={{ fontWeight: 700, fontSize: '0.7rem' }}
    />
  );
}

function MetricCard({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  color?: string;
  sub?: string;
}) {
  return (
    <Card
      sx={{
        flex: 1,
        minWidth: 120,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={700} sx={{ color: color || 'text.primary', lineHeight: 1.2, mt: 0.5 }}>
          {value}
        </Typography>
        {sub && (
          <Typography variant="caption" color="text.secondary">
            {sub}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default function TestingView() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [testCases, setTestCases] = useState<TestCase[]>([
    { id: generateId(), question: '', expected: '' },
  ]);
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [bearerToken, setBearerToken] = useState('');
  const [threshold, setThreshold] = useState<number>(90);
  const [skipValidation, setSkipValidation] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showBearer, setShowBearer] = useState(false);

  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [metrics, setMetrics] = useState<TestMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length > 0) {
        setTestCases(parsed);
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  }, []);

  const addTestCase = () => {
    setTestCases((prev) => [...prev, { id: generateId(), question: '', expected: '' }]);
  };

  const removeTestCase = (id: string) => {
    setTestCases((prev) => (prev.length > 1 ? prev.filter((tc) => tc.id !== id) : prev));
  };

  const updateTestCase = (id: string, field: 'question' | 'expected', value: string) => {
    setTestCases((prev) => prev.map((tc) => (tc.id === id ? { ...tc, [field]: value } : tc)));
  };

  const handleRunClick = () => {
    const validCases = testCases.filter((tc) => tc.question.trim());
    if (validCases.length === 0) {
      setError('Ingresá al menos una pregunta para ejecutar los tests.');
      return;
    }
    setConfirmOpen(true);
  };

  const runTests = async () => {
    setConfirmOpen(false);
    const validCases = testCases.filter((tc) => tc.question.trim());

    setRunning(true);
    setError(null);
    setResults(null);
    setMetrics(null);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 100 / (validCases.length * 3), 95));
    }, 1000);

    try {
      const res = await fetch('/api/testing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testCases: validCases.map(({ question, expected }) => ({ question, expected })),
          config: {
            ...(apiUrl.trim() ? { apiUrl: apiUrl.trim() } : {}),
            ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
            ...(bearerToken.trim() ? { bearerToken: bearerToken.trim() } : {}),
            threshold,
            skipValidation,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Error al ejecutar los tests.');
      } else {
        setResults(data.results);
        setMetrics(data.metrics);
      }
    } catch (e) {
      setError(`Error de conexión: ${(e as Error).message}`);
    } finally {
      clearInterval(progressInterval);
      setProgress(100);
      setRunning(false);
    }
  };

  const downloadCSV = () => {
    if (!results) return;
    const headers = ['#', 'Pregunta', 'Respuesta Esperada', 'Respuesta del Agente', 'Estado', 'Razón', 'Latencia (ms)'];
    const rows = results.map((r) => [
      r.index,
      `"${r.question.replace(/"/g, '""')}"`,
      `"${r.expected.replace(/"/g, '""')}"`,
      `"${r.response.replace(/"/g, '""')}"`,
      r.status,
      `"${r.reason.replace(/"/g, '""')}"`,
      r.latencyMs,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-results-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <BiotechIcon sx={{ color: 'white', fontSize: 22 }} />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Testing Automatizado
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enviá preguntas a NumiAgent y validá las respuestas semánticamente con IA
          </Typography>
        </Box>
      </Box>

      {/* Configuration Panel */}
      <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
          onClick={() => setShowConfig((v) => !v)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsIcon sx={{ fontSize: 18, color: 'primary.main' }} />
            <Typography variant="subtitle2" fontWeight={600}>
              Configuración
            </Typography>
            <Chip
              label={apiUrl || process.env.NEXT_PUBLIC_LANGFLOW_API_URL ? 'Configurado' : 'Usando defaults del servidor'}
              size="small"
              color={apiUrl ? 'success' : 'default'}
              sx={{ fontSize: '0.65rem', height: 20 }}
            />
          </Box>
          <IconButton size="small">
            {showConfig ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
        <Collapse in={showConfig}>
          <Divider />
          <CardContent>
            <Grid container spacing={2}>
              <Grid size={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="API URL"
                  placeholder="https://api.journeybuilder.numia.co/api/v1/run/..."
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  helperText="Dejá vacío para usar la URL configurada en el servidor"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="API Key"
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  helperText="Dejá vacío para usar la key del servidor"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowApiKey((v) => !v)}>
                          {showApiKey ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Bearer Token"
                  type={showBearer ? 'text' : 'password'}
                  placeholder="Bearer eyJ..."
                  value={bearerToken}
                  onChange={(e) => setBearerToken(e.target.value)}
                  helperText="Dejá vacío para usar el token del servidor"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowBearer((v) => !v)}>
                          {showBearer ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                  Umbral de éxito: <strong>{threshold}%</strong>
                </Typography>
                <Slider
                  value={threshold}
                  onChange={(_, v) => setThreshold(v as number)}
                  min={0}
                  max={100}
                  step={5}
                  marks={[
                    { value: 0, label: '0%' },
                    { value: 50, label: '50%' },
                    { value: 90, label: '90%' },
                    { value: 100, label: '100%' },
                  ]}
                  sx={{ mt: 1 }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', alignItems: 'flex-end' }}>
                <Button
                  variant={skipValidation ? 'contained' : 'outlined'}
                  color={skipValidation ? 'warning' : 'inherit'}
                  size="small"
                  onClick={() => setSkipValidation((v) => !v)}
                  startIcon={<InfoIcon />}
                >
                  {skipValidation ? 'Validación desactivada' : 'Activar validación IA'}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Collapse>
      </Card>

      {/* Test Cases */}
      <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              Casos de Test ({testCases.length})
            </Typography>
            <Stack direction="row" spacing={1}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".csv,.txt"
                style={{ display: 'none' }}
              />
              <Tooltip title="Importar CSV con columnas: Pregunta, Respuesta Esperada">
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<UploadFileIcon />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Importar CSV
                </Button>
              </Tooltip>
              <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={addTestCase}>
                Agregar
              </Button>
            </Stack>
          </Box>

          <Stack spacing={1.5}>
            {testCases.map((tc, idx) => (
              <Box
                key={tc.id}
                sx={{
                  display: 'flex',
                  gap: 1,
                  alignItems: 'flex-start',
                  p: 1.5,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'action.hover',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    mt: 1.2,
                    minWidth: 24,
                    textAlign: 'right',
                    fontWeight: 600,
                  }}
                >
                  {idx + 1}
                </Typography>
                <TextField
                  size="small"
                  placeholder="Pregunta al agente..."
                  value={tc.question}
                  onChange={(e) => updateTestCase(tc.id, 'question', e.target.value)}
                  multiline
                  minRows={1}
                  maxRows={3}
                  sx={{ flex: 1 }}
                />
                <TextField
                  size="small"
                  placeholder="Respuesta esperada (opcional, para validar)"
                  value={tc.expected}
                  onChange={(e) => updateTestCase(tc.id, 'expected', e.target.value)}
                  multiline
                  minRows={1}
                  maxRows={3}
                  sx={{ flex: 1 }}
                />
                <Tooltip title="Eliminar">
                  <IconButton
                    size="small"
                    onClick={() => removeTestCase(tc.id)}
                    sx={{ color: 'text.secondary', mt: 0.5 }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Run Button */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={running ? <CircularProgress size={18} color="inherit" /> : <PlayArrowIcon />}
          onClick={handleRunClick}
          disabled={running}
          sx={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
            px: 4,
            fontWeight: 700,
          }}
        >
          {running ? 'Ejecutando tests...' : 'Ejecutar Tests'}
        </Button>
        {results && (
          <Button variant="outlined" size="large" startIcon={<DownloadIcon />} onClick={downloadCSV}>
            Exportar CSV
          </Button>
        )}
        <Typography variant="caption" color="text.secondary">
          {testCases.filter((t) => t.question.trim()).length} pregunta(s) válida(s)
        </Typography>
      </Box>

      {/* Progress */}
      {running && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: 'action.hover',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #8b5cf6, #a855f7)',
                borderRadius: 4,
              },
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            Enviando preguntas al agente y validando respuestas...
          </Typography>
        </Box>
      )}

      {/* Error */}
      {error && (
        <Paper
          sx={{
            p: 2,
            mb: 3,
            bgcolor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 2,
          }}
        >
          <Typography variant="body2" color="error" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ErrorIcon fontSize="small" />
            {error}
          </Typography>
        </Paper>
      )}

      {/* Results */}
      {metrics && results && (
        <>
          {/* Metrics Summary */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Resultados
              </Typography>
              <Chip
                label={metrics.passed ? 'SUITE PASSED' : metrics.validated === 0 ? 'SIN VALIDAR' : 'SUITE FAILED'}
                color={metrics.passed ? 'success' : metrics.validated === 0 ? 'default' : 'error'}
                size="small"
                sx={{ fontWeight: 700 }}
              />
            </Box>

            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              <MetricCard label="Total" value={metrics.total} />
              <MetricCard
                label="Pass"
                value={metrics.success}
                color="#10b981"
                sub={metrics.validated > 0 ? `${metrics.successRate}%` : undefined}
              />
              <MetricCard label="Fail" value={metrics.failed} color="#ef4444" />
              <MetricCard label="Errores" value={metrics.errors} color="#f59e0b" />
              <MetricCard
                label="Tasa de éxito"
                value={`${metrics.successRate}%`}
                color={
                  metrics.successRate >= metrics.threshold
                    ? '#10b981'
                    : metrics.successRate >= metrics.threshold * 0.7
                    ? '#f59e0b'
                    : '#ef4444'
                }
                sub={`Umbral: ${metrics.threshold}%`}
              />
              <MetricCard
                label="Latencia prom."
                value={`${metrics.avgLatencyMs}ms`}
                color={metrics.avgLatencyMs < 3000 ? '#10b981' : metrics.avgLatencyMs < 8000 ? '#f59e0b' : '#ef4444'}
              />
            </Stack>

            {/* Success Rate Bar */}
            {metrics.validated > 0 && (
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Progreso hacia umbral ({metrics.threshold}%)
                  </Typography>
                  <Typography variant="caption" fontWeight={600}>
                    {metrics.successRate}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(metrics.successRate, 100)}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    bgcolor: 'action.hover',
                    '& .MuiLinearProgress-bar': {
                      background:
                        metrics.successRate >= metrics.threshold
                          ? 'linear-gradient(90deg, #10b981, #34d399)'
                          : 'linear-gradient(90deg, #ef4444, #f87171)',
                      borderRadius: 5,
                    },
                  }}
                />
              </Box>
            )}
          </Box>

          {/* Results Table */}
          <TableContainer component={Paper} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 700, width: 40 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Pregunta</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 100 }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 80 }}>Latencia</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 40 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((r) => (
                  <>
                    <TableRow
                      key={r.index}
                      hover
                      sx={{
                        cursor: 'pointer',
                        bgcolor:
                          r.status === 'PASS'
                            ? 'rgba(16, 185, 129, 0.04)'
                            : r.status === 'FAIL' || r.status === 'ERROR'
                            ? 'rgba(239, 68, 68, 0.04)'
                            : undefined,
                      }}
                      onClick={() => setExpandedRow(expandedRow === r.index ? null : r.index)}
                    >
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" fontWeight={600}>
                          {r.index}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            maxWidth: 500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {r.question}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <StatusChip status={r.status} />
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color={
                            r.latencyMs < 3000
                              ? 'success.main'
                              : r.latencyMs < 8000
                              ? 'warning.main'
                              : 'error.main'
                          }
                          fontWeight={600}
                        >
                          {r.latencyMs > 0 ? `${r.latencyMs}ms` : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton size="small">
                          {expandedRow === r.index ? (
                            <ExpandLessIcon fontSize="small" />
                          ) : (
                            <ExpandMoreIcon fontSize="small" />
                          )}
                        </IconButton>
                      </TableCell>
                    </TableRow>

                    {expandedRow === r.index && (
                      <TableRow key={`${r.index}-detail`}>
                        <TableCell colSpan={5} sx={{ p: 0 }}>
                          <Box
                            sx={{
                              p: 2,
                              bgcolor: 'action.hover',
                              borderLeft: '3px solid',
                              borderColor:
                                r.status === 'PASS'
                                  ? 'success.main'
                                  : r.status === 'FAIL' || r.status === 'ERROR'
                                  ? 'error.main'
                                  : 'divider',
                            }}
                          >
                            <Grid container spacing={2}>
                              {r.expected && (
                                <Grid size={{ xs: 12, md: 6 }}>
                                  <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" gutterBottom>
                                    RESPUESTA ESPERADA
                                  </Typography>
                                  <Typography variant="body2">{r.expected}</Typography>
                                </Grid>
                              )}
                              <Grid size={{ xs: 12, md: r.expected ? 6 : 12 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" gutterBottom>
                                  RESPUESTA DEL AGENTE
                                </Typography>
                                <Typography variant="body2">
                                  {r.response || <em style={{ opacity: 0.5 }}>Sin respuesta</em>}
                                </Typography>
                              </Grid>
                              <Grid size={12}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" gutterBottom>
                                  RAZÓN DE VALIDACIÓN
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {r.reason}
                                </Typography>
                              </Grid>
                            </Grid>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Token consumption confirmation dialog */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            border: '1px solid',
            borderColor: 'warning.main',
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <WarningAmberIcon sx={{ color: 'warning.main', fontSize: 22 }} />
          </Box>
          <Typography variant="h6" fontWeight={700}>
            Alto consumo de tokens
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Box
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 2,
              bgcolor: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              display: 'flex',
              gap: 1.5,
              alignItems: 'flex-start',
            }}
          >
            <TokenIcon sx={{ color: 'warning.main', mt: 0.2, flexShrink: 0 }} />
            <Box>
              <Typography variant="body2" fontWeight={600} color="warning.main" gutterBottom>
                Cada test consume tokens del LLM
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cada pregunta genera <strong>dos llamadas</strong> a la API: una para obtener la respuesta del agente
                y otra para validarla semánticamente. Con{' '}
                <strong>{testCases.filter((t) => t.question.trim()).length} caso(s)</strong>, se realizarán hasta{' '}
                <strong>{testCases.filter((t) => t.question.trim()).length * 2} llamadas</strong> al modelo.
              </Typography>
            </Box>
          </Box>

          <Typography variant="body2" color="text.secondary">
            Este proceso simula consultas reales de usuarios a NumiAgent. El costo en tokens depende de la longitud de
            las preguntas y respuestas. Asegurate de que esto sea intencional antes de continuar.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setConfirmOpen(false)}
            sx={{ flex: 1 }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={runTests}
            startIcon={<PlayArrowIcon />}
            sx={{
              flex: 1,
              background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
              fontWeight: 700,
            }}
          >
            Sí, ejecutar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
