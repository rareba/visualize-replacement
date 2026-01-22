import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LindasService, CubeInfo, Dimension, Endpoint } from '../../services/lindas.service';

interface BreadcrumbItem {
  label: string;
  url?: string;
}

@Component({
  selector: 'app-cube-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatTabsModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './cube-detail.component.html',
  styleUrl: './cube-detail.component.scss'
})
export class CubeDetailComponent implements OnInit {
  cube = signal<CubeInfo | null>(null);
  dimensions = signal<Dimension[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  cubeIri = '';
  endpoint: Endpoint = 'prod';

  displayedColumns = ['label', 'type', 'dataType', 'unit'];

  breadcrumbs = signal<BreadcrumbItem[]>([
    { label: 'Home', url: '/' },
    { label: 'Data Cubes', url: '/cubes' },
    { label: 'Loading...' }
  ]);

  constructor(
    private route: ActivatedRoute,
    private lindasService: LindasService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.cubeIri = decodeURIComponent(params['cubeId']);
    });

    this.route.queryParams.subscribe(queryParams => {
      this.endpoint = (queryParams['endpoint'] as Endpoint) || 'prod';
      this.loadCubeData();
    });
  }

  loadCubeData(): void {
    this.loading.set(true);
    this.error.set(null);

    this.lindasService.getCubeSchema(this.cubeIri, this.endpoint).subscribe({
      next: (response) => {
        this.cube.set(response.cube);
        this.dimensions.set(response.dimensions);
        this.loading.set(false);

        this.breadcrumbs.set([
          { label: 'Home', url: '/' },
          { label: 'Data Cubes', url: '/cubes' },
          { label: response.cube.title || response.cube.identifier }
        ]);
      },
      error: (err) => {
        this.error.set('Failed to load cube details. Please try again.');
        this.loading.set(false);
        console.error('Error loading cube:', err);
      }
    });
  }

  getSparqlExample(): string {
    return `PREFIX cube: <https://cube.link/>
PREFIX schema: <http://schema.org/>
PREFIX dct: <http://purl.org/dc/terms/>

SELECT ?dimension ?value
WHERE {
  <${this.cubeIri}> cube:observationSet ?observationSet .
  ?observationSet cube:observation ?observation .
  ?observation ?dimension ?value .
}
LIMIT 10`;
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Copied to clipboard');
    });
  }
}
