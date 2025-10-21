import { Component, inject, HostListener, ElementRef, AfterViewInit, Renderer2, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { navActiveState, navHover, fadeIn } from '../../core/animations/animations';
import { BackendUser, ApiService } from '../../core/services/api.service';

/*
 * HeaderComponent
 * Componente de navegación con comportamiento condicional por página.
 * - Home: Header fijo con logo grande arriba que desaparece con scroll
 * - Otras páginas: Header normal (no fijo) con logo pequeño a la izquierda
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  animations: [navActiveState, navHover, fadeIn]
})
export class HeaderComponent implements AfterViewInit, OnDestroy, OnInit {
  private router = inject(Router);
  private elementRef = inject(ElementRef);
  private renderer = inject(Renderer2);
  private apiService = inject(ApiService);
  currentRoute = '';
  isMenuOpen = false;
  hasScrolled = false; // Una vez que se hace scroll, se mantiene true
  isHomePage = false; // Para detectar si estamos en home
  isLoggedIn = false;
  currentUser: BackendUser | null = null;

  constructor() {
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
   * Verifica si hay una sesión activa
   */
  private checkSession() {
    const token = sessionStorage.getItem('authToken');
    const userData = sessionStorage.getItem('currentUser');
    this.isLoggedIn = !!(token && userData);
    if (this.isLoggedIn && userData) {
      try {
        this.currentUser = JSON.parse(userData);
      } catch (error) {
        console.error('Error parsing current user data:', error);
        this.isLoggedIn = false;
        this.currentUser = null;
      }
    } else {
      this.currentUser = null;
    }
  }

  /**
   * Obtiene la URL del avatar del usuario
   */
  getAvatarUrl(): string {
    if (this.currentUser?.foto) {
      return this.apiService.getAvatarUrl(this.currentUser?.foto);
    }
    return 'assets/admin/admin_default.png';
  }


  /**
   * Cierra la sesión del usuario
   */
  logout() {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('currentUser');
    this.isLoggedIn = false;
    this.currentUser = null;
    this.router.navigate(['/login']);
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
    const wasHomePage = this.isHomePage;
    this.isHomePage = this.currentRoute === '/' || this.currentRoute === '';
    
    // Si acabamos de llegar a home desde otra página, resetear estado
    if (this.isHomePage && !wasHomePage) {
      this.hasScrolled = false;
    }
  }

  /**
   * Actualiza la visibilidad del logo basado en la página actual
   */
  private updateLogoVisibility() {
    const logoLarge = this.elementRef.nativeElement.querySelector('.desktop-logo');
    const logoSmall = this.elementRef.nativeElement.querySelector('.desktop-logo-small');
    
    if (logoLarge && logoSmall) {
      if (this.isHomePage && !this.hasScrolled) {
        // En home sin scroll: mostrar logo grande
        logoLarge.classList.remove('hidden');
        logoSmall.classList.remove('visible');
        // Reset scroll state cuando se vuelve a home
        this.hasScrolled = false;
      } else {
        // En otras páginas o home con scroll: mostrar logo pequeño
        logoLarge.classList.add('hidden');
        logoSmall.classList.add('visible');
      }
    }
  }

  /**
   * Detecta el primer scroll para cambiar el logo permanentemente (solo en home)
   */
  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    // Solo aplicar lógica de scroll en la página home
    if (!this.isHomePage) return;
    
    const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    
    // Solo cambiar una vez cuando se hace el primer scroll en home
    if (scrollTop > 50 && !this.hasScrolled) {
      this.hasScrolled = true;
      this.updateLogoVisibility();
    }
  }

  /**
   * Alterna el estado del menú móvil
   */
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }
}
