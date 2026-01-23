import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LindasService, CubeInfo, Endpoint } from '../../services/lindas.service';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

interface BreadcrumbItem {
  label: string;
  url?: string;
}

@Component({
  selector: 'app-cubes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './cubes.component.html',
  styleUrl: './cubes.component.scss'
})
export class CubesComponent implements OnInit {
  cubes = signal<CubeInfo[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  searchQuery = signal('');
  selectedEndpoint = signal<Endpoint>('prod');

  endpoints: Endpoint[] = ['prod', 'int', 'test'];

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', url: '/' },
    { label: 'Data Cubes' }
  ];

  private searchSubject = new Subject<string>();

  constructor(
    private lindasService: LindasService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.searchQuery.set(query);
      this.loadCubes();
    });

    this.loadCubes();
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  onEndpointChange(endpoint: Endpoint): void {
    this.selectedEndpoint.set(endpoint);
    this.loadCubes();
  }

  loadCubes(): void {
    this.loading.set(true);
    this.error.set(null);

    this.lindasService.listCubes(
      this.selectedEndpoint(),
      this.searchQuery() || undefined,
      100,
      0
    ).subscribe({
      next: (response) => {
        this.cubes.set(response.cubes);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load data cubes. Please try again.');
        this.loading.set(false);
        console.error('Error loading cubes:', err);
      }
    });
  }

  selectCube(cube: CubeInfo): void {
    this.router.navigate(['/cubes', encodeURIComponent(cube.iri)], {
      queryParams: { endpoint: this.selectedEndpoint() }
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  }
}
