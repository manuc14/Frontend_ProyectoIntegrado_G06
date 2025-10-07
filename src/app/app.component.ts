import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/*
 * AppComponent
 * Componente raíz de la aplicación ESIMedia. Actúa como contenedor principal
 * que renderiza las diferentes páginas a través del sistema de rutas de Angular.
 * Proporciona la estructura base para toda la aplicación.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  // Título de la aplicación usado internamente por Angular
  title = 'frontend_g06';
}
