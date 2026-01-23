import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Skeleton,
  Alert,
  Tabs,
  Tab,
  Button,
} from '@mui/material';
import { BarChart as ChartIcon } from '@mui/icons-material';
import { useState } from 'react';
import { lindasService } from '@/services/lindas';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`cube-tabpanel-${index}`}
      aria-labelledby={`cube-tab-${index}`}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export function CubeDetailPage() {
  const { cubeId } = useParams<{ cubeId: string }>();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  const decodedCubeId = cubeId ? decodeURIComponent(cubeId) : '';

  // Fetch cube schema
  const {
    data: schema,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['cubeSchema', decodedCubeId],
    queryFn: () => lindasService.getCubeSchema(decodedCubeId),
    enabled: !!decodedCubeId,
  });

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Extract cube name from IRI
  const cubeName = decodedCubeId.split('/').pop() || 'Cube';

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="text" width="40%" height={40} />
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="rectangular" height={300} sx={{ mt: 2 }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load cube details. The cube may not exist or the endpoint may
        be unavailable.
      </Alert>
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
        <Link
          color="inherit"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate('/cubes');
          }}
          underline="hover"
        >
          Data Cubes
        </Link>
        <Typography color="text.primary">{cubeName}</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {cubeName}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ wordBreak: 'break-all' }}
          >
            {decodedCubeId}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<ChartIcon />}
          onClick={() => navigate(`/cubes/${cubeId}/chart`)}
          sx={{ flexShrink: 0 }}
        >
          Create Chart
        </Button>
      </Box>

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Schema" />
            <Tab label="Preview" />
            <Tab label="SPARQL" />
          </Tabs>
        </Box>

        {/* Schema Tab */}
        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Label</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Data Type</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {schema?.columns.map((col) => (
                  <TableRow key={col.iri}>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {col.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{col.label}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={col.type}
                        color={
                          col.type === 'measure'
                            ? 'primary'
                            : col.type === 'temporalDimension'
                            ? 'secondary'
                            : 'default'
                        }
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        fontFamily="monospace"
                      >
                        {col.dataType || '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Preview Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography color="text.secondary">
            Data preview will be available after connecting to Superset. Create
            a chart in Superset using this cube's data to visualize it here.
          </Typography>
        </TabPanel>

        {/* SPARQL Tab */}
        <TabPanel value={tabValue} index={2}>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              bgcolor: 'grey.50',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              overflow: 'auto',
            }}
          >
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
{`PREFIX cube: <https://cube.link/>
PREFIX schema: <http://schema.org/>

SELECT ?observation ?p ?o
WHERE {
  ?observation a cube:Observation ;
    cube:observedBy <${decodedCubeId}> ;
    ?p ?o .
}
LIMIT 100`}
            </pre>
          </Paper>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Copy this query to explore the cube data in your SPARQL client.
          </Typography>
        </TabPanel>
      </Paper>
    </Box>
  );
}
