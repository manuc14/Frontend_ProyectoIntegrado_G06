import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor para agregar automáticamente el token JWT a todas las peticiones HTTP
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Rutas que NO necesitan autenticación
  const publicUrls = [
    '/auth/login',
    '/auth/register',
    '/auth/verify-email',
    '/auth/verify-code',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/resources/',
    '/assets/',
    '/auth/reset-password'
  ];

  // Rutas que SÍ necesitan autenticación (incluso si están en publicUrls)
  const authenticatedUrls = [
    '/api/files/thumbnails/', // Thumbnails requieren autenticación
    '/api/files/audio/' // Archivos de audio requieren autenticación
  ];

  // Verificar si la petición es a una ruta pública
  const isPublicUrl = publicUrls.some(url => req.url.includes(url));

  // Verificar si la petición requiere autenticación explícitamente
  const requiresAuth = authenticatedUrls.some(url => req.url.includes(url));

  // Si es una ruta pública Y no requiere autenticación explícita, no agregar token
  if (isPublicUrl && !requiresAuth) {
    return next(req);
  }

  // Obtener el token de acceso
  const token = authService.getToken();

  // Si hay token, clonar la petición y agregar el header Authorization
  if (token) {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedReq);
  }

  // Si no hay token, enviar la petición sin modificar
  return next(req);
};
