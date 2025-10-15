import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/*
 * Interfaz para el usuario devuelto por el endpoint ad-user
 * Contiene toda la información de administración de usuarios
 */
export interface UserEV {
  id: string;
  nombre: string;
  apellidos: string;
  correo: string;
  alias: string;
  esVip: boolean;
  fechaNacimiento: string;
  activo: boolean;
  foto?: string;
}

/*
 * UserService
 * Servicio para la gestión de usuarios administrativos.
 * Maneja las comunicaciones HTTP con el endpoint ad-user del backend.
 * Incluye manejo de errores centralizado siguiendo el patrón del ApiService.
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  // URL base configurada según el entorno (development/production)
  private base = environment.baseApiUrl;

  /**
   * Maneja errores HTTP y devuelve mensajes amigables para el usuario.
   * Evita mostrar errores técnicos como "404 Not Found" al usuario.
   */
  private handleError(operation = 'operación', defaultMessage = 'Ha ocurrido un error inesperado') {
    return (error: HttpErrorResponse): Observable<never> => {
      let userMessage = defaultMessage;

      // Si el backend envía un mensaje de error personalizado, usarlo
      if (error.error && typeof error.error === 'object' && error.error.message) {
        userMessage = error.error.message;
      } else {
        // Mensajes amigables basados en códigos de estado HTTP
        switch (error.status) {
          case 400:
            userMessage = 'Los datos solicitados no son válidos.';
            break;
          case 401:
            userMessage = 'No tienes autorización para acceder a esta información.';
            break;
          case 403:
            userMessage = 'No tienes permisos para ver los usuarios.';
            break;
          case 404:
            userMessage = 'El servicio de usuarios no está disponible en este momento.';
            break;
          case 500:
            userMessage = 'Error interno del servidor. Por favor, intenta más tarde.';
            break;
          case 503:
            userMessage = 'El servicio de usuarios no está disponible temporalmente.';
            break;
          default:
            if (error.status === 0) {
              userMessage = 'No se puede conectar con el servidor. Verifica tu conexión a internet.';
            } else {
              userMessage = defaultMessage;
            }
        }
      }

      console.error(`Error en ${operation}:`, error);
      return throwError(() => new Error(userMessage));
    };
  }

  /** 
   * Obtiene la lista completa de usuarios para administración.
   * Endpoint: GET /ad-user
   * Incluye manejo de errores centralizado.
   */
  listarUsuarios(): Observable<UserEV[]> {
    return this.http.get<UserEV[]>(`${this.base}/ad-user`).pipe(
      catchError(this.handleError('listar usuarios', 'No se pudieron cargar los usuarios'))
    );
  }
}