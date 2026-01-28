import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Typography,
  Paper,
} from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CodeIcon from '@mui/icons-material/Code';
import TimelineIcon from '@mui/icons-material/Timeline';

const features = [
  {
    title: 'Data Cubes',
    description: 'Browse and explore LINDAS data cubes. Search for datasets and view their structure.',
    icon: <StorageIcon sx={{ fontSize: 48 }} />,
    path: '/cubes',
    color: '#1890ff',
  },
  {
    title: 'Dashboards',
    description: 'View and interact with Superset dashboards built from LINDAS data.',
    icon: <DashboardIcon sx={{ fontSize: 48 }} />,
    path: '/dashboard/1',
    color: '#722ed1',
  },
  {
    title: 'Charts',
    description: 'Explore individual charts and visualizations.',
    icon: <TimelineIcon sx={{ fontSize: 48 }} />,
    path: '/chart/1',
    color: '#52c41a',
  },
  {
    title: 'GraphQL API',
    description: 'Interact with LINDAS data using our GraphQL API.',
    icon: <CodeIcon sx={{ fontSize: 48 }} />,
    path: '/graphql',
    color: '#eb2f96',
  },
];

export function HomePage() {
  const navigate = useNavigate();

  return (
    <Box>
      {/* Hero section */}
      <Paper
        sx={{
          p: 4,
          mb: 4,
          background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
          color: 'white',
          borderRadius: 2,
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Welcome to Visualize Superset
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9 }}>
          Explore Swiss Linked Data with powerful visualizations
        </Typography>
        <Typography variant="body1" sx={{ mt: 2, opacity: 0.8, maxWidth: 600 }}>
          This application connects Apache Superset to the LINDAS (Linked Data
          Service) to provide interactive dashboards and charts for Swiss open
          government data.
        </Typography>
      </Paper>

      {/* Features grid */}
      <Typography variant="h5" gutterBottom fontWeight="600" sx={{ mb: 3 }}>
        Get Started
      </Typography>

      <Grid container spacing={3}>
        {features.map((feature) => (
          <Grid item xs={12} sm={6} md={3} key={feature.title}>
            <Card
              sx={{
                height: '100%',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
              }}
            >
              <CardActionArea
                onClick={() => navigate(feature.path)}
                sx={{ height: '100%', p: 1 }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 80,
                      height: 80,
                      borderRadius: 2,
                      bgcolor: `${feature.color}15`,
                      color: feature.color,
                      mb: 2,
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick stats */}
      <Paper sx={{ mt: 4, p: 3 }}>
        <Typography variant="h6" gutterBottom fontWeight="600">
          About LINDAS
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          LINDAS (Linked Data Service) is the Swiss Federal Administration's
          platform for publishing and sharing linked open data. It provides
          access to a wide range of datasets from various Swiss government
          agencies.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Available endpoints:
        </Typography>
        <Box component="ul" sx={{ mt: 1, pl: 2 }}>
          <li>
            <Typography variant="body2" color="text.secondary">
              <strong>Production:</strong> lindas-cached.cluster.ldbar.ch
            </Typography>
          </li>
          <li>
            <Typography variant="body2" color="text.secondary">
              <strong>Integration:</strong> lindas-cached.int.cluster.ldbar.ch
            </Typography>
          </li>
          <li>
            <Typography variant="body2" color="text.secondary">
              <strong>Test:</strong> lindas-cached.test.cluster.ldbar.ch
            </Typography>
          </li>
        </Box>
      </Paper>
    </Box>
  );
}
