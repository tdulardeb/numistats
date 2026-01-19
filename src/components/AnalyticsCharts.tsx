'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Skeleton,
  Alert,
  Grid,
  alpha,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  Cell,
} from 'recharts';

// Tipos
interface FunnelData {
  n0: number;
  n1: number;
  total: number;
  n0Percentage: number;
  n1Percentage: number;
}

interface DailyMetric {
  date: string;
  label: string;
  messages: number;
  conversations: number;
  users: number;
  tickets: number;
}

interface AnalyticsData {
  funnel: FunnelData;
  dailyMetrics: DailyMetric[];
  hourlyDistribution: { hour: number; messages: number }[];
}

interface ApiResponse {
  success: boolean;
  data: AnalyticsData;
  configured?: boolean;
  error?: string;
}

// Colores del tema
const chartColors = {
  primary: '#8b5cf6',
  secondary: '#a855f7',
  success: '#10b981',
  warning: '#f59e0b',
  messages: '#8b5cf6',
  conversations: '#a855f7',
  users: '#10b981',
  tickets: '#f59e0b',
  n0: '#10b981',  // Verde para resueltos
  n1: '#f59e0b',  // Amarillo para escalados
};

// Componente de skeleton para gráficos
function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={height} sx={{ borderRadius: 2 }} />
      </CardContent>
    </Card>
  );
}

// Componente de Embudo N0/N1
function FunnelChart({ data, loading }: { data: FunnelData; loading: boolean }) {
  const theme = useTheme();
  
  if (loading) {
    return <ChartSkeleton height={250} />;
  }

  const funnelData = [
    { name: 'Total Conversaciones', value: data.total, fill: chartColors.primary },
    { name: 'N0 - Resueltos', value: data.n0, fill: chartColors.n0 },
    { name: 'N1 - Escalados', value: data.n1, fill: chartColors.n1 },
  ];

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          🎯 Embudo de Resolución
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          N0 = Resueltos en interacción | N1 = Escalados a ticket
        </Typography>

        {/* Stats principales */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 4 }}>
            <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: alpha(chartColors.primary, 0.1) }}>
              <Typography variant="h4" fontWeight={700} color="primary">
                {data.total}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Conversaciones
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 4 }}>
            <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: alpha(chartColors.n0, 0.1) }}>
              <Typography variant="h4" fontWeight={700} sx={{ color: chartColors.n0 }}>
                {data.n0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                N0 ({data.n0Percentage}%)
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 4 }}>
            <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: alpha(chartColors.n1, 0.1) }}>
              <Typography variant="h4" fontWeight={700} sx={{ color: chartColors.n1 }}>
                {data.n1}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                N1 ({data.n1Percentage}%)
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Barra horizontal de progreso */}
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', height: 40, borderRadius: 2, overflow: 'hidden' }}>
            <Box
              sx={{
                width: `${data.n0Percentage}%`,
                bgcolor: chartColors.n0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'width 0.5s ease',
              }}
            >
              {data.n0Percentage > 10 && (
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                  N0 {data.n0Percentage}%
                </Typography>
              )}
            </Box>
            <Box
              sx={{
                width: `${data.n1Percentage}%`,
                bgcolor: chartColors.n1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'width 0.5s ease',
              }}
            >
              {data.n1Percentage > 10 && (
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                  N1 {data.n1Percentage}%
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// Componente de gráfico de mensajes por día
function MessagesChart({ data, loading }: { data: DailyMetric[]; loading: boolean }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  if (loading) {
    return <ChartSkeleton height={300} />;
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          💬 Mensajes por Día
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Últimos 7 días
        </Typography>
        
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColors.messages} stopOpacity={0.3} />
                <stop offset="95%" stopColor={chartColors.messages} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333' : '#eee'} />
            <XAxis 
              dataKey="label" 
              tick={{ fill: isDark ? '#999' : '#666', fontSize: 12 }}
              axisLine={{ stroke: isDark ? '#444' : '#ddd' }}
            />
            <YAxis 
              tick={{ fill: isDark ? '#999' : '#666', fontSize: 12 }}
              axisLine={{ stroke: isDark ? '#444' : '#ddd' }}
            />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: isDark ? '#1a1a24' : '#fff',
                border: `1px solid ${isDark ? '#333' : '#ddd'}`,
                borderRadius: 8,
              }}
              labelStyle={{ color: isDark ? '#fff' : '#000' }}
            />
            <Area
              type="monotone"
              dataKey="messages"
              name="Mensajes"
              stroke={chartColors.messages}
              strokeWidth={2}
              fill="url(#colorMessages)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Componente de gráfico de métricas combinadas
function CombinedMetricsChart({ data, loading }: { data: DailyMetric[]; loading: boolean }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  if (loading) {
    return <ChartSkeleton height={300} />;
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          📊 Actividad Diaria
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Conversaciones, usuarios y tickets
        </Typography>
        
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333' : '#eee'} />
            <XAxis 
              dataKey="label" 
              tick={{ fill: isDark ? '#999' : '#666', fontSize: 12 }}
              axisLine={{ stroke: isDark ? '#444' : '#ddd' }}
            />
            <YAxis 
              tick={{ fill: isDark ? '#999' : '#666', fontSize: 12 }}
              axisLine={{ stroke: isDark ? '#444' : '#ddd' }}
            />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: isDark ? '#1a1a24' : '#fff',
                border: `1px solid ${isDark ? '#333' : '#ddd'}`,
                borderRadius: 8,
              }}
              labelStyle={{ color: isDark ? '#fff' : '#000' }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: 10 }}
              formatter={(value) => <span style={{ color: isDark ? '#999' : '#666' }}>{value}</span>}
            />
            <Bar dataKey="conversations" name="Conversaciones" fill={chartColors.conversations} radius={[4, 4, 0, 0]} />
            <Bar dataKey="users" name="Usuarios" fill={chartColors.users} radius={[4, 4, 0, 0]} />
            <Bar dataKey="tickets" name="Tickets" fill={chartColors.tickets} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Componente de distribución horaria
