import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { LindasService, Endpoint } from '../../services/lindas.service';

interface ExampleQuery {
  name: string;
  description: string;
  query: string;
}

interface BreadcrumbItem {
  label: string;
  url?: string;
}

@Component({
  selector: 'app-graphql-playground',
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
    MatProgressSpinnerModule,
    MatTabsModule
  ],
  templateUrl: './graphql-playground.component.html',
  styleUrl: './graphql-playground.component.scss'
})
export class GraphqlPlaygroundComponent {
  query = signal('');
  result = signal<string>('');
  loading = signal(false);
  error = signal<string | null>(null);
  executionTime = signal<number | null>(null);

  selectedEndpoint = signal<Endpoint>('prod');
  endpoints: Endpoint[] = ['prod', 'int', 'test'];

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', url: '/' },
    { label: 'GraphQL Playground' }
  ];

  exampleQueries: ExampleQuery[] = [
    {
      name: 'List Cubes',
      description: 'Get a list of available data cubes',
      query: `query {
  cubes(endpoint: PROD, limit: 10) {
    iri
    title
    description
    publisher
  }
}`
    },
    {
      name: 'Cube Dimensions',
      description: 'Get dimensions for a specific cube',
      query: `query {
  cubeDimensions(
    cubeIri: "https://agriculture.ld.admin.ch/foag/cube/MilsuspT",
    endpoint: PROD
  ) {
    iri
    label
    type
    dataType
  }
}`
    },
    {
      name: 'Execute SPARQL',
      description: 'Run a raw SPARQL query',
      query: `query {
  executeSparql(
    query: """
      PREFIX schema: <http://schema.org/>
      SELECT ?cube ?title
      WHERE {
        ?cube a <https://cube.link/Cube> ;
              schema:name ?title .
      }
      LIMIT 5
    """,
    endpoint: PROD
  ) {
    columns
    rows
    executionTimeMs
  }
}`
    }
  ];

  constructor(private lindasService: LindasService) {
    this.query.set(this.exampleQueries[0].query);
  }

  loadExample(example: ExampleQuery): void {
    this.query.set(example.query);
    this.result.set('');
    this.error.set(null);
  }

  executeQuery(): void {
    const queryText = this.query();
    if (!queryText.trim()) {
      this.error.set('Please enter a query');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.result.set('');
    this.executionTime.set(null);

    const startTime = performance.now();

    fetch(`http://localhost:8089/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: queryText })
    })
      .then(response => response.json())
      .then(data => {
        const endTime = performance.now();
        this.executionTime.set(Math.round(endTime - startTime));
        this.result.set(JSON.stringify(data, null, 2));
        this.loading.set(false);
      })
      .catch(err => {
        this.error.set(`Query failed: ${err.message}`);
        this.loading.set(false);
      });
  }
}
