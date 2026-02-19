'use client';

import { useEffect, useState } from 'react';
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
  Divider,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ChatIcon from '@mui/icons-material/Chat';
import ForumIcon from '@mui/icons-material/Forum';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SpeedIcon from '@mui/icons-material/Speed';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import PollIcon from '@mui/icons-material/Poll';
import RefreshIcon from '@mui/icons-material/Refresh';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EscalatorWarningIcon from '@mui/icons-material/EscalatorWarning';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import RemoveIcon from '@mui/icons-material/Remove';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckIcon from '@mui/icons-material/Check';
import type { KpiStat } from '@/types/database';
import type { CompareResponse } from '@/app/api/stats-compare/route';

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
const POSITIVE_COLOR = '#10b981';
const NEGATIVE_COLOR = '#ef4444';
const NEUTRAL_COLOR = '#6b7280';

function parseNumericValue(value: string | number): number {
  if (typeof value === 'number') return value;
  const str = String(value).replace('%', '').replace(/\./g, '').replace(/,/g, '.');
  if (str.endsWith('M')) return parseFloat(str) * 1_000_000;
  if (str.endsWith('K')) return parseFloat(str) * 1_000;
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}

function getDelta(prodVal: string | number, preprodVal: string | number) {
  const prod = parseNumericValue(prodVal);
  const preprod = parseNumericValue(preprodVal);
  if (prod === 0 && preprod === 0) return { diff: 0, pct: 0, direction: 'neutral' as const };
  const diff = preprod - prod;
  const pct = prod !== 0 ? Math.round((diff / prod) * 100 * 10) / 10 : preprod > 0 ? 100 : 0;
  return {
    diff,
    pct,
    direction: diff > 0 ? ('up' as const) : diff < 0 ? ('down' as const) : ('neutral' as const),
  };
}

interface EnvBadgeProps {
  env: 'PROD' | 'PREPROD';
  configured: boolean;
}

function EnvBadge({ env, configured }: EnvBadgeProps) {
  const color = env === 'PROD' ? PROD_COLOR : PREPROD_COLOR;
  return (
    <Chip
      size="small"
      icon={
        configured ? (
          <CheckIcon sx={{ fontSize: '14px !important', color: `${color} !important` }} />
        ) : (
          <WarningAmberIcon sx={{ fontSize: '14px !important', color: `${color} !important` }} />
        )
      }
      label={env}
      sx={{
        bgcolor: alpha(color, 0.12),
        color: color,
        fontWeight: 700,
        fontSize: '0.75rem',
        letterSpacing: 0.5,
        border: `1px solid ${alpha(color, 0.3)}`,
      }}
    />
  );
}

interface CompareCardProps {
  stat: KpiStat;
  preprodStat: KpiStat | undefined;
  prodConfigured: boolean;
  preprodConfigured: boolean;
  loading: boolean;
}

