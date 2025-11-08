import { Component, inject, ElementRef, AfterViewInit, Renderer2, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { navActiveState, navHover, fadeIn } from '../../core/animations/animations';
import { ApiService } from '../../core/services/api.service';
import { ImageSelectorService } from '../../core/services/image-selector.service';
import { AuthService } from '../../core/services/auth.service';
import { HeaderBase } from '../../core/base/header.base';
import { UserDropdownMenuComponent } from '../components/user-dropdown-menu/user-dropdown-menu.component';

/*
 * HeaderComponent
 * Componente de navegación con comportamiento condicional por página.
 * - Home: Header fijo con logo grande arriba que desaparece con scroll
 * - Otras páginas: Header normal (no fijo) con logo pequeño a la izquierda
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, UserDropdownMenuComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  animations: [navActiveState, navHover, fadeIn]
})
export class HeaderComponent extends HeaderBase implements AfterViewInit, OnDestroy, OnInit {
  protected override router = inject(Router);
  private elementRef = inject(ElementRef);
  private renderer = inject(Renderer2);
  protected override apiService = inject(ApiService);
  protected override imageSelectorService = inject(ImageSelectorService);
  protected override authService = inject(AuthService);
  currentRoute = '';
  isMenuOpen = false;
  isHomePage = false; // Para detectar si estamos en home
  isLoggedIn = false;

  constructor() {
    super();
    this.router = inject(Router);
    this.apiService = inject(ApiService);
    this.imageSelectorService = inject(ImageSelectorService);
    this.authService = inject(AuthService);

    // Obtener la ruta inicial
    this.currentRoute = this.router.url;
    this.checkIfHomePage();
    this.updateBodyClass();
    
    // Escuchar cambios de ruta
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.url;
        this.checkIfHomePage();
        this.updateLogoVisibility();
        this.updateBodyClass();
        // Revalidar sesión en cada cambio de ruta
        this.checkSession();
      });
  }

  ngOnInit() {
    this.checkSession();
  }

  ngAfterViewInit() {
    // Configurar estado inicial después de que la vista se inicialice
    setTimeout(() => {
      this.updateLogoVisibility();
    }, 0);
  }

  ngOnDestroy() {
    // Limpiar las clases del body al destruir el componente
    this.renderer.removeClass(document.body, 'home-page');
    this.renderer.removeClass(document.body, 'other-page');
  }

  /**
   * Verifica si hay una sesión activa usando AuthService
   */
  private checkSession() {
    this.isLoggedIn = this.authService.isAuthenticated();
    if (this.isLoggedIn) {
      const user = this.authService.getCurrentUser();
      if (user) {
        this.currentUser = user;
      }
    } else {
      this.currentUser = null;
    }
  }

  override getAvatarUrl(): string {
    // Intentar con 'foto' (campo del backend)
    const fotoUrl = this.currentUser?.foto;
    if (fotoUrl) {
      return this.imageSelectorService.getFullImageUrl(fotoUrl, 'avatar');
    }
    return 'assets/admin/admin_default.png';
  }


  /**
   * Cierra la sesión del usuario usando AuthService
   */
  override logout() {
    this.authService.logout(true);
    this.isLoggedIn = false;
    this.currentUser = null;
  }

  /**
   * Actualiza las clases del body según la página actual
   */
  private updateBodyClass() {
    const body = document.body;
    
    // Remover clases existentes
    this.renderer.removeClass(body, 'home-page');
    this.renderer.removeClass(body, 'other-page');
    
    // Agregar clase apropiada
    if (this.isHomePage) {
      this.renderer.addClass(body, 'home-page');
    } else {
      this.renderer.addClass(body, 'other-page');
    }
  }

  /**
   * Verifica si estamos en la página home
   */
  private checkIfHomePage() {
    this.isHomePage = this.currentRoute === '/' || this.currentRoute === '';
  }

  /**
   * Actualiza la visibilidad del logo basado en la página actual
   */
  private updateLogoVisibility() {
    // Logo siempre visible a la izquierda, no hay lógica de visibilidad dinámica
  }

  /**
   * Alterna el estado del menú móvil
   */
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }
}
