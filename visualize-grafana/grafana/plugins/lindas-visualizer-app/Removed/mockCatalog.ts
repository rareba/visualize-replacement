/**
 * Mock Catalog Service for Development
 *
 * Provides dummy cube data for development and testing when
 * a live SPARQL endpoint is not available.
 */

import type {
  CubeMetadata,
  CubeFullMetadata,
  CubeDimension,
  CubeMeasure,
  DimensionValue,
} from '../types';

/**
 * Mock cubes representing realistic LINDAS data
 */
const MOCK_CUBES: CubeFullMetadata[] = [
  {
    uri: 'https://environment.ld.admin.ch/foen/cube/air-quality-2023',
    label: 'Air Quality Measurements Switzerland 2023',
    description: 'Hourly air quality measurements from monitoring stations across Switzerland, including PM2.5, PM10, NO2, and O3 concentrations.',
    publisher: 'Federal Office for the Environment FOEN',
    dateModified: '2024-01-15',
    dimensions: [
      {
        uri: 'https://environment.ld.admin.ch/foen/dimension/measurementDate',
        label: 'Measurement Date',
        range: 'xsd:dateTime',
        scaleType: 'temporal',
        isTemporal: true,
        isNumerical: false,
        order: 1,
      },
      {
        uri: 'https://environment.ld.admin.ch/foen/dimension/station',
        label: 'Monitoring Station',
        range: 'xsd:string',
        scaleType: 'nominal',
        isTemporal: false,
        isNumerical: false,
        order: 2,
      },
      {
        uri: 'https://environment.ld.admin.ch/foen/dimension/canton',
        label: 'Canton',
        range: 'xsd:string',
        scaleType: 'nominal',
        isTemporal: false,
        isNumerical: false,
        order: 3,
      },
      {
        uri: 'https://environment.ld.admin.ch/foen/dimension/pollutant',
        label: 'Pollutant Type',
        range: 'xsd:string',
        scaleType: 'nominal',
        isTemporal: false,
        isNumerical: false,
        order: 4,
      },
    ],
    measures: [
      {
        uri: 'https://environment.ld.admin.ch/foen/measure/concentration',
        label: 'Concentration',
        unit: 'ug/m3',
        dataType: 'xsd:decimal',
      },
      {
        uri: 'https://environment.ld.admin.ch/foen/measure/aqi',
        label: 'Air Quality Index',
        unit: 'index',
        dataType: 'xsd:integer',
      },
    ],
  },
  {
    uri: 'https://agriculture.ld.admin.ch/foag/cube/MilkProduction_Canton_Year',
    label: 'Milk Production by Canton',
    description: 'Annual milk production statistics by canton in Switzerland, including organic and conventional production volumes.',
    publisher: 'Federal Office for Agriculture FOAG',
    dateModified: '2024-02-20',
    dimensions: [
      {
        uri: 'https://agriculture.ld.admin.ch/foag/dimension/year',
        label: 'Year',
        range: 'xsd:gYear',
        scaleType: 'temporal',
        isTemporal: true,
        isNumerical: false,
        order: 1,
      },
      {
        uri: 'https://agriculture.ld.admin.ch/foag/dimension/canton',
        label: 'Canton',
        range: 'xsd:string',
        scaleType: 'nominal',
        isTemporal: false,
        isNumerical: false,
        order: 2,
      },
      {
        uri: 'https://agriculture.ld.admin.ch/foag/dimension/productionType',
        label: 'Production Type',
        range: 'xsd:string',
        scaleType: 'nominal',
        isTemporal: false,
        isNumerical: false,
        order: 3,
      },
    ],
    measures: [
      {
        uri: 'https://agriculture.ld.admin.ch/foag/measure/volume',
        label: 'Production Volume',
        unit: 'kg',
        dataType: 'xsd:decimal',
      },
      {
        uri: 'https://agriculture.ld.admin.ch/foag/measure/numberOfFarms',
        label: 'Number of Farms',
        unit: 'count',
        dataType: 'xsd:integer',
      },
      {
        uri: 'https://agriculture.ld.admin.ch/foag/measure/averagePrice',
        label: 'Average Price',
        unit: 'CHF/kg',
        dataType: 'xsd:decimal',
      },
    ],
  },
];

/**
 * Mock dimension values for filters
 */
