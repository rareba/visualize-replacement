import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ObMasterLayoutModule, ObNavTreeComponent, ObNavTreeItemModel } from '@oblique/oblique';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TranslateModule, ObMasterLayoutModule, ObNavTreeComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  navigation: ObNavTreeItemModel[] = [
    {
      id: 'home',
      label: 'Home',
      path: '/'
    } as ObNavTreeItemModel,
    {
      id: 'cubes',
      label: 'Data Cubes',
      path: '/cubes'
    } as ObNavTreeItemModel,
    {
      id: 'graphql',
      label: 'GraphQL Playground',
      path: '/graphql'
    } as ObNavTreeItemModel
  ];
}
