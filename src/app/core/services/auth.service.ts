import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * @fileoverview Servicio centralizado para la gestión de autenticación y sesiones con Session Timeout
 * 
 * Responsabilidades:
 * - Gestión de tokens y datos de usuario en sessionStorage
 * - Control de roles y permisos
 * - Validación de rutas permitidas por rol
 * - Cierre de sesión automático
 */

export type UserRole = 'admin' | 'creator' | 'user';

export interface CurrentUser {
  id: number | string;
  nombre: string;
  apellido?: string;
  apellidos?: string;
  email: string;
  rol: UserRole;
  tipo?: string; // Tipo del backend (ADMINISTRADOR, CREADOR, USUARIO_EV)
  tipoContenido?: string;
  foto?: string; // Campo del backend para avatar
  avatar?: string; // Alias del campo foto
}

/**
 * Servicio de autenticación que gestiona sesiones y control de acceso
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  
  // Temporizadores de sesión
  private idleTimer: any = null;
  private absoluteTimer: any = null;
  
  // Subject para notificar expiración de sesión
  private sessionExpired$ = new BehaviorSubject<{ reason: string; message: string } | null>(null);
  
  // Observable público para que componentes escuchen expiración
  public sessionExpiredObservable = this.sessionExpired$.asObservable();
  
  /**
   * Rutas permitidas por rol (sin incluir rutas públicas)
   */
  private readonly allowedRoutesByRole: Record<UserRole, string[]> = {
    admin: [
      '/ad-users',
      '/ad-users-edit',
      '/ad-admin',
      '/ad-admin-add',
      '/ad-admin-edit',
      '/ad-creators',
      '/ad-creators-add',
      '/ad-creators-edit'
    ],
    creator: [
      '/content-creator',
      '/upload-content',
      '/creator/catalog',
      '/creator/profile'
    ],
    user: [
      '/catalog',
      '/content',
      '/player'
    ]
  };

  /**
   * Rutas públicas accesibles sin autenticación
   */
  private readonly publicRoutes = [
    '/',
    '/login',
    '/signup',
    '/verify-email',
    '/verify-code',
    '/forgot-password',
    '/reset-password-code',
    '/new-password'
  ];

  constructor(private router: Router) {}

  /**
   * Obtiene el Access Token del sessionStorage
   */
  getToken(): string | null {
    return sessionStorage.getItem('authToken');
  }

  /**
   * Obtiene el Refresh Token del localStorage
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  /**
   * Guarda el Access Token en sessionStorage
   */
  private setToken(token: string): void {
    sessionStorage.setItem('authToken', token);
  }

  /**
   * Guarda el Refresh Token en localStorage para persistencia entre pestañas
   */
  private setRefreshToken(refreshToken: string): void {
    localStorage.setItem('refreshToken', refreshToken);
  }

  /**
   * Renueva el Access Token usando el Refresh Token
   * Endpoint: POST /api/auth/refresh
   */
  refreshAccessToken(): Observable<{ accessToken: string; refreshToken: string; message: string }> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      console.log('❌ [AuthService] No hay Refresh Token - cerrando sesión');
      this.logout(true);
      return throwError(() => new Error('No refresh token available'));
    }

    console.log('🔄 [AuthService] Renovando Access Token...');
    
    return this.http.post<{ accessToken: string; refreshToken: string; message: string }>(
      `${environment.baseApiUrl}/auth/refresh`,
      { refreshToken }
    ).pipe(
      tap(response => {
        console.log('✅ [AuthService] Token renovado exitosamente');
        // Guardar nuevos tokens
        this.setToken(response.accessToken);
        this.setRefreshToken(response.refreshToken);
        // Reiniciar Idle Timer (actividad reciente)
        this.resetIdleTimer();
        // NO reiniciar Absolute Timer (sigue corriendo desde login)
      }),
      catchError(error => {
        console.error('❌ [AuthService] Error renovando token:', error);
        
        // Analizar el mensaje de error para determinar el tipo de expiración
        const message = error.error?.message || error.message || 'Token expirado';
        
        if (message.includes('inactividad')) {
          this.sessionExpired$.next({ 
            reason: 'idle', 
            message: 'Tu sesión expiró por inactividad' 
          });
        } else if (message.includes('límite de tiempo')) {
          this.sessionExpired$.next({ 
            reason: 'absolute', 
            message: 'Tu sesión ha expirado' 
          });
        } else {
          this.sessionExpired$.next({ 
            reason: 'invalid', 
            message: 'Tu sesión es inválida' 
          });
        }
        
        // Cerrar sesión
        this.logout(true);
        
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtiene los datos del usuario actual del sessionStorage
   */
  getCurrentUser(): CurrentUser | null {
    const userData = sessionStorage.getItem('currentUser');
    if (!userData) {
      console.log('🔍 [AuthService] getCurrentUser: No userData in sessionStorage');
      return null;
    }
    
    try {
      const user = JSON.parse(userData) as CurrentUser;
      console.log('🔍 [AuthService] getCurrentUser: user from storage', user);
      
      // Mapear el tipo del backend a rol si no existe el rol o si existe el tipo
      if (user && (!user.rol || user.tipo)) {
        const mappedRole = this.mapBackendTypeToRole(user.tipo || '');
        user.rol = mappedRole;
        console.log('🔍 [AuthService] getCurrentUser: mapped tipo to rol', { 
          tipo: user.tipo, 
          rol: mappedRole 
        });
        
        // Actualizar el sessionStorage con el rol mapeado
        sessionStorage.setItem('currentUser', JSON.stringify(user));
      }
      return user;
    } catch (error) {
      console.error('🔍 [AuthService] getCurrentUser: Error parsing userData', error);
      return null;
    }
  }

  /**
   * Mapea el tipo del backend (ADMINISTRADOR, CREADOR, USUARIO_EV) al rol de la app
   */
  private mapBackendTypeToRole(tipo: string): UserRole {
    if (!tipo) return 'user'; // Por defecto user si no hay tipo
    const tipoLower = tipo.toLowerCase();
    if (tipoLower.includes('admin')) return 'admin';
    if (tipoLower.includes('creador') || tipoLower.includes('creator')) return 'creator';
    return 'user'; // USUARIO_EV u otros tipos desconocidos
  }

  /**
   * Verifica si hay una sesión activa
   */
  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  /**
   * Obtiene el rol del usuario actual
   */
  getCurrentRole(): UserRole | null {
    const user = this.getCurrentUser();
    return user?.rol ?? null;
  }

  /**
   * Verifica si la ruta actual es permitida para el rol del usuario
   * @param currentPath - Ruta actual del navegador
   */
  isRouteAllowedForCurrentUser(currentPath: string): boolean {
    console.log('🔍 [AuthService] isRouteAllowedForCurrentUser:', currentPath);
    
    // Rutas públicas siempre permitidas
    if (this.publicRoutes.includes(currentPath)) {
      console.log('✅ [AuthService] Ruta pública permitida');
      return true;
    }

    const role = this.getCurrentRole();
    console.log('🔍 [AuthService] Current role:', role);
    
    if (!role) {
      console.log('❌ [AuthService] No role found');
      return false;
    }

    const allowedRoutes = this.allowedRoutesByRole[role];
    console.log('🔍 [AuthService] Allowed routes for role:', allowedRoutes);
    
    // Verificar si la ruta actual comienza con alguna de las rutas permitidas
    // IMPORTANTE: Usar match exacto o con / para evitar falsos positivos
    // Ejemplo: /content debe hacer match con /content/123 pero NO con /content-creator
    const isAllowed = allowedRoutes.some(route => {
      // Si la ruta permitida es exactamente igual
      if (currentPath === route) return true;
      
      // Si la ruta actual empieza con la permitida Y el siguiente carácter es / (para rutas con parámetros)
      // Esto permite /content/123 pero rechaza /content-creator
      if (currentPath.startsWith(route + '/')) return true;
      
      return false;
    });
    
    console.log(isAllowed ? '✅ [AuthService] Ruta permitida' : '❌ [AuthService] Ruta NO permitida');
    
    return isAllowed;
  }

  /**
   * Cierra la sesión del usuario y limpia el sessionStorage y localStorage
   * @param redirect - Si debe redirigir a la página de inicio (default: true)
   */
  logout(redirect: boolean = true): void {
    console.log('🚪 [AuthService] Cerrando sesión...');
    
    // Detener temporizadores
    this.stopAllTimers();
    
    // Obtener refreshToken antes de eliminarlo
    const refreshToken = this.getRefreshToken();
    
    // Limpiar tokens y datos de usuario del frontend
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('currentUser');
    localStorage.removeItem('refreshToken');
    
    // Llamar al backend para invalidar el refresh token (si existe)
    if (refreshToken) {
      console.log('🗑️ [AuthService] Invalidando refresh token en el backend...');
      this.http.post(`${environment.baseApiUrl}/auth/logout`, { refreshToken }).subscribe({
        next: () => console.log('✅ [AuthService] Refresh token invalidado en el backend'),
        error: (error) => console.error('❌ [AuthService] Error al invalidar refresh token:', error)
      });
    }
    
    if (redirect) {
      this.router.navigate(['/']);
    }
  }

  /**
   * Inicia el temporizador de Idle Timeout según el rol del usuario
   * Se reinicia en cada actividad del usuario
   */
  startIdleTimer(): void {
    const role = this.getCurrentRole();
    if (!role) return;

    // Configuración de Idle Timeout por rol (en milisegundos)
    const idleTimeouts: Record<UserRole, number> = {
      admin: 15 * 60 * 1000,    // 15 minutos
      creator: 15 * 60 * 1000,  // 15 minutos
      user: 20 * 60 * 1000      // 20 minutos
    };

    const timeout = idleTimeouts[role];
    console.log(`⏰ [AuthService] Iniciando Idle Timer para ${role}: ${timeout / 60000} minutos`);

    // Limpiar timer anterior si existe
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }

    // Crear nuevo timer
    this.idleTimer = setTimeout(() => {
      console.log('⏰ [AuthService] Idle Timeout alcanzado - renovando token...');
      this.refreshAccessToken().subscribe({
        error: () => {
          // El error ya fue manejado en refreshAccessToken()
          console.log('❌ [AuthService] No se pudo renovar el token - sesión cerrada');
        }
      });
    }, timeout);
  }

  /**
   * Reinicia el temporizador de Idle Timeout
   * Debe llamarse en cada actividad del usuario
   */
  resetIdleTimer(): void {
    if (!this.isAuthenticated()) return;
    this.startIdleTimer();
  }

  /**
   * Inicia el temporizador de Absolute Timeout
   * Se ejecuta UNA VEZ al hacer login y NO se reinicia
   */
  startAbsoluteTimer(): void {
    const absoluteTimeout = 8 * 60 * 60 * 1000; // 8 horas para todos los roles
    
    console.log(`⏰ [AuthService] Iniciando Absolute Timer: ${absoluteTimeout / 3600000} horas`);

    // Limpiar timer anterior si existe
    if (this.absoluteTimer) {
      clearTimeout(this.absoluteTimer);
    }

    // Crear nuevo timer
    this.absoluteTimer = setTimeout(() => {
      console.log('⏰ [AuthService] Absolute Timeout alcanzado - cerrando sesión...');
      this.sessionExpired$.next({ 
        reason: 'absolute', 
        message: 'Tu sesión ha expirado (límite de 8 horas)' 
      });
      this.logout(true);
    }, absoluteTimeout);
  }

  /**
   * Detiene todos los temporizadores
   */
  private stopAllTimers(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    if (this.absoluteTimer) {
      clearTimeout(this.absoluteTimer);
      this.absoluteTimer = null;
    }
    console.log('⏹️ [AuthService] Todos los temporizadores detenidos');
  }

  /**
   * Método para llamar después de un login exitoso
   * Inicia ambos temporizadores
   */
  startSessionTimers(): void {
    console.log('🚀 [AuthService] Iniciando temporizadores de sesión...');
    this.startIdleTimer();
    this.startAbsoluteTimer();
  }

  /**
   * Valida la sesión en la ruta actual y cierra sesión si no está permitida
   * Debe llamarse en cada cambio de ruta
   */
  validateSessionForCurrentRoute(): void {
    const currentPath = this.router.url;
    console.log('🔍 [AuthService] validateSessionForCurrentRoute:', currentPath);
    
    // NO redirigir automáticamente desde /
    // Dejar que el authGuard y las rutas manejen la redirección
    // Solo validar que la sesión sea válida para la ruta actual
    
    // Si está autenticado y la ruta no está permitida, cerrar sesión
    if (this.isAuthenticated() && currentPath !== '/' && !this.isRouteAllowedForCurrentUser(currentPath)) {
      console.log('⚠️ [AuthService] Ruta no permitida - cerrando sesión y redirigiendo a /');
      this.logout(true);
    } else {
      console.log('✅ [AuthService] Sesión válida para esta ruta');
    }
  }

  /**
   * Obtiene la ruta de redirección según el rol del usuario
   */
  getRedirectRouteForRole(role: UserRole): string {
    const redirectMap: Record<UserRole, string> = {
      admin: '/ad-users',
      creator: '/content-creator',
      user: '/catalog'
    };
    return redirectMap[role] || '/';
  }
}