const MOCK_DIMENSION_VALUES: Record<string, DimensionValue[]> = {
  'https://environment.ld.admin.ch/foen/dimension/canton': [
    { value: 'https://ld.admin.ch/canton/ZH', label: 'Zurich' },
    { value: 'https://ld.admin.ch/canton/BE', label: 'Bern' },
    { value: 'https://ld.admin.ch/canton/GE', label: 'Geneva' },
    { value: 'https://ld.admin.ch/canton/VD', label: 'Vaud' },
    { value: 'https://ld.admin.ch/canton/BS', label: 'Basel-Stadt' },
    { value: 'https://ld.admin.ch/canton/AG', label: 'Aargau' },
  ],
  'https://environment.ld.admin.ch/foen/dimension/station': [
    { value: 'https://environment.ld.admin.ch/station/ZH-Kaserne', label: 'Zurich Kaserne' },
    { value: 'https://environment.ld.admin.ch/station/BE-Bollwerk', label: 'Bern Bollwerk' },
    { value: 'https://environment.ld.admin.ch/station/GE-Wilson', label: 'Geneva Wilson' },
    { value: 'https://environment.ld.admin.ch/station/BS-Feldberg', label: 'Basel Feldberg' },
  ],
  'https://environment.ld.admin.ch/foen/dimension/pollutant': [
    { value: 'https://environment.ld.admin.ch/pollutant/PM25', label: 'PM2.5' },
    { value: 'https://environment.ld.admin.ch/pollutant/PM10', label: 'PM10' },
    { value: 'https://environment.ld.admin.ch/pollutant/NO2', label: 'NO2' },
    { value: 'https://environment.ld.admin.ch/pollutant/O3', label: 'O3' },
  ],
  'https://agriculture.ld.admin.ch/foag/dimension/canton': [
    { value: 'https://ld.admin.ch/canton/ZH', label: 'Zurich' },
    { value: 'https://ld.admin.ch/canton/BE', label: 'Bern' },
    { value: 'https://ld.admin.ch/canton/LU', label: 'Lucerne' },
    { value: 'https://ld.admin.ch/canton/SG', label: 'St. Gallen' },
    { value: 'https://ld.admin.ch/canton/FR', label: 'Fribourg' },
    { value: 'https://ld.admin.ch/canton/TG', label: 'Thurgau' },
  ],
  'https://agriculture.ld.admin.ch/foag/dimension/productionType': [
    { value: 'https://agriculture.ld.admin.ch/type/conventional', label: 'Conventional' },
    { value: 'https://agriculture.ld.admin.ch/type/organic', label: 'Organic' },
    { value: 'https://agriculture.ld.admin.ch/type/alpine', label: 'Alpine' },
  ],
  'https://agriculture.ld.admin.ch/foag/dimension/year': [
    { value: '2023', label: '2023' },
    { value: '2022', label: '2022' },
    { value: '2021', label: '2021' },
    { value: '2020', label: '2020' },
    { value: '2019', label: '2019' },
  ],
};

/**
 * Mock Catalog Service
 * Use this when developing without a live SPARQL endpoint
 */
export class MockCatalogService {
  private simulateDelay: boolean;
  private delayMs: number;

  constructor(options?: { simulateDelay?: boolean; delayMs?: number }) {
    this.simulateDelay = options?.simulateDelay ?? true;
    this.delayMs = options?.delayMs ?? 500;
  }

  private async delay(): Promise<void> {
    if (this.simulateDelay) {
      return new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }
  }

  /**
   * Search for cubes by keyword
   */
  async searchCubes(keyword: string = ''): Promise<CubeMetadata[]> {
    await this.delay();

    const lowerKeyword = keyword.toLowerCase();
    return MOCK_CUBES.filter((cube) => {
      if (!keyword) return true;
      return (
        cube.label.toLowerCase().includes(lowerKeyword) ||
        (cube.description?.toLowerCase().includes(lowerKeyword) ?? false) ||
        (cube.publisher?.toLowerCase().includes(lowerKeyword) ?? false)
      );
    }).map((cube) => ({
      uri: cube.uri,
      label: cube.label,
      description: cube.description,
      publisher: cube.publisher,
      dateModified: cube.dateModified,
    }));
  }

  /**
   * Get full metadata for a cube including dimensions and measures
   */
  async getCubeMetadata(cubeUri: string): Promise<CubeFullMetadata | null> {
    await this.delay();

    const cube = MOCK_CUBES.find((c) => c.uri === cubeUri);
    return cube || null;
  }

  /**
   * Get available values for a dimension
   */
  async getDimensionValues(cubeUri: string, dimensionUri: string): Promise<DimensionValue[]> {
    await this.delay();

    const values = MOCK_DIMENSION_VALUES[dimensionUri];
    if (values) {
      return values;
    }

    // Return empty array for unknown dimensions
    return [];
  }

  /**
   * Get all available mock cubes
   */
  getAllCubes(): CubeMetadata[] {
    return MOCK_CUBES.map((cube) => ({
      uri: cube.uri,
      label: cube.label,
      description: cube.description,
      publisher: cube.publisher,
      dateModified: cube.dateModified,
    }));
  }
}

/**
 * Singleton instance of the mock catalog service
 */
export const mockCatalogService = new MockCatalogService();

export default MockCatalogService;
