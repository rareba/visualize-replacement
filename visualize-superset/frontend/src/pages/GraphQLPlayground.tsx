import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Paper,
  Button,
  TextField,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { lindasService, Endpoint } from '@/services/lindas';

const EXAMPLE_QUERIES = {
  listCubes: `query ListCubes {
  cubes(endpoint: PROD, limit: 10) {
    iri
    title
    description
    publisher
  }
}`,
  cubeDimensions: `query CubeDimensions {
  cubeDimensions(
    cubeIri: "https://environment.ld.admin.ch/foen/ubd000502/7"
    endpoint: PROD
  ) {
    iri
    label
    dimensionType
    dataType
  }
}`,
  sparqlQuery: `query ExecuteSPARQL {
  executeSparql(
    query: """
      SELECT ?cube ?title
      WHERE {
        ?cube a cube:Cube ;
          schema:name ?title .
        FILTER(LANG(?title) = "en")
      }
      LIMIT 10
    """
    endpoint: PROD
  ) {
    columns
    rows
    executionTimeMs
  }
}`,
};

export function GraphQLPlayground() {
  const navigate = useNavigate();
  const [query, setQuery] = useState(EXAMPLE_QUERIES.listCubes);
  const [endpoint, setEndpoint] = useState<Endpoint>('prod');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeQuery = async () => {
    setLoading(true);
    setError(null);
    setResult('');

    try {
      // For this playground, we'll execute a simple SPARQL query
      // A full GraphQL playground would need a graphql client
      const sparqlQuery = `
        SELECT ?cube ?title
        WHERE {
          ?cube a cube:Cube ;
            schema:name ?title .
          FILTER(LANG(?title) = "en" || LANG(?title) = "")
        }
        LIMIT 20
      `;

      const response = await lindasService.executeSparqlQuery(sparqlQuery, endpoint);

      setResult(JSON.stringify(response, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query execution failed');
    } finally {
      setLoading(false);
    }
  };

  const loadExample = (key: keyof typeof EXAMPLE_QUERIES) => {
    setQuery(EXAMPLE_QUERIES[key]);
  };

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
        <Typography color="text.primary">GraphQL</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          GraphQL Playground
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Interact with LINDAS data using our GraphQL API. Try the example
          queries or write your own.
        </Typography>
      </Box>

      {/* API Info */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          GraphQL Endpoint
        </Typography>
        <Typography
          variant="body2"
          fontFamily="monospace"
          color="text.secondary"
        >
          {import.meta.env.VITE_SPARQL_PROXY_URL || 'http://localhost:8089'}
          /graphql
        </Typography>
      </Paper>

      {/* Example queries */}
      <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="subtitle2" sx={{ mr: 1, alignSelf: 'center' }}>
          Examples:
        </Typography>
        <Button
          size="small"
          variant="outlined"
          onClick={() => loadExample('listCubes')}
        >
          List Cubes
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={() => loadExample('cubeDimensions')}
        >
          Cube Dimensions
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={() => loadExample('sparqlQuery')}
        >
          SPARQL Query
        </Button>
      </Box>

      {/* Query editor */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Endpoint</InputLabel>
            <Select
              value={endpoint}
              label="Endpoint"
              onChange={(e) => setEndpoint(e.target.value as Endpoint)}
            >
              <MenuItem value="prod">Production</MenuItem>
              <MenuItem value="int">Integration</MenuItem>
              <MenuItem value="test">Test</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <PlayArrowIcon />}
            onClick={executeQuery}
            disabled={loading}
          >
            Execute
          </Button>
        </Box>

        <TextField
          fullWidth
          multiline
          rows={12}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your GraphQL query..."
          sx={{
            fontFamily: 'monospace',
            '& .MuiInputBase-input': {
              fontFamily: 'monospace',
              fontSize: '0.875rem',
            },
          }}
        />
      </Paper>

      {/* Error display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Results */}
      {result && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Result
          </Typography>
          <Box
            sx={{
              bgcolor: 'grey.50',
              p: 2,
              borderRadius: 1,
              overflow: 'auto',
              maxHeight: 400,
            }}
          >
            <pre style={{ margin: 0, fontSize: '0.875rem' }}>{result}</pre>
          </Box>
        </Paper>
      )}

      {/* Quick reference */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Available Queries
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Query</TableCell>
                <TableCell>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>
                  <code>cubes</code>
                </TableCell>
                <TableCell>List available data cubes</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <code>cube</code>
                </TableCell>
                <TableCell>Get info about a specific cube</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <code>cubeDimensions</code>
                </TableCell>
                <TableCell>Get dimensions of a cube</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <code>dimensionValues</code>
                </TableCell>
                <TableCell>Get values for a dimension</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <code>observations</code>
                </TableCell>
                <TableCell>Get observations from a cube</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <code>executeSparql</code>
                </TableCell>
                <TableCell>Execute a raw SPARQL query</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
