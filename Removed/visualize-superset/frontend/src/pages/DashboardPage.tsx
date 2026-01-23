import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Breadcrumbs, Link, Paper, Alert } from '@mui/material';
import { SupersetEmbed } from '@/components/SupersetEmbed';

export function DashboardPage() {
  const { dashboardId } = useParams<{ dashboardId: string }>();
  const navigate = useNavigate();

  if (!dashboardId) {
    return (
      <Alert severity="error">Dashboard ID is required</Alert>
    );
  }

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          color="inherit"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
          underline="hover"
        >
          Home
        </Link>
        <Typography color="text.primary">Dashboard {dashboardId}</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Embedded Superset dashboard. You can interact with filters and
          visualizations.
        </Typography>
      </Box>

      {/* Info banner */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'info.lighter' }}>
        <Typography variant="body2">
          <strong>Note:</strong> This dashboard is embedded from Apache
          Superset. Ensure Superset is running and the dashboard exists with ID{' '}
          <code>{dashboardId}</code>.
        </Typography>
      </Paper>

      {/* Embedded dashboard */}
      <SupersetEmbed type="dashboard" id={dashboardId} height="calc(100vh - 280px)" />
    </Box>
  );
}
