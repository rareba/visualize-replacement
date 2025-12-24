/**
 * Visual Builder SceneApp
 *
 * Main entry point for the Scenes-based Visual Builder.
 * Uses SceneApp for state management and URL-based deep linking.
 *
 * Architecture:
 * - SceneApp manages overall plugin state and routing
 * - Landing page shows dataset catalog
 * - Visual Builder page with split layout (sidebar + canvas)
 */

import React from 'react';
import {
  SceneApp,
  SceneAppPage,
  EmbeddedScene,
  SceneFlexLayout,
  SceneFlexItem,
} from '@grafana/scenes';

import { DatasetCatalogScene } from './DatasetCatalogScene';
import { VisualBuilderScene } from './VisualBuilderScene';
import { PLUGIN_BASE_URL } from '../constants';

// ============================================================================
// Embedded Scene Wrappers
// ============================================================================

function createCatalogScene(): EmbeddedScene {
  return new EmbeddedScene({
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({
          body: new DatasetCatalogScene({}),
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
          body: new VisualBuilderScene({ cubeUri }),
        }),
      ],
    }),
  });
}

// ============================================================================
// Route Definitions
// ============================================================================

function getCatalogPage(): SceneAppPage {
  return new SceneAppPage({
    title: 'Swiss Open Data',
    subTitle: 'Browse and visualize datasets from LINDAS',
    url: PLUGIN_BASE_URL,
    getScene: () => createCatalogScene(),
  });
}

// ============================================================================
// Main App Scene
// ============================================================================

export function getVisualBuilderApp(): SceneApp {
  return new SceneApp({
    pages: [
      getCatalogPage(),
      new SceneAppPage({
        title: 'Visual Builder',
        url: `${PLUGIN_BASE_URL}/builder/:cubeUri`,
        getScene: (routeMatch) => {
          // Type assertion for route params
          const params = routeMatch.params as { cubeUri?: string };
          const cubeUri = params.cubeUri
            ? decodeURIComponent(params.cubeUri)
            : '';
          return createBuilderScene(cubeUri);
        },
        getParentPage: () => getCatalogPage(),
      }),
    ],
  });
}

// ============================================================================
// App Root Component
// ============================================================================

let appInstance: SceneApp | null = null;

function getApp(): SceneApp {
  if (!appInstance) {
    appInstance = getVisualBuilderApp();
  }
  return appInstance;
}

export const VisualBuilderAppRoot: React.FC = () => {
  const app = getApp();

  return <app.Component model={app} />;
};

export default VisualBuilderAppRoot;
