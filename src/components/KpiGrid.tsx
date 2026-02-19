'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Skeleton,
  Chip,
  alpha,
  Alert,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ChatIcon from '@mui/icons-material/Chat';
import ForumIcon from '@mui/icons-material/Forum';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SpeedIcon from '@mui/icons-material/Speed';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import PollIcon from '@mui/icons-material/Poll';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import RefreshIcon from '@mui/icons-material/Refresh';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EscalatorWarningIcon from '@mui/icons-material/EscalatorWarning';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ConstructionIcon from '@mui/icons-material/Construction';
import StorageIcon from '@mui/icons-material/Storage';
import type { KpiStat } from '@/types/database';
import type { CompareResponse } from '@/app/api/stats-compare/route';
import { useNavigation } from '@/context/NavigationContext';

type Env = 'prod' | 'preprod';

// Mapeo de iconos string a componentes
const iconMap: Record<string, React.ReactNode> = {
  people: <PeopleIcon />,
  person_add: <PersonAddIcon />,
  chat: <ChatIcon />,
  forum: <ForumIcon />,
  analytics: <AnalyticsIcon />,
  speed: <SpeedIcon />,
  confirmation_number: <ConfirmationNumberIcon />,
  poll: <PollIcon />,
  support_agent: <SupportAgentIcon />,
  check_circle: <CheckCircleIcon />,
  escalator_warning: <EscalatorWarningIcon />,
};

const PROD_COLOR = '#6366f1';
const PREPROD_COLOR = '#f59e0b';

// Colores
const colors = {
  primary: '#6366f1',
  n0: '#10b981',
  n1: '#f59e0b',
  secondary: '#8b5cf6',
};

interface ApiResponse {
  success: boolean;
  data: KpiStat[];
  configured?: boolean;
  message?: string;
  error?: string;
}

interface HeroMetricsProps {
  stats: KpiStat[];
  loading: boolean;
  env: Env;
  preprodConfigured: boolean;
  onEnvChange: (env: Env) => void;
}

