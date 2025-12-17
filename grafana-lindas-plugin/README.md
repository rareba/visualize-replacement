# Grafana LINDAS Plugin

A Grafana datasource plugin for browsing and visualizing Swiss government datasets from LINDAS (Linked Data Services).

## Features

- **Dataset Browser**: Browse all available datasets from LINDAS without writing SPARQL
- **Automatic Dimension Discovery**: Select data fields from a visual interface
- **Query Generation**: Automatically generates SPARQL queries based on your selections
- **Manual SPARQL Mode**: Full control with the SPARQL editor for advanced users
- **Multi-language Support**: Labels in English, German, French, and Italian

## How It Works

This plugin provides a user experience similar to [visualize.admin.ch](https://visualize.admin.ch):

1. **Select a Dataset**: Browse or search through available LINDAS datasets (RDF Data Cubes)
2. **Choose Dimensions**: Pick which dimensions and measures to include in your visualization
3. **Visualize**: The plugin generates SPARQL queries and displays results in any Grafana panel

## Quick Start with Docker

### Prerequisites
- Docker and Docker Compose installed

### Run the POC

```bash
# Navigate to the plugin directory
cd grafana-lindas-plugin

# Build the plugin (requires Node.js 18+)
npm install
npm run build

# Start Grafana with the plugin
docker-compose up -d

# Access Grafana at http://localhost:3001
# Login: admin / admin
```

### Using the Plugin

1. Open Grafana at http://localhost:3001
2. Go to **Explore** or create a new **Dashboard**
3. Select the **LINDAS** datasource
4. Use the **Dataset Browser** tab to:
   - Search for datasets
   - Select a dataset
   - Choose dimensions and measures
5. Click **Run Query** to see the data

## Development

### Build the Plugin

```bash
npm install
npm run dev    # Development mode with watch
npm run build  # Production build
```

### Run Tests

```bash
npm test
```

## Architecture

```
+------------------+     +----------------+     +------------------+
|   Grafana UI     | --> | LINDAS Plugin  | --> | SPARQL Proxy     |
| (Dashboard/Panel)|     | (Query Editor) |     | (CORS handling)  |
+------------------+     +----------------+     +------------------+
                                                        |
                                                        v
                                               +------------------+
                                               | LINDAS SPARQL    |
                                               | Endpoint         |
                                               | lindas.admin.ch  |
                                               +------------------+
```

### Key Components

- **CubeSelector**: Browses and searches LINDAS datasets
- **DimensionSelector**: Displays available dimensions/measures for a dataset
- **QueryEditor**: Combines browser + manual SPARQL editing
- **sparql-queries.ts**: SPARQL query templates based on visualize.admin.ch patterns

## Comparison with visualize.admin.ch

| Feature | visualize.admin.ch | This Plugin |
|---------|-------------------|-------------|
| Dataset Browser | Yes | Yes |
| Dimension Selection | Yes | Yes |
| Chart Types | 8 types | All Grafana types |
| Embedding | Yes | Yes (Grafana) |
| Dashboards | Limited | Full Grafana dashboards |
| Alerting | No | Yes (Grafana) |
| Multiple Data Sources | No | Yes |
| Custom SPARQL | No | Yes |

## SPARQL Queries

The plugin uses SPARQL queries based on the patterns from visualize.admin.ch:

- `LIST_CUBES_QUERY`: Discover all available datasets
- `SEARCH_CUBES_QUERY`: Search datasets by keyword
- `GET_CUBE_DIMENSIONS_QUERY`: Get dimensions for a dataset
- `GENERATE_OBSERVATIONS_QUERY`: Build data queries

## Configuration

### Datasource Settings

- **SPARQL Endpoint**: Select LINDAS production, integration, or custom endpoint
- **Default Language**: Preferred language for labels (en, de, fr, it)

### Environment Variables

For the SPARQL proxy:
- `DEFAULT_SPARQL_ENDPOINT`: Default LINDAS endpoint (default: https://lindas.admin.ch/query)
- `PORT`: Proxy server port (default: 3002)

## Credits

- Based on [Flanders Make SPARQL Plugin](https://github.com/Flanders-Make-vzw/grafana-sparql-datasource)
- Query patterns from [visualize.admin.ch](https://github.com/visualize-admin/visualization-tool)
- Data from [LINDAS](https://lindas.admin.ch)

## License

Apache-2.0
