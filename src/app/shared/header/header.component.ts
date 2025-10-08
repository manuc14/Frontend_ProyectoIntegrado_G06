import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { navActiveState, navHover, fadeIn } from '../../core/animations/animations';

/*
 * HeaderComponent
 * Componente de navegación principal de la aplicación. Incluye el logotipo,
 * menú de navegación responsive con hamburger para móvil, y enlaces de
 * autenticación. Se adapta automáticamente a diferentes tamaños de pantalla.
 * Resalta automáticamente el elemento de navegación activo según la ruta actual.
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  animations: [navActiveState, navHover, fadeIn]
})
export class HeaderComponent {
  private router = inject(Router);
  currentRoute = '';
  isMenuOpen = false;

  constructor() {
    // Obtener la ruta inicial
    this.currentRoute = this.router.url;
    
    // Escuchar cambios de ruta
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.url;
      });
  }

  /**
   * Determina si una ruta está activa
   */
  isActiveRoute(route: string): boolean {
    if (route === '/') {
      return this.currentRoute === '/' || this.currentRoute === '';
    }
    return this.currentRoute.startsWith(route);
  }

  /**
   * Obtiene la clase CSS para un enlace de navegación
   */
  getLinkClass(route: string): string {
    return this.isActiveRoute(route) ? 'link' : 'link2';
  }

  /**
   * Obtiene la clase CSS para el texto de navegación
   */
  getTextClass(route: string): string {
    return this.isActiveRoute(route) ? 'text2' : 'text3';
  }

  /**
   * Obtiene el estado de animación para navegación activa
   */
  getNavActiveState(route: string): string {
    return this.isActiveRoute(route) ? 'active' : 'inactive';
  }

  /**
   * Alterna el estado del menú móvil
   */
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }
}
