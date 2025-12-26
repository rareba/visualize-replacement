/**
 * Chart Builder - A professional visualization tool for LINDAS datasets
 *
 * Features:
 * - Multiple chart types with live preview
 * - Data table view
 * - Export to PNG/CSV
 * - Filtering and grouping
 * - Custom colors and themes
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
  ToggleButton,
  ToggleButtonGroup,
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
  ListItemIcon,
  ListItemText,
  Collapse,
  Card,
  CardContent,
  Skeleton,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import dynamic from "next/dynamic";

// Icons (using text representations for simplicity)
const DownloadIcon = () => <span style={{ fontSize: 18 }}>{"[Download]"}</span>;
const TableIcon = () => <span style={{ fontSize: 18 }}>{"[Table]"}</span>;
const ChartIcon = () => <span style={{ fontSize: 18 }}>{"[Chart]"}</span>;
const FullscreenIcon = () => <span style={{ fontSize: 18 }}>{"[Full]"}</span>;
const FilterIcon = () => <span style={{ fontSize: 18 }}>{"[Filter]"}</span>;
const SettingsIcon = () => <span style={{ fontSize: 18 }}>{"[Gear]"}</span>;

// Dynamically import ECharts to avoid SSR issues
const SimpleEChartsChart = dynamic(
  () => import("@/charts/simple-echarts").then((mod) => mod.SimpleEChartsChart),
  { ssr: false, loading: () => <Skeleton variant="rectangular" height={400} /> }
);

type SimpleChartType = "column" | "bar" | "line" | "area" | "pie" | "scatter";

// Chart type configuration with better descriptions
const CHART_TYPES: Array<{
  type: SimpleChartType;
  label: string;
  icon: string;
  description: string;
}> = [
  { type: "column", label: "Column", icon: "|||", description: "Vertical bars for comparing categories" },
  { type: "bar", label: "Bar", icon: "===", description: "Horizontal bars for ranking data" },
  { type: "line", label: "Line", icon: "/\\", description: "Trends over time" },
  { type: "area", label: "Area", icon: "/_\\", description: "Cumulative values over time" },
  { type: "pie", label: "Pie", icon: "(o)", description: "Parts of a whole" },
  { type: "scatter", label: "Scatter", icon: "...", description: "Correlation between variables" },
];

// Color palettes
const COLOR_PALETTES = {
  swiss: ["#DC0018", "#2D6B9F", "#66B573", "#F9B21A", "#8E6A9E", "#00A5AC", "#E06336"],
  blue: ["#1565C0", "#1976D2", "#1E88E5", "#2196F3", "#42A5F5", "#64B5F6", "#90CAF9"],
  earth: ["#5D4037", "#6D4C41", "#8D6E63", "#A1887F", "#D7CCC8", "#8BC34A", "#689F38"],
  rainbow: ["#E53935", "#FB8C00", "#FDD835", "#43A047", "#1E88E5", "#8E24AA", "#F06292"],
};

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

// Helper to detect date fields
function isDateField(id: string, label: string): boolean {
  const lower = (id + label).toLowerCase();
  return lower.includes("date") || lower.includes("year") || lower.includes("time") || lower.includes("period");
}

// Format label for display (extract readable part from URIs)
function formatLabel(value: string): string {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) {
    const parts = value.split("/");
    return decodeURIComponent(parts[parts.length - 1]);
  }
  return value;
}

// Sort observations by field (handles dates)
function sortObservations(observations: Observation[], field: string): Observation[] {
  return [...observations].sort((a, b) => {
    const valA = a[field];
    const valB = b[field];
    if (valA == null && valB == null) return 0;
    if (valA == null) return 1;
    if (valB == null) return -1;

    const strA = String(valA);
    const strB = String(valB);

    // Extract years
    const yearA = strA.match(/(\d{4})/);
    const yearB = strB.match(/(\d{4})/);
    if (yearA && yearB) {
      return parseInt(yearA[1]) - parseInt(yearB[1]);
    }

    // Numeric comparison
    const numA = parseFloat(strA);
    const numB = parseFloat(strB);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }

    return strA.localeCompare(strB);
  });
}

// Calculate statistics
function calculateStats(observations: Observation[], field: string): {
  min: number;
  max: number;
  avg: number;
  sum: number;
  count: number;
} {
  const values = observations
    .map(o => Number(o[field]))
    .filter(v => !isNaN(v));

  if (values.length === 0) {
    return { min: 0, max: 0, avg: 0, sum: 0, count: 0 };
  }

  const sum = values.reduce((a, b) => a + b, 0);
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    avg: sum / values.length,
    sum,
    count: values.length,
  };
}

// SPARQL endpoint
const SPARQL_ENDPOINT = "https://lindas.admin.ch/query";

// Fetch cube metadata and observations
async function fetchCubeData(cubeIri: string): Promise<{
  title: string;
  dimensions: Dimension[];
  measures: Measure[];
  observations: Observation[];
}> {
  // Query for cube metadata
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

  // Query for observations
  const observationsQuery = `
    PREFIX cube: <https://cube.link/>

    SELECT ?obs ?p ?o WHERE {
      <${cubeIri}> cube:observationSet ?obsSet .
      ?obsSet cube:observation ?obs .
      ?obs ?p ?o .
    } LIMIT 10000
  `;

  try {
    // Fetch metadata
    const metadataResponse = await fetch(SPARQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/sparql-results+json",
      },
      body: `query=${encodeURIComponent(metadataQuery)}`,
    });

    const metadataJson = await metadataResponse.json();

    // Parse dimensions and measures
    const dimensionsMap = new Map<string, Dimension>();
    const measuresMap = new Map<string, Measure>();
    let title = "";

    for (const binding of metadataJson.results.bindings) {
      if (binding.title?.value && !title) {
        title = binding.title.value;
      }
      if (binding.dimension?.value && binding.dimensionLabel?.value) {
        dimensionsMap.set(binding.dimension.value, {
          id: binding.dimension.value,
          label: binding.dimensionLabel.value,
        });
      }
      if (binding.measure?.value && binding.measureLabel?.value) {
        measuresMap.set(binding.measure.value, {
          id: binding.measure.value,
          label: binding.measureLabel.value,
          unit: binding.unit?.value,
        });
      }
    }

    // Fetch observations
    const obsResponse = await fetch(SPARQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/sparql-results+json",
      },
      body: `query=${encodeURIComponent(observationsQuery)}`,
    });

    const obsJson = await obsResponse.json();

    // Group observations by subject
    const obsMap = new Map<string, Observation>();
    for (const binding of obsJson.results.bindings) {
      const obsId = binding.obs.value;
      if (!obsMap.has(obsId)) {
        obsMap.set(obsId, {});
      }
      const obs = obsMap.get(obsId)!;
      const predicate = binding.p.value;
      const value = binding.o.value;
      obs[predicate] = value;
    }

    return {
      title,
      dimensions: Array.from(dimensionsMap.values()),
      measures: Array.from(measuresMap.values()),
      observations: Array.from(obsMap.values()),
    };
  } catch (error) {
    console.error("Error fetching cube data:", error);
    throw error;
  }
}

// Tab panel component
function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return (
    <div hidden={value !== index} style={{ height: "100%" }}>
      {value === index && children}
    </div>
  );
}

export default function ChartBuilderPage() {
  const router = useRouter();
  const { cube } = router.query;
  const cubeIri = typeof cube === "string" ? cube : "";
  const chartRef = useRef<HTMLDivElement>(null);

  // Data state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [editableTitle, setEditableTitle] = useState("");
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [measures, setMeasures] = useState<Measure[]>([]);
  const [rawObservations, setRawObservations] = useState<Observation[]>([]);

  // UI state
  const [viewTab, setViewTab] = useState(0); // 0: chart, 1: table
  const [showSettings, setShowSettings] = useState(true);
  const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);

  // Chart configuration
  const [chartType, setChartType] = useState<SimpleChartType>("column");
  const [xField, setXField] = useState("");
  const [yField, setYField] = useState("");
  const [groupField, setGroupField] = useState("");
  const [colorPalette, setColorPalette] = useState<keyof typeof COLOR_PALETTES>("swiss");
  const [showLegend, setShowLegend] = useState(true);
  const [showTooltip, setShowTooltip] = useState(true);
  const [chartHeight, setChartHeight] = useState(450);

  // Fetch data when cube changes
  useEffect(() => {
    if (!cubeIri) return;

    setLoading(true);
    setError(null);

    fetchCubeData(cubeIri)
      .then((data) => {
        setTitle(data.title);
        setEditableTitle(data.title);
        setDimensions(data.dimensions);
        setMeasures(data.measures);
        setRawObservations(data.observations);

        // Auto-select fields
        if (data.dimensions.length > 0) {
          const dateField = data.dimensions.find(d => isDateField(d.id, d.label));
          setXField(dateField?.id || data.dimensions[0].id);
        }
        if (data.measures.length > 0) {
          setYField(data.measures[0].id);
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to load data");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [cubeIri]);

  // Sort observations
  const observations = useMemo(() => {
    if (!xField || rawObservations.length === 0) return rawObservations;
    return sortObservations(rawObservations, xField);
  }, [rawObservations, xField]);

  // Get labels
  const xAxisLabel = useMemo(() => {
    const dim = dimensions.find(d => d.id === xField);
    return dim?.label || formatLabel(xField) || "X-Axis";
  }, [dimensions, xField]);

  const yAxisLabel = useMemo(() => {
    const measure = measures.find(m => m.id === yField);
    if (measure) {
      return measure.unit ? `${measure.label} (${measure.unit})` : measure.label;
    }
    return formatLabel(yField) || "Y-Axis";
  }, [measures, yField]);

  // Statistics
  const stats = useMemo(() => {
    if (!yField || observations.length === 0) return null;
    return calculateStats(observations, yField);
  }, [observations, yField]);

  // Export functions
  const handleExportPNG = useCallback(() => {
    if (chartRef.current) {
      const canvas = chartRef.current.querySelector("canvas");
      if (canvas) {
        const link = document.createElement("a");
        link.download = `${editableTitle || "chart"}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      }
    }
    setExportAnchor(null);
  }, [editableTitle]);

  const handleExportCSV = useCallback(() => {
    if (observations.length === 0) return;

    const headers = [xAxisLabel, yAxisLabel, ...(groupField ? [formatLabel(groupField)] : [])];
    const rows = observations.map(obs => [
      formatLabel(String(obs[xField] || "")),
      obs[yField],
      ...(groupField ? [formatLabel(String(obs[groupField] || ""))] : [])
    ]);

    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.download = `${editableTitle || "data"}.csv`;
    link.href = URL.createObjectURL(blob);
    link.click();
    setExportAnchor(null);
  }, [observations, xField, yField, groupField, xAxisLabel, yAxisLabel, editableTitle]);

  const hasData = observations.length > 0 && xField && yField;

  if (!cubeIri) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="warning">
          No dataset specified. Please provide a cube parameter.
          <br /><br />
          Example: /chart-builder?cube=https://agriculture.ld.admin.ch/foag/cube/MilkDairyProducts/Production_Index_Year
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc", display: "flex", flexDirection: "column" }}>
      <Head>
        <title>{editableTitle || "Chart Builder"} - visualize.admin.ch</title>
      </Head>

      {/* Header */}
      <Box sx={{ bgcolor: "#1e293b", color: "white", py: 1.5, px: 2, borderBottom: "3px solid #dc0018" }}>
        <Container maxWidth="xl">
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box>
              <Typography variant="subtitle2" sx={{ opacity: 0.7, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>
                visualize.admin.ch
              </Typography>
              <TextField
                value={editableTitle}
                onChange={(e) => setEditableTitle(e.target.value)}
                variant="standard"
                placeholder="Chart Title"
                InputProps={{
                  disableUnderline: true,
                  sx: { color: "white", fontSize: 20, fontWeight: 600 },
                }}
                sx={{ minWidth: 400 }}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={(e) => setExportAnchor(e.currentTarget)}
                sx={{ color: "white", borderColor: "rgba(255,255,255,0.3)" }}
              >
                Export
              </Button>
              <Menu
                anchorEl={exportAnchor}
                open={Boolean(exportAnchor)}
                onClose={() => setExportAnchor(null)}
              >
                <MenuItem onClick={handleExportPNG}>
                  <ListItemText primary="Download as PNG" secondary="High-quality image" />
                </MenuItem>
                <MenuItem onClick={handleExportCSV}>
                  <ListItemText primary="Download as CSV" secondary="Data spreadsheet" />
                </MenuItem>
              </Menu>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {error ? (
          <Container maxWidth="md" sx={{ py: 4 }}>
            <Alert severity="error">{error}</Alert>
          </Container>
        ) : (
          <>
            {/* Settings Panel */}
            <Collapse in={showSettings} orientation="horizontal">
              <Paper
                sx={{
                  width: 320,
                  height: "100%",
                  borderRadius: 0,
                  borderRight: "1px solid",
                  borderColor: "divider",
                  overflow: "auto",
                }}
                elevation={0}
              >
                <Box sx={{ p: 2.5 }}>
                  {/* Chart Type */}
                  <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: "#334155" }}>
                    Chart Type
                  </Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: 1,
                      mb: 3,
                    }}
                  >
                    {CHART_TYPES.map(({ type, label, icon, description }) => (
                      <Tooltip key={type} title={description} arrow placement="top">
                        <Paper
                          onClick={() => setChartType(type)}
                          sx={{
                            p: 1.5,
                            cursor: "pointer",
                            textAlign: "center",
                            border: "2px solid",
                            borderColor: chartType === type ? "primary.main" : "transparent",
                            bgcolor: chartType === type ? "primary.50" : "grey.50",
                            transition: "all 0.2s",
                            "&:hover": {
                              bgcolor: chartType === type ? "primary.50" : "grey.100",
                              transform: "translateY(-2px)",
                            },
                          }}
                          elevation={chartType === type ? 2 : 0}
                        >
                          <Typography sx={{ fontFamily: "monospace", fontSize: 16, mb: 0.5 }}>
                            {icon}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: chartType === type ? 600 : 400 }}>
                            {label}
                          </Typography>
                        </Paper>
                      </Tooltip>
                    ))}
                  </Box>

                  <Divider sx={{ my: 2.5 }} />

                  {/* Data Configuration */}
                  <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: "#334155" }}>
                    Data Configuration
                  </Typography>

                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel>X-Axis (Category)</InputLabel>
                    <Select
                      value={xField}
                      onChange={(e) => setXField(e.target.value)}
                      label="X-Axis (Category)"
                      disabled={loading}
                    >
                      {dimensions.map((dim) => (
                        <MenuItem key={dim.id} value={dim.id}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            {dim.label}
                            {isDateField(dim.id, dim.label) && (
                              <Chip label="Time" size="small" color="info" sx={{ height: 18, fontSize: 10 }} />
                            )}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel>Y-Axis (Value)</InputLabel>
                    <Select
                      value={yField}
                      onChange={(e) => setYField(e.target.value)}
                      label="Y-Axis (Value)"
                      disabled={loading}
                    >
                      {measures.map((m) => (
                        <MenuItem key={m.id} value={m.id}>
                          {m.label}
                          {m.unit && (
                            <Typography variant="caption" sx={{ ml: 1, color: "text.secondary" }}>
                              ({m.unit})
                            </Typography>
                          )}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel>Group By (Optional)</InputLabel>
                    <Select
                      value={groupField}
                      onChange={(e) => setGroupField(e.target.value)}
                      label="Group By (Optional)"
                      disabled={loading}
                    >
                      <MenuItem value=""><em>None</em></MenuItem>
                      {dimensions.filter(d => d.id !== xField).map((dim) => (
                        <MenuItem key={dim.id} value={dim.id}>{dim.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Divider sx={{ my: 2.5 }} />

                  {/* Appearance */}
                  <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: "#334155" }}>
                    Appearance
                  </Typography>

                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel>Color Palette</InputLabel>
                    <Select
                      value={colorPalette}
                      onChange={(e) => setColorPalette(e.target.value as keyof typeof COLOR_PALETTES)}
                      label="Color Palette"
                    >
                      {Object.entries(COLOR_PALETTES).map(([name, colors]) => (
                        <MenuItem key={name} value={name}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography sx={{ textTransform: "capitalize" }}>{name}</Typography>
                            <Box sx={{ display: "flex", gap: 0.25 }}>
                              {colors.slice(0, 5).map((c, i) => (
                                <Box key={i} sx={{ width: 12, height: 12, bgcolor: c, borderRadius: 0.5 }} />
                              ))}
                            </Box>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Box sx={{ mb: 2 }}>
                    <FormControlLabel
                      control={<Switch checked={showLegend} onChange={(e) => setShowLegend(e.target.checked)} size="small" />}
                      label={<Typography variant="body2">Show Legend</Typography>}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <FormControlLabel
                      control={<Switch checked={showTooltip} onChange={(e) => setShowTooltip(e.target.checked)} size="small" />}
                      label={<Typography variant="body2">Show Tooltip</Typography>}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      Chart Height: {chartHeight}px
                    </Typography>
                    <Slider
                      value={chartHeight}
                      onChange={(_, v) => setChartHeight(v as number)}
                      min={300}
                      max={800}
                      step={50}
                      size="small"
                    />
                  </Box>

                  {/* Statistics */}
                  {stats && (
                    <>
                      <Divider sx={{ my: 2.5 }} />
                      <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: "#334155" }}>
                        Data Summary
                      </Typography>
                      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                        <Paper variant="outlined" sx={{ p: 1, textAlign: "center" }}>
                          <Typography variant="caption" color="text.secondary">Min</Typography>
                          <Typography variant="body2" fontWeight={600}>{stats.min.toLocaleString()}</Typography>
                        </Paper>
                        <Paper variant="outlined" sx={{ p: 1, textAlign: "center" }}>
                          <Typography variant="caption" color="text.secondary">Max</Typography>
                          <Typography variant="body2" fontWeight={600}>{stats.max.toLocaleString()}</Typography>
                        </Paper>
                        <Paper variant="outlined" sx={{ p: 1, textAlign: "center" }}>
                          <Typography variant="caption" color="text.secondary">Average</Typography>
                          <Typography variant="body2" fontWeight={600}>{stats.avg.toFixed(1)}</Typography>
                        </Paper>
                        <Paper variant="outlined" sx={{ p: 1, textAlign: "center" }}>
                          <Typography variant="caption" color="text.secondary">Count</Typography>
                          <Typography variant="body2" fontWeight={600}>{stats.count}</Typography>
                        </Paper>
                      </Box>
                    </>
                  )}
                </Box>
              </Paper>
            </Collapse>

            {/* Main Preview Area */}
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {/* Toolbar */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 2,
                  py: 1,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  bgcolor: "white",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Button
                    size="small"
                    onClick={() => setShowSettings(!showSettings)}
                    startIcon={<SettingsIcon />}
                    sx={{ textTransform: "none" }}
                  >
                    {showSettings ? "Hide Settings" : "Show Settings"}
                  </Button>
                </Box>
                <Tabs value={viewTab} onChange={(_, v) => setViewTab(v)} sx={{ minHeight: 36 }}>
                  <Tab
                    label="Chart"
                    icon={<ChartIcon />}
                    iconPosition="start"
                    sx={{ minHeight: 36, textTransform: "none", fontSize: 13 }}
                  />
                  <Tab
                    label="Data Table"
                    icon={<TableIcon />}
                    iconPosition="start"
                    sx={{ minHeight: 36, textTransform: "none", fontSize: 13 }}
                  />
                </Tabs>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {hasData && (
                    <Chip
                      label={`${observations.length} data points`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>

              {/* Content */}
              <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
                <TabPanel value={viewTab} index={0}>
                  <Paper sx={{ p: 3, height: "100%" }} elevation={1}>
                    {loading ? (
                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: chartHeight, gap: 2 }}>
                        <CircularProgress />
                        <Typography color="text.secondary">Loading data from LINDAS...</Typography>
                      </Box>
                    ) : !hasData ? (
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: chartHeight }}>
                        <Alert severity="info" sx={{ maxWidth: 400 }}>
                          <Typography variant="subtitle2" gutterBottom>Select Data Fields</Typography>
                          Configure the X-Axis and Y-Axis fields in the settings panel to visualize your data.
                        </Alert>
                      </Box>
                    ) : (
                      <Box ref={chartRef}>
                        <SimpleEChartsChart
                          observations={observations}
                          xField={xField}
                          yField={yField}
                          segmentField={groupField || undefined}
                          chartType={chartType}
                          height={chartHeight}
                          xAxisLabel={xAxisLabel}
                          yAxisLabel={yAxisLabel}
                          showLegend={showLegend && !!groupField}
                          showTooltip={showTooltip}
                          colors={COLOR_PALETTES[colorPalette]}
                        />
                      </Box>
                    )}
                  </Paper>
                </TabPanel>

                <TabPanel value={viewTab} index={1}>
                  <Paper sx={{ height: "100%" }} elevation={1}>
                    <TableContainer sx={{ maxHeight: chartHeight + 100 }}>
                      <Table stickyHeader size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, bgcolor: "#f8fafc" }}>{xAxisLabel}</TableCell>
                            <TableCell sx={{ fontWeight: 600, bgcolor: "#f8fafc" }} align="right">{yAxisLabel}</TableCell>
                            {groupField && (
                              <TableCell sx={{ fontWeight: 600, bgcolor: "#f8fafc" }}>
                                {dimensions.find(d => d.id === groupField)?.label || "Group"}
                              </TableCell>
                            )}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {observations.slice(0, 100).map((obs, idx) => (
                            <TableRow key={idx} hover>
                              <TableCell>{formatLabel(String(obs[xField] || ""))}</TableCell>
                              <TableCell align="right">
                                {typeof obs[yField] === "number"
                                  ? obs[yField].toLocaleString()
                                  : obs[yField]}
                              </TableCell>
                              {groupField && (
                                <TableCell>{formatLabel(String(obs[groupField] || ""))}</TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    {observations.length > 100 && (
                      <Box sx={{ p: 2, textAlign: "center", borderTop: "1px solid", borderColor: "divider" }}>
                        <Typography variant="caption" color="text.secondary">
                          Showing first 100 of {observations.length} rows. Export CSV to see all data.
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </TabPanel>
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
