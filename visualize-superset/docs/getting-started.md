# Getting Started

This guide will help you set up and run the visualize-superset project.

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

## Quick Start with Docker

### 1. Clone and Navigate

```bash
cd visualize-superset
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and set a secure secret key:

```env
SUPERSET_SECRET_KEY=your-secure-random-string-at-least-42-chars
```

### 3. Start All Services

```bash
docker-compose up -d
```

This will start:
- PostgreSQL (Superset database)
- Redis (caching)
- SPARQL Proxy (http://localhost:8089)
- Superset (http://localhost:8088)
- Frontend (http://localhost:3000)

### 4. Initialize Superset

The first time you run, wait for services to start, then run:

```bash
./scripts/init-superset.sh
```

Or on Windows:
```batch
scripts\setup.bat
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Superset**: http://localhost:8088 (admin/admin)
- **SPARQL Proxy API**: http://localhost:8089
- **GraphQL Playground**: http://localhost:8089/graphql

## Local Development

### SPARQL Proxy

```bash
cd sparql-proxy

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn src.main:app --reload --port 8089
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

### Superset (Docker)

For Superset, it's recommended to use Docker:

```bash
docker-compose up -d postgres redis superset superset-worker
```

## Verification Steps

### 1. Check SPARQL Proxy Health

```bash
curl http://localhost:8089/api/v1/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "endpoints": {
    "prod": "https://lindas-cached.cluster.ldbar.ch/query",
    "int": "https://lindas-cached.int.cluster.ldbar.ch/query",
    "test": "https://lindas-cached.test.cluster.ldbar.ch/query"
  }
}
```

### 2. List Data Cubes

```bash
curl "http://localhost:8089/api/v1/cubes?limit=5"
```

### 3. Test GraphQL

```bash
curl -X POST http://localhost:8089/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ cubes(limit: 5, endpoint: PROD) { iri title } }"}'
```

### 4. Access Superset

Open http://localhost:8088 and log in with:
- Username: `admin`
- Password: `admin`

### 5. Test Frontend

Open http://localhost:3000 and verify:
- Home page loads
- Data Cubes page shows cubes from LINDAS
- GraphQL playground works

## Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SUPERSET_SECRET_KEY` | Secret key for Superset | Required |
| `POSTGRES_PASSWORD` | PostgreSQL password | `superset` |
| `ADMIN_USERNAME` | Superset admin username | `admin` |
| `ADMIN_PASSWORD` | Superset admin password | `admin` |
| `SUPERSET_PORT` | Superset port | `8088` |
| `SPARQL_PROXY_PORT` | SPARQL Proxy port | `8089` |
| `FRONTEND_PORT` | Frontend port | `3000` |

### Changing LINDAS Endpoint

By default, the application uses the production LINDAS endpoint. To change this:

1. In the frontend, use the endpoint selector in the UI
2. In API calls, specify the `endpoint` parameter

## Troubleshooting

### Services Not Starting

```bash
docker-compose logs -f
```

### Superset Initialization Failed

```bash
docker-compose exec superset superset init
```

### SPARQL Proxy Connection Issues

Check if LINDAS endpoints are accessible:

```bash
curl "https://lindas-cached.cluster.ldbar.ch/query" \
  -d "query=SELECT ?s WHERE { ?s a ?o } LIMIT 1"
```

### Port Conflicts

If ports are in use, modify them in `.env`:

```env
SUPERSET_PORT=8088
SPARQL_PROXY_PORT=8089
FRONTEND_PORT=3000
```