function CompareCard({ stat, preprodStat, prodConfigured, preprodConfigured, loading }: CompareCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent sx={{ p: 2.5 }}>
          <Skeleton variant="text" width="60%" height={20} sx={{ mb: 1 }} />
          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <Skeleton variant="rounded" width="45%" height={60} />
            <Skeleton variant="rounded" width="10%" height={60} />
            <Skeleton variant="rounded" width="45%" height={60} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  const preprod = preprodStat ?? stat;
  const delta = getDelta(stat.value, preprod.value);

  const deltaColor =
    delta.direction === 'up'
      ? POSITIVE_COLOR
      : delta.direction === 'down'
      ? NEGATIVE_COLOR
      : NEUTRAL_COLOR;

  const DeltaIcon =
    delta.direction === 'up' ? ArrowUpwardIcon : delta.direction === 'down' ? ArrowDownwardIcon : RemoveIcon;

  return (
    <Card
      sx={{
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'box-shadow 0.2s ease',
        '&:hover': { boxShadow: 4 },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        {/* Title row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1,
              bgcolor: alpha(PROD_COLOR, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: PROD_COLOR,
              '& svg': { fontSize: 18 },
              flexShrink: 0,
            }}
          >
            {iconMap[stat.icon] || <AnalyticsIcon />}
          </Box>
          <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ lineHeight: 1.3 }}>
            {stat.title}
          </Typography>
        </Box>

        {/* Values row */}
        <Box sx={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
          {/* PROD value */}
          <Box
            sx={{
              flex: 1,
              p: 1.5,
              borderRadius: 1.5,
              bgcolor: alpha(PROD_COLOR, 0.06),
              border: `1px solid ${alpha(PROD_COLOR, 0.15)}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <EnvBadge env="PROD" configured={prodConfigured} />
            <Typography
              variant="h5"
              fontWeight={800}
              sx={{ color: PROD_COLOR, lineHeight: 1, mt: 0.5 }}
            >
              {prodConfigured ? stat.value : '—'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.68rem' }}>
              {stat.description}
            </Typography>
          </Box>

          {/* Delta column */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              px: 1,
              gap: 0.25,
              minWidth: 48,
            }}
          >
            <DeltaIcon sx={{ fontSize: 16, color: deltaColor }} />
            {delta.pct !== 0 && (
              <Typography
                variant="caption"
                fontWeight={700}
                sx={{ color: deltaColor, fontSize: '0.65rem', lineHeight: 1 }}
              >
                {delta.pct > 0 ? '+' : ''}
                {delta.pct}%
              </Typography>
            )}
            {delta.diff !== 0 && (
              <Typography
                variant="caption"
                sx={{ color: deltaColor, fontSize: '0.6rem', lineHeight: 1 }}
              >
                {delta.diff > 0 ? '+' : ''}
                {delta.diff >= 1000
                  ? (delta.diff / 1000).toFixed(1) + 'K'
                  : delta.diff}
              </Typography>
            )}
          </Box>

          {/* PREPROD value */}
          <Box
            sx={{
              flex: 1,
              p: 1.5,
              borderRadius: 1.5,
              bgcolor: alpha(PREPROD_COLOR, 0.06),
              border: `1px solid ${alpha(PREPROD_COLOR, 0.15)}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <EnvBadge env="PREPROD" configured={preprodConfigured} />
            <Typography
              variant="h5"
              fontWeight={800}
              sx={{ color: PREPROD_COLOR, lineHeight: 1, mt: 0.5 }}
            >
              {preprodConfigured ? preprod.value : '—'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.68rem' }}>
              {preprod.description}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

interface SectionHeaderProps {
  title: string;
}

function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, mt: 3 }}>
      <Divider sx={{ flex: 1 }} />
      <Typography variant="overline" fontWeight={700} color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
        {title}
      </Typography>
      <Divider sx={{ flex: 1 }} />
    </Box>
  );
}

const CATEGORY_ORDER: Array<{ key: string; label: string }> = [
  { key: 'atenciones', label: 'Atenciones' },
  { key: 'users', label: 'Usuarios' },
  { key: 'messages', label: 'Mensajes y Conversaciones' },
  { key: 'tickets', label: 'Tickets' },
  { key: 'surveys', label: 'Encuestas' },
];

export default function ComparisonView() {
  const [data, setData] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/stats-compare');
      if (!res.ok) throw new Error('Error al cargar comparación');
      const json: CompareResponse = await res.json();
      setData(json);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const prodStats = data?.prod ?? [];
  const preprodStats = data?.preprod ?? [];

  function getStatById(stats: KpiStat[], id: string) {
    return stats.find(s => s.id === id);
  }

  const allIds = [...new Set([...prodStats.map(s => s.id)])];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <EnvBadge env="PROD" configured={data?.prodConfigured ?? false} />
          <Typography variant="body2" color="text.secondary" sx={{ mx: 0.5 }}>vs</Typography>
          <EnvBadge env="PREPROD" configured={data?.preprodConfigured ?? false} />
          {lastUpdate && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              Actualizado: {lastUpdate.toLocaleTimeString('es-ES')}
            </Typography>
          )}
        </Box>
        <Tooltip title="Actualizar datos">
          <IconButton onClick={fetchData} disabled={loading} size="small">
            <RefreshIcon
              sx={{ animation: loading ? 'spin 1s linear infinite' : 'none', fontSize: 20 }}
            />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {!loading && !data?.preprodConfigured && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <strong>PREPROD no configurado.</strong> Agrega{' '}
          <code>NEXT_PUBLIC_SUPABASE_URL_PREPROD</code> y{' '}
          <code>SUPABASE_SERVICE_ROLE_KEY_PREPROD</code> en tu <code>.env.local</code> para ver los
          datos de PREPROD.
        </Alert>
      )}
      {!loading && !data?.prodConfigured && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <strong>PROD no configurado.</strong> Las credenciales de producción no están disponibles.
        </Alert>
      )}

      {/* Legend */}
      {!loading && (
        <Card sx={{ mb: 3, bgcolor: 'background.paper' }}>
          <CardContent sx={{ py: 1.5, px: 2.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Cómo leer el delta (flecha central):
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ArrowUpwardIcon sx={{ fontSize: 14, color: POSITIVE_COLOR }} />
                <Typography variant="caption" color="text.secondary">
                  PREPROD tiene más que PROD
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ArrowDownwardIcon sx={{ fontSize: 14, color: NEGATIVE_COLOR }} />
                <Typography variant="caption" color="text.secondary">
                  PREPROD tiene menos que PROD
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <RemoveIcon sx={{ fontSize: 14, color: NEUTRAL_COLOR }} />
                <Typography variant="caption" color="text.secondary">
                  Sin diferencia
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Cards by category */}
      {CATEGORY_ORDER.map(({ key, label }) => {
        const categoryIds = allIds.filter(id => {
          const stat = prodStats.find(s => s.id === id) || preprodStats.find(s => s.id === id);
          return stat?.category === key;
        });

        if (categoryIds.length === 0 && !loading) return null;

        const skeletonCount = key === 'atenciones' ? 3 : key === 'users' ? 2 : key === 'messages' ? 4 : 2;

        return (
          <Box key={key}>
            <SectionHeader title={label} />
            <Grid container spacing={2}>
              {loading
                ? Array.from({ length: skeletonCount }).map((_, i) => (
                    <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={i}>
                      <CompareCard
                        stat={{ id: '', title: '', value: '', change: 0, changeType: 'neutral', icon: 'analytics', description: '', category: 'users' }}
                        preprodStat={undefined}
                        prodConfigured={false}
                        preprodConfigured={false}
                        loading
                      />
                    </Grid>
                  ))
                : categoryIds.map(id => {
                    const prodStat = getStatById(prodStats, id);
                    const preprodStat = getStatById(preprodStats, id);
                    const stat = prodStat ?? preprodStat;
                    if (!stat) return null;
                    return (
                      <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={id}>
                        <CompareCard
                          stat={stat}
                          preprodStat={preprodStat}
                          prodConfigured={data?.prodConfigured ?? false}
                          preprodConfigured={data?.preprodConfigured ?? false}
                          loading={false}
                        />
                      </Grid>
                    );
                  })}
            </Grid>
          </Box>
        );
      })}

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
}
