/**
 * Data Catalog Page
 *
 * Main entry point for browsing and selecting datasets.
 * Users select a dataset here, then are redirected to chart-builder.
 */

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import {
  Box,
  Container,
  Typography,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  CircularProgress,
  Paper,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import BarChartIcon from "@mui/icons-material/BarChart";
import { c as colors } from "@interactivethings/swiss-federal-ci";

// SPARQL endpoint
const LINDAS_ENDPOINT = "https://lindas.admin.ch/query";

interface CubeInfo {
  iri: string;
  title: string;
  description: string;
  publisher: string;
  themes: string[];
  modified: string;
}

// Search for cubes in LINDAS
async function searchCubes(searchTerm: string = ""): Promise<CubeInfo[]> {
  const query = `
    PREFIX schema: <http://schema.org/>
    PREFIX dcat: <http://www.w3.org/ns/dcat#>
    PREFIX dcterms: <http://purl.org/dc/terms/>
    PREFIX cube: <https://cube.link/>

    SELECT DISTINCT ?cube ?title ?description ?publisher ?theme ?modified
    WHERE {
      ?cube a cube:Cube .
      ?cube schema:name ?title .
      FILTER(LANG(?title) = "en" || LANG(?title) = "")

      OPTIONAL { ?cube schema:description ?description . FILTER(LANG(?description) = "en" || LANG(?description) = "") }
      OPTIONAL { ?cube schema:publisher/schema:name ?publisher . }
      OPTIONAL { ?cube dcat:theme/schema:name ?theme . }
      OPTIONAL { ?cube schema:dateModified ?modified . }

      ${searchTerm ? `FILTER(CONTAINS(LCASE(?title), LCASE("${searchTerm}")))` : ""}
    }
    ORDER BY DESC(?modified)
    LIMIT 50
  `;

  const response = await fetch(LINDAS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/sparql-query",
      Accept: "application/sparql-results+json",
    },
    body: query,
  });

  if (!response.ok) {
    throw new Error(`SPARQL query failed: ${response.status}`);
  }

  const data = await response.json();

  // Group by cube IRI to combine themes
  const cubeMap = new Map<string, CubeInfo>();

  for (const binding of data.results.bindings) {
    const iri = binding.cube?.value;
    if (!iri) continue;

    if (!cubeMap.has(iri)) {
      cubeMap.set(iri, {
        iri,
        title: binding.title?.value || "Untitled",
        description: binding.description?.value || "",
        publisher: binding.publisher?.value || "",
        themes: [],
        modified: binding.modified?.value || "",
      });
    }

    const cube = cubeMap.get(iri)!;
    if (binding.theme?.value && !cube.themes.includes(binding.theme.value)) {
      cube.themes.push(binding.theme.value);
    }
  }

  return Array.from(cubeMap.values());
}

export default function DataCatalogPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [cubes, setCubes] = useState<CubeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial cubes
  useEffect(() => {
    searchCubes()
      .then(setCubes)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Handle search
  const handleSearch = useCallback(async () => {
    setSearching(true);
    setError(null);
    try {
      const results = await searchCubes(searchTerm);
      setCubes(results);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  }, [searchTerm]);

  // Handle dataset selection - redirect to chart-builder
  const handleSelectDataset = useCallback((cubeInfo: CubeInfo) => {
    router.push({
      pathname: "/chart-builder",
      query: { cube: cubeInfo.iri },
    });
  }, [router]);

  // Handle key press for search
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  }, [handleSearch]);

  return (
    <>
      <Head>
        <title>Data Catalog - Swiss Federal Data Visualization</title>
        <meta name="description" content="Browse and visualize Swiss Federal linked data" />
      </Head>

      {/* Header */}
      <Box
        sx={{
          bgcolor: colors.red[600],
          color: "white",
          py: 4,
          mb: 4,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                bgcolor: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Box
                sx={{
                  width: 30,
                  height: 20,
                  position: "relative",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 20,
                    height: 6,
                    bgcolor: colors.red[600],
                  },
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 6,
                    height: 20,
                    bgcolor: colors.red[600],
                  },
                }}
              />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={600}>
                Swiss Confederation
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Federal Data Visualization Platform
              </Typography>
            </Box>
          </Box>

          <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
            Data Catalog
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 600 }}>
            Browse Swiss Federal linked data and create interactive visualizations.
            Select a dataset to start building charts.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* Search Box */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            bgcolor: colors.monochrome[50],
            border: `1px solid ${colors.monochrome[200]}`,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Search Datasets
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              fullWidth
              placeholder="Search for datasets (e.g., agriculture, population, energy...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ bgcolor: "white" }}
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={searching}
              sx={{
                bgcolor: colors.red[600],
                "&:hover": { bgcolor: colors.red[700] },
                minWidth: 120,
              }}
            >
              {searching ? <CircularProgress size={24} color="inherit" /> : "Search"}
            </Button>
          </Box>
        </Paper>

        {/* Error Message */}
        {error && (
          <Paper
            sx={{
              p: 2,
              mb: 4,
              bgcolor: colors.red[50],
              border: `1px solid ${colors.red[200]}`,
              color: colors.red[800],
            }}
          >
            <Typography>Error: {error}</Typography>
          </Paper>
        )}

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: colors.red[600] }} />
          </Box>
        )}

        {/* Dataset Cards */}
        {!loading && (
          <>
            <Typography variant="h6" gutterBottom sx={{ color: colors.monochrome[700] }}>
              {searchTerm ? `Search Results (${cubes.length})` : `Recent Datasets (${cubes.length})`}
            </Typography>

            <Grid container spacing={3}>
              {cubes.map((cube) => (
                <Grid item xs={12} md={6} lg={4} key={cube.iri}>
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      transition: "box-shadow 0.2s, transform 0.2s",
                      "&:hover": {
                        boxShadow: 4,
                        transform: "translateY(-2px)",
                      },
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{
                          fontSize: "1rem",
                          fontWeight: 600,
                          lineHeight: 1.3,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {cube.title}
                      </Typography>

                      {cube.publisher && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          {cube.publisher}
                        </Typography>
                      )}

                      {cube.description && (
                        <Typography
                          variant="body2"
                          sx={{
                            mb: 2,
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            color: colors.monochrome[600],
                          }}
                        >
                          {cube.description}
                        </Typography>
                      )}

                      {cube.themes.length > 0 && (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                          {cube.themes.slice(0, 3).map((theme, i) => (
                            <Chip
                              key={i}
                              label={theme}
                              size="small"
                              sx={{
                                fontSize: "0.7rem",
                                height: 22,
                                bgcolor: colors.monochrome[100],
                              }}
                            />
                          ))}
                        </Box>
                      )}
                    </CardContent>

                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<BarChartIcon />}
                        onClick={() => handleSelectDataset(cube)}
                        sx={{
                          bgcolor: colors.red[600],
                          "&:hover": { bgcolor: colors.red[700] },
                        }}
                      >
                        Create Visualization
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {cubes.length === 0 && !loading && (
              <Paper
                sx={{
                  p: 4,
                  textAlign: "center",
                  bgcolor: colors.monochrome[50],
                }}
              >
                <Typography color="text.secondary">
                  No datasets found. Try a different search term.
                </Typography>
              </Paper>
            )}
          </>
        )}
      </Container>

      {/* Footer */}
      <Box
        sx={{
          mt: 8,
          py: 4,
          bgcolor: colors.monochrome[100],
          borderTop: `1px solid ${colors.monochrome[200]}`,
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            Data provided by LINDAS - Linked Data Service of the Swiss Federal Administration
          </Typography>
        </Container>
      </Box>
    </>
  );
}
