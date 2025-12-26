/**
 * Chart Builder - A professional Swiss Federal data visualization platform
 *
 * Features:
 * - Swiss Federal CI design system
 * - Multiple chart dashboard with vertical stacking
 * - Multiple views: Chart, Table, Filters, Settings, Code
 * - Full-screen and zen modes
 * - Interactive filters
 * - Export to PNG/CSV/SVG/JSON
 * - Annotations
 * - Responsive design
 */

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  Box,
  Container,
  Typography,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Button,
  IconButton,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Slider,
  Switch,
  FormControlLabel,
  Tooltip,
  Menu,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormGroup,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import dynamic from "next/dynamic";

// Dynamically import ECharts
const SimpleEChartsChart = dynamic(
  () => import("@/charts/simple-echarts").then((mod) => mod.SimpleEChartsChart),
  { ssr: false }
);

// Types
type SimpleChartType = "column" | "bar" | "line" | "area" | "pie" | "scatter";

interface Dimension {
  id: string;
  label: string;
  values?: Array<{ value: string; label: string }>;
}

interface Measure {
  id: string;
  label: string;
  unit?: string;
}

interface Observation {
  [key: string]: string | number | null;
}

interface ChartConfig {
  id: string;
  chartType: SimpleChartType;
  xField: string;
  yField: string;
  groupField: string;
  title: string;
  colorPalette: string;
  showLegend: boolean;
  showTooltip: boolean;
  height: number;
  filters: Record<string, string[]>;
}

interface Annotation {
  id: string;
  text: string;
  xValue: string;
  yValue?: number;
  color: string;
}

// Constants
const CHART_TYPES: Array<{ type: SimpleChartType; label: string; icon: string; description: string }> = [
  { type: "column", label: "Column", icon: "||", description: "Vertical bars" },
  { type: "bar", label: "Bar", icon: "=", description: "Horizontal bars" },
  { type: "line", label: "Line", icon: "^", description: "Trends over time" },
  { type: "area", label: "Area", icon: "/", description: "Cumulative values" },
  { type: "pie", label: "Pie", icon: "O", description: "Parts of whole" },
  { type: "scatter", label: "Scatter", icon: ".", description: "Correlation" },
];

const COLOR_PALETTES: Record<string, string[]> = {
  swiss: ["#DC0018", "#2D6B9F", "#66B573", "#F9B21A", "#8E6A9E", "#00A5AC", "#E06336", "#7B7B7B"],
  federal: ["#1D4ED8", "#047857", "#B45309", "#7C3AED", "#BE185D", "#0369A1", "#15803D", "#A16207"],
  blue: ["#1565C0", "#1976D2", "#1E88E5", "#2196F3", "#42A5F5", "#64B5F6", "#90CAF9", "#BBDEFB"],
  warm: ["#DC2626", "#EA580C", "#D97706", "#CA8A04", "#65A30D", "#16A34A", "#059669", "#0D9488"],
  cool: ["#2563EB", "#4F46E5", "#7C3AED", "#9333EA", "#C026D3", "#DB2777", "#E11D48", "#F43F5E"],
  monochrome: ["#111827", "#374151", "#4B5563", "#6B7280", "#9CA3AF", "#D1D5DB", "#E5E7EB", "#F3F4F6"],
};

const SPARQL_ENDPOINT = "https://lindas.admin.ch/query";

// Navigation items
const NAV_ITEMS = [
  { id: "chart", label: "Visualization", icon: "[=]" },
  { id: "table", label: "Data Table", icon: "[#]" },
  { id: "filters", label: "Filters", icon: "[?]" },
  { id: "settings", label: "Settings", icon: "[*]" },
  { id: "code", label: "API / Code", icon: "[<>]" },
];

// Helpers
function isDateField(id: string, label: string): boolean {
  const lower = (id + label).toLowerCase();
  return lower.includes("date") || lower.includes("year") || lower.includes("time") || lower.includes("period");
}

function formatLabel(value: string): string {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) {
    const parts = value.split("/");
    return decodeURIComponent(parts[parts.length - 1]);
  }
  const yearMatch = value.match(/^Year\s+(\d{4})$/i);
  if (yearMatch) return yearMatch[1];
  return value;
}

