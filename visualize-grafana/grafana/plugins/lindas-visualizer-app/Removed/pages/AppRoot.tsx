/**
 * App Root - LINDAS Dataset Portal
 *
 * Main entry point for the Swiss Open Data visualization portal.
 * Handles routing between:
 * - Dataset Catalog (browse/search datasets)
 * - Visualizer (configure and view charts)
 *
 * Features:
 * - URL-based state management for deep linking
 * - Language persistence
 * - Clean navigation between views
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { AppRootProps } from '@grafana/data';
import { DatasetCatalog } from './DatasetCatalog';
import { Visualizer } from './Visualizer';
import {
  Language,
  parseStateFromUrl,
  serializeStateToUrl,
  VisualizerState,
} from '../sparql';
import { ChartType } from '../components/ChartPreview';

// ============================================================================
// Constants
// ============================================================================

const VALID_LANGUAGES: Language[] = ['de', 'fr', 'it', 'en'];
const LANGUAGE_STORAGE_KEY = 'lindas-catalog-language';

// ============================================================================
// Helpers
// ============================================================================

/**
 * Get initial state from URL and localStorage
 */
function getInitialState(): {
  language: Language;
  cubeUri: string | null;
  vizState: VisualizerState;
} {
  const urlParams = new URLSearchParams(window.location.search);
  const state = parseStateFromUrl(urlParams);

  // Language from URL, localStorage, or default
  let language: Language = 'de';
  if (state.lang && VALID_LANGUAGES.includes(state.lang)) {
    language = state.lang;
  } else {
    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored && VALID_LANGUAGES.includes(stored as Language)) {
        language = stored as Language;
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  return {
    language,
    cubeUri: state.cube || null,
    vizState: state,
  };
}

/**
 * Update URL without triggering navigation
 */
function updateUrl(state: VisualizerState): void {
  const params = serializeStateToUrl(state);
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, '', newUrl);
}

// ============================================================================
// Main Component
// ============================================================================

export const AppRoot: React.FC<AppRootProps> = () => {
  // Parse initial state from URL
  const initial = useMemo(() => getInitialState(), []);

  // State
  const [language, setLanguage] = useState<Language>(initial.language);
  const [cubeUri, setCubeUri] = useState<string | null>(initial.cubeUri);
  const [vizState, setVizState] = useState<VisualizerState>(initial.vizState);
  const [error, setError] = useState<string | null>(null);

  // Sync language to localStorage and URL
  useEffect(() => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch (e) {
      // Ignore
    }

    // Update URL with language
    const currentState = { ...vizState, lang: language };
    if (cubeUri) {
      currentState.cube = cubeUri;
    }
    updateUrl(currentState);
  }, [language, cubeUri, vizState]);

  // Handle language change
  const handleLanguageChange = useCallback((newLang: Language) => {
    setLanguage(newLang);
  }, []);

  // Handle dataset selection from catalog
  const handleSelectDataset = useCallback((uri: string, label?: string) => {
    setCubeUri(uri);
    setVizState({ cube: uri, lang: language });
    setError(null);
  }, [language]);

  // Handle back to catalog
  const handleBackToCatalog = useCallback(() => {
    setCubeUri(null);
    setVizState({ lang: language });
    updateUrl({ lang: language });
  }, [language]);

  // Handle visualizer state changes (for URL sync)
  const handleVisualizerStateChange = useCallback((state: {
    x?: string;
    y?: string;
    group?: string;
    chart?: ChartType;
  }) => {
    const newState: VisualizerState = {
      cube: cubeUri || undefined,
      lang: language,
      x: state.x,
      y: state.y,
      group: state.group,
      chart: state.chart,
    };
    setVizState(newState);
    updateUrl(newState);
  }, [cubeUri, language]);

  // Render based on state
  if (cubeUri) {
    return (
      <Visualizer
        cubeUri={cubeUri}
        initialState={{
          x: vizState.x,
          y: vizState.y,
          group: vizState.group,
          chart: vizState.chart as ChartType,
          limit: vizState.limit,
        }}
        lang={language}
        onBack={handleBackToCatalog}
        onStateChange={handleVisualizerStateChange}
      />
    );
  }

  return (
    <DatasetCatalog
      onSelectDataset={handleSelectDataset}
      language={language}
      onLanguageChange={handleLanguageChange}
      error={error}
      onClearError={() => setError(null)}
    />
  );
};

export default AppRoot;
