import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Skeleton,
  Alert,
  Card,
  CardContent,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  ShowChart as LineChartIcon,
  PieChart as PieChartIcon,
  ScatterPlot as ScatterPlotIcon,
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { lindasService } from '@/services/lindas';
import ReactECharts from 'echarts-for-react';

type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'table';

interface ChartConfig {
  xAxis: string;
  yAxis: string;
  colorBy: string;
  chartType: ChartType;
}

export function ChartBuilderPage() {
  const { cubeId } = useParams<{ cubeId: string }>();
  const navigate = useNavigate();
  const decodedCubeId = cubeId ? decodeURIComponent(cubeId) : '';

  const [config, setConfig] = useState<ChartConfig>({
    xAxis: '',
    yAxis: '',
    colorBy: '',
    chartType: 'bar',
  });

  // Fetch cube schema
  const {
    data: schema,
    isLoading: schemaLoading,
    error: schemaError,
  } = useQuery({
    queryKey: ['cubeSchema', decodedCubeId],
    queryFn: () => lindasService.getCubeSchema(decodedCubeId),
    enabled: !!decodedCubeId,
  });

  // Fetch chart data when config is complete
  const {
    data: chartData,
    isLoading: dataLoading,
    error: dataError,
    refetch: fetchData,
  } = useQuery({
    queryKey: ['chartData', decodedCubeId, config],
    queryFn: () => lindasService.getObservations(decodedCubeId, {
      dimensions: [config.xAxis, config.colorBy].filter(Boolean),
      measures: [config.yAxis].filter(Boolean),
      limit: 1000,
    }),
    enabled: false, // Manual trigger
  });

  // Auto-select first options when schema loads
  useEffect(() => {
    if (schema?.columns && schema.columns.length > 0) {
      // Find temporal dimension or first column for X-axis
      const temporal = schema.columns.find((c) =>
        c.type === 'temporalDimension' || c.name.toLowerCase().includes('date')
      );

      // Find numeric-looking column for Y-axis (revenue, amount, count, value, etc.)
      const numericCol = schema.columns.find((c) =>
        c.type === 'measure' ||
        c.name.toLowerCase().includes('revenue') ||
        c.name.toLowerCase().includes('amount') ||
        c.name.toLowerCase().includes('value') ||
        c.name.toLowerCase().includes('count')
      );

      if (!config.xAxis) {
        setConfig((prev) => ({
          ...prev,
          xAxis: temporal?.name || schema.columns[0].name,
        }));
      }
      if (!config.yAxis && schema.columns.length > 1) {
        setConfig((prev) => ({
          ...prev,
          yAxis: numericCol?.name || schema.columns[1].name
        }));
      }
    }
  }, [schema]);

  // Fetch data when config changes and is complete
  useEffect(() => {
    if (config.xAxis && config.yAxis) {
      fetchData();
    }
  }, [config.xAxis, config.yAxis, config.colorBy]);

  const cubeName = decodedCubeId.split('/').pop() || 'Cube';

  // Use all columns for both dimensions and measures since backend doesn't classify properly
  const allColumns = schema?.columns || [];
  const dimensions = allColumns;
  const measures = allColumns;

  // Generate ECharts options based on config and data
  const getChartOptions = () => {
    if (!chartData || chartData.length === 0) {
      return null;
    }

    const xAxisData = [...new Set(chartData.map((d: any) => d[config.xAxis]))].sort();

    if (config.chartType === 'pie') {
      const aggregated: Record<string, number> = {};
      chartData.forEach((d: any) => {
        const key = String(d[config.xAxis]);
        aggregated[key] = (aggregated[key] || 0) + Number(d[config.yAxis] || 0);
      });

      return {
        tooltip: { trigger: 'item' },
        legend: { orient: 'vertical', left: 'left' },
        series: [{
          type: 'pie',
          radius: '50%',
          data: Object.entries(aggregated).map(([name, value]) => ({ name, value })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        }],
      };
    }

    // For bar/line charts
    if (config.colorBy) {
      const groups = [...new Set(chartData.map((d: any) => d[config.colorBy]))];
      const series = groups.map((group) => {
        const groupData = xAxisData.map((x) => {
          const match = chartData.find(
            (d: any) => d[config.xAxis] === x && d[config.colorBy] === group
          );
          return match ? Number(match[config.yAxis] || 0) : 0;
        });
        return {
          name: String(group),
          type: config.chartType === 'scatter' ? 'scatter' : config.chartType,
          data: groupData,
          stack: config.chartType === 'bar' ? 'total' : undefined,
        };
      });

      return {
        tooltip: { trigger: 'axis' },
        legend: { data: groups.map(String) },
        xAxis: { type: 'category', data: xAxisData },
        yAxis: { type: 'value' },
        series,
      };
    }

    // Simple aggregation without grouping
    const aggregated: Record<string, number> = {};
    chartData.forEach((d: any) => {
      const key = String(d[config.xAxis]);
      aggregated[key] = (aggregated[key] || 0) + Number(d[config.yAxis] || 0);
    });

    return {
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: xAxisData },
      yAxis: { type: 'value' },
      series: [{
        type: config.chartType === 'scatter' ? 'scatter' : config.chartType,
        data: xAxisData.map((x) => aggregated[String(x)] || 0),
      }],
    };
  };

  if (schemaLoading) {
    return (
      <Box>
        <Skeleton variant="text" width="40%" height={40} />
        <Skeleton variant="rectangular" height={400} sx={{ mt: 2 }} />
      </Box>
    );
  }

  if (schemaError) {
    return (
      <Alert severity="error">
        Failed to load cube schema. Please try again.
      </Alert>
    );
  }

  const chartOptions = getChartOptions();

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          color="inherit"
          href="#"
          onClick={(e) => { e.preventDefault(); navigate('/'); }}
          underline="hover"
        >
          Home
        </Link>
        <Link
          color="inherit"
          href="#"
          onClick={(e) => { e.preventDefault(); navigate('/cubes'); }}
          underline="hover"
        >
          Data Cubes
        </Link>
        <Link
          color="inherit"
          href="#"
          onClick={(e) => { e.preventDefault(); navigate(`/cubes/${cubeId}`); }}
          underline="hover"
        >
          {cubeName}
        </Link>
        <Typography color="text.primary">Chart Builder</Typography>
      </Breadcrumbs>

      <Typography variant="h4" gutterBottom>
        Create Visualization
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure your chart using the options below
      </Typography>

      <Grid container spacing={3}>
        {/* Configuration Panel */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Chart Configuration
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {/* Chart Type */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Chart Type
                </Typography>
                <ToggleButtonGroup
                  value={config.chartType}
                  exclusive
                  onChange={(_, value) => value && setConfig((prev) => ({ ...prev, chartType: value }))}
                  size="small"
                  fullWidth
                >
                  <ToggleButton value="bar" title="Bar Chart">
                    <BarChartIcon />
                  </ToggleButton>
                  <ToggleButton value="line" title="Line Chart">
                    <LineChartIcon />
                  </ToggleButton>
                  <ToggleButton value="pie" title="Pie Chart">
                    <PieChartIcon />
                  </ToggleButton>
                  <ToggleButton value="scatter" title="Scatter Plot">
                    <ScatterPlotIcon />
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {/* X-Axis */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>X-Axis (Dimension)</InputLabel>
                <Select
                  value={config.xAxis}
                  label="X-Axis (Dimension)"
                  onChange={(e) => setConfig((prev) => ({ ...prev, xAxis: e.target.value }))}
                >
                  {dimensions.map((dim) => (
                    <MenuItem key={dim.name} value={dim.name}>
                      {dim.label || dim.name}
                      {dim.type === 'temporalDimension' && ' (Time)'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Y-Axis */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Y-Axis (Measure)</InputLabel>
                <Select
                  value={config.yAxis}
                  label="Y-Axis (Measure)"
                  onChange={(e) => setConfig((prev) => ({ ...prev, yAxis: e.target.value }))}
                >
                  {measures.map((measure) => (
                    <MenuItem key={measure.name} value={measure.name}>
                      {measure.label || measure.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Color By */}
              {config.chartType !== 'pie' && (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Color By (Optional)</InputLabel>
                  <Select
                    value={config.colorBy}
                    label="Color By (Optional)"
                    onChange={(e) => setConfig((prev) => ({ ...prev, colorBy: e.target.value }))}
                  >
                    <MenuItem value="">None</MenuItem>
                    {dimensions
                      .filter((d) => d.name !== config.xAxis)
                      .map((dim) => (
                        <MenuItem key={dim.name} value={dim.name}>
                          {dim.label || dim.name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              )}

              <Divider sx={{ my: 2 }} />

              <Button
                variant="contained"
                fullWidth
                onClick={() => fetchData()}
                disabled={!config.xAxis || !config.yAxis}
              >
                Update Chart
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Chart Preview */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%', minHeight: 500 }}>
            <CardContent sx={{ height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Preview
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {dataLoading && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 400,
                  }}
                >
                  <CircularProgress />
                </Box>
              )}

              {dataError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  Failed to load data. Please check your configuration.
                </Alert>
              )}

              {!dataLoading && chartOptions && (
                <ReactECharts
                  option={chartOptions}
                  style={{ height: 400, width: '100%' }}
                  notMerge={true}
                />
              )}

              {!dataLoading && !chartOptions && !dataError && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 400,
                    bgcolor: 'grey.100',
                    borderRadius: 1,
                  }}
                >
                  <Typography color="text.secondary">
                    Select dimensions and measures to preview the chart
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
