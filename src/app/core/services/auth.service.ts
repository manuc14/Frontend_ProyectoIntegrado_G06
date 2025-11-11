import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export type UserRole = 'admin' | 'creator' | 'user';

export interface CurrentUser {
  id: number | string;
  nombre: string;
  apellido?: string;
  apellidos?: string;
  email: string;
  rol: UserRole;
  tipo?: string;
  tipoContenido?: string;
  foto?: string; // Campo del backend para avatar
  avatar?: string; // Alias del campo foto
  edad?: number; // Edad del usuario para restricciones de contenido
  esVip?: boolean; // Si el usuario tiene suscripción VIP
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private idleTimer: any = null;
  private absoluteTimer: any = null;
  private tokenExpiryTimer: any = null;
  private sessionExpired$ = new BehaviorSubject<{ reason: string; message: string } | null>(null);
  public sessionExpiredObservable = this.sessionExpired$.asObservable();
  
  private readonly allowedRoutesByRole: Record<UserRole, string[]> = {
    admin: ['/ad-users', '/ad-users-edit', '/ad-admin', '/ad-admin-add', '/ad-admin-edit', '/ad-creators', '/ad-creators-add', '/ad-creators-edit', '/ad-content'],
    creator: ['/content-creator', '/upload-content', '/creator/catalog', '/creator/profile', '/create-list', '/edit-list', '/search'],
    user: ['/catalog', '/content', '/player', '/my-lists', '/create-private-list', '/edit-private-list', '/search']
  };

  private readonly publicRoutes = ['/', '/login', '/signup', '/qr-code-setup', '/verify-email', '/verify-code', '/verify-otp', '/forgot-password', '/reset-password-code', '/new-password'];

  constructor(private router: Router) {}

  getToken(): string | null { return sessionStorage.getItem('authToken'); }
  getRefreshToken(): string | null { return localStorage.getItem('refreshToken'); }

