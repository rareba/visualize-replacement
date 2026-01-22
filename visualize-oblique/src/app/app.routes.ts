import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'cubes',
    loadComponent: () => import('./pages/cubes/cubes.component').then(m => m.CubesComponent)
  },
  {
    path: 'cubes/:cubeId',
    loadComponent: () => import('./pages/cube-detail/cube-detail.component').then(m => m.CubeDetailComponent)
  },
  {
    path: 'graphql',
    loadComponent: () => import('./pages/graphql-playground/graphql-playground.component').then(m => m.GraphqlPlaygroundComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
