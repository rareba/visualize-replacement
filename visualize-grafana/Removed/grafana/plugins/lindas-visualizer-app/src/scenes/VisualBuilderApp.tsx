/**
 * Visual Builder SceneApp
 *
 * Main entry point for the Scenes-based Visual Builder.
 * Uses SceneApp for routing and SceneReactObject for React components.
 */

import React from 'react';
import {
  SceneApp,
  SceneAppPage,
  EmbeddedScene,
  SceneFlexLayout,
  SceneFlexItem,
  SceneReactObject,
} from '@grafana/scenes';

import { DatasetCatalogContent } from './DatasetCatalogScene';
import { VisualBuilderContent } from './VisualBuilderScene';
import { PLUGIN_BASE_URL } from '../constants';

// ============================================================================
// Scene Creation Functions
// ============================================================================

function createCatalogScene(): EmbeddedScene {
  return new EmbeddedScene({
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({
          minHeight: '100%',
          body: new SceneReactObject({
            component: DatasetCatalogContent,
          }),
        }),
      ],
    }),
  });
}

function createBuilderScene(cubeUri: string): EmbeddedScene {
  return new EmbeddedScene({
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({
          minHeight: '100%',
          body: new SceneReactObject({
            component: () => <VisualBuilderContent cubeUri={cubeUri} />,
          }),
        }),
      ],
    }),
  });
}

// ============================================================================
// SceneApp Definition
// ============================================================================

function getVisualBuilderApp(): SceneApp {
  return new SceneApp({
    pages: [
      new SceneAppPage({
        title: 'Swiss Open Data',
        subTitle: 'Browse and visualize datasets from LINDAS',
        url: PLUGIN_BASE_URL,
        getScene: () => createCatalogScene(),
      }),
      new SceneAppPage({
        title: 'Visual Builder',
        url: `${PLUGIN_BASE_URL}/builder/:cubeUri`,
        getScene: (routeMatch) => {
          const params = routeMatch.params as { cubeUri?: string };
          const cubeUri = params.cubeUri
            ? decodeURIComponent(params.cubeUri)
            : '';
          return createBuilderScene(cubeUri);
        },
      }),
    ],
  });
}

// ============================================================================
// App Root Component
// ============================================================================

export const VisualBuilderAppRoot: React.FC = () => {
  // Create new app instance on each render to avoid stale state
  const app = React.useMemo(() => getVisualBuilderApp(), []);

  return <app.Component model={app} />;
};

export default VisualBuilderAppRoot;
