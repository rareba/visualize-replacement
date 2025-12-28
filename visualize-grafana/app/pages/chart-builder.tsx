/**
 * Chart Builder - A professional Swiss Federal data visualization platform
 *
 * Features:
 * - Swiss Federal CI design system
 * - Multiple datasets support with dataset browser
 * - Multiple chart dashboard with vertical stacking
 * - Multiple views: Datasets, Chart, Table, Filters, Settings, Code
 * - Full-screen and zen modes
 * - Interactive filters
 * - Export to PNG/CSV/SVG/JSON
 * - Responsive design
 */

import { useState, useMemo, useEffect, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
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
  Button,
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
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  CardActions,
  Grid,
  Alert as MuiAlert,
} from "@mui/material";

// Lightweight UI components (Swiss Federal CI)
import { Alert, Chip, Divider, Spinner, LinearProgress } from "@/components/ui";
import dynamic from "next/dynamic";
import {
  encodeChartConfig,
  generateEmbedCode,
  isConfigTooLarge,
  sampleDatasetForEmbed,
  preparePayloadForEmbed,
  type EmbedPayload,
  type EmbedOptions,
} from "@/utils/chart-config-encoder";

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
}

interface Measure {
  id: string;
  label: string;
  unit?: string;
}

interface Observation {
  [key: string]: string | number | null;
}

interface Dataset {
  id: string;
  iri: string;
  title: string;
  description?: string;
  creator?: string;
  datePublished?: string;
  dimensions: Dimension[];
  measures: Measure[];
  observations: Observation[];
  loaded: boolean;
  loading: boolean;
  error?: string;
}

interface ChartConfig {
  id: string;
  datasetId: string;
  chartType: SimpleChartType;
  xField: string;
  yField: string;
  groupField: string;
  title: string;
  colorPalette: string;
  showLegend: boolean;
  showTooltip: boolean;
  height: number;
}

interface SearchResult {
  iri: string;
  title: string;
  description?: string;
  creator?: string;
  datePublished?: string;
  themes?: string[];
}

// DatasetJoin and JoinedDataset types reserved for future persistence

// Constants
const CHART_TYPES: Array<{ type: SimpleChartType; label: string; icon: string }> = [
  { type: "column", label: "Column", icon: "||" },
  { type: "bar", label: "Bar", icon: "=" },
  { type: "line", label: "Line", icon: "^" },
  { type: "area", label: "Area", icon: "/" },
  { type: "pie", label: "Pie", icon: "O" },
  { type: "scatter", label: "Scatter", icon: "." },
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

// Navigation items (Filters moved to Visualization tab)
const NAV_ITEMS = [
  { id: "datasets", label: "Datasets", icon: "[+]" },
  { id: "chart", label: "Visualization", icon: "[=]" },
  { id: "table", label: "Data Table", icon: "[#]" },
  { id: "settings", label: "Settings", icon: "[*]" },
  { id: "code", label: "API / Code", icon: "[<>]" },
];

// Helpers
function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

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
    if (yearA && yearB) return parseInt(yearA[1]) - parseInt(yearB[1]);
    const numA = parseFloat(strA);
    const numB = parseFloat(strB);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return strA.localeCompare(strB);
  });
}

function getUniqueFieldValues(observations: Observation[], field: string): string[] {
  const unique = new Set<string>();
  observations.forEach(obs => {
    const val = obs[field];
    if (val != null) unique.add(String(val));
  });
  return Array.from(unique).sort();
}

// Find common fields between two datasets (potential join keys)
function findCommonFields(dataset1: Dataset, dataset2: Dataset): Array<{
  field1: Dimension;
  field2: Dimension;
  commonValues: number;
  totalValues1: number;
  totalValues2: number;
  matchScore: number;
}> {
  const results: Array<{
    field1: Dimension;
    field2: Dimension;
    commonValues: number;
    totalValues1: number;
    totalValues2: number;
    matchScore: number;
  }> = [];

  for (const dim1 of dataset1.dimensions) {
    const values1 = new Set(getUniqueFieldValues(dataset1.observations, dim1.id));

    for (const dim2 of dataset2.dimensions) {
      const values2 = new Set(getUniqueFieldValues(dataset2.observations, dim2.id));

      // Count common values
      let commonCount = 0;
      values1.forEach(v => {
        if (values2.has(v)) commonCount++;
      });

      if (commonCount > 0) {
        // Calculate match score: higher is better
        const matchScore = (commonCount / Math.min(values1.size, values2.size)) * 100;
        results.push({
          field1: dim1,
          field2: dim2,
          commonValues: commonCount,
          totalValues1: values1.size,
          totalValues2: values2.size,
          matchScore,
        });
      }
    }
  }

  // Sort by match score descending
  return results.sort((a, b) => b.matchScore - a.matchScore);
}

// Join two datasets on specified fields
function joinDatasets(
  left: Dataset,
  right: Dataset,
  leftField: string,
  rightField: string,
  joinType: "inner" | "left" | "full" = "inner"
): { observations: Observation[]; dimensions: Dimension[]; measures: Measure[] } {
  // Build index of right dataset by join field
  const rightIndex = new Map<string, Observation[]>();
  right.observations.forEach(obs => {
    const key = String(obs[rightField] || "");
    if (!rightIndex.has(key)) rightIndex.set(key, []);
    rightIndex.get(key)!.push(obs);
  });

  const joinedObs: Observation[] = [];
  const usedRightKeys = new Set<string>();

  // Process left dataset
  for (const leftObs of left.observations) {
    const key = String(leftObs[leftField] || "");
    const rightMatches = rightIndex.get(key);

    if (rightMatches && rightMatches.length > 0) {
      // Join with each matching right observation
      for (const rightObs of rightMatches) {
        const joined: Observation = { ...leftObs };
        // Add right dataset fields with prefix to avoid conflicts
        for (const [k, v] of Object.entries(rightObs)) {
          if (k !== rightField) {
            joined[`right_${k}`] = v;
          }
        }
        joinedObs.push(joined);
      }
      usedRightKeys.add(key);
    } else if (joinType === "left" || joinType === "full") {
      // Include left row with null right values
      joinedObs.push({ ...leftObs });
    }
  }

  // For full join, include unmatched right rows
  if (joinType === "full") {
    for (const rightObs of right.observations) {
      const key = String(rightObs[rightField] || "");
      if (!usedRightKeys.has(key)) {
        const joined: Observation = {};
        for (const [k, v] of Object.entries(rightObs)) {
          joined[`right_${k}`] = v;
        }
        joinedObs.push(joined);
      }
    }
  }

  // Combine dimensions and measures
  const dimensions = [
    ...left.dimensions,
    ...right.dimensions.filter(d => d.id !== rightField).map(d => ({
      ...d,
      id: `right_${d.id}`,
      label: `${d.label} (${right.title.substring(0, 20)}...)`,
    })),
  ];

  const measures = [
    ...left.measures,
    ...right.measures.map(m => ({
      ...m,
      id: `right_${m.id}`,
      label: `${m.label} (${right.title.substring(0, 20)}...)`,
    })),
  ];

  return { observations: joinedObs, dimensions, measures };
}

