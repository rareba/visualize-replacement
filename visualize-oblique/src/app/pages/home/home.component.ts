import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  features = [
    {
      title: 'Data Cubes',
      description: 'Browse and search through LINDAS data cubes. View schemas, preview data, and explore available datasets.',
      icon: 'storage',
      link: '/cubes',
      color: '#1890ff'
    },
    {
      title: 'Dashboards',
      description: 'View interactive dashboards powered by Apache Superset for comprehensive data visualization.',
      icon: 'dashboard',
      link: '/dashboard/1',
      color: '#722ed1'
    },
    {
      title: 'Charts',
      description: 'Explore individual charts and visualizations created from LINDAS data cubes.',
      icon: 'bar_chart',
      link: '/chart/1',
      color: '#52c41a'
    },
    {
      title: 'GraphQL API',
      description: 'Query LINDAS data using our GraphQL API. Build custom queries and explore the data model.',
      icon: 'code',
      link: '/graphql',
      color: '#eb2f96'
    }
  ];

  endpoints = [
    { name: 'Production', url: 'lindas-cached.cluster.ldbar.ch' },
    { name: 'Integration', url: 'lindas-cached.int.cluster.ldbar.ch' },
    { name: 'Test', url: 'lindas-cached.test.cluster.ldbar.ch' }
  ];
}
