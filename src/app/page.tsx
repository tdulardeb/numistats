'use client';

import DashboardShell from '@/components/DashboardShell';
import KpiGrid from '@/components/KpiGrid';
import AnalyticsCharts from '@/components/AnalyticsCharts';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Box, Chip } from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import { useNavigation } from '@/context/NavigationContext';

export default function Home() {
  const { activeSection } = useNavigation();
  
  const isAnalytics = activeSection === 'analytics';

  return (
    <ProtectedRoute>
      <DashboardShell>
        <Box sx={{ mb: 2 }}>
          <Chip
            icon={<StorageIcon sx={{ fontSize: 16 }} />}
            label="Conectado a Supabase"
            size="small"
            sx={{
              bgcolor: 'rgba(139, 92, 246, 0.15)',
              color: '#a78bfa',
              fontWeight: 600,
            }}
          />
        </Box>

        {isAnalytics ? <AnalyticsCharts /> : <KpiGrid />}
      </DashboardShell>
    </ProtectedRoute>
  );
}
