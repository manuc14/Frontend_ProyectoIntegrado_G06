import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, finalize, filter, take, BehaviorSubject } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { isPublicAuthRoute } from '../constants/route-config.constants';

// Estado de refresh con BehaviorSubject
const refreshInProgress$ = new BehaviorSubject<boolean>(false);
// Resultado del último refresh (null = no iniciado, true = éxito, false = fallo)
const refreshResult$ = new BehaviorSubject<boolean | null>(null);

/**
 * Función helper para verificar si hay un refresh en progreso
 * Exportada para que otros interceptors puedan consultarla
 */
export function getRefreshInProgress(): boolean {
  return refreshInProgress$.value;
}

/**
 * Interceptor para manejar errores 401 y renovar tokens automáticamente
 * Implementa un sistema para evitar múltiples refreshes simultáneos
 * y mantiene un queue de peticiones pendientes
 */
export const tokenRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Solo interceptar errores 401 (Unauthorized)
      if (error.status === 401) {
        console.log('🔄 [TokenRefreshInterceptor] Error 401 detectado en:', req.url);
        
        // ✅ Usar helper centralizado para verificar rutas públicas
        if (isPublicAuthRoute(req.url)) {
          console.log('⚠️ [TokenRefreshInterceptor] Ruta pública de autenticación - no renovar token');
          return throwError(() => error);
        }

        // No intentar renovar si ya estamos en una petición de refresh
        // PERO si el refresh falló, debemos propagar el error para que error.interceptor redirija
        if (req.url.includes('/auth/refresh')) {
          console.log('⚠️ [TokenRefreshInterceptor] Error 401 en endpoint de refresh - propagando error');
          console.log('   Esto significa que el refresh token expiró - redirigir al login');
          return throwError(() => error);
        }

        // Si ya estamos refrescando, esperar a que se complete
        if (refreshInProgress$.value) {
          console.log('⏳ [TokenRefreshInterceptor] Refresh ya en progreso - esperando a que se complete');
          
          // Esperar a que el refresh se complete (cuando refreshInProgress$ sea false)
          return refreshInProgress$.pipe(
            // Saltar el primer valor (true) y tomar el false que indica que terminó
            filter(isRefreshing => !isRefreshing),
            take(1),
            switchMap(() => {
              console.log('🔄 [TokenRefreshInterceptor] Refresh terminó, verificando resultado...');
              console.log('   refreshResult$:', refreshResult$.value);
              
              // Verificar si el refresh fue exitoso
              if (refreshResult$.value === false) {
                console.log('❌ [TokenRefreshInterceptor] Refresh falló - peticiones en cola fallarán');
                return throwError(() => new Error('Token refresh failed - redirecting to login'));
              }
              
              // El refresh se completó exitosamente, reintentar con el nuevo token
              console.log('✅ [TokenRefreshInterceptor] Refresh exitoso - reintentando petición en cola');
              const newToken = authService.getToken();
              if (!newToken) {
                console.log('❌ [TokenRefreshInterceptor] No hay token después del refresh exitoso');
                return throwError(() => new Error('Token refresh failed'));
              }
              
              const clonedReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`
                }
              });
              
              return next(clonedReq);
            })
          );
        }

        // Marcar que estamos refrescando
        refreshInProgress$.next(true);
        refreshResult$.next(null); // Resetear resultado
        console.log('🔄 [TokenRefreshInterceptor] Iniciando refresh de token');

        // Intentar renovar el token
        return authService.refreshAccessToken().pipe(
          switchMap(() => {
            console.log('✅ [TokenRefreshInterceptor] Token renovado - reintentando petición original');
            refreshResult$.next(true); // Marcar éxito
            
            // Clonar la petición original con el nuevo token
            const newToken = authService.getToken();
            if (!newToken) {
              console.error('❌ [TokenRefreshInterceptor] No hay token después del refresh');
              refreshResult$.next(false);
              return throwError(() => new Error('Token refresh failed'));
            }
            
            const clonedReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`
              }
            });
            
            // Reintentar la petición original con el nuevo token
            return next(clonedReq);
          }),
          catchError(refreshError => {
            console.log('❌ [TokenRefreshInterceptor] CATCH ERROR ejecutado - refresh falló');
            console.log('   refreshInProgress$ antes:', refreshInProgress$.value);
            console.log('❌ [TokenRefreshInterceptor] No se pudo renovar el token');
            refreshResult$.next(false); // Marcar fallo
            // Marcar que el refresh terminó (incluso si falló)
            // Esto permite que el error.interceptor procese el 401 y redirija al login
            refreshInProgress$.next(false);
            console.log('   refreshInProgress$ después:', refreshInProgress$.value);
            console.log('   refreshResult$:', refreshResult$.value);
            // El error ya fue manejado en refreshAccessToken()
            return throwError(() => refreshError);
          }),
          finalize(() => {
            console.log('✅ [TokenRefreshInterceptor] FINALIZE ejecutado');
            console.log('   refreshInProgress$ antes:', refreshInProgress$.value);
            // Asegurar que el refresh se marca como completado
            refreshInProgress$.next(false);
            console.log('   refreshInProgress$ después:', refreshInProgress$.value);
            console.log('   refreshResult$:', refreshResult$.value);
            console.log('✅ [TokenRefreshInterceptor] Refresh completado, notificando peticiones pendientes');
          })
        );
      }

      // Para otros errores, simplemente propagarlos
      return throwError(() => error);
    })
  );
};
