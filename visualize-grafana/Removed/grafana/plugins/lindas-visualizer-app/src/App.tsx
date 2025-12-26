/**
 * LINDAS Visual Builder App
 *
 * Simple React-based app plugin without SceneApp complexity.
 * Handles routing via URL hash and React state.
 */

import React, { useState, useEffect } from 'react';
import { DatasetCatalogContent } from './scenes/DatasetCatalogScene';
import { VisualBuilderContent } from './scenes/VisualBuilderScene';

type View = 'catalog' | 'builder';

interface AppState {
  view: View;
  cubeUri: string | null;
}

function parseHash(): AppState {
  const hash = window.location.hash;
  if (hash.startsWith('#/builder/')) {
    const cubeUri = decodeURIComponent(hash.slice(10));
    return { view: 'builder', cubeUri };
  }
  return { view: 'catalog', cubeUri: null };
}

export const App: React.FC = () => {
  const [state, setState] = useState<AppState>(parseHash);

  useEffect(() => {
    const handleHashChange = () => {
      setState(parseHash());
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (state.view === 'builder' && state.cubeUri) {
    return <VisualBuilderContent cubeUri={state.cubeUri} />;
  }

  return <DatasetCatalogContent />;
};

export default App;
