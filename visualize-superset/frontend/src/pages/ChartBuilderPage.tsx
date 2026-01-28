import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Grid,
  Button,
  Skeleton,
  Alert,
  Card,
  CardContent,
  CircularProgress,
  Paper,
  Tooltip,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  ShowChart as LineChartIcon,
  PieChart as PieChartIcon,
  ScatterPlot as ScatterPlotIcon,
  DonutLarge as AreaChartIcon,
  Radar as RadarChartIcon,
  FilterNone as FunnelIcon,
  Speed as GaugeIcon,
  GridOn as HeatmapIcon,
  AccountTree as TreemapIcon,
  Analytics as BoxplotIcon,
  BarChart,
} from '@mui/icons-material';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, defaultDropAnimationSideEffects, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useState, useEffect, Component, type ReactNode, type ErrorInfo } from 'react';
import { lindasService, type CubeColumn } from '@/services/lindas';
import ReactECharts from 'echarts-for-react';
import { FieldPanel } from '@/components/FieldPanel/FieldPanel';
import { FieldWell } from '@/components/FieldWell/FieldWell';
import { FilterPanel, type Filter } from '@/components/FilterPanel/FilterPanel';

type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'radar' | 'funnel' | 'gauge' | 'heatmap' | 'treemap' | 'boxplot' | 'table';

type Aggregation = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none';

interface ChartConfig {
  chartType: ChartType;
  xAxis: string[];
  yAxis: string[];
  colorBy: string[];
  aggregation: Aggregation;
}

