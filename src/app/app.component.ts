import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { SessionTimeoutModalComponent } from './shared/session-timeout-modal/session-timeout-modal.component';

/*
 * AppComponent
 * Componente raíz de la aplicación ESIMedia. Actúa como contenedor principal
 * que renderiza las diferentes páginas a través del sistema de rutas de Angular.
 * Proporciona la estructura base para toda la aplicación y gestiona la validación
 * de sesiones en cada cambio de ruta, así como el timeout de sesión por inactividad.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SessionTimeoutModalComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  // Título de la aplicación usado internamente por Angular
  title = 'frontend_g06';
  
  // Modal de expiración de sesión
  showTimeoutModal = false;
  timeoutMessage = '';
  
  // Subscripción a eventos de expiración
  private sessionExpiredSub?: Subscription;
  
  // Throttling para eventos de actividad (evitar llamadas excesivas)
  private lastActivityTime = 0;
  private readonly ACTIVITY_THROTTLE_MS = 10000; // 10 segundos entre resets

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
      // Resetear idle timer cuando el usuario navega (indica actividad)
      if (this.authService.isAuthenticated()) {
        this.authService.resetIdleTimer();
      }
    });

    // Escuchar eventos de expiración de sesión
    this.sessionExpiredSub = this.authService.sessionExpiredObservable.subscribe(event => {
      if (event) {
        this.timeoutMessage = event.message;
        this.showTimeoutModal = true;
      }
    });
  }

  ngOnDestroy(): void {
    this.sessionExpiredSub?.unsubscribe();
  }

  /**
   * Escucha eventos de actividad del usuario para resetear Idle Timer
   * Se incluyen múltiples eventos para capturar diferentes tipos de interacción
   * Con throttling para evitar llamadas excesivas
   */
  @HostListener('document:click')
  @HostListener('document:mousedown')
  @HostListener('document:mousemove')
  @HostListener('document:keydown')
  @HostListener('document:keypress')
  @HostListener('document:touchstart')
  @HostListener('document:touchmove')
  @HostListener('document:scroll')
  @HostListener('window:scroll')
  onUserActivity(): void {
    // Solo resetear si hay una sesión activa
    if (!this.authService.isAuthenticated()) return;
    
    // Throttling: solo resetear si han pasado al menos 10 segundos desde el último reset
    const now = Date.now();
    if (now - this.lastActivityTime < this.ACTIVITY_THROTTLE_MS) return;
    
    this.lastActivityTime = now;
    this.authService.resetIdleTimer();
  }

  /**
   * Cierra el modal de timeout y redirige al login
   */
  closeTimeoutModal(): void {
    this.showTimeoutModal = false;
    this.router.navigate(['/login']);
  }
}
