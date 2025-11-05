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
  console.log('🛡️ [authGuard] Route params:', route.params);
  console.log('🛡️ [authGuard] Route path:', route.routeConfig?.path);

  // Verificar si está autenticado
  if (!authService.isAuthenticated()) {
    console.log('❌ [authGuard] No autenticado - redirigiendo a /login');
    router.navigate(['/login']);
    return false;
  }

  console.log('✅ [authGuard] Usuario autenticado');

  // Verificar si la ruta está permitida para el rol actual
  const isAllowed = authService.isRouteAllowedForCurrentUser(state.url);
  console.log('🛡️ [authGuard] isRouteAllowedForCurrentUser devolvió:', isAllowed);
  
  if (!isAllowed) {
    // Redirigir a la página principal del usuario según su rol, SIN cerrar sesión
    console.log('❌ [authGuard] Ruta no permitida - redirigiendo a página principal del usuario');
    const role = authService.getCurrentRole();
    if (role) {
      const redirectRoute = authService.getRedirectRouteForRole(role);
      console.log('🔄 [authGuard] Redirigiendo a:', redirectRoute);
      router.navigate([redirectRoute]);
    } else {
      // Si no hay rol, entonces sí cerrar sesión
      console.log('❌ [authGuard] No se pudo obtener el rol - cerrando sesión');
      authService.logout(true);
    }
    return false;
  }

  console.log('✅ [authGuard] Acceso permitido');
  return true;
};

/**
 * Guard para rutas públicas (login, signup, etc)
 * Redirige a la página correspondiente si ya está autenticado
 */
export const publicGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🌐 [publicGuard] Verificando acceso a ruta pública:', state.url);

  // Si está autenticado, redirigir según el rol
  if (authService.isAuthenticated()) {
    console.log('⚠️ [publicGuard] Usuario ya autenticado - redirigiendo');
    const role = authService.getCurrentRole();
    if (role) {
      const redirectRoute = authService.getRedirectRouteForRole(role);
      console.log('🔄 [publicGuard] Redirigiendo a:', redirectRoute);
      router.navigate([redirectRoute]);
      return false;
    }
  }

  console.log('✅ [publicGuard] Acceso permitido a ruta pública');
  return true;
};