// Search for cubes in LINDAS
async function searchCubes(query: string): Promise<SearchResult[]> {
  const searchQuery = `
    PREFIX cube: <https://cube.link/>
    PREFIX schema: <http://schema.org/>
    PREFIX dcat: <http://www.w3.org/ns/dcat#>
    PREFIX dcterms: <http://purl.org/dc/terms/>

    SELECT DISTINCT ?cube ?title ?description ?creator ?datePublished ?theme WHERE {
      ?cube a cube:Cube .
      ?cube schema:name ?title .
      FILTER(LANG(?title) = "en" || LANG(?title) = "")
      ${query ? `FILTER(CONTAINS(LCASE(STR(?title)), LCASE("${query}")))` : ""}
      OPTIONAL { ?cube schema:description ?description . FILTER(LANG(?description) = "en" || LANG(?description) = "") }
      OPTIONAL { ?cube dcterms:creator/schema:name ?creator }
      OPTIONAL { ?cube schema:datePublished ?datePublished }
      OPTIONAL { ?cube dcat:theme/schema:name ?theme }
    }
    ORDER BY DESC(?datePublished)
    LIMIT 50
  `;

  try {
    const response = await fetch(SPARQL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/sparql-results+json" },
      body: `query=${encodeURIComponent(searchQuery)}`,
    });
    const json = await response.json();
    const resultsMap = new Map<string, SearchResult>();

    for (const binding of json.results.bindings) {
      const iri = binding.cube.value;
      if (!resultsMap.has(iri)) {
        resultsMap.set(iri, {
          iri,
          title: binding.title?.value || iri,
          description: binding.description?.value,
          creator: binding.creator?.value,
          datePublished: binding.datePublished?.value,
          themes: binding.theme?.value ? [binding.theme.value] : [],
        });
      } else if (binding.theme?.value) {
        const existing = resultsMap.get(iri)!;
        if (!existing.themes?.includes(binding.theme.value)) {
          existing.themes = [...(existing.themes || []), binding.theme.value];
        }
      }
    }
    return Array.from(resultsMap.values());
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}

