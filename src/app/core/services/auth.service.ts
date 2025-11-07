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
  private tokenExpiryTimer: any = null; // Timer para renovar token antes de que expire
  
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
      '/upload-content'
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
    '/qr-code-setup',
    '/verify-email',
    '/verify-code',
    '/verify-otp',
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
    
    // Decodificar el token JWT para obtener el tiempo de expiración
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000; // Convertir a milisegundos
      sessionStorage.setItem('tokenExpiry', expiryTime.toString());
      
      // Iniciar timer para renovar token proactivamente
      this.startTokenExpiryTimer(expiryTime);
    } catch (error) {
      console.error('❌ [AuthService] Error decodificando token JWT:', error);
    }
  }

  /**
   * Guarda el Access Token en sessionStorage (método público)
   */
  setAccessToken(token: string): void {
    this.setToken(token);
  }

  /**
   * Guarda el Refresh Token en localStorage para persistencia entre pestañas
   */
  private setRefreshToken(refreshToken: string): void {
    localStorage.setItem('refreshToken', refreshToken);
  }

  /**
   * Guarda el Refresh Token en localStorage (método público)
   */
  setRefreshTokenPublic(refreshToken: string): void {
    this.setRefreshToken(refreshToken);
  }

  /**
   * Guarda la configuración de timeouts recibida del backend
   */
  saveSessionConfig(idleTimeoutMillis: number, absoluteTimeoutMillis: number): void {
    const config = {
      idleTimeout: idleTimeoutMillis,
      absoluteTimeout: absoluteTimeoutMillis
    };
    sessionStorage.setItem('sessionConfig', JSON.stringify(config));
    console.log('💾 [AuthService] Configuración de sesión guardada:', config);
  }

  /**
   * Obtiene la configuración de timeouts del backend (si existe)
   */
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
        this.setRefreshTokenPublic(response.refreshToken);
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
        
        // Cerrar sesión omitiendo invalidación del token (ya está invalidado en el backend)
        this.logout(true, true);
        
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtiene los datos del usuario actual del sessionStorage
   */
  getCurrentUser(): CurrentUser | null {
    const userData = sessionStorage.getItem('currentUser');
    if (userData) {
      // Proteger contra valores inválidos
      if (userData === 'undefined' || userData === 'null') {
        console.log('🔍 [AuthService] getCurrentUser: userData es un string inválido');
        sessionStorage.removeItem('currentUser');
        return null;
      }
      
      try {
        const user = JSON.parse(userData) as CurrentUser;
        console.log('🔍 [AuthService] getCurrentUser: user from sessionStorage', user);
        return user;
      } catch (error) {
        console.error('🔍 [AuthService] getCurrentUser: Error parsing userData', error);
        sessionStorage.removeItem('currentUser');
        return null;
      }
    }
    
    // Si no hay en sessionStorage, construir desde JWT
    const decoded = this.decodeJWT();
    if (decoded?.email) {
      console.log('📝 [AuthService] getCurrentUser: Construyendo usuario desde JWT');
      
      // Normalizar el rol del JWT
      const normalizedRole = this.normalizeRole(decoded.role) || 'user';
      
      const userFromJWT: CurrentUser = {
        id: decoded.sub || decoded.userId || 'unknown',
        email: decoded.email,
        nombre: decoded.name || decoded.nombre || decoded.email.split('@')[0],
        apellidos: decoded.apellidos || decoded.apellido || '',
        rol: normalizedRole,
        tipo: decoded.tipo || decoded.role, // Guardar el tipo original del backend también
        avatar: decoded.avatar || decoded.foto
      };
      
      console.log('✅ [AuthService] Usuario construido desde JWT:', userFromJWT);
      // Guardar en sessionStorage para futuras referencias
      sessionStorage.setItem('currentUser', JSON.stringify(userFromJWT));
      return userFromJWT;
    }
    
    return null;
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
   * Obtiene los datos completos del usuario desde el backend
   * Se usa cuando el backend no devuelve los datos en la respuesta de login/2FA
   */
  getCurrentUserFromBackend(): Observable<CurrentUser> {
    console.log('🔍 [AuthService] Obteniendo datos del usuario del backend...');
    return this.http.get<CurrentUser>(`${environment.baseApiUrl}/auth/me`).pipe(
      tap((user: CurrentUser) => {
        console.log('✅ [AuthService] Datos del usuario obtenidos del backend:', user);
        // Normalizar el rol si viene del backend
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

  /**
   * Inicia el setup de 2FA durante el login para usuarios nuevos sin 2FA configurado
   * Retorna QR, secreto y códigos de respaldo para que el usuario escanee
   * 
   * @param sessionToken - Token temporal de sesión 2FA válido por 5 minutos
   * @returns Observable con respuesta del setup (QR, secreto, códigos respaldo)
   */
  setupDuringLogin(sessionToken: string): Observable<any> {
    console.log('🔐 [AuthService] Iniciando setup de 2FA durante login...');
    return this.http.post<any>(
      `${environment.baseApiUrl}/auth/2fa/setup-during-login`,
      { sessionToken }
    ).pipe(
      tap((response) => {
        console.log('✅ [AuthService] Setup 2FA iniciado exitosamente');
        console.log('   - QR Code disponible:', response.qrCode ? '✅' : '❌');
        console.log('   - Secreto disponible:', response.secret ? '✅' : '❌');
        console.log('   - Códigos respaldo:', response.backupCodes?.length || 0);
      }),
      catchError((error) => {
        console.error('❌ [AuthService] Error iniciando setup de 2FA:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Verifica e habilita 2FA durante el setup inicial
   * El usuario introduce el código TOTP de su authenticator
   * 
   * @param request - { sessionToken, code, isBackupCode }
   * @returns Observable con tokens JWT si verificación es exitosa
   */
  verifyAndEnable(request: { sessionToken: string; code: string; isBackupCode?: boolean }): Observable<any> {
    console.log('🔐 [AuthService] Verificando y habilitando 2FA...');
    return this.http.post<any>(
      `${environment.baseApiUrl}/auth/2fa/verify-and-enable`,
      request
    ).pipe(
      tap((response) => {
        console.log('✅ [AuthService] 2FA verificado y habilitado exitosamente');
        console.log('   - Access Token:', response.accessToken ? '✅' : '❌');
        console.log('   - Refresh Token:', response.refreshToken ? '✅' : '❌');
      }),
      catchError((error) => {
        console.error('❌ [AuthService] Error verificando 2FA:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Verifica código TOTP para usuarios que ya tienen 2FA configurado
   * Se usa cuando un usuario con 2FA existente se autentica
   * 
   * @param request - { sessionToken, code, isBackupCode }
   * @returns Observable con tokens JWT si verificación es exitosa
   */
  verify(request: { sessionToken: string; code: string; isBackupCode?: boolean }): Observable<any> {
    console.log('🔐 [AuthService] Enviando request de verificación');
    console.log('   - sessionToken: ***' + request.sessionToken.slice(-8));
    console.log('   - code: ' + request.code);
    console.log('   - isBackupCode: ' + request.isBackupCode);
    console.log('   - code length: ' + request.code.length);
    console.log('   - code type: ' + typeof request.code);
    console.log('🔍 [AuthService] REQUEST BODY COMPLETO (JSON):', JSON.stringify(request, null, 2));
    console.log('🔍 [AuthService] KEYS del request:', Object.keys(request));
    console.log('🔍 [AuthService] isBackupCode TYPE:', typeof request.isBackupCode);
    console.log('🔍 [AuthService] isBackupCode VALUE:', request.isBackupCode === true ? 'TRUE (boolean)' : request.isBackupCode === false ? 'FALSE (boolean)' : 'UNDEFINED or OTHER');
    return this.http.post<any>(
      `${environment.baseApiUrl}/auth/2fa/verify`,
      request
    ).pipe(
      tap((response) => {
        console.log('✅ [AuthService] Código TOTP verificado exitosamente');
        console.log('   - Access Token:', response.accessToken ? '✅' : '❌');
        console.log('   - Refresh Token:', response.refreshToken ? '✅' : '❌');
      }),
      catchError((error) => {
        console.error('❌ [AuthService] Error verificando TOTP:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Decodifica el JWT actual y extrae sus claims
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private decodeJWT(): any {
    const token = this.getToken();
    if (!token) {
      console.log('🔐 [AuthService] decodeJWT: No hay token disponible');
      return null;
    }
    
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('JWT inválido: debe tener 3 partes');
      }
      
      const decoded = JSON.parse(atob(parts[1]));
      console.log('🔐 [AuthService] decodeJWT: Token decodificado exitosamente');
      console.log('   - sub:', decoded.sub);
      console.log('   - email:', decoded.email);
      console.log('   - role:', decoded.role);
      console.log('   - Todas las claims:', Object.keys(decoded));
      
      return decoded;
    } catch (error) {
      console.error('❌ [AuthService] decodeJWT: Error al decodificar token:', error);
      return null;
    }
  }

  /**
   * Normaliza los roles del backend a los roles del frontend
   */
  private normalizeRole(backendRole: string): UserRole | null {
    const roleMap: Record<string, UserRole> = {
      'ADMIN': 'admin',
      'ADMINISTRADOR': 'admin',
      'CREADORCONTENIDO': 'creator',
      'CREADOR': 'creator',
      'USUARIOEV': 'user',
      'USUARIO_EV': 'user',
      'USER': 'user'
    };
    
    const normalized = roleMap[backendRole.toUpperCase()];
    
    if (!normalized) {
      console.warn('⚠️ [AuthService] normalizeRole: Rol desconocido:', backendRole);
    }
    
    return normalized || null;
  }

  /**
   * Obtiene el rol del usuario actual directamente del JWT
   * El backend siempre incluye el rol en el token
   */
  getCurrentRole(): UserRole | null {
    const decoded = this.decodeJWT();
    if (decoded?.role) {
      console.log('🔐 [AuthService] getCurrentRole: Rol extraído del JWT:', decoded.role);
      const normalizedRole = this.normalizeRole(decoded.role);
      console.log('🔐 [AuthService] getCurrentRole: Rol normalizado:', normalizedRole);
      return normalizedRole;
    }
    
    console.warn('⚠️ [AuthService] getCurrentRole: No se encontró rol en el JWT');
    return null;
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
   * @param skipBackendInvalidation - Si debe omitir la invalidación del token en el backend (default: false)
   */
  logout(redirect: boolean = true, skipBackendInvalidation: boolean = false): void {
    console.log('🚪 [AuthService] Cerrando sesión...');
    
    // Detener temporizadores
    this.stopAllTimers();
    
    // Obtener refreshToken antes de eliminarlo
    const refreshToken = this.getRefreshToken();
    
    // Limpiar tokens, datos de usuario y configuración de sesión del frontend
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('sessionConfig'); // Limpiar configuración de timeouts
    sessionStorage.removeItem('tokenExpiry'); // Limpiar timestamp de expiración del token
    localStorage.removeItem('refreshToken');
    
    // Llamar al backend para invalidar el refresh token (si existe y no se debe omitir)
    if (refreshToken && !skipBackendInvalidation) {
      console.log('🗑️ [AuthService] Invalidando refresh token en el backend...');
      this.http.post(`${environment.baseApiUrl}/auth/logout`, { refreshToken }).subscribe({
        next: () => console.log('✅ [AuthService] Refresh token invalidado en el backend'),
        error: (error) => console.error('❌ [AuthService] Error al invalidar refresh token:', error)
      });
    } else if (skipBackendInvalidation) {
      console.log('⏭️ [AuthService] Omitiendo invalidación del token en el backend (ya invalidado)');
    }
    
    if (redirect) {
      this.router.navigate(['/']);
    }
  }

  /**
   * Emite un evento de sesión expirada para que muestre el modal
   * Útil cuando otros componentes detectan que la sesión ha expirado
   */
  emitSessionExpired(reason: string = 'session-timeout', message: string = 'Tu sesión ha expirado'): void {
    console.log('⏰ [AuthService] Emitiendo evento de sesión expirada:', { reason, message });
    this.sessionExpired$.next({ reason, message });
  }

  /**
   * Inicia el temporizador de Idle Timeout según la configuración del backend
   * Se reinicia en cada actividad del usuario
   */
  startIdleTimer(): void {
    // Obtener configuración del backend
    const sessionConfig = this.getSessionConfig();
    
    if (!sessionConfig?.idleTimeout) {
      console.error('❌ [AuthService] No se encontró configuración de Idle Timeout del backend');
      return;
    }

    const timeout = sessionConfig.idleTimeout;
    console.log(`⏰ [AuthService] Iniciando Idle Timer: ${timeout / 1000} segundos`);

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
   * Inicia el temporizador de Absolute Timeout según la configuración del backend
   * Se ejecuta UNA VEZ al hacer login y NO se reinicia
   */
  startAbsoluteTimer(): void {
    // Obtener configuración del backend
    const sessionConfig = this.getSessionConfig();
    
    if (!sessionConfig?.absoluteTimeout) {
      console.error('❌ [AuthService] No se encontró configuración de Absolute Timeout del backend');
      return;
    }

    const timeout = sessionConfig.absoluteTimeout;
    console.log(`⏰ [AuthService] Iniciando Absolute Timer: ${timeout / 3600000} horas`);

    // Limpiar timer anterior si existe
    if (this.absoluteTimer) {
      clearTimeout(this.absoluteTimer);
    }

    // Crear nuevo timer
    this.absoluteTimer = setTimeout(() => {
      console.log('⏰ [AuthService] Absolute Timeout alcanzado - cerrando sesión...');
      this.sessionExpired$.next({ 
        reason: 'absolute', 
        message: 'Tu sesión ha expirado (límite de tiempo alcanzado)' 
      });
      // Omitir invalidación del token (el backend ya lo invalidó por timeout)
      this.logout(true, true);
    }, timeout);
  }

  /**
   * Inicia un timer para renovar el token proactivamente antes de que expire
   * @param expiryTime - Timestamp en milisegundos cuando expira el token
   */
  private startTokenExpiryTimer(expiryTime: number): void {
    // Limpiar timer anterior si existe
    if (this.tokenExpiryTimer) {
      clearTimeout(this.tokenExpiryTimer);
    }

    const now = Date.now();
    const timeUntilExpiry = expiryTime - now;
    
    // Renovar el token 10 segundos ANTES de que expire
    // O si ya pasó el tiempo, renovar inmediatamente
    const renewBeforeExpiry = 10000; // 10 segundos
    const timeUntilRenewal = Math.max(0, timeUntilExpiry - renewBeforeExpiry);

    console.log(`⏰ [AuthService] Token expira en ${timeUntilExpiry / 1000}s - renovación programada en ${timeUntilRenewal / 1000}s`);

    this.tokenExpiryTimer = setTimeout(() => {
      console.log('⏰ [AuthService] Renovando token proactivamente antes de expiración...');
      this.refreshAccessToken().subscribe({
        next: () => {
          console.log('✅ [AuthService] Token renovado proactivamente');
        },
        error: (error) => {
          console.error('❌ [AuthService] Error en renovación proactiva:', error);
          // El error ya fue manejado en refreshAccessToken()
        }
      });
    }, timeUntilRenewal);
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
    if (this.tokenExpiryTimer) {
      clearTimeout(this.tokenExpiryTimer);
      this.tokenExpiryTimer = null;
    }
    console.log('⏹️ [AuthService] Todos los temporizadores detenidos');
  }

  /**
   * Método para llamar después de un login exitoso
   * Inicia ambos temporizadores (idempotente - no reinicia si ya están activos)
   */
  startSessionTimers(): void {
    // Verificar si los timers ya están activos
    if (this.idleTimer || this.absoluteTimer) {
      console.log('⚠️ [AuthService] Temporizadores ya iniciados, omitiendo reinicio');
      return;
    }
    
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
