import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * @fileoverview Guard funcional para proteger rutas que requieren autenticación
 * 
 * Valida:
 * - Usuario autenticado
 * - Rol del usuario tiene acceso a la ruta
 * - Cierra sesión si la ruta no está permitida
 */

/**
 * Guard de autenticación
 * Protege rutas verificando token y permisos del rol
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🛡️ [authGuard] Verificando acceso a:', state.url);

  // Verificar si está autenticado
  if (!authService.isAuthenticated()) {
    console.log('❌ [authGuard] No autenticado - redirigiendo a /login');
    router.navigate(['/login']);
    return false;
  }

  console.log('✅ [authGuard] Usuario autenticado');

  // Verificar si la ruta está permitida para el rol actual
  if (!authService.isRouteAllowedForCurrentUser(state.url)) {
    // Cerrar sesión y redirigir a home
    console.log('❌ [authGuard] Ruta no permitida - cerrando sesión');
    authService.logout(true);
    return false;
  }

  console.log('✅ [authGuard] Acceso permitido');
  return true;
};

/**
 * Guard para rutas públicas (login, signup, etc)
 * Redirige a la página correspondiente si ya está autenticado
 */
export const publicGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si está autenticado, redirigir según el rol
  if (authService.isAuthenticated()) {
    const role = authService.getCurrentRole();
    if (role) {
      const redirectRoute = authService.getRedirectRouteForRole(role);
      router.navigate([redirectRoute]);
      return false;
    }
  }

  return true;
};
