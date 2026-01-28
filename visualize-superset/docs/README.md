# Visualize Superset Documentation

This documentation covers the visualize-superset project, which provides a custom React frontend for embedding Apache Superset charts and dashboards, connected to LINDAS SPARQL endpoints via a SQL-to-SPARQL proxy middleware.

## Table of Contents

1. [Architecture Overview](./architecture.md)
2. [Getting Started](./getting-started.md)
3. [SPARQL Proxy API](./sparql-proxy-api.md)
4. [GraphQL API](./graphql-api.md)
5. [Frontend Components](./frontend-components.md)
6. [Superset Configuration](./superset-configuration.md)
7. [Development Log](./development-log.md)

## Quick Start

```bash
# Clone and setup
cd visualize-superset

# Copy environment file and configure
cp .env.example .env
# Edit .env with your settings

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Superset: http://localhost:8088
# SPARQL Proxy: http://localhost:8089
# GraphQL: http://localhost:8089/graphql
```

## Project Purpose

This project was created to:

1. Provide a user-friendly interface for exploring Swiss Linked Data (LINDAS)
2. Leverage Apache Superset's powerful visualization capabilities
3. Bridge the gap between SQL-based tools and SPARQL endpoints
4. Enable embedding of Superset charts in custom applications

## Key Features

- **Data Cube Browser**: Browse and search LINDAS data cubes
- **Superset Embedding**: Embed Superset dashboards and charts
- **SQL-to-SPARQL Translation**: Write SQL queries that get translated to SPARQL
- **GraphQL API**: Modern GraphQL interface for LINDAS data
- **Multi-endpoint Support**: Connect to production, integration, or test endpoints
