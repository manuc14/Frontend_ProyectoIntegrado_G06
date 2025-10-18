import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { extractApiErrorMessage } from '../utils/error-utils';

/**
 * Interceptor global para manejo de errores HTTP
 * Convierte errores técnicos en mensajes amigables para el usuario
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let userMessage = 'Ha ocurrido un error inesperado';

      // Si backend provee mensaje estructurado, usarlo
      const e = extractApiErrorMessage(error);
      if (e?.message) {
        userMessage = e.message;
      } else {
        // Mensajes amigables basados en códigos de estado HTTP
        switch (error.status) {
          case 400:
            userMessage = 'Los datos enviados no son válidos. Por favor, verifica la información.';
            break;
          case 401:
            userMessage = 'No tienes autorización para realizar esta acción.';
            break;
          case 403:
            userMessage = 'No tienes permisos para acceder a este recurso.';
            break;
          case 404:
            userMessage = 'El servicio solicitado no está disponible en este momento.';
            break;
          case 409:
            userMessage = 'Ya existe un registro con esta información.';
            break;
          case 422:
            userMessage = 'Los datos proporcionados no son válidos.';
            break;
          case 500:
            userMessage = 'Error interno del servidor. Por favor, intenta más tarde.';
            break;
          case 503:
            userMessage = 'El servicio no está disponible temporalmente.';
            break;
          default:
            if (error.status === 0) {
              userMessage = 'No se puede conectar con el servidor. Verifica tu conexión a internet.';
            }
        }
      }

      console.error('Error HTTP interceptado:', error);
      
      // Crear un nuevo error con el mensaje amigable
      const friendlyError = new Error(userMessage);
      (friendlyError as any).originalError = error;
      
      return throwError(() => friendlyError);
    })
  );
};