  private setToken(token: string): void {
    sessionStorage.setItem('authToken', token);
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000;
      sessionStorage.setItem('tokenExpiry', expiryTime.toString());
      this.startTokenExpiryTimer(expiryTime);
    } catch (error) {
      console.error('Error decodificando token JWT:', error);
    }
  }

  setAccessToken(token: string): void { this.setToken(token); }
  private setRefreshToken(refreshToken: string): void { localStorage.setItem('refreshToken', refreshToken); }
  setRefreshTokenPublic(refreshToken: string): void { this.setRefreshToken(refreshToken); }

  saveSessionConfig(idleTimeoutMillis: number, absoluteTimeoutMillis: number): void {
    const config = { idleTimeout: idleTimeoutMillis, absoluteTimeout: absoluteTimeoutMillis };
    sessionStorage.setItem('sessionConfig', JSON.stringify(config));
  }

  private getSessionConfig(): { idleTimeout: number; absoluteTimeout: number } | null {
    const configData = sessionStorage.getItem('sessionConfig');
    if (!configData) return null;
    return JSON.parse(configData);
  }

  refreshAccessToken(): Observable<{ accessToken: string; refreshToken: string; message: string }> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.logout(true);
      return throwError(() => new Error('No refresh token available'));
    }
    
    return this.http.post<{ accessToken: string; refreshToken: string; message: string }>(
      `${environment.baseApiUrl}/auth/refresh`,
      { refreshToken }
    ).pipe(
      tap(response => {
        this.setToken(response.accessToken);
        this.setRefreshTokenPublic(response.refreshToken);
        this.resetIdleTimer();
      }),
      catchError(error => {
        const message = error.error?.message || error.message || 'Token expirado';

        if (message.includes('inactividad')) {
          this.sessionExpired$.next({ reason: 'idle', message: 'Tu sesión expiró por inactividad' });
        } else if (message.includes('límite de tiempo')) {
          this.sessionExpired$.next({ reason: 'absolute', message: 'Tu sesión ha expirado' });
        } else {
          this.sessionExpired$.next({ reason: 'invalid', message: 'Tu sesión es inválida' });
        }
        
        this.logout(true, true);
        return throwError(() => error);
      })
    );
  }

  getCurrentUser(): CurrentUser | null {
    const userData = sessionStorage.getItem('currentUser');
    if (!userData) return null;

    try {
      const user = JSON.parse(userData) as CurrentUser;
      return user;
    } catch (error) {
      console.error('Error parsing currentUser from sessionStorage:', error);
      sessionStorage.removeItem('currentUser');
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  private normalizeRole(backendRole: string): UserRole | null {
    const roleMap: Record<string, UserRole> = {
      'ADMIN': 'admin', 'ADMINISTRADOR': 'admin',
      'CREADORCONTENIDO': 'creator', 'CREADOR': 'creator',
      'USUARIOEV': 'user', 'USUARIO_EV': 'user', 'USER': 'user'
    };
    return roleMap[backendRole.toUpperCase()] || null;
  }

  getCurrentRole(): UserRole | null {
    const user = this.getCurrentUser();
    return user?.tipo ? this.normalizeRole(user.tipo) : null;
  }

   /**
   * Obtiene la edad del usuario actual desde sessionStorage
   */
  getUserAge(): number {
    const user = this.getCurrentUser();
    return user?.edad ?? 0;
  }

  /**
   * Verifica si el usuario actual es VIP
   */
  isUserVip(): boolean {
    const user = this.getCurrentUser();
    return user?.esVip ?? false;
  }

  /**
   * Verifica si el usuario actual es un creador de contenido
   */
  isCreator(): boolean {
    const role = this.getCurrentRole();
    return role === 'creator';
  }

  isRouteAllowedForCurrentUser(currentPath: string): boolean {
    if (this.publicRoutes.includes(currentPath)) return true;
    const role = this.getCurrentRole();
    if (!role) return false;
    const allowedRoutes = this.allowedRoutesByRole[role];
    return allowedRoutes.some(route => currentPath === route || currentPath.startsWith(route + '/'));
  }

  logout(redirect: boolean = true, skipBackendInvalidation: boolean = false): void {
    this.stopAllTimers();
    const refreshToken = this.getRefreshToken();
    
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('sessionConfig');
    sessionStorage.removeItem('tokenExpiry');
    localStorage.removeItem('refreshToken');
    
    if (refreshToken && !skipBackendInvalidation) {
      this.http.post(`${environment.baseApiUrl}/auth/logout`, { refreshToken }).subscribe();
    }
    
    if (redirect) this.router.navigate(['/']);
  }

  emitSessionExpired(reason: string = 'session-timeout', message: string = 'Tu sesión ha expirado'): void {
    this.sessionExpired$.next({ reason, message });
  }

  startIdleTimer(): void {
    const sessionConfig = this.getSessionConfig();
    if (!sessionConfig?.idleTimeout) return;

    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      this.refreshAccessToken().subscribe();
    }, sessionConfig.idleTimeout);
  }

  resetIdleTimer(): void {
    if (!this.isAuthenticated()) return;
    this.startIdleTimer();
  }

  startAbsoluteTimer(): void {
    const sessionConfig = this.getSessionConfig();
    if (!sessionConfig?.absoluteTimeout) return;

    if (this.absoluteTimer) clearTimeout(this.absoluteTimer);
    this.absoluteTimer = setTimeout(() => {
      this.sessionExpired$.next({ reason: 'absolute', message: 'Tu sesión ha expirado (límite de tiempo alcanzado)' });
      this.logout(true, true);
    }, sessionConfig.absoluteTimeout);
  }

  private startTokenExpiryTimer(expiryTime: number): void {
    if (this.tokenExpiryTimer) clearTimeout(this.tokenExpiryTimer);
    const timeUntilRenewal = Math.max(0, expiryTime - Date.now() - 10000);
    this.tokenExpiryTimer = setTimeout(() => {
      this.refreshAccessToken().subscribe();
    }, timeUntilRenewal);
  }

  private stopAllTimers(): void {
    if (this.idleTimer) { clearTimeout(this.idleTimer); this.idleTimer = null; }
    if (this.absoluteTimer) { clearTimeout(this.absoluteTimer); this.absoluteTimer = null; }
    if (this.tokenExpiryTimer) { clearTimeout(this.tokenExpiryTimer); this.tokenExpiryTimer = null; }
  }

  startSessionTimers(): void {
    if (this.idleTimer || this.absoluteTimer) return;
    this.startIdleTimer();
    this.startAbsoluteTimer();
  }

  validateSessionForCurrentRoute(): void {
    const currentPath = this.router.url;
    if (this.isAuthenticated() && currentPath !== '/' && !this.isRouteAllowedForCurrentUser(currentPath)) {
      this.logout(true);
    }
  }

  getRedirectRouteForRole(role: UserRole): string {
    const redirectMap: Record<UserRole, string> = {
      admin: '/ad-users',
      creator: '/content-creator',
      user: '/catalog'
    };
    return redirectMap[role] || '/';
  }

  /**
   * Extrae la información del usuario desde un token JWT
   * Método centralizado para ser usado en diferentes puntos de login
   */
  extractUserFromJWT(token: string): CurrentUser | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const tipo = payload.role || payload.tipo || 'USUARIOEV';

      const user: CurrentUser = {
        id: payload.sub || payload.userId || '',
        email: payload.email || '',
        nombre: payload.name || payload.nombre || payload.email?.split('@')[0] || 'Usuario',
        apellidos: payload.apellidos || '',
        tipo,
        rol: this.normalizeRole(tipo) || 'user',
        avatar: payload.avatar || payload.foto,
        edad: payload.edad,
        esVip: payload.esVip
      };

      return user;
    } catch (error) {
      console.error('❌ [AuthService] Error extrayendo usuario del JWT:', error);
      return null;
    }
  }
}
