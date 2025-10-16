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
      let userMessage = 'Se ha producido un error inesperado. Inténtelo de nuevo más tarde.';

      // Si el backend envía un mensaje de error personalizado, usarlo
      if (error.error && typeof error.error === 'object' && error.error.message) {
        userMessage = error.error.message;
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