function HourlyChart({ data, loading }: { data: { hour: number; messages: number }[]; loading: boolean }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  if (loading) {
    return <ChartSkeleton height={200} />;
  }

  const formattedData = data.map(d => ({
    ...d,
    label: `${d.hour}:00`,
  }));

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          🕐 Distribución por Hora
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Mensajes por hora del día (últimos 7 días)
        </Typography>
        
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333' : '#eee'} />
            <XAxis 
              dataKey="label" 
              tick={{ fill: isDark ? '#999' : '#666', fontSize: 10 }}
              axisLine={{ stroke: isDark ? '#444' : '#ddd' }}
              interval={2}
            />
            <YAxis 
              tick={{ fill: isDark ? '#999' : '#666', fontSize: 10 }}
              axisLine={{ stroke: isDark ? '#444' : '#ddd' }}
            />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: isDark ? '#1a1a24' : '#fff',
                border: `1px solid ${isDark ? '#333' : '#ddd'}`,
                borderRadius: 8,
              }}
              labelStyle={{ color: isDark ? '#fff' : '#000' }}
              formatter={(value: number | undefined) => [value ?? 0, 'Mensajes']}
            />
            <Bar dataKey="messages" fill={chartColors.secondary} radius={[2, 2, 0, 0]}>
              {formattedData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.messages > 0 ? chartColors.secondary : alpha(chartColors.secondary, 0.2)} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Componente principal
export default function AnalyticsCharts() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/analytics');

      if (!response.ok) {
        throw new Error('Error al cargar analytics');
      }

      const result: ApiResponse = await response.json();
      
      setData(result.data);
      setConfigured(result.configured ?? true);
      setLastUpdate(new Date());
      
      if (!result.success && result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    
    // Auto-refresh cada 5 minutos
    const interval = setInterval(fetchAnalytics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const emptyFunnel: FunnelData = { n0: 0, n1: 0, total: 0, n0Percentage: 0, n1Percentage: 0 };
  const emptyDaily: DailyMetric[] = [];
  const emptyHourly: { hour: number; messages: number }[] = [];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="body1" color="text.secondary">
            Visualizaciones y tendencias de tu plataforma.
          </Typography>
          {lastUpdate && (
            <Typography variant="caption" color="text.secondary">
              Última actualización: {lastUpdate.toLocaleTimeString('es-ES')}
            </Typography>
          )}
        </Box>
        <Tooltip title="Actualizar datos">
          <IconButton 
            onClick={fetchAnalytics} 
            disabled={loading}
            sx={{ 
              bgcolor: 'background.paper',
              '&:hover': { bgcolor: 'action.hover' }
            }}
          >
            <RefreshIcon sx={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Alerta si no está configurado */}
      {!configured && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Supabase no configurado. Los gráficos mostrarán datos vacíos.
        </Alert>
      )}

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Gráficos */}
      <Grid container spacing={3}>
        {/* Embudo N0/N1 */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <FunnelChart data={data?.funnel ?? emptyFunnel} loading={loading} />
        </Grid>

        {/* Mensajes por día */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <MessagesChart data={data?.dailyMetrics ?? emptyDaily} loading={loading} />
        </Grid>

        {/* Actividad combinada */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <CombinedMetricsChart data={data?.dailyMetrics ?? emptyDaily} loading={loading} />
        </Grid>

        {/* Distribución horaria */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <HourlyChart data={data?.hourlyDistribution ?? emptyHourly} loading={loading} />
        </Grid>
      </Grid>

      {/* CSS para animación de refresh */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
}