class ChartErrorBoundary extends Component<
  { children: ReactNode; onReset?: () => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Chart render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            Invalid chart configuration. The chart could not be rendered.
          </Alert>
          <Button
            variant="outlined"
            onClick={() => {
              this.setState({ hasError: false });
              this.props.onReset?.();
            }}
          >
            Reset
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

export function ChartBuilderPage() {
  const { cubeId } = useParams<{ cubeId: string }>();
  const navigate = useNavigate();
  const decodedCubeId = cubeId ? decodeURIComponent(cubeId) : '';

  const [config, setConfig] = useState<ChartConfig>({
    chartType: 'bar',
    xAxis: [],
    yAxis: [],
    colorBy: [],
    aggregation: 'sum',
  });

  const [filters, setFilters] = useState<Filter[]>([]);
  const [activeDragItem, setActiveDragItem] = useState<CubeColumn | null>(null);

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 5 },
  });
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(pointerSensor, keyboardSensor);

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

  // Auto-select first options when schema loads
  useEffect(() => {
    if (schema?.columns && schema.columns.length > 0) {
      const temporal = schema.columns.find((c) =>
        c.type === 'temporalDimension' || c.name.toLowerCase().includes('date')
      );

      const numericCol = schema.columns.find((c) =>
        c.type === 'measure' ||
        c.name.toLowerCase().includes('revenue') ||
        c.name.toLowerCase().includes('amount') ||
        c.name.toLowerCase().includes('value') ||
        c.name.toLowerCase().includes('count')
      );

      if (config.xAxis.length === 0 && temporal) {
        setConfig((prev) => ({
          ...prev,
          xAxis: [temporal.name],
        }));
      }

      if (config.yAxis.length === 0 && numericCol) {
        setConfig((prev) => ({
          ...prev,
          yAxis: [numericCol.name],
        }));
      }
    }
  }, [schema]);

  // Fetch chart data when config is complete
  const {
    data: chartData,
    isLoading: dataLoading,
    error: dataError,
    refetch: fetchData,
  } = useQuery({
    queryKey: ['chartData', decodedCubeId, config, filters],
    queryFn: () => lindasService.getObservations(decodedCubeId, {
      dimensions: [...config.xAxis, ...config.colorBy].filter(Boolean),
      measures: config.yAxis.filter(Boolean),
      limit: 10000,
    }),
    enabled: config.xAxis.length > 0 && config.yAxis.length > 0,
  });

  const cubeName = decodedCubeId.split('/').pop() || 'Cube';
  const allColumns = schema?.columns || [];

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const column = allColumns.find(c => c.name === active.id);
    setActiveDragItem(column || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over) return;

    const column = allColumns.find(c => c.name === active.id);
    if (!column) {
      return;
    }

    const wellId = over.id;
    const isMeasure = column.type === 'measure';
    const isDimension = column.type === 'dimension' || column.type === 'temporalDimension';

    // Validate field type against well type
    if (wellId === 'x-axis-well') {
      // X-Axis only accepts dimensions
      if (!isDimension) {
        return;
      }
      // Prevent duplicates
      if (config.xAxis.includes(column.name)) return;
      setConfig(prev => ({
        ...prev,
        xAxis: [...prev.xAxis, column.name],
      }));
    } else if (wellId === 'y-axis-well') {
      // Y-Axis only accepts measures
      if (!isMeasure) {
        return;
      }
      // Prevent duplicates
      if (config.yAxis.includes(column.name)) return;
      setConfig(prev => ({
        ...prev,
        yAxis: [...prev.yAxis, column.name],
      }));
    } else if (wellId === 'color-by-well') {
      // Color By only accepts dimensions
      if (!isDimension) {
        return;
      }
      // Prevent duplicates
      if (config.colorBy.includes(column.name)) return;
      setConfig(prev => ({
        ...prev,
        colorBy: [...prev.colorBy, column.name],
      }));
    }
  };

  // Drop animation configuration
  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };

  const handleRemoveField = (wellType: 'xAxis' | 'yAxis' | 'colorBy', fieldName: string) => {
    setConfig(prev => ({
      ...prev,
      [wellType]: prev[wellType].filter(f => f !== fieldName),
    }));
  };

  const handleAddFilter = (filter: Filter) => {
    setFilters(prev => [...prev, filter]);
  };

  const handleRemoveFilter = (filterId: string) => {
    setFilters(prev => prev.filter(f => f.id !== filterId));
  };

  const handleUpdateFilter = (filterId: string, updates: Partial<Filter>) => {
    setFilters(prev => prev.map(f => f.id === filterId ? { ...f, ...updates } : f));
  };

  // Chart type configuration
  const chartTypes: { type: ChartType; icon: React.ReactNode; label: string; description: string }[] = [
    { type: 'bar', icon: <BarChartIcon />, label: 'Bar', description: 'Bar chart' },
    { type: 'line', icon: <LineChartIcon />, label: 'Line', description: 'Line chart' },
    { type: 'area', icon: <AreaChartIcon />, label: 'Area', description: 'Area chart' },
    { type: 'pie', icon: <PieChartIcon />, label: 'Pie', description: 'Pie chart' },
    { type: 'scatter', icon: <ScatterPlotIcon />, label: 'Scatter', description: 'Scatter plot' },
    { type: 'radar', icon: <RadarChartIcon />, label: 'Radar', description: 'Radar chart' },
    { type: 'funnel', icon: <FunnelIcon />, label: 'Funnel', description: 'Funnel chart' },
    { type: 'gauge', icon: <GaugeIcon />, label: 'Gauge', description: 'Gauge/KPI' },
    { type: 'heatmap', icon: <HeatmapIcon />, label: 'Heatmap', description: 'Heatmap' },
    { type: 'treemap', icon: <TreemapIcon />, label: 'Treemap', description: 'Treemap' },
    { type: 'boxplot', icon: <BoxplotIcon />, label: 'Boxplot', description: 'Box plot' },
    { type: 'table', icon: <span>📊</span>, label: 'Table', description: 'Data table' },
  ];

  // Safe Math.max that handles empty arrays
  const safeMax = (arr: number[]) => arr.length === 0 ? 0 : Math.max(...arr);

  // Generate ECharts options based on config and data
  const getChartOptions = () => {
    try {
    if (config.chartType === 'table') return null;

    if (!chartData || chartData.length === 0) {
      return null;
    }

    const xField = config.xAxis[0];
    const yField = config.yAxis[0];
    const colorField = config.colorBy[0];

    if (!xField || !yField) return null;

    // Get unique X-axis values (handle both flat and nested data structures)
    const getFieldValue = (d: any, field: string): any => {
      if (!field) return undefined;
      // Handle nested values structure from backend
      const data = d.values || d;
      return data[field];
    };

    const xAxisData = [...new Set(chartData.map((d: any) => getFieldValue(d, xField)))].sort();

    // Apply filters using getFieldValue helper
    const filteredData = chartData.filter((d: any) => {
      return filters.every(filter => {
        const value = getFieldValue(d, filter.column.name);
        switch (filter.operator) {
          case 'equals':
            return String(value) === filter.value;
          case 'not_equals':
            return String(value) !== filter.value;
          case 'contains':
            return String(value).toLowerCase().includes(filter.value.toLowerCase());
          case 'greater_than':
            return Number(value) > Number(filter.value);
          case 'less_than':
            return Number(value) < Number(filter.value);
          case 'greater_equal':
            return Number(value) >= Number(filter.value);
          case 'less_equal':
            return Number(value) <= Number(filter.value);
          default:
            return true;
        }
      });
    });

    // Specialized chart types
    if (config.chartType === 'gauge') {
      if (filteredData.length === 0) return null;
      const total = filteredData.reduce((sum, d: any) => sum + (Number(getFieldValue(d, yField)) || 0), 0);
      const avg = total / filteredData.length;

      return {
        series: [{
          type: 'gauge',
          startAngle: 180,
          endAngle: 0,
          min: 0,
          max: safeMax(filteredData.map((d: any) => Number(getFieldValue(d, yField)) || 0)) * 1.2 || 100,
          splitNumber: 8,
          axisLine: {
            lineStyle: {
              width: 6,
              color: [[0.25, '#7CFFB2'], [0.5, '#58D9F9'], [0.75, '#FDDD60'], [1, '#FF6E76']],
            },
          },
          pointer: { length: '80%', width: 8, offsetCenter: [0, '-60%'], itemStyle: { color: 'auto' } },
          axisTick: { length: 12, lineStyle: { color: 'auto', width: 2 } },
          splitLine: { length: 20, lineStyle: { color: 'auto', width: 5 } },
          axisLabel: { color: '#464646', fontSize: 20, distance: -60, formatter: (value: number) => value },
          title: { offsetCenter: [0, '-20%'], fontSize: 20, color: '#464646' },
          detail: {
            fontSize: 30,
            offsetCenter: [0, '0%'],
            valueAnimation: true,
            formatter: (value: string) => `${value}`,
            color: 'auto',
          },
          data: [{ value: avg, name: 'Average' }],
        }],
      };
    }

    if (config.chartType === 'radar') {
      if (filteredData.length === 0) return null;
      const groups = colorField
        ? [...new Set(filteredData.map((d: any) => getFieldValue(d, colorField)))]
        : ['All'];
      const maxVal = safeMax(filteredData.map((d: any) => Number(getFieldValue(d, yField)) || 0)) * 1.2 || 100;
      const indicators = xAxisData.map(x => ({ name: String(x), max: maxVal }));
      const series = groups.map(group => {
        return {
          value: xAxisData.map(x => {
            const match = filteredData.find((d: any) => getFieldValue(d, xField) === x && (!colorField || getFieldValue(d, colorField) === group));
            return match ? Number(getFieldValue(match, yField)) || 0 : 0;
          }),
          name: String(group),
        };
      });

      return {
        tooltip: { trigger: 'item' },
        legend: { data: groups.map(String) },
        radar: { indicator: indicators },
        series: [{ type: 'radar', data: series }],
      };
    }

    if (config.chartType === 'funnel') {
      const aggregated: Record<string, number> = {};
      filteredData.forEach((d: any) => {
        const key = String(getFieldValue(d, xField));
        aggregated[key] = (aggregated[key] || 0) + Number(getFieldValue(d, yField) || 0);
      });

      const funnelData = Object.entries(aggregated)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      return {
        tooltip: { trigger: 'item' },
        series: [{
          type: 'funnel',
          left: '10%',
          top: 60,
          bottom: 60,
          width: '80%',
          min: 0,
          max: safeMax(funnelData.map(d => d.value)),
          minSize: '0%',
          maxSize: '100%',
          sort: 'descending',
          gap: 2,
          label: { show: true, position: 'inside' },
          labelLine: { length: 10, lineStyle: { width: 1, type: 'solid' } },
          itemStyle: { borderColor: '#fff', borderWidth: 1 },
          emphasis: { label: { fontSize: 20 } },
          data: funnelData,
        }],
      };
    }

    if (config.chartType === 'heatmap') {
      const xCategories = xAxisData;
      const yCategories = colorField ? [...new Set(filteredData.map((d: any) => getFieldValue(d, colorField)))] : [yField];

      const data: [number, number, number][] = [];
      xCategories.forEach((x, xIdx) => {
        yCategories.forEach((y, yIdx) => {
          const match = filteredData.find((d: any) => getFieldValue(d, xField) === x && (getFieldValue(d, colorField) === y || !colorField));
          data.push([xIdx, yIdx, match ? Number(getFieldValue(match, yField) || 0) : 0]);
        });
      });

      return {
        tooltip: { position: 'top' },
        grid: { height: '75%', top: '10%' },
        xAxis: { type: 'category', data: xCategories },
        yAxis: { type: 'category', data: yCategories },
        visualMap: { min: 0, max: safeMax(data.map(d => d[2])) || 100, calculable: true, orient: 'horizontal', left: 'center', bottom: '0%' },
        series: [{ type: 'heatmap', data: data, label: { show: true }, emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } } }],
      };
    }

    if (config.chartType === 'treemap') {
      const aggregated: Record<string, number> = {};
      filteredData.forEach((d: any) => {
        const key = String(getFieldValue(d, xField));
        aggregated[key] = (aggregated[key] || 0) + Number(getFieldValue(d, yField) || 0);
      });

      const treeData = Object.entries(aggregated).map(([name, value]) => ({ name, value }));

      return {
        tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c}' },
        series: [{ type: 'treemap', data: treeData }],
      };
    }

    if (config.chartType === 'boxplot') {
      const valuesByGroup: Record<string, number[]> = {};
      filteredData.forEach((d: any) => {
        const key = String(getFieldValue(d, xField));
        if (!valuesByGroup[key]) valuesByGroup[key] = [];
        valuesByGroup[key].push(Number(getFieldValue(d, yField) || 0));
      });

      const categories = Object.keys(valuesByGroup).sort();
      const boxData = categories.map(cat => {
        const values = valuesByGroup[cat].sort((a, b) => a - b);
        const q1 = values[Math.floor(values.length * 0.25)];
        const q2 = values[Math.floor(values.length * 0.5)];
        const q3 = values[Math.floor(values.length * 0.75)];
        const min = values[0];
        const max = values[values.length - 1];
        return [min, q1, q2, q3, max];
      });

      return {
        tooltip: { trigger: 'item' },
        xAxis: { type: 'category', data: categories },
        yAxis: { type: 'value' },
        series: [{ type: 'boxplot', data: boxData }],
      };
    }

    if (config.chartType === 'pie') {
      const aggregated: Record<string, number> = {};
      filteredData.forEach((d: any) => {
        const key = String(getFieldValue(d, xField));
        aggregated[key] = (aggregated[key] || 0) + Number(getFieldValue(d, yField) || 0);
      });

      return {
        tooltip: { trigger: 'item' },
        legend: { orient: 'vertical', left: 'left' },
        series: [{
          type: 'pie',
          radius: '50%',
          data: Object.entries(aggregated).map(([name, value]) => ({ name, value })),
          emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
        }],
      };
    }

    // For bar/line/area charts
    const areaStyle = config.chartType === 'area' ? { opacity: 0.3 } : undefined;

    if (colorField) {
      const groups = [...new Set(filteredData.map((d: any) => getFieldValue(d, colorField)))];
      const series = groups.map((group) => {
        const groupData = xAxisData.map((x) => {
          const match = filteredData.find(
            (d: any) => getFieldValue(d, xField) === x && getFieldValue(d, colorField) === group
          );
          return match ? Number(getFieldValue(match, yField) || 0) : 0;
        });
        return {
          name: String(group),
          type: config.chartType === 'scatter' ? 'scatter' : config.chartType === 'area' ? 'line' : config.chartType,
          data: groupData,
          stack: config.chartType === 'bar' ? 'total' : undefined,
          areaStyle,
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
    filteredData.forEach((d: any) => {
      const key = String(getFieldValue(d, xField));
      aggregated[key] = (aggregated[key] || 0) + Number(getFieldValue(d, yField) || 0);
    });

    return {
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: xAxisData },
      yAxis: { type: 'value' },
      series: [{
        type: config.chartType === 'scatter' ? 'scatter' : config.chartType === 'area' ? 'line' : config.chartType,
        data: xAxisData.map((x) => aggregated[String(x)] || 0),
        areaStyle,
      }],
    };
    } catch (e) {
      console.error('getChartOptions error:', e);
      return null;
    }
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

  // Helper to get icon for drag overlay
  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'temporalDimension':
        return '📅';
      case 'measure':
        return '#';
      default:
        return '🏷️';
    }
  };

  // Helper to get color for drag overlay
  const getFieldColor = (type: string) => {
    switch (type) {
      case 'temporalDimension':
        return '#1976d2';
      case 'measure':
        return '#2e7d32';
      default:
        return '#7b1fa2';
    }
  };

  // Validation messages
  const getValidationMessage = () => {
    if (config.xAxis.length === 0 && config.yAxis.length === 0) {
      return 'Add a dimension to X-Axis and a measure to Y-Axis';
    }
    if (config.xAxis.length === 0) {
      return 'Add a dimension to X-Axis';
    }
    if (config.yAxis.length === 0) {
      return 'Add a measure to Y-Axis';
    }
    if (chartData && chartData.length === 0) {
      return 'No data available for the selected configuration';
    }
    return null;
  };

  const validationMessage = getValidationMessage();
  const hasInsufficientData = !dataLoading && (!chartData || chartData.length === 0) && config.xAxis.length > 0 && config.yAxis.length > 0;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
            onClick={(e) => { e.preventDefault(); navigate(`/cubes/${encodeURIComponent(decodedCubeId)}`); }}
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
          Drag and drop fields to create your chart. Dimensions (🏷️) go to X-Axis and Color By. Measures (#) go to Y-Axis.
        </Typography>

        <Grid container spacing={2} sx={{ flexGrow: 1 }}>
          {/* Left Panel - Fields */}
          <Grid item xs={12} md={3} sx={{ height: '100%' }}>
            <Paper sx={{ p: 2, height: '100%', overflow: 'auto' }}>
              <Typography variant="h6" gutterBottom>
                Data Fields
              </Typography>

            <FieldPanel
              columns={allColumns}
              type="dimensions"
            />

            <FieldPanel
              columns={allColumns}
              type="measures"
            />
            </Paper>
          </Grid>

          {/* Middle Panel - Configuration */}
          <Grid item xs={12} md={3} sx={{ height: '100%' }}>
            <Paper sx={{ p: 2, height: '100%', overflow: 'auto' }}>
              <Typography variant="h6" gutterBottom>
                Configuration
              </Typography>

              {/* Chart Type */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Chart Type
                </Typography>
                <Grid container spacing={1}>
                  {chartTypes.map((ct) => (
                    <Grid item xs={4} key={ct.type}>
                      <Tooltip title={ct.description}>
                        <Button
                          fullWidth
                          variant={config.chartType === ct.type ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => setConfig(prev => ({ ...prev, chartType: ct.type }))}
                          sx={{ minWidth: 'auto', py: 1.5 }}
                        >
                          {ct.icon}
                        </Button>
                      </Tooltip>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Field Wells */}
              <FieldWell
                id="x-axis-well"
                title="X-Axis"
                description="dimension"
                acceptTypes={['dimension', 'temporalDimension']}
                fields={allColumns.filter(c => config.xAxis.includes(c.name))}
                onRemoveField={(name) => handleRemoveField('xAxis', name)}
                icon="📊"
              />

              <FieldWell
                id="y-axis-well"
                title="Y-Axis"
                description="measure"
                acceptTypes={['measure']}
                fields={allColumns.filter(c => config.yAxis.includes(c.name))}
                onRemoveField={(name) => handleRemoveField('yAxis', name)}
                icon="#"
              />

              {config.chartType !== 'gauge' && config.chartType !== 'treemap' && (
                <FieldWell
                  id="color-by-well"
                  title="Color By"
                  description="dimension"
                  acceptTypes={['dimension', 'temporalDimension']}
                  fields={allColumns.filter(c => config.colorBy.includes(c.name))}
                  onRemoveField={(name) => handleRemoveField('colorBy', name)}
                  icon="🎨"
                />
              )}

              <Divider sx={{ my: 2 }} />

              {/* Filters */}
              <FilterPanel
                columns={allColumns}
                filters={filters}
                onAddFilter={handleAddFilter}
                onRemoveFilter={handleRemoveFilter}
                onUpdateFilter={handleUpdateFilter}
              />
            </Paper>
          </Grid>

          {/* Right Panel - Chart Preview */}
          <Grid item xs={12} md={6} sx={{ height: '100%' }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Preview
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => fetchData()}
                    disabled={!config.xAxis.length || !config.yAxis.length}
                  >
                    Refresh
                  </Button>
                </Box>

                {/* Validation Warning */}
                {validationMessage && (
                  <Alert
                    severity={config.xAxis.length === 0 || config.yAxis.length === 0 ? 'warning' : 'info'}
                    sx={{ mb: 2 }}
                    icon={config.xAxis.length === 0 || config.yAxis.length === 0 ? undefined : <BarChart />}
                  >
                    {validationMessage}
                  </Alert>
                )}

                {dataLoading && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexGrow: 1,
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

                {!dataLoading && config.chartType === 'table' && chartData && chartData.length > 0 && (
                  <TableContainer sx={{ maxHeight: 500 }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          {[...config.xAxis, ...config.yAxis, ...config.colorBy].filter(Boolean).map((field) => (
                            <TableCell key={field} sx={{ fontWeight: 'bold' }}>
                              {allColumns.find(c => c.name === field)?.label || field}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {chartData.slice(0, 200).map((row: any, idx: number) => (
                          <TableRow key={idx} hover>
                            {[...config.xAxis, ...config.yAxis, ...config.colorBy].filter(Boolean).map((field) => (
                              <TableCell key={field}>
                                {String((row.values || row)[field] ?? '')}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                {!dataLoading && chartOptions && !hasInsufficientData && (
                  <ChartErrorBoundary key={config.chartType} onReset={() => setConfig(prev => ({ ...prev, xAxis: [], yAxis: [], colorBy: [] }))}>
                    <ReactECharts
                      option={chartOptions}
                      style={{ height: 500, width: '100%' }}
                      notMerge={true}
                    />
                  </ChartErrorBoundary>
                )}

                {(hasInsufficientData || (!dataLoading && !chartOptions && !dataError && !(config.chartType === 'table' && chartData && chartData.length > 0))) && (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexGrow: 1,
                      minHeight: 400,
                      bgcolor: 'grey.100',
                      borderRadius: 1,
                      p: 3,
                      textAlign: 'center',
                    }}
                  >
                    <BarChart sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                    <Typography color="text.secondary" variant="h6" gutterBottom>
                      {hasInsufficientData ? 'No Data Available' : 'Chart Preview'}
                    </Typography>
                    <Typography color="text.secondary">
                      {hasInsufficientData
                        ? 'No data returned for the selected configuration. Try adjusting your filters or selecting different fields.'
                        : 'Drag dimensions to X-Axis and measures to Y-Axis to create a chart'}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Drag Overlay - rendered at the top level */}
      <DragOverlay dropAnimation={dropAnimation}>
        {activeDragItem && (
          <Chip
            label={`${getFieldIcon(activeDragItem.type)} ${activeDragItem.label || activeDragItem.name}`}
            sx={{
              backgroundColor: getFieldColor(activeDragItem.type),
              color: 'white',
              fontWeight: 500,
              boxShadow: 3,
              cursor: 'grabbing',
              transform: 'scale(1.05)',
            }}
            size="small"
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
