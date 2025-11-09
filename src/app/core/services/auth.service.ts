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
  foto?: string;
  avatar?: string;
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
    admin: ['/ad-users', '/ad-users-edit', '/ad-admin', '/ad-admin-add', '/ad-admin-edit', '/ad-creators', '/ad-creators-add', '/ad-creators-edit'],
    creator: ['/content-creator', '/upload-content'],
    user: ['/catalog', '/content', '/player']
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
      console.error('❌ [AuthService] Error decodificando token JWT:', error);
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
    try {
      return JSON.parse(configData);
    } catch (error) {
      console.error('❌ [AuthService] Error parseando sessionConfig:', error);
      return null;
    }
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
    if (userData) {
      if (userData === 'undefined' || userData === 'null') {
        sessionStorage.removeItem('currentUser');
        return null;
      }
      try {
        return JSON.parse(userData) as CurrentUser;
      } catch (error) {
        console.error('❌ [AuthService] Error parsing userData', error);
        sessionStorage.removeItem('currentUser');
        return null;
      }
    }
    
    const decoded = this.decodeJWT();
    if (decoded?.email) {
      const userFromJWT: CurrentUser = {
        id: decoded.sub || decoded.userId || 'unknown',
        email: decoded.email,
        nombre: decoded.name || decoded.nombre || decoded.email.split('@')[0],
        apellidos: decoded.apellidos || decoded.apellido || '',
        rol: this.normalizeRole(decoded.role) || 'user',
        tipo: decoded.tipo || decoded.role,
        avatar: decoded.avatar || decoded.foto
      };
      sessionStorage.setItem('currentUser', JSON.stringify(userFromJWT));
      return userFromJWT;
    }
    return null;
  }

  private mapBackendTypeToRole(tipo: string): UserRole {
    if (!tipo) return 'user';
    const tipoLower = tipo.toLowerCase();
    if (tipoLower.includes('admin')) return 'admin';
    if (tipoLower.includes('creador') || tipoLower.includes('creator')) return 'creator';
    return 'user';
  }

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  getCurrentUserFromBackend(): Observable<CurrentUser> {
    return this.http.get<CurrentUser>(`${environment.baseApiUrl}/auth/me`).pipe(
      tap((user: CurrentUser) => {
        if (user.tipo && !user.rol) {
          user.rol = this.normalizeRole(user.tipo) || 'user';
        }
        return user;
      }),
      catchError((error) => {
        console.error('❌ [AuthService] Error obteniendo datos del usuario:', error);
        return throwError(() => error);
      })
    );
  }

  private decodeJWT(): any {
    const token = this.getToken();
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('JWT inválido: debe tener 3 partes');
      return JSON.parse(atob(parts[1]));
    } catch (error) {
      console.error('❌ [AuthService] decodeJWT: Error al decodificar token:', error);
      return null;
    }
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
    const decoded = this.decodeJWT();
    return decoded?.role ? this.normalizeRole(decoded.role) : null;
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
      this.http.post(`${environment.baseApiUrl}/auth/logout`, { refreshToken }).subscribe({
        error: (error) => console.error('❌ [AuthService] Error al invalidar refresh token:', error)
      });
    }
    
    if (redirect) this.router.navigate(['/']);
  }

  emitSessionExpired(reason: string = 'session-timeout', message: string = 'Tu sesión ha expirado'): void {
    this.sessionExpired$.next({ reason, message });
  }

  startIdleTimer(): void {
    const sessionConfig = this.getSessionConfig();
    if (!sessionConfig?.idleTimeout) {
      console.error('❌ [AuthService] No se encontró configuración de Idle Timeout del backend');
      return;
    }

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
    if (!sessionConfig?.absoluteTimeout) {
      console.error('❌ [AuthService] No se encontró configuración de Absolute Timeout del backend');
      return;
    }

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
}