// Componente principal de métricas destacadas
function HeroMetrics({ stats, loading, env, preprodConfigured, onEnvChange }: HeroMetricsProps) {
  const totalAtenciones = stats.find(s => s.id === 'cantidad-atenciones');
  const atencionesN0 = stats.find(s => s.id === 'atenciones-n0');
  const atencionesN1 = stats.find(s => s.id === 'atenciones-n1');

  // Calcular porcentajes
  const total = totalAtenciones ? parseInt(String(totalAtenciones.value).replace(/\D/g, '')) || 0 : 0;
  const n0Value = atencionesN0 ? parseInt(String(atencionesN0.value).replace(/\D/g, '')) || 0 : 0;
  const n1Value = atencionesN1 ? parseInt(String(atencionesN1.value).replace(/\D/g, '')) || 0 : 0;
  
  const n0Percentage = total > 0 ? Math.round((n0Value / total) * 100) : 0;
  const n1Percentage = total > 0 ? Math.round((n1Value / total) * 100) : 0;

  const envColor = env === 'prod' ? PROD_COLOR : PREPROD_COLOR;

  if (loading) {
    return (
      <Box sx={{ mb: 6 }}>
        {/* Keep toggle visible during loading */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Skeleton variant="text" width={200} height={32} sx={{ mx: 'auto', mb: 1 }} />
          <Skeleton variant="text" width={280} height={20} sx={{ mx: 'auto', mb: 2.5 }} />
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5 }}>
            <ToggleButtonGroup
              value={env}
              exclusive
              onChange={(_, val) => val && onEnvChange(val as Env)}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  px: 2.5, py: 0.75, fontWeight: 700, fontSize: '0.8rem', letterSpacing: 0.5,
                  border: '1.5px solid', borderColor: 'divider',
                  '&.Mui-selected': { color: 'white', borderColor: 'transparent' },
                },
                '& .MuiToggleButton-root[value="prod"].Mui-selected': { bgcolor: PROD_COLOR },
                '& .MuiToggleButton-root[value="preprod"].Mui-selected': { bgcolor: PREPROD_COLOR },
              }}
            >
              <ToggleButton value="prod"><StorageIcon sx={{ fontSize: 14, mr: 0.75 }} />PROD</ToggleButton>
              <ToggleButton value="preprod" disabled={!preprodConfigured}><StorageIcon sx={{ fontSize: 14, mr: 0.75 }} />PREPROD</ToggleButton>
            </ToggleButtonGroup>
            <Chip size="small" label={env === 'prod' ? 'Producción' : 'Preproducción'}
              sx={{ bgcolor: alpha(envColor, 0.12), color: envColor, fontWeight: 700, fontSize: '0.72rem', border: `1px solid ${alpha(envColor, 0.3)}` }} />
          </Box>
        </Box>
        <Grid container spacing={4}>
          {[1, 2, 3].map((i) => (
            <Grid size={{ xs: 12, md: 4 }} key={i}>
              <Card sx={{ height: '100%', minHeight: 280 }}>
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <Skeleton variant="circular" width={80} height={80} sx={{ mx: 'auto', mb: 3 }} />
                  <Skeleton variant="text" width="60%" height={80} sx={{ mx: 'auto' }} />
                  <Skeleton variant="text" width="80%" sx={{ mx: 'auto', mt: 2 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 6 }}>
      {/* Título de sección */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
          Panel de Atenciones
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Datos históricos desde el inicio de la plataforma
        </Typography>

        {/* Toggle PROD / PREPROD */}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5 }}>
          <ToggleButtonGroup
            value={env}
            exclusive
            onChange={(_, val) => val && onEnvChange(val as Env)}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                px: 2.5,
                py: 0.75,
                fontWeight: 700,
                fontSize: '0.8rem',
                letterSpacing: 0.5,
                border: '1.5px solid',
                borderColor: 'divider',
                transition: 'all 0.2s ease',
                '&.Mui-selected': {
                  color: 'white',
                  borderColor: 'transparent',
                },
              },
              '& .MuiToggleButton-root[value="prod"].Mui-selected': {
                bgcolor: PROD_COLOR,
                '&:hover': { bgcolor: PROD_COLOR, filter: 'brightness(1.1)' },
              },
              '& .MuiToggleButton-root[value="preprod"].Mui-selected': {
                bgcolor: PREPROD_COLOR,
                '&:hover': { bgcolor: PREPROD_COLOR, filter: 'brightness(1.1)' },
              },
            }}
          >
            <ToggleButton value="prod" disableRipple={false}>
              <StorageIcon sx={{ fontSize: 14, mr: 0.75 }} />
              PROD
            </ToggleButton>
            <ToggleButton value="preprod" disabled={!preprodConfigured} disableRipple={false}>
              <StorageIcon sx={{ fontSize: 14, mr: 0.75 }} />
              PREPROD
              {!preprodConfigured && (
                <Chip
                  label="Sin configurar"
                  size="small"
                  sx={{ ml: 1, height: 16, fontSize: '0.6rem', bgcolor: alpha('#000', 0.1) }}
                />
              )}
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Badge del entorno activo */}
          <Chip
            size="small"
            label={env === 'prod' ? 'Producción' : 'Preproducción'}
            sx={{
              bgcolor: alpha(envColor, 0.12),
              color: envColor,
              fontWeight: 700,
              fontSize: '0.72rem',
              border: `1px solid ${alpha(envColor, 0.3)}`,
            }}
          />
        </Box>
      </Box>

      <Grid container spacing={4}>
        {/* Total de Atenciones */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            sx={{
              height: '100%',
              minHeight: 280,
              background: `linear-gradient(135deg, ${alpha(envColor, 0.1)} 0%, ${alpha(envColor, 0.05)} 100%)`,
              border: `2px solid ${alpha(envColor, 0.2)}`,
              transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 20px 40px -12px ${alpha(envColor, 0.3)}`,
              },
            }}
          >
            <CardContent sx={{ p: 4, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: alpha(envColor, 0.15),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                  transition: 'background-color 0.3s ease',
                }}
              >
                <SupportAgentIcon sx={{ fontSize: 40, color: envColor, transition: 'color 0.3s ease' }} />
              </Box>
              
              <Typography
                variant="h2"
                fontWeight={800}
                sx={{
                  fontSize: { xs: '3rem', md: '4rem' },
                  color: envColor,
                  lineHeight: 1,
                  mb: 1,
                  transition: 'color 0.3s ease',
                }}
              >
                {totalAtenciones?.value ?? '—'}
              </Typography>
              
              <Typography variant="h6" fontWeight={600} color="text.primary" sx={{ mb: 1 }}>
                Total de Atenciones
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                Conversaciones atendidas
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* N0 - Resueltas */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            sx={{
              height: '100%',
              minHeight: 280,
              background: `linear-gradient(135deg, ${alpha(colors.n0, 0.1)} 0%, ${alpha(colors.n0, 0.05)} 100%)`,
              border: `2px solid ${alpha(colors.n0, 0.2)}`,
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 20px 40px -12px ${alpha(colors.n0, 0.3)}`,
              },
            }}
          >
            <CardContent sx={{ p: 4, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: alpha(colors.n0, 0.15),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <CheckCircleIcon sx={{ fontSize: 40, color: colors.n0 }} />
              </Box>
              
              {/* Porcentaje GIGANTE */}
              <Typography
                variant="h1"
                fontWeight={800}
                sx={{
                  fontSize: { xs: '4rem', md: '5rem' },
                  color: colors.n0,
                  lineHeight: 1,
                  mb: 0,
                }}
              >
                {n0Percentage}%
              </Typography>
              
              <Typography variant="h6" fontWeight={600} color="text.primary" sx={{ mb: 1 }}>
                Finalizadas en N0
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Resueltas sin escalar
              </Typography>
              
              {/* Cantidad secundaria */}
              <Chip
                label={`${atencionesN0?.value ?? '—'} atenciones`}
                size="small"
                sx={{
                  bgcolor: alpha(colors.n0, 0.1),
                  color: colors.n0,
                  fontWeight: 600,
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* N1 - Escaladas */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            sx={{
              height: '100%',
              minHeight: 280,
              background: `linear-gradient(135deg, ${alpha(colors.n1, 0.1)} 0%, ${alpha(colors.n1, 0.05)} 100%)`,
              border: `2px solid ${alpha(colors.n1, 0.2)}`,
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 20px 40px -12px ${alpha(colors.n1, 0.3)}`,
              },
            }}
          >
            <CardContent sx={{ p: 4, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: alpha(colors.n1, 0.15),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <EscalatorWarningIcon sx={{ fontSize: 40, color: colors.n1 }} />
              </Box>
              
              {/* Porcentaje GIGANTE */}
              <Typography
                variant="h1"
                fontWeight={800}
                sx={{
                  fontSize: { xs: '4rem', md: '5rem' },
                  color: colors.n1,
                  lineHeight: 1,
                  mb: 0,
                }}
              >
                {n1Percentage}%
              </Typography>
              
              <Typography variant="h6" fontWeight={600} color="text.primary" sx={{ mb: 1 }}>
                Derivadas a N1
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Escaladas a ticket
              </Typography>
              
              {/* Cantidad secundaria */}
              <Chip
                label={`${atencionesN1?.value ?? '—'} atenciones`}
                size="small"
                sx={{
                  bgcolor: alpha(colors.n1, 0.1),
                  color: colors.n1,
                  fontWeight: 600,
                }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Barra de progreso visual */}
      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', height: 12, borderRadius: 2, overflow: 'hidden', bgcolor: 'action.hover' }}>
          <Box
            sx={{
              width: `${n0Percentage}%`,
              bgcolor: colors.n0,
              transition: 'width 0.5s ease',
            }}
          />
          <Box
            sx={{
              width: `${n1Percentage}%`,
              bgcolor: colors.n1,
              transition: 'width 0.5s ease',
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="caption" sx={{ color: colors.n0, fontWeight: 600 }}>
            N0: {n0Percentage}% resueltas
          </Typography>
          <Typography variant="caption" sx={{ color: colors.n1, fontWeight: 600 }}>
            N1: {n1Percentage}% escaladas
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

// Card pequeña para métricas secundarias
function SmallKpiCard({ stat }: { stat: KpiStat }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(colors.secondary, 0.1),
              color: colors.secondary,
              '& svg': { fontSize: 20 },
            }}
          >
            {iconMap[stat.icon] || <AnalyticsIcon />}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={700}>
              {stat.value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {stat.title}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function KpiGrid() {
  const { activeSection } = useNavigation();
  const [env, setEnv] = useState<Env>('prod');
  const [stats, setStats] = useState<KpiStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState(true);
  const [preprodConfigured, setPreprodConfigured] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchStats = useCallback(async (targetEnv: Env = env) => {
    try {
      setLoading(true);
      setError(null);

      if (targetEnv === 'preprod') {
        const response = await fetch('/api/stats-compare');
        if (!response.ok) throw new Error('Error al cargar estadísticas PREPROD');
        const result: CompareResponse = await response.json();
        setStats(result.preprod);
        setPreprodConfigured(result.preprodConfigured);
        setConfigured(result.preprodConfigured);
      } else {
        const response = await fetch('/api/stats');
        if (!response.ok) throw new Error('Error al cargar estadísticas');
        const result: ApiResponse = await response.json();
        setStats(result.data);
        setConfigured(result.configured ?? true);
        // También actualizar si preprod está configurado
        const compareRes = await fetch('/api/stats-compare');
        if (compareRes.ok) {
          const compareData: CompareResponse = await compareRes.json();
          setPreprodConfigured(compareData.preprodConfigured);
        }
        if (!result.success && result.error) setError(result.error);
      }

      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [env]);

  const handleEnvChange = (newEnv: Env) => {
    setEnv(newEnv);
  };

  useEffect(() => {
    fetchStats(env);
    const interval = setInterval(() => fetchStats(env), 5 * 60 * 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [env]);

  // Agrupar stats
  const atencionesStats = stats.filter(s => s.category === 'atenciones');
  const otherStats = stats.filter(s => s.category !== 'atenciones');

  // Si está en una sección específica que no es 'all' ni 'atenciones', mostrar vista antigua
  if (activeSection !== 'all' && activeSection !== 'atenciones') {
    const filteredStats = stats.filter(s => {
      if (activeSection === 'users') return s.category === 'users';
      if (activeSection === 'messages') return s.category === 'messages';
      if (activeSection === 'tickets') return s.category === 'tickets' || s.category === 'surveys';
      return false;
    });

    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            {lastUpdate && (
              <Typography variant="caption" color="text.secondary">
                Última actualización: {lastUpdate.toLocaleTimeString('es-ES')}
              </Typography>
            )}
          </Box>
          <Tooltip title="Actualizar datos">
            <IconButton onClick={() => fetchStats()} disabled={loading}>
              <RefreshIcon sx={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </IconButton>
          </Tooltip>
        </Box>

        <Alert 
          severity="info" 
          icon={<ConstructionIcon />}
          sx={{ mb: 3 }}
        >
          <Typography variant="body2">
            <strong>Sección en desarrollo.</strong> Estas métricas están en fase beta.
          </Typography>
        </Alert>

        <Grid container spacing={3}>
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={i}>
                  <Card>
                    <CardContent>
                      <Skeleton variant="rounded" height={80} />
                    </CardContent>
                  </Card>
                </Grid>
              ))
            : filteredStats.map((stat) => (
                <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={stat.id}>
                  <SmallKpiCard stat={stat} />
                </Grid>
              ))}
        </Grid>

        <style jsx global>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header con refresh */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mb: 2 }}>
        {lastUpdate && (
          <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>
            Actualizado: {lastUpdate.toLocaleTimeString('es-ES')}
          </Typography>
        )}
        <Tooltip title="Actualizar datos">
          <IconButton 
            onClick={() => fetchStats()} 
            disabled={loading}
            size="small"
            sx={{ 
              bgcolor: 'background.paper',
              '&:hover': { bgcolor: 'action.hover' }
            }}
          >
            <RefreshIcon sx={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Alerta si Supabase no está configurado */}
      {!configured && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
        >
          <Typography variant="body2">
            <strong>Supabase no configurado.</strong> Conecta tu base de datos para ver métricas reales.
          </Typography>
        </Alert>
      )}

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* MÉTRICAS PRINCIPALES - Atenciones */}
      <HeroMetrics
        stats={atencionesStats}
        loading={loading}
        env={env}
        preprodConfigured={preprodConfigured}
        onEnvChange={handleEnvChange}
      />

      {/* Métricas secundarias en Accordion */}
      {activeSection === 'all' && (
        <Accordion 
          sx={{ 
            bgcolor: 'background.paper',
            '&:before': { display: 'none' },
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{ 
              '& .MuiAccordionSummary-content': { 
                alignItems: 'center',
                gap: 1,
              }
            }}
          >
            <ConstructionIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            <Typography fontWeight={600}>
              Otras métricas
            </Typography>
            <Chip 
              label="Beta" 
              size="small" 
              sx={{ 
                ml: 1,
                bgcolor: alpha(colors.secondary, 0.1),
                color: colors.secondary,
                fontWeight: 600,
                fontSize: '0.7rem',
              }} 
            />
          </AccordionSummary>
          <AccordionDetails>
            <Alert 
              severity="info" 
              sx={{ mb: 3 }}
            >
              Estas métricas están en desarrollo y pueden cambiar.
            </Alert>
            
            <Grid container spacing={2}>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={i}>
                      <Card>
                        <CardContent sx={{ p: 2 }}>
                          <Skeleton variant="rounded" height={60} />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))
                : otherStats.map((stat) => (
                    <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={stat.id}>
                      <SmallKpiCard stat={stat} />
                    </Grid>
                  ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}

      {/* CSS para animación */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
}
