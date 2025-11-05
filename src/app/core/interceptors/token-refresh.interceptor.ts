import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor para manejar errores 401 y renovar tokens automáticamente
 */
export const tokenRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Solo interceptar errores 401 (Unauthorized)
      if (error.status === 401) {
        console.log('🔄 [TokenRefreshInterceptor] Error 401 detectado en:', req.url);
        
        // Rutas que NO deben intentar renovar el token (rutas públicas de autenticación)
        const publicAuthUrls = [
          '/auth/login',
          '/auth/register',
          '/auth/verify-email',
          '/auth/verify-code',
          '/auth/forgot-password',
          '/auth/reset-password',
          '/auth/refresh'
        ];

        // Si es una ruta pública de autenticación, NO intentar renovar token
        if (publicAuthUrls.some(url => req.url.includes(url))) {
          console.log('⚠️ [TokenRefreshInterceptor] Ruta pública de autenticación - no renovar token');
          return throwError(() => error);
        }

        // Intentar renovar el token
        return authService.refreshAccessToken().pipe(
          switchMap(() => {
            console.log('✅ [TokenRefreshInterceptor] Token renovado - reintentando petición original');
            
            // Clonar la petición original con el nuevo token
            const newToken = authService.getToken();
            const clonedReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`
              }
            });
            
            // Reintentar la petición original con el nuevo token
            return next(clonedReq);
          }),
          catchError(refreshError => {
            console.log('❌ [TokenRefreshInterceptor] No se pudo renovar el token');
            // El error ya fue manejado en refreshAccessToken()
            return throwError(() => refreshError);
          })
        );
      }

      // Para otros errores, simplemente propagarlos
      return throwError(() => error);
    })
  );
};
