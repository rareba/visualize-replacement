# Visualize Admin ECharts - Project Restructuring Plan

## Overview

This document outlines the plan to restructure the codebase for improved maintainability, scalability, and developer experience.

## Current State Analysis

### Problem Areas

1. **Large Barrel Files**
   - `charts/index.ts` - 4,000+ lines
   - `config-types.ts` - 1,800+ lines
   - `chart-config-ui-options.ts` - 1,800+ lines

2. **Unclear Module Boundaries**
   - Mixed concerns in single files
   - Deep coupling between modules

3. **Inconsistent Patterns**
   - Some adapters use classes, others use functions
   - Varying approaches to state management

## Target Architecture

### Directory Structure

```
app/
├── charts/
│   ├── core/                      # Core abstractions
│   │   ├── universal-chart-state.ts
│   │   ├── chart-adapter-registry.ts
│   │   └── index.ts
│   ├── registry/                  # Chart type definitions
│   │   ├── chart-types.ts
│   │   ├── chart-categories.ts
│   │   └── index.ts
│   ├── config/                    # Chart configuration
│   │   ├── defaults/              # Default factory functions
│   │   │   ├── column.ts
│   │   │   ├── bar.ts
│   │   │   └── ...
│   │   ├── adjusters/             # Field adjusters
│   │   ├── validation/            # Schema validation
│   │   ├── migrations/            # Version migrations
│   │   └── index.ts
│   ├── echarts/                   # ECharts implementation
│   │   ├── universal-adapters/    # Pure function adapters
│   │   │   ├── shared/            # Shared adapter utilities
│   │   │   │   ├── formatting.ts  # Formatting config handling
│   │   │   │   ├── axis.ts        # Axis configuration
│   │   │   │   └── index.ts
│   │   │   ├── column-adapter.ts
│   │   │   ├── bar-adapter.ts
│   │   │   └── ...
│   │   ├── components/            # ECharts React components
│   │   ├── theme.ts
│   │   ├── adapter-utils.ts
│   │   └── index.ts
│   ├── shared/                    # Shared chart utilities
│   └── index.ts                   # Minimal public API (~200 lines)
│
├── config/                        # Configuration module
│   ├── types/                     # Type definitions
│   │   ├── base.ts                # Base types
│   │   ├── filters.ts             # Filter types
│   │   ├── fields.ts              # Field types
│   │   ├── formatting.ts          # Formatting types
│   │   ├── chart-configs/         # Per-chart config types
│   │   │   ├── column.ts
│   │   │   ├── bar.ts
│   │   │   └── ...
│   │   └── index.ts
│   ├── utils/                     # Configuration utilities
│   ├── adjusters/                 # Config adjusters
│   ├── ui-options/                # UI option definitions
│   └── index.ts
│
├── configurator/                  # Chart configurator
│   ├── components/
│   │   ├── powerbi/               # PowerBI-style components
│   │   │   ├── panels/            # Panel components
│   │   │   │   ├── FormattingPanel.tsx
│   │   │   │   ├── FilterPanel.tsx
│   │   │   │   └── ...
│   │   │   ├── shared/            # Shared PowerBI components
│   │   │   ├── theme.ts           # PowerBI theme/styles
│   │   │   └── index.ts
│   │   ├── chart-controls/        # Chart control components
│   │   └── ...
│   ├── state/                     # Configurator state
│   │   ├── actions.tsx
│   │   ├── reducer.tsx
│   │   ├── context.tsx
│   │   └── index.tsx
│   └── index.ts
│
├── components/                    # Shared UI components
│   ├── ui/                        # Generic UI (Button, Dialog, etc.)
│   ├── data/                      # Data display components
│   ├── layout/                    # Layout components
│   └── index.ts
│
├── utils/                         # Utilities
│   ├── formatting/                # Number/date formatting
│   ├── hooks/                     # Custom React hooks
│   ├── color/                     # Color utilities
│   └── index.ts
│
├── stores/                        # State stores
│   ├── interactive-filters.tsx
│   └── index.ts
│
└── graphql/                       # GraphQL layer
    ├── schema/
    ├── resolvers/
    ├── hooks/
    └── index.ts
```

## Migration Strategy

### Phase 1: Create Shared Adapter Utilities
- Extract formatting config handling into `charts/echarts/universal-adapters/shared/`
- Create consistent patterns for all adapters
- **Status: Partially Complete** (formatting integration done)

### Phase 2: Split Charts Barrel File
- Create `charts/registry/` module
- Create `charts/config/` module
- Move adjusters, defaults, migrations
- Reduce `charts/index.ts` to minimal exports

### Phase 3: Organize Config Types
- Split `config-types.ts` into focused files
- Create `config/types/` directory structure
- Add re-exports for backward compatibility

### Phase 4: Clean Up Components
- Organize PowerBI components
- Create shared theme/styles
- Improve prop types

### Phase 5: Fix Technical Debt
- Fix GraphQL TypeScript errors
- Remove deprecated code
- Update documentation

## Backward Compatibility

All changes maintain backward compatibility through:
1. Re-export patterns in barrel files
2. Path aliases in tsconfig.json
3. Deprecation notices before removal

## Success Metrics

- [ ] `charts/index.ts` under 500 lines
- [ ] `config-types.ts` split into files under 500 lines each
- [ ] All adapters use shared formatting utilities
- [ ] Zero new TypeScript errors
- [ ] All existing tests pass
