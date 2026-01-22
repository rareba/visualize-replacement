# Angular/Oblique Migration Documentation

## Overview

This document describes the migration of the visualize-superset React application to an Angular application using the Swiss Federal Admin Oblique framework.

## Technology Stack

### Source Application (React)
- React 18.2.0
- Vite 5.1.3
- Material-UI (MUI) 5.15.10
- React Query (TanStack Query) 5.20.5
- React Router 6.22.1
- TypeScript 5.3.3

### Target Application (Angular)
- Angular 20.3.x
- Oblique 14.2.x (Swiss Federal Admin Framework)
- Angular Material 20.x
- @ngx-translate for internationalization
- RxJS for reactive programming
- TypeScript 5.x

## Project Structure

```
visualize-oblique/
├── src/
│   ├── app/
│   │   ├── pages/
│   │   │   ├── home/           # Home page component
│   │   │   ├── cubes/          # Data cubes listing
│   │   │   ├── cube-detail/    # Cube details view
│   │   │   └── graphql-playground/  # GraphQL query interface
│   │   ├── services/
│   │   │   └── lindas.service.ts    # LINDAS API integration
│   │   ├── app.ts              # Root component with Oblique master layout
│   │   ├── app.html            # Master layout template
│   │   ├── app.config.ts       # Application configuration
│   │   └── app.routes.ts       # Route definitions
│   ├── assets/
│   │   └── i18n/               # Translation files (en, de-CH, fr-CH, it-CH)
│   ├── environments/           # Environment configurations
│   └── styles.scss             # Global styles
├── angular.json                # Angular CLI configuration
├── package.json                # Dependencies
└── tsconfig.json               # TypeScript configuration
```

## Key Migrations

### 1. React Hooks to Angular Signals

React useState and useEffect hooks were migrated to Angular signals:

```typescript
// React
const [cubes, setCubes] = useState<CubeInfo[]>([]);
const [loading, setLoading] = useState(false);

// Angular
cubes = signal<CubeInfo[]>([]);
loading = signal(false);
```

### 2. React Query to RxJS

Data fetching was migrated from React Query to Angular's HttpClient with RxJS:

```typescript
// React
const { data, isLoading } = useQuery(['cubes'], () => listCubes());

// Angular
loadCubes(): void {
  this.loading.set(true);
  this.lindasService.listCubes().subscribe({
    next: (response) => {
      this.cubes.set(response.cubes);
      this.loading.set(false);
    }
  });
}
```

### 3. Material-UI to Angular Material + Oblique

UI components were migrated from Material-UI to Angular Material with Oblique styling:

- MUI `<Card>` to Angular `<mat-card>`
- MUI `<TextField>` to Angular `<mat-form-field>` with `<input matInput>`
- MUI `<Select>` to Angular `<mat-select>`
- MUI Navigation to Oblique's `<ob-master-layout>` with `<ob-nav-tree>`

### 4. React Router to Angular Router

```typescript
// React
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/cubes" element={<CubesPage />} />
</Routes>

// Angular
export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'cubes', loadComponent: () => import('./pages/cubes/cubes.component').then(m => m.CubesComponent) }
];
```

## Features

1. **Home Page** - Overview of LINDAS Visualizer features
2. **Data Cubes Browser** - Search and browse LINDAS data cubes with endpoint selection
3. **Cube Detail View** - View cube schema, dimensions, and example SPARQL queries
4. **GraphQL Playground** - Interactive GraphQL query interface

## Internationalization

The application supports four languages:
- English (en)
- German (de-CH)
- French (fr-CH)
- Italian (it-CH)

Translations are stored in `/src/assets/i18n/` as JSON files.

## Configuration

### Development

```bash
npm start
# Runs at http://localhost:4200
```

### Build

```bash
npm run build
# Output in dist/visualize-oblique
```

### Test

```bash
npm test
# Runs Karma tests
```

## Dependencies on Backend

The application requires the SPARQL proxy backend to be running:
- Default: `http://localhost:8089`
- Configure in `src/environments/environment.ts`

## Oblique Framework Integration

The application uses the following Oblique features:
- Master Layout (`ObMasterLayoutModule`)
- Navigation Tree (`ObNavTreeComponent`)
- Translations integration with ngx-translate
- Swiss Federal corporate design styling

## Known Limitations

1. Bundle size is larger than typical Angular applications due to Oblique framework
2. Some Material Design icon errors in tests (cosmetic, tests pass)
3. Requires Angular 20+ for Oblique 14 compatibility
