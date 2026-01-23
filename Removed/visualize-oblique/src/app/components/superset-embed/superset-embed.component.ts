import { Component, Input, OnInit, OnDestroy, ElementRef, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { SupersetService } from '../../services/superset.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-superset-embed',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatCardModule],
  template: `
    <div class="superset-embed-container" [style.height]="height">
      @if (loading()) {
        <div class="loading-overlay">
          <mat-spinner diameter="40"></mat-spinner>
          <span class="loading-text">Loading {{ type }}...</span>
        </div>
      }

      @if (error()) {
        <mat-card class="error-card">
          <mat-card-content>
            <div class="error-icon">!</div>
            <h3>Failed to load {{ type }}</h3>
            <p>{{ error() }}</p>
            <p class="error-hint">
              Make sure Superset is running at {{ supersetUrl }} and the {{ type }} with ID "{{ id }}" exists.
            </p>
          </mat-card-content>
        </mat-card>
      }

      <div #embedContainer class="embed-container" [class.hidden]="loading() || error()"></div>
    </div>
  `,
  styles: [`
    .superset-embed-container {
      position: relative;
      width: 100%;
      min-height: 400px;
      background: #f5f5f5;
      border-radius: 8px;
      overflow: hidden;
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.9);
      z-index: 10;
    }

    .loading-text {
      margin-top: 16px;
      color: #666;
    }

    .error-card {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      max-width: 400px;
      text-align: center;
    }

    .error-icon {
      width: 48px;
      height: 48px;
      margin: 0 auto 16px;
      background: #ff4d4f;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: bold;
    }

    .error-card h3 {
      margin: 0 0 8px;
      color: #333;
    }

    .error-card p {
      margin: 0 0 8px;
      color: #666;
    }

    .error-hint {
      font-size: 12px;
      color: #999;
    }

    .embed-container {
      width: 100%;
      height: 100%;
    }

    .embed-container.hidden {
      visibility: hidden;
    }

    .embed-container iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
  `]
})
export class SupersetEmbedComponent implements OnInit, OnDestroy {
  @Input() type: 'dashboard' | 'chart' = 'dashboard';
  @Input() id!: string;
  @Input() height = '600px';

  @ViewChild('embedContainer', { static: true }) embedContainer!: ElementRef<HTMLDivElement>;

  loading = signal(true);
  error = signal<string | null>(null);

  supersetUrl = environment.supersetUrl || 'http://localhost:8088';

  constructor(private supersetService: SupersetService) {}

  ngOnInit(): void {
    this.loadEmbed();
  }

  ngOnDestroy(): void {
    // Clean up iframe using safe DOM methods
    if (this.embedContainer?.nativeElement) {
      this.clearContainer();
    }
  }

  private clearContainer(): void {
    const container = this.embedContainer.nativeElement;
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
  }

  private loadEmbed(): void {
    this.loading.set(true);
    this.error.set(null);

    // Get guest token from Superset
    this.supersetService.authenticateAndGetGuestToken(this.id, this.type).subscribe({
      next: (guestToken) => {
        this.createEmbed(guestToken);
      },
      error: (err) => {
        console.error('Failed to get guest token:', err);
        this.error.set(err.message || 'Failed to authenticate with Superset');
        this.loading.set(false);
      }
    });
  }

  private createEmbed(guestToken: string): void {
    const container = this.embedContainer.nativeElement;

    // Clear any existing content using safe DOM methods
    this.clearContainer();

    // Create iframe element
    const iframe = document.createElement('iframe');

    if (this.type === 'dashboard') {
      // For dashboards, use dashboard URL
      const embedUrl = new URL(`/superset/dashboard/${this.id}/`, this.supersetUrl);
      embedUrl.searchParams.set('standalone', 'true');
      embedUrl.searchParams.set('guest_token', guestToken);
      iframe.src = embedUrl.toString();
    } else {
      // For charts, use explore URL
      const embedUrl = new URL('/superset/explore/', this.supersetUrl);
      embedUrl.searchParams.set('standalone', 'true');
      embedUrl.searchParams.set('guest_token', guestToken);
      embedUrl.searchParams.set('slice_id', this.id);
      iframe.src = embedUrl.toString();
    }

    // Set iframe attributes
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.allow = 'fullscreen';

    iframe.onload = () => {
      this.loading.set(false);
    };

    iframe.onerror = () => {
      this.error.set(`Failed to load ${this.type} iframe`);
      this.loading.set(false);
    };

    container.appendChild(iframe);
  }
}
