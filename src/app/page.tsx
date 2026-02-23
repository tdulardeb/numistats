'use client';

import DashboardShell from '@/components/DashboardShell';
import KpiGrid from '@/components/KpiGrid';
import AnalyticsCharts from '@/components/AnalyticsCharts';
import ComparisonView from '@/components/ComparisonView';
import TestingView from '@/components/TestingView';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Box, Chip } from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import { useNavigation } from '@/context/NavigationContext';

export default function Home() {
  const { activeSection } = useNavigation();

  function renderContent() {
    if (activeSection === 'analytics') return <AnalyticsCharts />;
    if (activeSection === 'compare') return <ComparisonView />;
    if (activeSection === 'testing') return <TestingView />;
    return <KpiGrid />;
  }

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

        {renderContent()}
      </DashboardShell>
    </ProtectedRoute>
  );
}
