/**
 * Scenes-based Visualizer for LINDAS Data
 *
 * Uses Grafana Scenes SDK to render native Grafana visualizations
 * instead of custom D3.js/SVG charts.
 *
 * Key benefits:
 * - All Grafana panel types available (timeseries, barchart, piechart, table, etc.)
 * - Native theming and responsiveness
 * - Panel options UI for end users
 * - Export and sharing capabilities
 */

import {
  SceneObjectBase,
  SceneObjectState,
  SceneFlexLayout,
  SceneFlexItem,
  VizPanel,
  SceneDataState,
  SceneDataProvider,
} from '@grafana/scenes';
import {
  DataFrame,
  LoadingState,
  dateTime,
} from '@grafana/data';
import { Observable, ReplaySubject } from 'rxjs';

// ============================================================================
// Custom Data Provider for SPARQL Results
// ============================================================================

interface SparqlDataProviderState extends SceneObjectState, SceneDataState {}

/**
 * A custom Scene object that provides DataFrame data from SPARQL queries.
 * This allows us to feed SPARQL results into Grafana's native VizPanels.
 */
export class SparqlDataProvider
  extends SceneObjectBase<SparqlDataProviderState>
  implements SceneDataProvider<SparqlDataProviderState>
{
  static Component = () => null;

  private resultsSubject = new ReplaySubject<SceneDataState>(1);

  constructor(state?: Partial<SparqlDataProviderState>) {
    const now = dateTime();
    const yearAgo = dateTime().subtract(1, 'year');

    super({
      data: {
        state: LoadingState.NotStarted,
        series: [],
        timeRange: {
          from: yearAgo,
          to: now,
          raw: { from: 'now-1y', to: 'now' },
        },
      },
      ...state,
    });

    // Emit initial state
    this.resultsSubject.next(this.state.data!);
  }

  /**
   * Required by SceneDataProvider interface
   */
  getResultsStream(): Observable<SceneDataState> {
    return this.resultsSubject.asObservable();
  }

  /**
   * Update the data in this provider
   */
  setData(frames: DataFrame[], loading = false) {
    const now = dateTime();
    const yearAgo = dateTime().subtract(1, 'year');

    const newData: SceneDataState = {
      state: loading ? LoadingState.Loading : LoadingState.Done,
      series: frames,
      timeRange: {
        from: yearAgo,
        to: now,
        raw: { from: 'now-1y', to: 'now' },
      },
    };

    this.setState({ data: newData });
    this.resultsSubject.next(newData);
  }

  /**
   * Set loading state
   */
  setLoading() {
    const now = dateTime();
    const yearAgo = dateTime().subtract(1, 'year');

    const newData: SceneDataState = {
      state: LoadingState.Loading,
      series: this.state.data?.series || [],
      timeRange: {
        from: yearAgo,
        to: now,
        raw: { from: 'now-1y', to: 'now' },
      },
    };

    this.setState({ data: newData });
    this.resultsSubject.next(newData);
  }

  /**
   * Set error state
   */
  setError(error: Error) {
    const now = dateTime();
    const yearAgo = dateTime().subtract(1, 'year');

    const newData: SceneDataState = {
      state: LoadingState.Error,
      series: [],
      timeRange: {
        from: yearAgo,
        to: now,
        raw: { from: 'now-1y', to: 'now' },
      },
      error: {
        message: error.message,
      },
    };

    this.setState({ data: newData });
    this.resultsSubject.next(newData);
  }
}

// ============================================================================
// Chart Type Configurations
// ============================================================================

export type ChartType = 'bar' | 'line' | 'pie' | 'table' | 'stat' | 'gauge';

interface ChartTypeConfig {
  panelType: string;
  title: string;
  icon: string;
  options: Record<string, any>;
  fieldConfig: {
    defaults: Record<string, any>;
    overrides: any[];
  };
}

