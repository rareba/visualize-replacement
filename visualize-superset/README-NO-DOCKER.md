# No-Docker Setup Guide

This guide explains how to run the visualize-superset project without Docker, using native tools on your system.

## Prerequisites

### For Frontend (React + Vite)
- Node.js 18 or higher
- npm (comes with Node.js)

### For SPARQL Proxy (Python + FastAPI)
- Python 3.10 or higher
- pip (comes with Python)

## Quick Start

### Windows - One-Click Startup

Just double-click or run:
```cmd
scripts\start-dev.bat
```

This will automatically:
- Start SPARQL Proxy on port 8089
- Start Frontend on port 5173
- Open both services in separate terminal windows

To stop all services:
```cmd
scripts\stop-dev.bat
```

### macOS/Linux - One-Click Startup

First, make scripts executable (only needed once):
```bash
chmod +x scripts/*.sh
```

Then start everything with one command:
```bash
scripts/start-dev.sh
```

This will automatically:
- Start SPARQL Proxy on port 8089
- Start Frontend on port 5173
- Run both services in the background

To stop all services:
```bash
scripts/stop-dev.sh
```

### Windows - Manual (if you prefer separate terminals)

1. **Start SPARQL Proxy** (in a new terminal):
   ```cmd
   scripts\start-sparql-proxy.bat
   ```
   The proxy will start at `http://localhost:8089`

2. **Start Frontend** (in another new terminal):
   ```cmd
   scripts\start-frontend.bat
   ```
   The frontend will start at `http://localhost:5173`

### macOS/Linux - Manual (if you prefer separate terminals)

1. **Make scripts executable** (first time only):
   ```bash
   chmod +x scripts/*.sh
   ```

2. **Start SPARQL Proxy** (in a new terminal):
   ```bash
   scripts/start-sparql-proxy.sh
   ```
   The proxy will start at `http://localhost:8089`

3. **Start Frontend** (in another new terminal):
   ```bash
   scripts/start-frontend.sh
   ```
   The frontend will start at `http://localhost:5173`

## Manual Setup (Alternative)

If you prefer to run things manually without the starter scripts:

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Create a `.env` file (copy from example):
   ```bash
   cp .env.example .env
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### SPARQL Proxy

1. Navigate to the sparql-proxy directory:
   ```bash
   cd sparql-proxy
   ```

2. Create a virtual environment:
   ```bash
   python3 -m venv venv
   ```

3. Activate the virtual environment:

   **Windows:**
   ```cmd
   venv\Scripts\activate.bat
   ```

   **Unix/Linux/Mac:**
   ```bash
   source venv/bin/activate
   ```

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Start the server:
   ```bash
   cd src
   python main.py
   ```

## Environment Variables

The frontend needs a `.env` file in the `frontend/` directory. Here's a minimal configuration:

```env
VITE_SPARQL_PROXY_URL=http://localhost:8089
```

If you're using the SPARQL Proxy with LINDAS, the proxy will automatically use the default endpoints:
- Production: https://lindas-cached.cluster.ldbar.ch/query
- Integration: https://lindas-cached.int.cluster.ldbar.ch/query
- Test: https://lindas-cached.test.cluster.ldbar.ch/query

## Services and Ports

| Service | Port | Purpose |
|---------|------|---------|
| Frontend | 5173 | React development server |
| SPARQL Proxy | 8089 | SPARQL query proxy and GraphQL API |

## What's Not Included in No-Docker Mode

The following services are **NOT** available without Docker:
- Apache Superset (visualization engine)
- PostgreSQL (database)
- Redis (cache)

The no-Docker setup uses a custom React frontend with ECharts for visualization instead of Superset.

## Features

### New Chart Types
The chart builder now includes the following visualization types:

1. **Bar Chart** - Traditional bar chart for comparing values
2. **Line Chart** - Line chart for trends over time
3. **Area Chart** - Filled area chart for volume/trend visualization
4. **Pie Chart** - Pie chart for showing proportions
5. **Scatter Plot** - Scatter plot for showing relationships
6. **Radar Chart** - Radar/spider chart for multi-dimensional data
7. **Funnel Chart** - Funnel chart for showing conversion/stages
8. **Gauge Chart** - Gauge/KPI chart for single metric display
9. **Heatmap** - Heatmap for showing density/intensity
10. **Treemap** - Treemap for hierarchical data
11. **Box Plot** - Box plot for statistical distribution
12. **Table** - Data table view

### PowerBI-like Interface

- **Drag and Drop**: Drag dimensions and measures directly onto field wells
- **Field Wells**: Visual drop zones for X-Axis, Y-Axis, Color By, and Filters
- **Filter Panel**: Create and manage multiple filters with various operators
- **Real-time Preview**: Chart updates automatically when configuration changes
- **Responsive Layout**: Three-column layout optimized for building visualizations

## Troubleshooting

### Frontend Issues

**Problem: `npm install` fails**
- Make sure you have Node.js 18+ installed
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`, then run `npm install` again

**Problem: Cannot access the frontend**
- Check if port 5173 is already in use
- Make sure your firewall allows connections to localhost

**Problem: TypeScript errors after `npm install`**
- The @dnd-kit dependencies require `npm install` to complete first
- Run `npm install` to install all required dependencies

### SPARQL Proxy Issues

**Problem: `python -m venv` fails**
- Make sure you have Python 3.10+ installed
- On Windows, you may need to enable virtual environment support

**Problem: Cannot access the proxy**
- Check if port 8089 is already in use
- Make sure the virtual environment is activated
- Check Python error messages for missing dependencies

### General Issues

**Problem: Frontend can't connect to SPARQL Proxy**
- Make sure the SPARQL Proxy is running on port 8089
- Check that the `.env` file has the correct `VITE_SPARQL_PROXY_URL`
- Check the browser console for CORS errors

**Problem: Scripts won't run on macOS**
- Run `chmod +x scripts/*.sh` to make scripts executable
- Ensure you're running from the project root directory

**Problem: Scripts won't run on Windows**
- Make sure you're running `cmd.exe`, not PowerShell (or use the appropriate syntax)
- Ensure Python is in your PATH
- Check that the scripts are in the correct directory

## Development Tips

1. **Hot Reload**: Both the frontend and SPARQL Proxy support hot reload during development.

2. **Code Style**: The project uses TypeScript and ESLint. You can run `npm run lint` to check for issues.

3. **Building for Production**: When ready to deploy, run `npm run build` in the frontend directory.

4. **Viewing Logs**: When using `start-dev.sh`, you can view logs with:
   - `tail -f sparql-proxy-proxy.log` for SPARQL Proxy
   - `tail -f frontend-dev.log` for Frontend

## Next Steps

1. Open your browser to `http://localhost:5173`
2. Browse the available data cubes
3. Select a cube and create visualizations using the Chart Builder
4. Drag and drop dimensions to the X-Axis and measures to the Y-Axis
5. Use filters to narrow down data
6. Experiment with different chart types

## Support

If you encounter issues not covered here, please:
1. Check the main README.md for more details
2. Check the documentation in the `docs/` directory
3. Review error messages carefully
4. Ensure all prerequisites are met
5. Check that ports 5173 and 8089 are not already in use
