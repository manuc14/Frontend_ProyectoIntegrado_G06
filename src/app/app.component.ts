import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './core/services/auth.service';

/*
 * AppComponent
 * Componente raíz de la aplicación ESIMedia. Actúa como contenedor principal
 * que renderiza las diferentes páginas a través del sistema de rutas de Angular.
 * Proporciona la estructura base para toda la aplicación y gestiona la validación
 * de sesiones en cada cambio de ruta.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  // Título de la aplicación usado internamente por Angular
  title = 'frontend_g06';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Validar sesión en cada cambio de ruta
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.authService.validateSessionForCurrentRoute();
    });

    // Validar sesión inicial
    this.authService.validateSessionForCurrentRoute();
  }
}
