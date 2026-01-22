import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SupersetEmbedComponent } from '../../components/superset-embed/superset-embed.component';

interface BreadcrumbItem {
  label: string;
  url?: string;
}

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    SupersetEmbedComponent
  ],
  template: `
    <div class="chart-page">
      <!-- Breadcrumbs -->
      <nav class="breadcrumbs">
        @for (item of breadcrumbs; track item.label; let last = $last) {
          @if (!last) {
            <a [routerLink]="item.url" class="breadcrumb-link">{{ item.label }}</a>
            <span class="separator">/</span>
          } @else {
            <span class="current">{{ item.label }}</span>
          }
        }
      </nav>

      <!-- Header -->
      <header class="page-header">
        <h1>Chart</h1>
        <p class="subtitle">
          Embedded Superset chart visualization.
        </p>
      </header>

      @if (!chartId()) {
        <mat-card class="error-card">
          <mat-card-content>
            <mat-icon color="warn">error</mat-icon>
            <h3>Chart ID Required</h3>
            <p>Please provide a valid chart ID in the URL.</p>
            <button mat-raised-button color="primary" routerLink="/">
              Go to Home
            </button>
          </mat-card-content>
        </mat-card>
      } @else {
        <!-- Info banner -->
        <mat-card class="info-banner">
          <mat-card-content>
            <mat-icon>info</mat-icon>
            <span>
              <strong>Note:</strong> This chart is embedded from Apache Superset.
              Ensure Superset is running and the chart with ID <code>{{ chartId() }}</code> exists.
            </span>
          </mat-card-content>
        </mat-card>

        <!-- Embedded Chart -->
        <div class="embed-wrapper">
          <app-superset-embed
            type="chart"
            [id]="chartId()!"
            height="600px"
          />
        </div>
      }
    </div>
  `,
  styles: [`
    .chart-page {
      padding: 0;
    }

    .breadcrumbs {
      margin-bottom: 16px;
      font-size: 14px;
    }

    .breadcrumb-link {
      color: #1890ff;
      text-decoration: none;
    }

    .breadcrumb-link:hover {
      text-decoration: underline;
    }

    .separator {
      margin: 0 8px;
      color: #999;
    }

    .current {
      color: #666;
    }

    .page-header {
      margin-bottom: 24px;
    }

    .page-header h1 {
      margin: 0 0 8px;
      font-size: 28px;
      font-weight: 600;
    }

    .subtitle {
      margin: 0;
      color: #666;
    }

    .error-card {
      text-align: center;
      padding: 32px;
    }

    .error-card mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }

    .error-card h3 {
      margin: 0 0 8px;
    }

    .error-card p {
      margin: 0 0 16px;
      color: #666;
    }

    .info-banner {
      margin-bottom: 16px;
      background: #e6f7ff;
    }

    .info-banner mat-card-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .info-banner mat-icon {
      color: #1890ff;
    }

    .info-banner code {
      background: rgba(0, 0, 0, 0.06);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
    }

    .embed-wrapper {
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  `]
})
export class ChartComponent implements OnInit {
  chartId = signal<string | null>(null);

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', url: '/' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('chartId');
      this.chartId.set(id);

      if (id) {
        this.breadcrumbs = [
          { label: 'Home', url: '/' },
          { label: `Chart ${id}` }
        ];
      }
    });
  }
}