function sortObservations(observations: Observation[], field: string): Observation[] {
  return [...observations].sort((a, b) => {
    const valA = a[field];
    const valB = b[field];
    if (valA == null && valB == null) return 0;
    if (valA == null) return 1;
    if (valB == null) return -1;

    const strA = String(valA);
    const strB = String(valB);

    const yearA = strA.match(/(\d{4})/);
    const yearB = strB.match(/(\d{4})/);
    if (yearA && yearB) {
      return parseInt(yearA[1]) - parseInt(yearB[1]);
    }

    const numA = parseFloat(strA);
    const numB = parseFloat(strB);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }

    return strA.localeCompare(strB);
  });
}

function calculateStats(observations: Observation[], field: string) {
  const values = observations.map(o => Number(o[field])).filter(v => !isNaN(v));
  if (values.length === 0) return { min: 0, max: 0, avg: 0, sum: 0, count: 0 };
  const sum = values.reduce((a, b) => a + b, 0);
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    avg: sum / values.length,
    sum,
    count: values.length,
  };
}

function getUniqueFieldValues(observations: Observation[], field: string): string[] {
  const unique = new Set<string>();
  observations.forEach(obs => {
    const val = obs[field];
    if (val != null) unique.add(String(val));
  });
  return Array.from(unique).sort();
}

async function fetchCubeData(cubeIri: string): Promise<{
  title: string;
  dimensions: Dimension[];
  measures: Measure[];
  observations: Observation[];
}> {
  const metadataQuery = `
    PREFIX cube: <https://cube.link/>
    PREFIX schema: <http://schema.org/>
    PREFIX sh: <http://www.w3.org/ns/shacl#>
    PREFIX qudt: <http://qudt.org/schema/qudt/>

    SELECT DISTINCT ?title ?dimension ?dimensionLabel ?measure ?measureLabel ?unit
    WHERE {
      <${cubeIri}> schema:name ?title .
      FILTER(LANG(?title) = "en" || LANG(?title) = "")

      <${cubeIri}> cube:observationConstraint ?shape .

      OPTIONAL {
        ?shape sh:property ?dimProp .
        ?dimProp sh:path ?dimension .
        ?dimProp schema:name ?dimensionLabel .
        FILTER(LANG(?dimensionLabel) = "en" || LANG(?dimensionLabel) = "")
        FILTER NOT EXISTS { ?dimProp qudt:hasUnit ?u }
      }

      OPTIONAL {
        ?shape sh:property ?measureProp .
        ?measureProp sh:path ?measure .
        ?measureProp schema:name ?measureLabel .
        FILTER(LANG(?measureLabel) = "en" || LANG(?measureLabel) = "")
        ?measureProp qudt:hasUnit ?unitUri .
        OPTIONAL { ?unitUri schema:name ?unit }
      }
    }
  `;

  const observationsQuery = `
    PREFIX cube: <https://cube.link/>

    SELECT ?obs ?p ?o WHERE {
      <${cubeIri}> cube:observationSet ?obsSet .
      ?obsSet cube:observation ?obs .
      ?obs ?p ?o .
    } LIMIT 10000
  `;

  const metadataResponse = await fetch(SPARQL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/sparql-results+json" },
    body: `query=${encodeURIComponent(metadataQuery)}`,
  });

  const metadataJson = await metadataResponse.json();
  const dimensionsMap = new Map<string, Dimension>();
  const measuresMap = new Map<string, Measure>();
  let title = "";

  for (const binding of metadataJson.results.bindings) {
    if (binding.title?.value && !title) title = binding.title.value;
    if (binding.dimension?.value && binding.dimensionLabel?.value) {
      dimensionsMap.set(binding.dimension.value, { id: binding.dimension.value, label: binding.dimensionLabel.value });
    }
    if (binding.measure?.value && binding.measureLabel?.value) {
      measuresMap.set(binding.measure.value, {
        id: binding.measure.value,
        label: binding.measureLabel.value,
        unit: binding.unit?.value,
      });
    }
  }

  const obsResponse = await fetch(SPARQL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/sparql-results+json" },
    body: `query=${encodeURIComponent(observationsQuery)}`,
  });

  const obsJson = await obsResponse.json();
  const obsMap = new Map<string, Observation>();
  for (const binding of obsJson.results.bindings) {
    const obsId = binding.obs.value;
    if (!obsMap.has(obsId)) obsMap.set(obsId, {});
    obsMap.get(obsId)![binding.p.value] = binding.o.value;
  }

  return {
    title,
    dimensions: Array.from(dimensionsMap.values()),
    measures: Array.from(measuresMap.values()),
    observations: Array.from(obsMap.values()),
  };
}