// Fetch cube data
async function fetchCubeData(cubeIri: string): Promise<{
  title: string;
  description?: string;
  dimensions: Dimension[];
  measures: Measure[];
  observations: Observation[];
}> {
  // Query for dimensions (not MeasureDimension type)
  const dimensionsQuery = `
    PREFIX cube: <https://cube.link/>
    PREFIX schema: <http://schema.org/>
    PREFIX sh: <http://www.w3.org/ns/shacl#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

    SELECT DISTINCT ?title ?description ?dimension ?dimensionLabel WHERE {
      <${cubeIri}> schema:name ?title .
      FILTER(LANG(?title) = "en" || LANG(?title) = "")
      OPTIONAL { <${cubeIri}> schema:description ?description . FILTER(LANG(?description) = "en" || LANG(?description) = "") }
      <${cubeIri}> cube:observationConstraint ?shape .
      ?shape sh:property ?prop .
      ?prop sh:path ?dimension .
      ?prop schema:name ?dimensionLabel .
      FILTER(LANG(?dimensionLabel) = "en" || LANG(?dimensionLabel) = "")
      FILTER NOT EXISTS { ?prop rdf:type cube:MeasureDimension }
    }
  `;

  // Query for measures (MeasureDimension type)
  const measuresQuery = `
    PREFIX cube: <https://cube.link/>
    PREFIX schema: <http://schema.org/>
    PREFIX sh: <http://www.w3.org/ns/shacl#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX qudt: <http://qudt.org/schema/qudt/>

    SELECT DISTINCT ?measure ?measureLabel ?unit WHERE {
      <${cubeIri}> cube:observationConstraint ?shape .
      ?shape sh:property ?prop .
      ?prop rdf:type cube:MeasureDimension .
      ?prop sh:path ?measure .
      ?prop schema:name ?measureLabel .
      FILTER(LANG(?measureLabel) = "en" || LANG(?measureLabel) = "")
      OPTIONAL {
        ?prop qudt:hasUnit ?unitUri .
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

  // Fetch dimensions
  const dimensionsResponse = await fetch(SPARQL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/sparql-results+json" },
    body: `query=${encodeURIComponent(dimensionsQuery)}`,
  });
  const dimensionsJson = await dimensionsResponse.json();

  // Fetch measures
  const measuresResponse = await fetch(SPARQL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/sparql-results+json" },
    body: `query=${encodeURIComponent(measuresQuery)}`,
  });
  const measuresJson = await measuresResponse.json();

  const dimensionsMap = new Map<string, Dimension>();
  const measuresMap = new Map<string, Measure>();
  let title = "";
  let description = "";

  // Process dimensions
  for (const binding of dimensionsJson.results.bindings) {
    if (binding.title?.value && !title) title = binding.title.value;
    if (binding.description?.value && !description) description = binding.description.value;
    if (binding.dimension?.value && binding.dimensionLabel?.value) {
      dimensionsMap.set(binding.dimension.value, { id: binding.dimension.value, label: binding.dimensionLabel.value });
    }
  }

  // Process measures
  for (const binding of measuresJson.results.bindings) {
    if (binding.measure?.value && binding.measureLabel?.value) {
      measuresMap.set(binding.measure.value, { id: binding.measure.value, label: binding.measureLabel.value, unit: binding.unit?.value });
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
    description,
    dimensions: Array.from(dimensionsMap.values()),
    measures: Array.from(measuresMap.values()),
    observations: Array.from(obsMap.values()),
  };
}

// Main component
export default function ChartBuilderPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { cube } = router.query;
  const initialCubeIri = typeof cube === "string" ? cube : "";

  // Datasets state
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // UI state
  const [currentView, setCurrentView] = useState("datasets");
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [zenMode, setZenMode] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: "" });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [addDatasetDialogOpen, setAddDatasetDialogOpen] = useState(false);
  const [customCubeIri, setCustomCubeIri] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  // Join datasets state
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [selectedJoinDatasets, setSelectedJoinDatasets] = useState<{ left: string; right: string }>({ left: "", right: "" });
  const [selectedJoinFields, setSelectedJoinFields] = useState<{ leftField: string; rightField: string }>({ leftField: "", rightField: "" });
  const [joinType, setJoinType] = useState<"inner" | "left" | "full">("inner");

  // Embed state
  const [embedDialogOpen, setEmbedDialogOpen] = useState(false);
  const [embedChartId, setEmbedChartId] = useState<string | null>(null);
  const [embedOptions, setEmbedOptions] = useState<EmbedOptions>({
    removeBorder: false,
    optimizeSpace: false,
    hideTitle: false,
    hideLegend: false,
    height: 400,
    responsive: true,
  });
  const [embedCode, setEmbedCode] = useState<{ url: string; iframe: string; iframeResponsive: string } | null>(null);
  const [embedCopied, setEmbedCopied] = useState(false);

  // Ensure client-side only rendering for ECharts
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Charts state
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [activeChartId, setActiveChartId] = useState<string | null>(null);

  // Global filters
  const [globalFilters, setGlobalFilters] = useState<Record<string, string[]>>({});

  // Settings
  const [settings, setSettings] = useState({
    defaultPalette: "swiss",
    animationDuration: 500,
    showDataLabels: false,
    compactMode: false,
    exportQuality: "high",
  });

  // Custom color palettes
  const [customPalettes, setCustomPalettes] = useState<Record<string, string[]>>({});
  const [newPaletteName, setNewPaletteName] = useState("");
  const [newPaletteColors, setNewPaletteColors] = useState<string[]>(["#DC0018", "#2D6B9F", "#66B573", "#F9B21A"]);
  const [editingColorIndex, setEditingColorIndex] = useState<number | null>(null);

  // Combined palettes (built-in + custom)
  const allPalettes = useMemo(() => ({ ...COLOR_PALETTES, ...customPalettes }), [customPalettes]);

  // Filters UI state
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Load initial cube from URL
  useEffect(() => {
    if (initialCubeIri && datasets.length === 0) {
      addDataset(initialCubeIri);
      setCurrentView("chart");
    }
  }, [initialCubeIri]);

  // Search cubes
  const handleSearch = useCallback(async () => {
    setSearching(true);
    setSearchError(null);
    try {
      const results = await searchCubes(searchQuery);
      setSearchResults(results);
    } catch (err) {
      setSearchError("Failed to search datasets");
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  // Initial search on mount
  useEffect(() => {
    handleSearch();
  }, []);

  // Add dataset
  const addDataset = useCallback(async (iri: string) => {
    // Check if already added
    if (datasets.some(d => d.iri === iri)) {
      setSnackbar({ open: true, message: "Dataset already added" });
      const existing = datasets.find(d => d.iri === iri);
      if (existing) setActiveDatasetId(existing.id);
      return;
    }

    const id = generateId();
    const newDataset: Dataset = {
      id,
      iri,
      title: "Loading...",
      dimensions: [],
      measures: [],
      observations: [],
      loaded: false,
      loading: true,
    };

    setDatasets(prev => [...prev, newDataset]);
    setActiveDatasetId(id);

    try {
      const data = await fetchCubeData(iri);
      setDatasets(prev => prev.map(d => d.id === id ? {
        ...d,
        title: data.title,
        description: data.description,
        dimensions: data.dimensions,
        measures: data.measures,
        observations: data.observations,
        loaded: true,
        loading: false,
      } : d));

      // Create default chart if dimensions and measures exist
      if (data.dimensions.length > 0 && data.measures.length > 0) {
        const dateField = data.dimensions.find(d => isDateField(d.id, d.label));
        const newChart: ChartConfig = {
          id: generateId(),
          datasetId: id,
          chartType: "column",
          xField: dateField?.id || data.dimensions[0].id,
          yField: data.measures[0].id,
          groupField: "",
          title: data.title,
          colorPalette: "swiss",
          showLegend: true,
          showTooltip: true,
          height: 400,
        };
        setCharts(prev => [...prev, newChart]);
        setActiveChartId(newChart.id);
        setCurrentView("chart");
      }

      setSnackbar({ open: true, message: `Dataset "${data.title}" added` });
    } catch (err) {
      setDatasets(prev => prev.map(d => d.id === id ? { ...d, loading: false, error: "Failed to load" } : d));
      setSnackbar({ open: true, message: "Failed to load dataset" });
    }
  }, [datasets]);

  // Remove dataset
  const removeDataset = useCallback((datasetId: string) => {
    setDatasets(prev => prev.filter(d => d.id !== datasetId));
    setCharts(prev => prev.filter(c => c.datasetId !== datasetId));
    if (activeDatasetId === datasetId) {
      const remaining = datasets.filter(d => d.id !== datasetId);
      setActiveDatasetId(remaining[0]?.id || null);
    }
    setSnackbar({ open: true, message: "Dataset removed" });
  }, [datasets, activeDatasetId]);

  // Active dataset
  const activeDataset = useMemo(() => datasets.find(d => d.id === activeDatasetId), [datasets, activeDatasetId]);

  // Active chart
  const activeChart = useMemo(() => charts.find(c => c.id === activeChartId) || charts[0], [charts, activeChartId]);

  // Get dataset for chart
  const getDatasetForChart = useCallback((chart: ChartConfig) => datasets.find(d => d.id === chart.datasetId), [datasets]);

  // Update chart
  const updateChart = useCallback((chartId: string, updates: Partial<ChartConfig>) => {
    setCharts(prev => prev.map(c => c.id === chartId ? { ...c, ...updates } : c));
  }, []);

  // Add chart from dataset
  const addChartFromDataset = useCallback((datasetId: string) => {
    setErrorMessage(null); // Clear previous error
    const dataset = datasets.find(d => d.id === datasetId);
    if (!dataset) {
      const msg = "Dataset not found";
      setErrorMessage(msg);
      setSnackbar({ open: true, message: msg });
      return;
    }
    if (dataset.dimensions.length === 0) {
      const msg = "Dataset has no dimensions - cannot create chart";
      setErrorMessage(msg);
      setSnackbar({ open: true, message: msg });
      return;
    }
    if (dataset.measures.length === 0) {
      const msg = "Dataset has no measures (numeric fields) - cannot create chart. Try using dimensions as Y-axis or select a different dataset.";
      setErrorMessage(msg);
      setSnackbar({ open: true, message: msg });
      return;
    }

    const dateField = dataset.dimensions.find(d => isDateField(d.id, d.label));
    const newChart: ChartConfig = {
      id: generateId(),
      datasetId,
      chartType: "line",
      xField: dateField?.id || dataset.dimensions[0].id,
      yField: dataset.measures[0].id,
      groupField: "",
      title: `${dataset.title} - Chart ${charts.filter(c => c.datasetId === datasetId).length + 1}`,
      colorPalette: settings.defaultPalette,
      showLegend: true,
      showTooltip: true,
      height: 350,
    };
    setCharts(prev => [...prev, newChart]);
    setActiveChartId(newChart.id);
    setCurrentView("chart");
    setSnackbar({ open: true, message: "Chart added" });
  }, [datasets, charts, settings.defaultPalette]);

  // Remove chart
  const removeChart = useCallback((chartId: string) => {
    setCharts(prev => prev.filter(c => c.id !== chartId));
    if (activeChartId === chartId) {
      const remaining = charts.filter(c => c.id !== chartId);
      setActiveChartId(remaining[0]?.id || null);
    }
  }, [charts, activeChartId]);

  // Find common fields between selected datasets
  const commonFields = useMemo(() => {
    const left = datasets.find(d => d.id === selectedJoinDatasets.left);
    const right = datasets.find(d => d.id === selectedJoinDatasets.right);
    if (!left || !right || !left.loaded || !right.loaded) return [];
    return findCommonFields(left, right);
  }, [datasets, selectedJoinDatasets]);

  // Create joined dataset
  const createJoinedDataset = useCallback(() => {
    const left = datasets.find(d => d.id === selectedJoinDatasets.left);
    const right = datasets.find(d => d.id === selectedJoinDatasets.right);

    if (!left || !right || !selectedJoinFields.leftField || !selectedJoinFields.rightField) {
      setSnackbar({ open: true, message: "Please select datasets and join fields" });
      return;
    }

    const joined = joinDatasets(left, right, selectedJoinFields.leftField, selectedJoinFields.rightField, joinType);

    const joinId = generateId();
    const joinedName = `${left.title.substring(0, 25)}... + ${right.title.substring(0, 25)}...`;

    // Add as a virtual dataset for charting
    const virtualDataset: Dataset = {
      id: `joined_${joinId}`,
      iri: `joined://${joinId}`,
      title: joinedName,
      dimensions: joined.dimensions,
      measures: joined.measures,
      observations: joined.observations,
      loaded: true,
      loading: false,
    };
    setDatasets(prev => [...prev, virtualDataset]);

    setJoinDialogOpen(false);
    setSelectedJoinDatasets({ left: "", right: "" });
    setSelectedJoinFields({ leftField: "", rightField: "" });
    setSnackbar({ open: true, message: `Joined dataset created with ${joined.observations.length} observations` });
  }, [datasets, selectedJoinDatasets, selectedJoinFields, joinType]);

  // Export
  const handleExport = useCallback((format: "csv" | "json") => {
    if (format === "json") {
      const config = { datasets: datasets.map(d => ({ iri: d.iri, title: d.title })), charts, globalFilters, settings };
      const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
      const link = document.createElement("a");
      link.download = "dashboard-config.json";
      link.href = URL.createObjectURL(blob);
      link.click();
    } else if (format === "csv" && activeChart && activeDataset) {
      const headers = ["X-Axis", "Y-Axis", "Group"];
      const rows = activeDataset.observations.map(obs => [
        formatLabel(String(obs[activeChart.xField] || "")),
        obs[activeChart.yField],
        activeChart.groupField ? formatLabel(String(obs[activeChart.groupField] || "")) : "",
      ]);
      const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const link = document.createElement("a");
      link.download = `${activeChart.title || "data"}.csv`;
      link.href = URL.createObjectURL(blob);
      link.click();
    }
    setSnackbar({ open: true, message: `Exported as ${format.toUpperCase()}` });
  }, [datasets, charts, globalFilters, settings, activeChart, activeDataset]);

  // Generate embed code for a chart
  const generateChartEmbed = useCallback((chartId: string) => {
    const chart = charts.find(c => c.id === chartId);
    const dataset = chart ? getDatasetForChart(chart) : null;
    if (!chart || !dataset) {
      setSnackbar({ open: true, message: "Chart or dataset not found" });
      return;
    }

    // Build initial embed payload
    const initialPayload: EmbedPayload = {
      version: 1,
      chart: {
        chartType: chart.chartType,
        xField: chart.xField,
        yField: chart.yField,
        groupField: chart.groupField,
        title: chart.title,
        colorPalette: chart.colorPalette,
        showLegend: chart.showLegend,
        showTooltip: chart.showTooltip,
        height: chart.height,
      },
      dataset: {
        title: dataset.title,
        dimensions: dataset.dimensions,
        measures: dataset.measures,
        observations: dataset.observations,
      },
      filters: globalFilters,
      customPalettes,
    };

    // Minimize payload for URL-based embedding (reduces size dramatically)
    // - Samples to max 100 observations
    // - Removes unused dimension columns
    // - Shortens URI field names
    const payload = preparePayloadForEmbed(initialPayload, 100);

    // Check size after minimization
    if (isConfigTooLarge(payload, 8000)) {
      setSnackbar({ open: true, message: "Configuration still too large. Try reducing data further." });
    }

    // Generate embed code
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const code = generateEmbedCode(baseUrl, payload, embedOptions);

    setEmbedCode(code);
    setEmbedChartId(chartId);
    setEmbedDialogOpen(true);
  }, [charts, getDatasetForChart, globalFilters, customPalettes, embedOptions]);

  // Copy embed code to clipboard
  const copyEmbedCode = useCallback((code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setEmbedCopied(true);
      setTimeout(() => setEmbedCopied(false), 2000);
    });
  }, []);

  // Get observations for chart with filters
  const getChartObservations = useCallback((chart: ChartConfig) => {
    const dataset = getDatasetForChart(chart);
    if (!dataset) return [];
    let obs = dataset.observations;
    Object.entries(globalFilters).forEach(([field, values]) => {
      if (values.length > 0) {
        obs = obs.filter(o => values.includes(String(o[field])));
      }
    });
    return sortObservations(obs, chart.xField);
  }, [getDatasetForChart, globalFilters]);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#f8fafc" }}>
      <Head>
        <title>Data Visualization Dashboard - visualize.admin.ch</title>
      </Head>

      {/* Top Bar */}
      {!zenMode && (
        <Box sx={{ bgcolor: "#1e293b", borderBottom: "3px solid #DC0018" }}>
          <Container maxWidth={false}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
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
                <Link href="/data-catalog" passHref legacyBehavior>
                  <Button
                    component="a"
                    size="small"
                    sx={{
                      color: "rgba(255,255,255,0.8)",
                      textTransform: "none",
                      fontSize: 12,
                      "&:hover": { color: "white", bgcolor: "rgba(255,255,255,0.1)" },
                    }}
                  >
                    &larr; Data Catalog
                  </Button>
                </Link>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Chip label={`${datasets.length} datasets`} size="small" style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "white" }} />
                <Chip label={`${charts.length} charts`} size="small" style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "white" }} />
                <Divider orientation="vertical" style={{ height: 24, margin: "0 8px", backgroundColor: "rgba(255,255,255,0.2)" }} />
                <Button size="sm" sx={{ color: "white", textTransform: "none" }} onClick={() => setZenMode(true)}>
                  Zen Mode
                </Button>
                <Button size="sm" sx={{ color: "white", textTransform: "none" }} onClick={() => handleExport("json")}>
                  Export
                </Button>
              </Box>
            </Box>
          </Container>
        </Box>
      )}

      {/* Main Layout */}
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Sidebar */}
        {!zenMode && (
          <Drawer
            variant={isMobile ? "temporary" : "persistent"}
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            sx={{
              width: sidebarOpen ? 240 : 0,
              flexShrink: 0,
              "& .MuiDrawer-paper": { width: 240, position: "relative", borderRight: "1px solid", borderColor: "divider", bgcolor: "white" },
            }}
          >
            <Box sx={{ p: 2 }}>
              <Typography variant="overline" color="text.secondary" sx={{ fontSize: 10 }}>
                Dashboard
              </Typography>
              <Typography variant="subtitle2">
                {datasets.length} Dataset{datasets.length !== 1 ? "s" : ""} Loaded
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
                    {item.id === "datasets" && datasets.length > 0 && (
                      <Chip label={String(datasets.length)} size="small" style={{ height: 20, fontSize: 11 }} />
                    )}
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
            <Divider style={{ marginTop: "auto" }} />
            {/* Loaded Datasets List */}
            <Box sx={{ p: 1, maxHeight: 200, overflow: "auto" }}>
              <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
                Loaded Datasets
              </Typography>
              {datasets.map(dataset => (
                <ListItemButton
                  key={dataset.id}
                  selected={activeDatasetId === dataset.id}
                  onClick={() => setActiveDatasetId(dataset.id)}
                  sx={{ borderRadius: 1, py: 0.5 }}
                >
                  <ListItemText
                    primary={dataset.title}
                    primaryTypographyProps={{ fontSize: 12, noWrap: true }}
                    secondary={dataset.loading ? "Loading..." : `${dataset.observations.length} rows`}
                    secondaryTypographyProps={{ fontSize: 10 }}
                  />
                </ListItemButton>
              ))}
              {datasets.length === 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ p: 1, display: "block" }}>
                  No datasets loaded
                </Typography>
              )}
            </Box>
          </Drawer>
        )}

        {/* Main Content */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Toolbar */}
          {!zenMode && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, px: 2, py: 1.5, bgcolor: "white", borderBottom: "1px solid", borderColor: "divider" }}>
              <Button size="sm" onClick={() => setSidebarOpen(!sidebarOpen)} sx={{ minWidth: 32 }}>
                {sidebarOpen ? "[<" : ">]"}
              </Button>
              <Typography variant="subtitle1" fontWeight={600} sx={{ flex: 1 }}>
                {NAV_ITEMS.find(n => n.id === currentView)?.label}
              </Typography>
              {currentView === "chart" && charts.length > 0 && (
                <Tabs
                  value={activeChartId || false}
                  onChange={(_, v) => setActiveChartId(v)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{ "& .MuiTab-root": { minWidth: 80, textTransform: "none", fontSize: 13 } }}
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
            {/* Datasets View */}
            {currentView === "datasets" && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {/* Search */}
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Browse LINDAS Datasets
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Search for datasets (e.g., agriculture, population, energy...)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                    <Button variant="contained" onClick={handleSearch} disabled={searching}>
                      {searching ? "..." : "Search"}
                    </Button>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                    <Button size="sm" onClick={() => setAddDatasetDialogOpen(true)}>
                      Add by IRI
                    </Button>
                    {datasets.filter(d => d.loaded).length >= 2 && (
                      <Button size="sm" variant="outlined" onClick={() => setJoinDialogOpen(true)}>
                        Join Datasets
                      </Button>
                    )}
                  </Box>
                </Paper>

                {/* Search Results */}
                {searching && <LinearProgress />}
                {searchError && <Alert severity="error">{searchError}</Alert>}

                <Grid container spacing={2}>
                  {searchResults.map(result => {
                    const isAdded = datasets.some(d => d.iri === result.iri);
                    return (
                      <Grid item xs={12} md={6} lg={4} key={result.iri}>
                        <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                          <CardContent sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom noWrap title={result.title}>
                              {result.title}
                            </Typography>
                            {result.creator && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {result.creator}
                              </Typography>
                            )}
                            {result.description && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {result.description}
                              </Typography>
                            )}
                            {result.themes && result.themes.length > 0 && (
                              <Box sx={{ mt: 1, display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                                {result.themes.slice(0, 3).map(theme => (
                                  <Chip key={theme} label={theme} size="small" style={{ height: 20, fontSize: 10 }} />
                                ))}
                              </Box>
                            )}
                          </CardContent>
                          <CardActions sx={{ justifyContent: "space-between", px: 2, pb: 2 }}>
                            {result.datePublished && (
                              <Typography variant="caption" color="text.secondary">
                                {new Date(result.datePublished).toLocaleDateString()}
                              </Typography>
                            )}
                            <Button
                              size="sm"
                              variant={isAdded ? "outlined" : "contained"}
                              onClick={() => !isAdded && addDataset(result.iri)}
                              disabled={isAdded}
                            >
                              {isAdded ? "Added" : "Add"}
                            </Button>
                          </CardActions>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>

                {searchResults.length === 0 && !searching && (
                  <Paper sx={{ p: 4, textAlign: "center" }}>
                    <Typography color="text.secondary">
                      No datasets found. Try a different search term.
                    </Typography>
                  </Paper>
                )}

                {/* Loaded Datasets */}
                {datasets.length > 0 && (
                  <Paper sx={{ p: 2, mt: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Loaded Datasets ({datasets.length})
                    </Typography>
                    {errorMessage && (
                      <div style={{ marginBottom: 16 }}>
                        <Alert severity="error" onClose={() => setErrorMessage(null)}>
                          {errorMessage}
                        </Alert>
                      </div>
                    )}
                    <List>
                      {datasets.map(dataset => (
                        <ListItem
                          key={dataset.id}
                          secondaryAction={
                            <Box sx={{ display: "flex", gap: 1 }}>
                              <Button size="sm" onClick={() => addChartFromDataset(dataset.id)} disabled={!dataset.loaded}>
                                + Chart
                              </Button>
                              <Button size="sm" color="error" onClick={() => removeDataset(dataset.id)}>
                                Remove
                              </Button>
                            </Box>
                          }
                        >
                          <ListItemText
                            primary={dataset.title}
                            secondary={
                              dataset.loading ? "Loading..." :
                              dataset.error ? dataset.error :
                              `${dataset.dimensions.length} dimensions, ${dataset.measures.length} measures, ${dataset.observations.length} observations`
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                )}
              </Box>
            )}

            {/* Chart View */}
            {currentView === "chart" && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {charts.length === 0 ? (
                  <Paper sx={{ p: 4, textAlign: "center" }}>
                    <Typography variant="h6" gutterBottom>No Charts Yet</Typography>
                    <Typography color="text.secondary" gutterBottom>
                      Add a dataset first, then create charts from it.
                    </Typography>
                    <Button variant="contained" onClick={() => setCurrentView("datasets")} sx={{ mt: 2 }}>
                      Browse Datasets
                    </Button>
                  </Paper>
                ) : (
                  <>
                    {/* Chart Controls */}
                    {activeChart && (
                      <Paper sx={{ p: 2 }}>
                        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "flex-end" }}>
                          <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>Dataset</InputLabel>
                            <Select
                              value={activeChart.datasetId}
                              label="Dataset"
                              onChange={(e) => {
                                const newDataset = datasets.find(d => d.id === e.target.value);
                                if (newDataset && newDataset.dimensions.length > 0 && newDataset.measures.length > 0) {
                                  updateChart(activeChart.id, {
                                    datasetId: e.target.value,
                                    xField: newDataset.dimensions[0].id,
                                    yField: newDataset.measures[0].id,
                                    groupField: "",
                                  });
                                }
                              }}
                            >
                              {datasets.filter(d => d.loaded).map(d => (
                                <MenuItem key={d.id} value={d.id}>{d.title}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <FormControl size="small" sx={{ minWidth: 100 }}>
                            <InputLabel>Type</InputLabel>
                            <Select
                              value={activeChart.chartType}
                              label="Type"
                              onChange={(e) => updateChart(activeChart.id, { chartType: e.target.value as SimpleChartType })}
                            >
                              {CHART_TYPES.map(t => (
                                <MenuItem key={t.type} value={t.type}>{t.label}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          {(() => {
                            const chartDataset = getDatasetForChart(activeChart);
                            if (!chartDataset) return null;
                            return (
                              <>
                                <FormControl size="small" sx={{ minWidth: 140 }}>
                                  <InputLabel>X-Axis</InputLabel>
                                  <Select
                                    value={activeChart.xField}
                                    label="X-Axis"
                                    onChange={(e) => updateChart(activeChart.id, { xField: e.target.value })}
                                  >
                                    {chartDataset.dimensions.map(d => (
                                      <MenuItem key={d.id} value={d.id}>{d.label}</MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                                <FormControl size="small" sx={{ minWidth: 140 }}>
                                  <InputLabel>Y-Axis</InputLabel>
                                  <Select
                                    value={activeChart.yField}
                                    label="Y-Axis"
                                    onChange={(e) => updateChart(activeChart.id, { yField: e.target.value })}
                                  >
                                    {chartDataset.measures.map(m => (
                                      <MenuItem key={m.id} value={m.id}>{m.label}</MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                  <InputLabel>Group</InputLabel>
                                  <Select
                                    value={activeChart.groupField}
                                    label="Group"
                                    onChange={(e) => updateChart(activeChart.id, { groupField: e.target.value })}
                                  >
                                    <MenuItem value=""><em>None</em></MenuItem>
                                    {chartDataset.dimensions.filter(d => d.id !== activeChart.xField).map(d => (
                                      <MenuItem key={d.id} value={d.id}>{d.label}</MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </>
                            );
                          })()}
                          <FormControl size="small" sx={{ minWidth: 100 }}>
                            <InputLabel>Colors</InputLabel>
                            <Select
                              value={activeChart.colorPalette}
                              label="Colors"
                              onChange={(e) => updateChart(activeChart.id, { colorPalette: e.target.value })}
                            >
                              {Object.keys(allPalettes).map(name => (
                                <MenuItem key={name} value={name} sx={{ textTransform: "capitalize" }}>{name}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <FormControlLabel
                            control={<Switch size="small" checked={activeChart.showLegend} onChange={(e) => updateChart(activeChart.id, { showLegend: e.target.checked })} />}
                            label={<Typography variant="body2">Legend</Typography>}
                          />
                          {charts.length > 1 && (
                            <Button size="sm" color="error" onClick={() => removeChart(activeChart.id)}>
                              Remove
                            </Button>
                          )}
                        </Box>
                      </Paper>
                    )}

                    {/* Compact Filters Menu */}
                    {activeDataset && activeDataset.loaded && activeDataset.dimensions.length > 0 && (
                      <Paper sx={{ p: 0, overflow: "hidden" }}>
                        <Box
                          sx={{
                            px: 2,
                            py: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            cursor: "pointer",
                            bgcolor: filtersExpanded ? "action.selected" : "transparent",
                            "&:hover": { bgcolor: "action.hover" },
                          }}
                          onClick={() => setFiltersExpanded(!filtersExpanded)}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography variant="body2" fontWeight={500}>Filters</Typography>
                            {Object.values(globalFilters).some(v => v.length > 0) && (
                              <Chip
                                label={`${Object.values(globalFilters).filter(v => v.length > 0).length} active`}
                                size="small"
                                color="primary"
                                sx={{ height: 20, fontSize: 11 }}
                              />
                            )}
                          </Box>
                          <Typography variant="body2" color="text.secondary">{filtersExpanded ? "-" : "+"}</Typography>
                        </Box>
                        {filtersExpanded && (
                          <Box sx={{ px: 2, pb: 2, borderTop: "1px solid", borderColor: "divider" }}>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
                              {activeDataset.dimensions.map(dim => {
                                const values = [...new Set(activeDataset.observations.map(o => o[dim.id]).filter(Boolean))].sort();
                                const selected = globalFilters[dim.id] || [];
                                if (values.length === 0 || values.length > 50) return null;
                                return (
                                  <FormControl key={dim.id} size="small" sx={{ minWidth: 150, maxWidth: 200 }}>
                                    <InputLabel>{dim.label}</InputLabel>
                                    <Select
                                      multiple
                                      value={selected}
                                      label={dim.label}
                                      onChange={(e) => setGlobalFilters(p => ({ ...p, [dim.id]: e.target.value as string[] }))}
                                      renderValue={(s) => s.length === 0 ? "All" : `${s.length} selected`}
                                      MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
                                    >
                                      {values.map(v => (
                                        <MenuItem key={String(v)} value={String(v)} sx={{ fontSize: 13 }}>
                                          <Checkbox checked={selected.includes(String(v))} size="small" />
                                          <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>{String(v)}</Typography>
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                );
                              })}
                            </Box>
                            {Object.values(globalFilters).some(v => v.length > 0) && (
                              <Button size="sm" sx={{ mt: 1 }} onClick={() => setGlobalFilters({})}>
                                Clear All Filters
                              </Button>
                            )}
                          </Box>
                        )}
                      </Paper>
                    )}

                    {/* Charts */}
                    {charts.map(chart => {
                      const chartDataset = getDatasetForChart(chart);
                      if (!chartDataset || !chartDataset.loaded) {
                        return (
                          <Paper key={chart.id} sx={{ p: 3, textAlign: "center" }}>
                            <Spinner size={24} />
                            <Typography color="text.secondary" sx={{ mt: 1 }}>Loading dataset...</Typography>
                          </Paper>
                        );
                      }

                      const observations = getChartObservations(chart);
                      const xLabel = chartDataset.dimensions.find(d => d.id === chart.xField)?.label || "";
                      const yLabel = chartDataset.measures.find(m => m.id === chart.yField)?.label || "";

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
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, gap: 1 }}>
                            <TextField
                              value={chart.title}
                              onChange={(e) => updateChart(chart.id, { title: e.target.value })}
                              variant="standard"
                              size="small"
                              sx={{
                                flex: 1,
                                "& .MuiInput-input": {
                                  fontSize: 14,
                                  fontWeight: 500,
                                  color: "text.secondary",
                                  py: 0.5
                                },
                                "& .MuiInput-underline:before": { borderBottom: "1px dashed rgba(0,0,0,0.2)" },
                                "& .MuiInput-underline:hover:before": { borderBottom: "1px solid rgba(0,0,0,0.4)" },
                              }}
                              onClick={(e) => e.stopPropagation()}
                              placeholder="Chart title..."
                            />
                            <Chip label={chartDataset.title} size="small" variant="outlined" style={{ fontSize: 10, flexShrink: 0 }} />
                          </Box>
                          {isMounted && (
                            <SimpleEChartsChart
                              key={`${chart.id}-${chart.datasetId}-${observations.length}`}
                              observations={observations}
                              xField={chart.xField}
                              yField={chart.yField}
                              segmentField={chart.groupField || undefined}
                              chartType={chart.chartType}
                              height={zenMode && typeof window !== "undefined" ? window.innerHeight - 20 : chart.height}
                              xAxisLabel={xLabel}
                              yAxisLabel={yLabel}
                              showLegend={chart.showLegend && !!chart.groupField}
                              showTooltip={chart.showTooltip}
                              colors={allPalettes[chart.colorPalette] || allPalettes.swiss}
                            />
                          )}
                        </Paper>
                      );
                    })}

                    {/* Add chart button */}
                    {datasets.some(d => d.loaded) && (
                      <Paper sx={{ p: 2, textAlign: "center", border: "2px dashed", borderColor: "divider" }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Add another chart from:
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, justifyContent: "center", flexWrap: "wrap" }}>
                          {datasets.filter(d => d.loaded).map(d => (
                            <Button key={d.id} size="sm" variant="outlined" onClick={() => addChartFromDataset(d.id)}>
                              {d.title}
                            </Button>
                          ))}
                        </Box>
                      </Paper>
                    )}
                  </>
                )}
              </Box>
            )}

            {/* Table View */}
            {currentView === "table" && activeDataset && activeDataset.loaded && (
              <Paper sx={{ overflow: "hidden" }}>
                <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Dataset</InputLabel>
                    <Select
                      value={activeDatasetId || ""}
                      label="Dataset"
                      onChange={(e) => setActiveDatasetId(e.target.value)}
                    >
                      {datasets.filter(d => d.loaded).map(d => (
                        <MenuItem key={d.id} value={d.id}>{d.title}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <TableContainer sx={{ maxHeight: "calc(100vh - 280px)" }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, bgcolor: "#f8fafc" }}>#</TableCell>
                        {activeDataset.dimensions.map(d => (
                          <TableCell key={d.id} sx={{ fontWeight: 600, bgcolor: "#f8fafc" }}>{d.label}</TableCell>
                        ))}
                        {activeDataset.measures.map(m => (
                          <TableCell key={m.id} sx={{ fontWeight: 600, bgcolor: "#f8fafc" }} align="right">
                            {m.label} {m.unit && `(${m.unit})`}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activeDataset.observations.slice(0, 500).map((obs, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell sx={{ color: "text.secondary" }}>{idx + 1}</TableCell>
                          {activeDataset.dimensions.map(d => (
                            <TableCell key={d.id}>{formatLabel(String(obs[d.id] || ""))}</TableCell>
                          ))}
                          {activeDataset.measures.map(m => (
                            <TableCell key={m.id} align="right">
                              {typeof obs[m.id] === "number" ? Number(obs[m.id]).toLocaleString() : obs[m.id]}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}


            {/* Settings View */}
            {currentView === "settings" && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 700 }}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>General Settings</Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Default Color Palette</InputLabel>
                      <Select value={settings.defaultPalette} label="Default Color Palette" onChange={(e) => setSettings(p => ({ ...p, defaultPalette: e.target.value }))}>
                        {Object.keys(allPalettes).map(name => (
                          <MenuItem key={name} value={name} sx={{ textTransform: "capitalize" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              {name}
                              <Box sx={{ display: "flex", gap: 0.25, ml: 1 }}>
                                {allPalettes[name].slice(0, 6).map((c, i) => (
                                  <Box key={i} sx={{ width: 12, height: 12, bgcolor: c, borderRadius: 0.5 }} />
                                ))}
                              </Box>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Box>
                      <Typography variant="body2" gutterBottom>Animation Duration: {settings.animationDuration}ms</Typography>
                      <Slider
                        value={settings.animationDuration}
                        onChange={(_, v) => setSettings(p => ({ ...p, animationDuration: v as number }))}
                        min={0} max={2000} step={100}
                      />
                    </Box>
                  </Box>
                </Paper>

                {/* Custom Color Palettes */}
                <Paper sx={{ p: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>Custom Color Palettes</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Create your own color palettes for chart visualizations.
                  </Typography>

                  {/* Existing custom palettes */}
                  {Object.entries(customPalettes).length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      {Object.entries(customPalettes).map(([name, colors]) => (
                        <Box key={name} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, p: 1, bgcolor: "action.hover", borderRadius: 1 }}>
                          <Typography variant="body2" fontWeight={500} sx={{ minWidth: 100, textTransform: "capitalize" }}>{name}</Typography>
                          <Box sx={{ display: "flex", gap: 0.5, flex: 1 }}>
                            {colors.map((c, i) => (
                              <Box key={i} sx={{ width: 24, height: 24, bgcolor: c, borderRadius: 0.5, border: "1px solid rgba(0,0,0,0.1)" }} />
                            ))}
                          </Box>
                          <Button
                            size="sm"
                            color="error"
                            onClick={() => {
                              setCustomPalettes(p => {
                                const updated = { ...p };
                                delete updated[name];
                                return updated;
                              });
                            }}
                          >
                            Delete
                          </Button>
                        </Box>
                      ))}
                    </Box>
                  )}

                  {/* Create new palette */}
                  <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, p: 2 }}>
                    <Typography variant="body2" fontWeight={500} gutterBottom>Create New Palette</Typography>
                    <TextField
                      size="small"
                      fullWidth
                      label="Palette Name"
                      value={newPaletteName}
                      onChange={(e) => setNewPaletteName(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
                      placeholder="e.g., corporate, brand"
                      sx={{ mb: 2 }}
                    />
                    <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: "block" }}>
                      Click on a color to edit it. Click + to add more colors.
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center", mt: 1, mb: 2 }}>
                      {newPaletteColors.map((color, index) => (
                        <Box key={index} sx={{ position: "relative" }}>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              bgcolor: color,
                              borderRadius: 1,
                              border: editingColorIndex === index ? "3px solid" : "1px solid",
                              borderColor: editingColorIndex === index ? "primary.main" : "rgba(0,0,0,0.2)",
                              cursor: "pointer",
                              "&:hover": { transform: "scale(1.1)" },
                              transition: "transform 0.1s",
                            }}
                            onClick={() => setEditingColorIndex(editingColorIndex === index ? null : index)}
                          />
                          {newPaletteColors.length > 2 && (
                            <Box
                              sx={{
                                position: "absolute",
                                top: -6,
                                right: -6,
                                width: 16,
                                height: 16,
                                bgcolor: "error.main",
                                color: "white",
                                borderRadius: "50%",
                                fontSize: 10,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                "&:hover": { bgcolor: "error.dark" },
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setNewPaletteColors(p => p.filter((_, i) => i !== index));
                                setEditingColorIndex(null);
                              }}
                            >
                              x
                            </Box>
                          )}
                        </Box>
                      ))}
                      {newPaletteColors.length < 10 && (
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            border: "2px dashed",
                            borderColor: "divider",
                            borderRadius: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
                          }}
                          onClick={() => {
                            const randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
                            setNewPaletteColors(p => [...p, randomColor]);
                          }}
                        >
                          <Typography color="text.secondary">+</Typography>
                        </Box>
                      )}
                    </Box>
                    {editingColorIndex !== null && (
                      <Box sx={{ mb: 2 }}>
                        <TextField
                          size="small"
                          label={`Color ${editingColorIndex + 1}`}
                          value={newPaletteColors[editingColorIndex]}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value.match(/^#[0-9A-Fa-f]{0,6}$/)) {
                              setNewPaletteColors(p => p.map((c, i) => i === editingColorIndex ? value : c));
                            }
                          }}
                          placeholder="#DC0018"
                          sx={{ width: 150 }}
                          InputProps={{
                            startAdornment: (
                              <Box sx={{ width: 20, height: 20, bgcolor: newPaletteColors[editingColorIndex], borderRadius: 0.5, mr: 1 }} />
                            ),
                          }}
                        />
                      </Box>
                    )}
                    <Button
                      variant="contained"
                      size="sm"
                      disabled={!newPaletteName || newPaletteColors.length < 2 || Object.keys(allPalettes).includes(newPaletteName)}
                      onClick={() => {
                        if (newPaletteName && newPaletteColors.length >= 2) {
                          setCustomPalettes(p => ({ ...p, [newPaletteName]: [...newPaletteColors] }));
                          setNewPaletteName("");
                          setNewPaletteColors(["#DC0018", "#2D6B9F", "#66B573", "#F9B21A"]);
                          setEditingColorIndex(null);
                        }
                      }}
                    >
                      Create Palette
                    </Button>
                  </Box>
                </Paper>

                <Paper sx={{ p: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>Loaded Datasets</Typography>
                  {datasets.map(d => (
                    <Box key={d.id} sx={{ mt: 2 }}>
                      <Typography variant="subtitle2">{d.title}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace", wordBreak: "break-all" }}>
                        {d.iri}
                      </Typography>
                    </Box>
                  ))}
                </Paper>
              </Box>
            )}

            {/* Code View */}
            {currentView === "code" && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>Dashboard Configuration</Typography>
                  <Box sx={{ bgcolor: "#1e293b", color: "#e2e8f0", p: 2, borderRadius: 1, mt: 2, fontFamily: "monospace", fontSize: 12, overflow: "auto", maxHeight: 400 }}>
                    <pre style={{ margin: 0 }}>{JSON.stringify({
                      datasets: datasets.map(d => ({ iri: d.iri, title: d.title })),
                      charts: charts.map(c => ({ ...c, datasetIri: datasets.find(d => d.id === c.datasetId)?.iri })),
                      settings
                    }, null, 2)}</pre>
                  </Box>
                  <Button size="sm" sx={{ mt: 2 }} onClick={() => handleExport("json")}>Download JSON</Button>
                </Paper>
                {/* Embed Charts Section */}
                {charts.length > 0 && (
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>Embed Charts</Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Generate embed codes to include charts in external websites.
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
                      {charts.map(chart => {
                        const dataset = getDatasetForChart(chart);
                        return (
                          <Box key={chart.id} sx={{ display: "flex", alignItems: "center", gap: 2, p: 2, bgcolor: "#f8fafc", borderRadius: 1 }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle2">{chart.title || "Untitled Chart"}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {CHART_TYPES.find(t => t.type === chart.chartType)?.label} - {dataset?.title || "No dataset"}
                              </Typography>
                            </Box>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => generateChartEmbed(chart.id)}
                              disabled={!dataset}
                            >
                              Get Embed Code
                            </Button>
                          </Box>
                        );
                      })}
                    </Box>
                  </Paper>
                )}

                {datasets.length > 0 && (
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>SPARQL Queries</Typography>
                    {datasets.map(d => (
                      <Box key={d.id} sx={{ mt: 2 }}>
                        <Typography variant="subtitle2">{d.title}</Typography>
                        <Box sx={{ bgcolor: "#1e293b", color: "#e2e8f0", p: 2, borderRadius: 1, mt: 1, fontFamily: "monospace", fontSize: 11, overflow: "auto" }}>
                          <pre style={{ margin: 0 }}>{`PREFIX cube: <https://cube.link/>
SELECT ?obs ?p ?o WHERE {
  <${d.iri}> cube:observationSet ?obsSet .
  ?obsSet cube:observation ?obs .
  ?obs ?p ?o .
} LIMIT 10000`}</pre>
                        </Box>
                      </Box>
                    ))}
                  </Paper>
                )}
              </Box>
            )}

            {/* Empty state for views that need data */}
            {currentView === "table" && (!activeDataset || !activeDataset.loaded) && (
              <Paper sx={{ p: 4, textAlign: "center" }}>
                <Typography variant="h6" gutterBottom>No Dataset Selected</Typography>
                <Typography color="text.secondary" gutterBottom>Add a dataset first to view data.</Typography>
                <Button variant="contained" onClick={() => setCurrentView("datasets")} sx={{ mt: 2 }}>Browse Datasets</Button>
              </Paper>
            )}
          </Box>
        </Box>
      </Box>

      {/* Zen Mode Exit */}
      {zenMode && (
        <Button onClick={() => setZenMode(false)} sx={{ position: "fixed", top: 16, right: 16, bgcolor: "rgba(0,0,0,0.5)", color: "white", "&:hover": { bgcolor: "rgba(0,0,0,0.7)" } }}>
          Exit Zen Mode
        </Button>
      )}

      {/* Add Dataset Dialog */}
      <Dialog open={addDatasetDialogOpen} onClose={() => setAddDatasetDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Dataset by IRI</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Enter the full IRI (URL) of a LINDAS cube dataset.
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="https://agriculture.ld.admin.ch/foag/cube/..."
            value={customCubeIri}
            onChange={(e) => setCustomCubeIri(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDatasetDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (customCubeIri) {
                addDataset(customCubeIri);
                setCustomCubeIri("");
                setAddDatasetDialogOpen(false);
              }
            }}
            disabled={!customCubeIri}
          >
            Add Dataset
          </Button>
        </DialogActions>
      </Dialog>

      {/* Join Datasets Dialog */}
      <Dialog open={joinDialogOpen} onClose={() => setJoinDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Join Datasets</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Combine two datasets by joining them on a common field. This creates a new virtual dataset.
          </Typography>

          <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Left Dataset</InputLabel>
              <Select
                value={selectedJoinDatasets.left}
                label="Left Dataset"
                onChange={(e) => {
                  setSelectedJoinDatasets(p => ({ ...p, left: e.target.value }));
                  setSelectedJoinFields({ leftField: "", rightField: "" });
                }}
              >
                {datasets.filter(d => d.loaded && d.id !== selectedJoinDatasets.right).map(d => (
                  <MenuItem key={d.id} value={d.id}>{d.title}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Right Dataset</InputLabel>
              <Select
                value={selectedJoinDatasets.right}
                label="Right Dataset"
                onChange={(e) => {
                  setSelectedJoinDatasets(p => ({ ...p, right: e.target.value }));
                  setSelectedJoinFields({ leftField: "", rightField: "" });
                }}
              >
                {datasets.filter(d => d.loaded && d.id !== selectedJoinDatasets.left).map(d => (
                  <MenuItem key={d.id} value={d.id}>{d.title}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Auto-detected common fields */}
          {commonFields.length > 0 && (
            <Paper sx={{ mt: 3, p: 2, bgcolor: "#f0fdf4", border: "1px solid #86efac" }}>
              <Typography variant="subtitle2" color="success.dark" gutterBottom>
                Suggested Join Fields (Auto-detected)
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                These fields have common values between the two datasets. Click to use.
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {commonFields.slice(0, 5).map((cf, idx) => (
                  <Button
                    key={idx}
                    size="sm"
                    variant={selectedJoinFields.leftField === cf.field1.id && selectedJoinFields.rightField === cf.field2.id ? "contained" : "outlined"}
                    onClick={() => setSelectedJoinFields({ leftField: cf.field1.id, rightField: cf.field2.id })}
                    sx={{ justifyContent: "flex-start", textAlign: "left" }}
                  >
                    <Box>
                      <Typography variant="body2">
                        {cf.field1.label} = {cf.field2.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {cf.commonValues} common values ({Math.round(cf.matchScore)}% match)
                      </Typography>
                    </Box>
                  </Button>
                ))}
              </Box>
            </Paper>
          )}

          {/* Manual field selection */}
          <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
            Or select fields manually:
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Left Field</InputLabel>
              <Select
                value={selectedJoinFields.leftField}
                label="Left Field"
                onChange={(e) => setSelectedJoinFields(p => ({ ...p, leftField: e.target.value }))}
                disabled={!selectedJoinDatasets.left}
              >
                {datasets.find(d => d.id === selectedJoinDatasets.left)?.dimensions.map(dim => (
                  <MenuItem key={dim.id} value={dim.id}>{dim.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Right Field</InputLabel>
              <Select
                value={selectedJoinFields.rightField}
                label="Right Field"
                onChange={(e) => setSelectedJoinFields(p => ({ ...p, rightField: e.target.value }))}
                disabled={!selectedJoinDatasets.right}
              >
                {datasets.find(d => d.id === selectedJoinDatasets.right)?.dimensions.map(dim => (
                  <MenuItem key={dim.id} value={dim.id}>{dim.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Join type */}
          <FormControl fullWidth size="small" sx={{ mt: 2 }}>
            <InputLabel>Join Type</InputLabel>
            <Select
              value={joinType}
              label="Join Type"
              onChange={(e) => setJoinType(e.target.value as "inner" | "left" | "full")}
            >
              <MenuItem value="inner">Inner Join (only matching rows)</MenuItem>
              <MenuItem value="left">Left Join (all left rows + matching right)</MenuItem>
              <MenuItem value="full">Full Join (all rows from both)</MenuItem>
            </Select>
          </FormControl>

          {/* No common fields warning */}
          {selectedJoinDatasets.left && selectedJoinDatasets.right && commonFields.length === 0 && (
            <div style={{ marginTop: 16 }}>
              <Alert severity="warning">
                No common values found between these datasets. You can still join them manually, but the result may be empty.
              </Alert>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJoinDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={createJoinedDataset}
            disabled={!selectedJoinFields.leftField || !selectedJoinFields.rightField}
          >
            Create Joined Dataset
          </Button>
        </DialogActions>
      </Dialog>

      {/* Embed Dialog */}
      <Dialog open={embedDialogOpen} onClose={() => setEmbedDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Embed Chart
          {embedChartId && (
            <Typography variant="body2" color="text.secondary">
              {charts.find(c => c.id === embedChartId)?.title || "Untitled Chart"}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {embedCode && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Embed Options */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>Embed Options</Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={embedOptions.removeBorder}
                        onChange={(e) => setEmbedOptions(p => ({ ...p, removeBorder: e.target.checked }))}
                        size="small"
                      />
                    }
                    label="Remove border"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={embedOptions.optimizeSpace}
                        onChange={(e) => setEmbedOptions(p => ({ ...p, optimizeSpace: e.target.checked }))}
                        size="small"
                      />
                    }
                    label="Optimize space"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={embedOptions.hideTitle}
                        onChange={(e) => setEmbedOptions(p => ({ ...p, hideTitle: e.target.checked }))}
                        size="small"
                      />
                    }
                    label="Hide title"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={embedOptions.hideLegend}
                        onChange={(e) => setEmbedOptions(p => ({ ...p, hideLegend: e.target.checked }))}
                        size="small"
                      />
                    }
                    label="Hide legend"
                  />
                </Box>
                <TextField
                  type="number"
                  label="Height (px)"
                  value={embedOptions.height}
                  onChange={(e) => setEmbedOptions(p => ({ ...p, height: parseInt(e.target.value) || 400 }))}
                  size="small"
                  sx={{ mt: 2, width: 120 }}
                  inputProps={{ min: 200, max: 1200 }}
                />
                <Button
                  size="small"
                  sx={{ mt: 2, ml: 2 }}
                  onClick={() => embedChartId && generateChartEmbed(embedChartId)}
                >
                  Update Preview
                </Button>
              </Box>

              {/* Fixed Height Iframe */}
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="subtitle2">Fixed Height Iframe</Typography>
                  <Button size="small" onClick={() => copyEmbedCode(embedCode.iframe)}>
                    {embedCopied ? "Copied!" : "Copy"}
                  </Button>
                </Box>
                <Box sx={{ bgcolor: "#1e293b", color: "#e2e8f0", p: 2, borderRadius: 1, fontFamily: "monospace", fontSize: 11, overflow: "auto", maxHeight: 100 }}>
                  <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{embedCode.iframe}</pre>
                </Box>
              </Box>

              {/* Responsive Iframe */}
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="subtitle2">Responsive Iframe (with auto-resize)</Typography>
                  <Button size="small" onClick={() => copyEmbedCode(embedCode.iframeResponsive)}>
                    {embedCopied ? "Copied!" : "Copy"}
                  </Button>
                </Box>
                <Box sx={{ bgcolor: "#1e293b", color: "#e2e8f0", p: 2, borderRadius: 1, fontFamily: "monospace", fontSize: 11, overflow: "auto", maxHeight: 120 }}>
                  <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{embedCode.iframeResponsive}</pre>
                </Box>
              </Box>

              {/* Direct URL */}
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="subtitle2">Direct URL</Typography>
                  <Button size="small" onClick={() => copyEmbedCode(embedCode.url)}>
                    {embedCopied ? "Copied!" : "Copy"}
                  </Button>
                </Box>
                <Box sx={{ bgcolor: "#f1f5f9", p: 2, borderRadius: 1, fontFamily: "monospace", fontSize: 11, overflow: "auto", wordBreak: "break-all" }}>
                  {embedCode.url}
                </Box>
              </Box>

              <Alert severity="info">
                The chart data is encoded directly in the URL. No server-side storage is required.
                For very large datasets, consider filtering the data before embedding.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmbedDialogOpen(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => embedCode && window.open(embedCode.url, "_blank")}
          >
            Preview in New Tab
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ open: false, message: "" })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <MuiAlert severity="info" onClose={() => setSnackbar({ open: false, message: "" })}>
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
}
