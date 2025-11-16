import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Interceptor global para manejo de errores HTTP
 * Maneja errores de autenticación (401) redirigiendo al login
 * Propaga otros errores para que sean manejados por los servicios específicos
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  
  // No interceptar errores para login, verify y verify-password, dejar que los servicios/componentes lo manejen
  if (req.url.includes('/auth/login') || 
      req.url.includes('/auth/verify') ||
      req.url.includes('/users/verify-password')) {
    return next(req);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Manejar errores de autenticación (401)
      if (error.status === 401) {
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