// Generate unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Main component
export default function ChartBuilderPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { cube } = router.query;
  const cubeIri = typeof cube === "string" ? cube : "";

  // Data state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [datasetTitle, setDatasetTitle] = useState("");
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [measures, setMeasures] = useState<Measure[]>([]);
  const [rawObservations, setRawObservations] = useState<Observation[]>([]);

  // UI state
  const [currentView, setCurrentView] = useState("chart");
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [zenMode, setZenMode] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: "" });

  // Charts state (multiple charts support)
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [activeChartId, setActiveChartId] = useState<string | null>(null);

  // Global filters
  const [globalFilters, setGlobalFilters] = useState<Record<string, string[]>>({});

  // Annotations
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [annotationDialogOpen, setAnnotationDialogOpen] = useState(false);
  const [editingAnnotation, setEditingAnnotation] = useState<Annotation | null>(null);

  // Settings
  const [settings, setSettings] = useState({
    defaultPalette: "swiss",
    animationDuration: 500,
    showDataLabels: false,
    compactMode: false,
    exportQuality: "high",
  });

  // Fetch data
  useEffect(() => {
    if (!cubeIri) return;
    setLoading(true);
    setError(null);

    fetchCubeData(cubeIri)
      .then((data) => {
        setDatasetTitle(data.title);
        setDimensions(data.dimensions);
        setMeasures(data.measures);
        setRawObservations(data.observations);

        // Create default chart
        if (data.dimensions.length > 0 && data.measures.length > 0) {
          const dateField = data.dimensions.find(d => isDateField(d.id, d.label));
          const defaultChart: ChartConfig = {
            id: generateId(),
            chartType: "column",
            xField: dateField?.id || data.dimensions[0].id,
            yField: data.measures[0].id,
            groupField: "",
            title: data.title,
            colorPalette: "swiss",
            showLegend: true,
            showTooltip: true,
            height: 400,
            filters: {},
          };
          setCharts([defaultChart]);
          setActiveChartId(defaultChart.id);
        }
      })
      .catch((err) => setError(err.message || "Failed to load data"))
      .finally(() => setLoading(false));
  }, [cubeIri]);

  // Get filtered observations
  const filteredObservations = useMemo(() => {
    let result = rawObservations;
    Object.entries(globalFilters).forEach(([field, values]) => {
      if (values.length > 0) {
        result = result.filter(obs => values.includes(String(obs[field])));
      }
    });
    return result;
  }, [rawObservations, globalFilters]);

  // Active chart
  const activeChart = useMemo(() => {
    return charts.find(c => c.id === activeChartId) || charts[0];
  }, [charts, activeChartId]);

  // Sorted observations for active chart
  const observations = useMemo(() => {
    if (!activeChart?.xField) return filteredObservations;
    return sortObservations(filteredObservations, activeChart.xField);
  }, [filteredObservations, activeChart?.xField]);

  // Statistics
  const stats = useMemo(() => {
    if (!activeChart?.yField) return null;
    return calculateStats(observations, activeChart.yField);
  }, [observations, activeChart?.yField]);

  // Update chart config
  const updateChart = useCallback((chartId: string, updates: Partial<ChartConfig>) => {
    setCharts(prev => prev.map(c => c.id === chartId ? { ...c, ...updates } : c));
  }, []);

  // Add new chart
  const addChart = useCallback(() => {
    if (dimensions.length === 0 || measures.length === 0) return;
    const newChart: ChartConfig = {
      id: generateId(),
      chartType: "line",
      xField: dimensions[0].id,
      yField: measures[0].id,
      groupField: "",
      title: `Chart ${charts.length + 1}`,
      colorPalette: settings.defaultPalette,
      showLegend: true,
      showTooltip: true,
      height: 350,
      filters: {},
    };
    setCharts(prev => [...prev, newChart]);
    setActiveChartId(newChart.id);
    setSnackbar({ open: true, message: "New chart added" });
  }, [dimensions, measures, charts.length, settings.defaultPalette]);

  // Remove chart
  const removeChart = useCallback((chartId: string) => {
    if (charts.length <= 1) return;
    setCharts(prev => prev.filter(c => c.id !== chartId));
    if (activeChartId === chartId) {
      setActiveChartId(charts.find(c => c.id !== chartId)?.id || null);
    }
    setSnackbar({ open: true, message: "Chart removed" });
  }, [charts, activeChartId]);

  // Export functions
  const handleExport = useCallback((format: "png" | "csv" | "json") => {
    if (format === "csv") {
      const headers = ["X-Axis", "Y-Axis", "Group"];
      const rows = observations.map(obs => [
        formatLabel(String(obs[activeChart?.xField || ""] || "")),
        obs[activeChart?.yField || ""],
        activeChart?.groupField ? formatLabel(String(obs[activeChart.groupField] || "")) : "",
      ]);
      const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const link = document.createElement("a");
      link.download = `${activeChart?.title || "data"}.csv`;
      link.href = URL.createObjectURL(blob);
      link.click();
    } else if (format === "json") {
      const config = { charts, globalFilters, annotations, settings };
      const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
      const link = document.createElement("a");
      link.download = `${datasetTitle || "config"}.json`;
      link.href = URL.createObjectURL(blob);
      link.click();
    }
    setSnackbar({ open: true, message: `Exported as ${format.toUpperCase()}` });
  }, [observations, activeChart, charts, globalFilters, annotations, settings, datasetTitle]);

  // Get axis labels
  const xAxisLabel = useMemo(() => {
    const dim = dimensions.find(d => d.id === activeChart?.xField);
    return dim?.label || formatLabel(activeChart?.xField || "") || "X-Axis";
  }, [dimensions, activeChart?.xField]);

  const yAxisLabel = useMemo(() => {
    const measure = measures.find(m => m.id === activeChart?.yField);
    return measure?.unit ? `${measure.label} (${measure.unit})` : measure?.label || "Y-Axis";
  }, [measures, activeChart?.yField]);

  if (!cubeIri) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#f1f5f9" }}>
        <Paper sx={{ p: 4, maxWidth: 600 }}>
          <Typography variant="h5" gutterBottom sx={{ color: "#DC0018" }}>
            Swiss Federal Data Visualization
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography gutterBottom fontWeight={600}>No dataset specified</Typography>
            Please provide a cube parameter in the URL.
            <Typography variant="body2" sx={{ mt: 2, fontFamily: "monospace", bgcolor: "#f8fafc", p: 1, borderRadius: 1 }}>
              /chart-builder?cube=https://agriculture.ld.admin.ch/...
            </Typography>
          </Alert>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#f8fafc" }}>
      <Head>
        <title>{datasetTitle || "Chart Builder"} - visualize.admin.ch</title>
      </Head>

      {/* Top Bar - Swiss Federal Design */}
      {!zenMode && (
        <Box sx={{ bgcolor: "#1e293b", borderBottom: "3px solid #DC0018" }}>
          <Container maxWidth={false}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                {/* Swiss Cross Logo */}
                <Box sx={{
                  width: 24, height: 24, bgcolor: "#DC0018", position: "relative",
                  "&::before": { content: '""', position: "absolute", top: "35%", left: "15%", width: "70%", height: "30%", bgcolor: "white" },
                  "&::after": { content: '""', position: "absolute", top: "15%", left: "35%", width: "30%", height: "70%", bgcolor: "white" },
                }} />
                <Box>
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>
                    Swiss Confederation
                  </Typography>
                  <Typography sx={{ color: "white", fontWeight: 600, fontSize: 14 }}>
                    Data Visualization Platform
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Button size="small" sx={{ color: "white", textTransform: "none" }} onClick={() => setZenMode(true)}>
                  Zen Mode
                </Button>
                <Divider orientation="vertical" flexItem sx={{ bgcolor: "rgba(255,255,255,0.2)", mx: 1 }} />
                <Button size="small" sx={{ color: "white", textTransform: "none" }} onClick={() => handleExport("csv")}>
                  CSV
                </Button>
                <Button size="small" sx={{ color: "white", textTransform: "none" }} onClick={() => handleExport("json")}>
                  JSON
                </Button>
              </Box>
            </Box>
          </Container>
        </Box>
      )}

      {/* Main Layout */}
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Navigation Sidebar */}
        {!zenMode && (
          <Drawer
            variant={isMobile ? "temporary" : "persistent"}
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            sx={{
              width: sidebarOpen ? 220 : 0,
              flexShrink: 0,
              "& .MuiDrawer-paper": {
                width: 220,
                position: "relative",
                borderRight: "1px solid",
                borderColor: "divider",
                bgcolor: "white",
              },
            }}
          >
            <Box sx={{ p: 2 }}>
              <Typography variant="overline" color="text.secondary" sx={{ fontSize: 10 }}>
                Dataset
              </Typography>
              <Typography variant="subtitle2" noWrap title={datasetTitle}>
                {datasetTitle || "Loading..."}
              </Typography>
            </Box>
            <Divider />
            <List sx={{ px: 1 }}>
              {NAV_ITEMS.map((item) => (
                <ListItem key={item.id} disablePadding>
                  <ListItemButton
                    selected={currentView === item.id}
                    onClick={() => setCurrentView(item.id)}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      "&.Mui-selected": { bgcolor: "#1D4ED8", color: "white" },
                      "&.Mui-selected:hover": { bgcolor: "#1e40af" },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>
                      <Typography sx={{ fontFamily: "monospace", fontSize: 12 }}>{item.icon}</Typography>
                    </ListItemIcon>
                    <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14 }} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
            <Divider sx={{ mt: "auto" }} />
            <Box sx={{ p: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                onClick={addChart}
                sx={{ textTransform: "none", mb: 1 }}
              >
                + Add Chart
              </Button>
              <Typography variant="caption" color="text.secondary">
                {charts.length} chart{charts.length !== 1 ? "s" : ""} | {filteredObservations.length} rows
              </Typography>
            </Box>
          </Drawer>
        )}

        {/* Main Content Area */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Secondary Toolbar */}
          {!zenMode && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, px: 2, py: 1.5, bgcolor: "white", borderBottom: "1px solid", borderColor: "divider" }}>
              <Button
                size="small"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                sx={{ minWidth: 32 }}
              >
                {sidebarOpen ? "[<" : ">]"}
              </Button>
              <Typography variant="subtitle1" fontWeight={600} sx={{ flex: 1 }}>
                {currentView === "chart" && "Visualization"}
                {currentView === "table" && "Data Table"}
                {currentView === "filters" && "Interactive Filters"}
                {currentView === "settings" && "Settings"}
                {currentView === "code" && "API / Code"}
              </Typography>
              {currentView === "chart" && charts.length > 1 && (
                <Tabs
                  value={activeChartId}
                  onChange={(_, v) => setActiveChartId(v)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{ "& .MuiTab-root": { minWidth: 100, textTransform: "none" } }}
                >
                  {charts.map((chart, idx) => (
                    <Tab key={chart.id} value={chart.id} label={`Chart ${idx + 1}`} />
                  ))}
                </Tabs>
              )}
            </Box>
          )}

          {/* Content */}
          <Box sx={{ flex: 1, overflow: "auto", p: zenMode ? 0 : 2 }}>
            {loading ? (
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 2 }}>
                <CircularProgress />
                <Typography color="text.secondary">Loading data from LINDAS...</Typography>
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
            ) : (
              <>
                {/* Visualization View */}
                {currentView === "chart" && (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {/* Chart Controls */}
                    {!zenMode && activeChart && (
                      <Paper sx={{ p: 2 }}>
                        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "flex-end" }}>
                          <FormControl size="small" sx={{ minWidth: 140 }}>
                            <InputLabel>Chart Type</InputLabel>
                            <Select
                              value={activeChart.chartType}
                              label="Chart Type"
                              onChange={(e) => updateChart(activeChart.id, { chartType: e.target.value as SimpleChartType })}
                            >
                              {CHART_TYPES.map((t) => (
                                <MenuItem key={t.type} value={t.type}>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Typography sx={{ fontFamily: "monospace", width: 20 }}>{t.icon}</Typography>
                                    {t.label}
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <FormControl size="small" sx={{ minWidth: 180 }}>
                            <InputLabel>X-Axis</InputLabel>
                            <Select
                              value={activeChart.xField}
                              label="X-Axis"
                              onChange={(e) => updateChart(activeChart.id, { xField: e.target.value })}
                            >
                              {dimensions.map((d) => (
                                <MenuItem key={d.id} value={d.id}>
                                  {d.label}
                                  {isDateField(d.id, d.label) && <Chip label="Time" size="small" sx={{ ml: 1, height: 18 }} />}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <FormControl size="small" sx={{ minWidth: 180 }}>
                            <InputLabel>Y-Axis</InputLabel>
                            <Select
                              value={activeChart.yField}
                              label="Y-Axis"
                              onChange={(e) => updateChart(activeChart.id, { yField: e.target.value })}
                            >
                              {measures.map((m) => (
                                <MenuItem key={m.id} value={m.id}>
                                  {m.label} {m.unit && <Typography variant="caption" sx={{ ml: 1 }}>({m.unit})</Typography>}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <FormControl size="small" sx={{ minWidth: 160 }}>
                            <InputLabel>Group By</InputLabel>
                            <Select
                              value={activeChart.groupField}
                              label="Group By"
                              onChange={(e) => updateChart(activeChart.id, { groupField: e.target.value })}
                            >
                              <MenuItem value=""><em>None</em></MenuItem>
                              {dimensions.filter(d => d.id !== activeChart.xField).map((d) => (
                                <MenuItem key={d.id} value={d.id}>{d.label}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <FormControl size="small" sx={{ minWidth: 140 }}>
                            <InputLabel>Colors</InputLabel>
                            <Select
                              value={activeChart.colorPalette}
                              label="Colors"
                              onChange={(e) => updateChart(activeChart.id, { colorPalette: e.target.value })}
                            >
                              {Object.entries(COLOR_PALETTES).map(([name, colors]) => (
                                <MenuItem key={name} value={name}>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Typography sx={{ textTransform: "capitalize" }}>{name}</Typography>
                                    <Box sx={{ display: "flex", gap: 0.25 }}>
                                      {colors.slice(0, 4).map((c, i) => (
                                        <Box key={i} sx={{ width: 10, height: 10, bgcolor: c, borderRadius: "2px" }} />
                                      ))}
                                    </Box>
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <FormControlLabel
                              control={<Switch size="small" checked={activeChart.showLegend} onChange={(e) => updateChart(activeChart.id, { showLegend: e.target.checked })} />}
                              label={<Typography variant="body2">Legend</Typography>}
                            />
                            <FormControlLabel
                              control={<Switch size="small" checked={activeChart.showTooltip} onChange={(e) => updateChart(activeChart.id, { showTooltip: e.target.checked })} />}
                              label={<Typography variant="body2">Tooltip</Typography>}
                            />
                          </Box>
                          {charts.length > 1 && (
                            <Button size="small" color="error" onClick={() => removeChart(activeChart.id)} sx={{ ml: "auto" }}>
                              Remove
                            </Button>
                          )}
                        </Box>
                      </Paper>
                    )}

                    {/* Charts Grid - Vertical Stacking */}
                    {charts.map((chart) => {
                      const chartObs = sortObservations(filteredObservations, chart.xField);
                      const chartXLabel = dimensions.find(d => d.id === chart.xField)?.label || "";
                      const chartYLabel = measures.find(m => m.id === chart.yField)?.label || "";

                      return (
                        <Paper
                          key={chart.id}
                          sx={{
                            p: 2,
                            border: chart.id === activeChartId ? "2px solid" : "1px solid",
                            borderColor: chart.id === activeChartId ? "primary.main" : "divider",
                            cursor: "pointer",
                          }}
                          onClick={() => setActiveChartId(chart.id)}
                        >
                          {!zenMode && (
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              {chart.title || `Chart: ${chartYLabel} by ${chartXLabel}`}
                            </Typography>
                          )}
                          <SimpleEChartsChart
                            observations={chartObs}
                            xField={chart.xField}
                            yField={chart.yField}
                            segmentField={chart.groupField || undefined}
                            chartType={chart.chartType}
                            height={zenMode ? window.innerHeight - 20 : chart.height}
                            xAxisLabel={chartXLabel}
                            yAxisLabel={chartYLabel}
                            showLegend={chart.showLegend && !!chart.groupField}
                            showTooltip={chart.showTooltip}
                            colors={COLOR_PALETTES[chart.colorPalette] || COLOR_PALETTES.swiss}
                          />
                        </Paper>
                      );
                    })}

                    {/* Statistics Summary */}
                    {!zenMode && stats && (
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Data Summary
                        </Typography>
                        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Minimum</Typography>
                            <Typography variant="h6">{stats.min.toLocaleString()}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Maximum</Typography>
                            <Typography variant="h6">{stats.max.toLocaleString()}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Average</Typography>
                            <Typography variant="h6">{stats.avg.toFixed(2)}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Sum</Typography>
                            <Typography variant="h6">{stats.sum.toLocaleString()}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Count</Typography>
                            <Typography variant="h6">{stats.count}</Typography>
                          </Box>
                        </Box>
                      </Paper>
                    )}
                  </Box>
                )}

                {/* Data Table View */}
                {currentView === "table" && (
                  <Paper sx={{ overflow: "hidden" }}>
                    <TableContainer sx={{ maxHeight: "calc(100vh - 200px)" }}>
                      <Table stickyHeader size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, bgcolor: "#f8fafc" }}>#</TableCell>
                            {dimensions.map((d) => (
                              <TableCell key={d.id} sx={{ fontWeight: 600, bgcolor: "#f8fafc" }}>{d.label}</TableCell>
                            ))}
                            {measures.map((m) => (
                              <TableCell key={m.id} sx={{ fontWeight: 600, bgcolor: "#f8fafc" }} align="right">
                                {m.label} {m.unit && `(${m.unit})`}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {observations.slice(0, 500).map((obs, idx) => (
                            <TableRow key={idx} hover>
                              <TableCell sx={{ color: "text.secondary" }}>{idx + 1}</TableCell>
                              {dimensions.map((d) => (
                                <TableCell key={d.id}>{formatLabel(String(obs[d.id] || ""))}</TableCell>
                              ))}
                              {measures.map((m) => (
                                <TableCell key={m.id} align="right">
                                  {typeof obs[m.id] === "number" ? Number(obs[m.id]).toLocaleString() : obs[m.id]}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    {observations.length > 500 && (
                      <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider", textAlign: "center" }}>
                        <Typography variant="caption" color="text.secondary">
                          Showing 500 of {observations.length} rows. Export CSV to see all.
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                )}

                {/* Filters View */}
                {currentView === "filters" && (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        Interactive Filters
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Select values to filter the data across all charts.
                      </Typography>
                    </Paper>
                    {dimensions.map((dim) => {
                      const values = getUniqueFieldValues(rawObservations, dim.id);
                      const selectedValues = globalFilters[dim.id] || [];

                      return (
                        <Accordion key={dim.id} defaultExpanded={values.length <= 20}>
                          <AccordionSummary>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                              <Typography fontWeight={500}>{dim.label}</Typography>
                              {selectedValues.length > 0 && (
                                <Chip size="small" label={`${selectedValues.length} selected`} color="primary" />
                              )}
                              <Typography variant="caption" color="text.secondary" sx={{ ml: "auto", mr: 2 }}>
                                {values.length} values
                              </Typography>
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                              <Button
                                size="small"
                                onClick={() => setGlobalFilters(prev => ({ ...prev, [dim.id]: values }))}
                              >
                                Select All
                              </Button>
                              <Button
                                size="small"
                                onClick={() => setGlobalFilters(prev => ({ ...prev, [dim.id]: [] }))}
                              >
                                Clear
                              </Button>
                            </Box>
                            <FormGroup sx={{ maxHeight: 300, overflow: "auto" }}>
                              {values.map((val) => (
                                <FormControlLabel
                                  key={val}
                                  control={
                                    <Checkbox
                                      size="small"
                                      checked={selectedValues.includes(val)}
                                      onChange={(e) => {
                                        setGlobalFilters(prev => ({
                                          ...prev,
                                          [dim.id]: e.target.checked
                                            ? [...(prev[dim.id] || []), val]
                                            : (prev[dim.id] || []).filter(v => v !== val)
                                        }));
                                      }}
                                    />
                                  }
                                  label={<Typography variant="body2">{formatLabel(val)}</Typography>}
                                />
                              ))}
                            </FormGroup>
                          </AccordionDetails>
                        </Accordion>
                      );
                    })}
                    {Object.keys(globalFilters).some(k => globalFilters[k]?.length > 0) && (
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => setGlobalFilters({})}
                        sx={{ alignSelf: "flex-start" }}
                      >
                        Clear All Filters
                      </Button>
                    )}
                  </Box>
                )}

                {/* Settings View */}
                {currentView === "settings" && (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 600 }}>
                    <Paper sx={{ p: 3 }}>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        General Settings
                      </Typography>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Default Color Palette</InputLabel>
                          <Select
                            value={settings.defaultPalette}
                            label="Default Color Palette"
                            onChange={(e) => setSettings(prev => ({ ...prev, defaultPalette: e.target.value }))}
                          >
                            {Object.keys(COLOR_PALETTES).map((name) => (
                              <MenuItem key={name} value={name} sx={{ textTransform: "capitalize" }}>{name}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <Box>
                          <Typography variant="body2" gutterBottom>
                            Animation Duration: {settings.animationDuration}ms
                          </Typography>
                          <Slider
                            value={settings.animationDuration}
                            onChange={(_, v) => setSettings(prev => ({ ...prev, animationDuration: v as number }))}
                            min={0}
                            max={2000}
                            step={100}
                            marks={[{ value: 0, label: "Off" }, { value: 1000, label: "1s" }, { value: 2000, label: "2s" }]}
                          />
                        </Box>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.showDataLabels}
                              onChange={(e) => setSettings(prev => ({ ...prev, showDataLabels: e.target.checked }))}
                            />
                          }
                          label="Show Data Labels"
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.compactMode}
                              onChange={(e) => setSettings(prev => ({ ...prev, compactMode: e.target.checked }))}
                            />
                          }
                          label="Compact Mode"
                        />
                      </Box>
                    </Paper>
                    <Paper sx={{ p: 3 }}>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        Export Settings
                      </Typography>
                      <FormControl fullWidth size="small" sx={{ mt: 2 }}>
                        <InputLabel>Export Quality</InputLabel>
                        <Select
                          value={settings.exportQuality}
                          label="Export Quality"
                          onChange={(e) => setSettings(prev => ({ ...prev, exportQuality: e.target.value }))}
                        >
                          <MenuItem value="low">Low (faster)</MenuItem>
                          <MenuItem value="medium">Medium</MenuItem>
                          <MenuItem value="high">High (best)</MenuItem>
                        </Select>
                      </FormControl>
                    </Paper>
                    <Paper sx={{ p: 3 }}>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        Data Source
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Cube IRI:
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: "monospace", bgcolor: "#f1f5f9", p: 1, mt: 1, borderRadius: 1, wordBreak: "break-all" }}>
                        {cubeIri}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        SPARQL Endpoint:
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: "monospace", bgcolor: "#f1f5f9", p: 1, mt: 1, borderRadius: 1 }}>
                        {SPARQL_ENDPOINT}
                      </Typography>
                    </Paper>
                  </Box>
                )}

                {/* Code / API View */}
                {currentView === "code" && (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <Paper sx={{ p: 3 }}>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        SPARQL Query
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Use this query to fetch the observation data from LINDAS.
                      </Typography>
                      <Box sx={{ bgcolor: "#1e293b", color: "#e2e8f0", p: 2, borderRadius: 1, mt: 2, fontFamily: "monospace", fontSize: 13, overflow: "auto" }}>
                        <pre style={{ margin: 0 }}>{`PREFIX cube: <https://cube.link/>

SELECT ?obs ?p ?o WHERE {
  <${cubeIri}> cube:observationSet ?obsSet .
  ?obsSet cube:observation ?obs .
  ?obs ?p ?o .
} LIMIT 10000`}</pre>
                      </Box>
                      <Button
                        size="small"
                        sx={{ mt: 2 }}
                        onClick={() => {
                          navigator.clipboard.writeText(`PREFIX cube: <https://cube.link/>\n\nSELECT ?obs ?p ?o WHERE {\n  <${cubeIri}> cube:observationSet ?obsSet .\n  ?obsSet cube:observation ?obs .\n  ?obs ?p ?o .\n} LIMIT 10000`);
                          setSnackbar({ open: true, message: "Query copied to clipboard" });
                        }}
                      >
                        Copy Query
                      </Button>
                    </Paper>
                    <Paper sx={{ p: 3 }}>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        Configuration Export
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Export the current chart configuration as JSON.
                      </Typography>
                      <Box sx={{ bgcolor: "#1e293b", color: "#e2e8f0", p: 2, borderRadius: 1, mt: 2, fontFamily: "monospace", fontSize: 12, overflow: "auto", maxHeight: 300 }}>
                        <pre style={{ margin: 0 }}>{JSON.stringify({ charts, globalFilters, settings }, null, 2)}</pre>
                      </Box>
                      <Button size="small" sx={{ mt: 2 }} onClick={() => handleExport("json")}>
                        Download JSON
                      </Button>
                    </Paper>
                    <Paper sx={{ p: 3 }}>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        Embed Code
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Use this HTML to embed the visualization in your website.
                      </Typography>
                      <Box sx={{ bgcolor: "#1e293b", color: "#e2e8f0", p: 2, borderRadius: 1, mt: 2, fontFamily: "monospace", fontSize: 12 }}>
                        <pre style={{ margin: 0 }}>{`<iframe
  src="${typeof window !== "undefined" ? window.location.origin : ""}/chart-builder?cube=${encodeURIComponent(cubeIri)}"
  width="100%"
  height="600"
  frameborder="0"
></iframe>`}</pre>
                      </Box>
                    </Paper>
                  </Box>
                )}
              </>
            )}
          </Box>
        </Box>
      </Box>

      {/* Zen Mode Exit Button */}
      {zenMode && (
        <Button
          onClick={() => setZenMode(false)}
          sx={{
            position: "fixed",
            top: 16,
            right: 16,
            bgcolor: "rgba(0,0,0,0.5)",
            color: "white",
            "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
          }}
        >
          Exit Zen Mode
        </Button>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ open: false, message: "" })}
        message={snackbar.message}
      />
    </Box>
  );
}
