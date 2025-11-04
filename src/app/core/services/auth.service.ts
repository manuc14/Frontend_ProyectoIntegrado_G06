import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

/**
 * @fileoverview Servicio centralizado para la gestión de autenticación y sesiones
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
      '/ad-creators-edit',
      '/ad-consultprofile'
    ],
    creator: [
      '/content-creator',
      '/upload-content'
    ],
    user: [
      '/catalog'
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
   * Obtiene el token de autenticación del sessionStorage
   */
  getToken(): string | null {
    return sessionStorage.getItem('authToken');
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
    const isAllowed = allowedRoutes.some(route => currentPath.startsWith(route));
    console.log(isAllowed ? '✅ [AuthService] Ruta permitida' : '❌ [AuthService] Ruta NO permitida');
    
    return isAllowed;
  }

  /**
   * Cierra la sesión del usuario y limpia el sessionStorage
   * @param redirect - Si debe redirigir a la página de inicio (default: true)
   */
  logout(redirect: boolean = true): void {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('currentUser');
    
    if (redirect) {
      this.router.navigate(['/']);
    }
  }

  /**
   * Valida la sesión en la ruta actual y cierra sesión si no está permitida
   * Debe llamarse en cada cambio de ruta
   */
  validateSessionForCurrentRoute(): void {
    const currentPath = this.router.url;
    console.log('🔍 [AuthService] validateSessionForCurrentRoute:', currentPath);
    
    // Si está en la página inicial (/) y está autenticado, redirigir según el rol
    if (currentPath === '/') {
      if (this.isAuthenticated()) {
        const role = this.getCurrentRole();
        if (role) {
          const redirectRoute = this.getRedirectRouteForRole(role);
          console.log('ℹ️ [AuthService] Usuario autenticado en página inicial - redirigiendo a:', redirectRoute);
          this.router.navigate([redirectRoute]);
        }
      }
      return;
    }

    // Si está autenticado y la ruta no está permitida, cerrar sesión
    if (this.isAuthenticated() && !this.isRouteAllowedForCurrentUser(currentPath)) {
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