export const CHART_TYPE_CONFIGS: Record<ChartType, ChartTypeConfig> = {
  bar: {
    panelType: 'barchart',
    title: 'Bar Chart',
    icon: 'graph-bar',
    options: {
      orientation: 'horizontal',
      showValue: 'always',
      stacking: 'none',
      barWidth: 0.8,
      groupWidth: 0.7,
    },
    fieldConfig: {
      defaults: {
        color: { mode: 'palette-classic' },
      },
      overrides: [],
    },
  },
  line: {
    panelType: 'timeseries',
    title: 'Line Chart',
    icon: 'gf-interpolation-linear',
    options: {
      legend: { displayMode: 'list', placement: 'bottom' },
    },
    fieldConfig: {
      defaults: {
        custom: {
          drawStyle: 'line',
          lineInterpolation: 'smooth',
          fillOpacity: 10,
          pointSize: 5,
        },
      },
      overrides: [],
    },
  },
  pie: {
    panelType: 'piechart',
    title: 'Pie Chart',
    icon: 'grafana',
    options: {
      pieType: 'pie',
      legend: { displayMode: 'table', placement: 'right' },
      tooltip: { mode: 'single' },
    },
    fieldConfig: {
      defaults: {},
      overrides: [],
    },
  },
  table: {
    panelType: 'table',
    title: 'Table',
    icon: 'table',
    options: {
      showHeader: true,
      sortBy: [],
    },
    fieldConfig: {
      defaults: {
        custom: {
          align: 'auto',
          inspect: false,
        },
      },
      overrides: [],
    },
  },
  stat: {
    panelType: 'stat',
    title: 'Stat',
    icon: 'calculator-alt',
    options: {
      reduceOptions: {
        calcs: ['lastNotNull'],
      },
      colorMode: 'value',
      graphMode: 'area',
    },
    fieldConfig: {
      defaults: {},
      overrides: [],
    },
  },
  gauge: {
    panelType: 'gauge',
    title: 'Gauge',
    icon: 'dashboard',
    options: {
      reduceOptions: {
        calcs: ['lastNotNull'],
      },
      showThresholdLabels: false,
      showThresholdMarkers: true,
    },
    fieldConfig: {
      defaults: {},
      overrides: [],
    },
  },
};

// ============================================================================
// Scene Builder
// ============================================================================

/**
 * Create a VizPanel with the specified chart type
 */
export function createVizPanel(
  chartType: ChartType,
  title: string,
  dataProvider: SparqlDataProvider
): VizPanel {
  const config = CHART_TYPE_CONFIGS[chartType];

  return new VizPanel({
    title,
    pluginId: config.panelType,
    options: config.options,
    fieldConfig: config.fieldConfig,
    $data: dataProvider,
  });
}

/**
 * Create a scene layout with the visualization
 */
export function createVisualizerScene(
  chartType: ChartType,
  title: string,
  dataProvider: SparqlDataProvider
): SceneFlexLayout {
  const vizPanel = createVizPanel(chartType, title, dataProvider);

  return new SceneFlexLayout({
    direction: 'column',
    children: [
      new SceneFlexItem({
        minHeight: 400,
        body: vizPanel,
      }),
    ],
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get all available chart types
 */
export function getAvailableChartTypes(): Array<{
  value: ChartType;
  label: string;
  icon: string;
}> {
  return Object.entries(CHART_TYPE_CONFIGS).map(([value, config]) => ({
    value: value as ChartType,
    label: config.title,
    icon: config.icon,
  }));
}

/**
 * Determine the best chart type based on data characteristics
 */
export function suggestChartType(
  hasTimeField: boolean,
  hasNumericField: boolean,
  uniqueCategories: number
): ChartType {
  if (hasTimeField && hasNumericField) {
    return 'line';
  }

  if (uniqueCategories <= 10) {
    return 'pie';
  }

  if (uniqueCategories <= 30) {
    return 'bar';
  }

  return 'table';
}
