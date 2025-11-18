import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { getRefreshInProgress } from './token-refresh.interceptor';

/**
 * Interceptor global para manejo de errores HTTP
 * Maneja errores de autenticación (401) redirigiendo al login
 * Propaga otros errores para que sean manejados por los servicios específicos
 * 
 * NOTA: Los errores 401 son manejados PRIMERO por el token-refresh interceptor
 * Este interceptor solo redirige si la renovación falló
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  
  // No interceptar errores para login, verify y verify-password, dejar que los servicios/componentes lo manejen
  if (req.url.includes('/auth/login') ||
      req.url.includes('/auth/verify') ||
      req.url.includes('/auth/refresh') ||
      req.url.includes('/users/verify-password')) {
    return next(req);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.log('🔍 [ErrorInterceptor] Error recibido:', error.status, error.url);
      
      // Manejar errores de autenticación (401) solo si llegaron aquí
      // (significa que el token-refresh interceptor no pudo renovar)
      if (error.status === 401) {
        console.log('🔍 [ErrorInterceptor] Error 401 detectado, verificando refresh en progreso...');
        console.log('   getRefreshInProgress():', getRefreshInProgress());
        
        // ⚠️ NO redirigir si hay un refresh en progreso
        // El token-refresh interceptor se encargará de reintentar
        if (getRefreshInProgress()) {
          console.log('⏳ [ErrorInterceptor] Refresh en progreso - no redirigir al login');
          return throwError(() => error);
        }
        
        console.log('❌ [ErrorInterceptor] 401 sin refresh en progreso - redirigir al login');
        // Limpiar token expirado
        sessionStorage.removeItem('authToken');
        // Redirigir al login
        router.navigate(['/login']);
      }

      // Para errores de autenticación, ya redirigimos al login arriba
      // Para otros errores, simplemente propagar el error original
      return throwError(() => error);
    })
  );
};