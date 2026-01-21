import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Breadcrumbs, Link, Paper, Alert } from '@mui/material';
import { SupersetEmbed } from '@/components/SupersetEmbed';

export function ChartPage() {
  const { chartId } = useParams<{ chartId: string }>();
  const navigate = useNavigate();

  if (!chartId) {
    return <Alert severity="error">Chart ID is required</Alert>;
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
        <Typography color="text.primary">Chart {chartId}</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Chart
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Embedded Superset chart visualization.
        </Typography>
      </Box>

      {/* Info banner */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'info.lighter' }}>
        <Typography variant="body2">
          <strong>Note:</strong> This chart is embedded from Apache Superset.
          Ensure Superset is running and the chart exists with ID{' '}
          <code>{chartId}</code>.
        </Typography>
      </Paper>

      {/* Embedded chart */}
      <SupersetEmbed type="chart" id={chartId} height="600px" />
    </Box>
  );
}
