import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/*
 * Interfaz para el creador devuelto por el endpoint ad-creator
 * Contiene toda la información de administración de creadores de contenido
 */
export interface CreatorEC {
  descripcion: string;
  id: string;
  nombre: string;
  apellidos: string;
  correo: string;
  alias: string;
  especialidad: string;
  tipoContenido: string;
  activo: boolean;
  foto?: string;
}

/*
 * CreatorService
 * Servicio para la gestión de creadores de contenido administrativos.
 * Maneja las comunicaciones HTTP con el endpoint ad-creator del backend.
 * Incluye manejo de errores centralizado siguiendo el patrón del ApiService.
 */
@Injectable({
  providedIn: 'root'
})
export class CreatorService {
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
            userMessage = 'No tienes permisos para ver los creadores.';
            break;
          case 404:
            userMessage = 'El servicio de creadores no está disponible en este momento.';
            break;
          case 500:
            userMessage = 'Error interno del servidor. Por favor, intenta más tarde.';
            break;
          case 503:
            userMessage = 'El servicio de creadores no está disponible temporalmente.';
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
   * Obtiene la lista completa de creadores para administración.
   * Endpoint: GET /ad-creator
   * Incluye manejo de errores centralizado.
   */
  listarCreadores(): Observable<CreatorEC[]> {
    return this.http.get<CreatorEC[]>(`${this.base}/ad-creator`).pipe(
      catchError(this.handleError('listar creadores', 'No se pudieron cargar los creadores'))
    );
  }

  /**
   * Crea un nuevo creador de contenido.
   * Endpoint: POST /ad-creator/crear
   */
  crearCreador(formData: FormData): Observable<any> {
    return this.http.post(`${this.base}/ad-creator/crear`, formData).pipe(
      catchError(this.handleError('crear creador', 'No se pudo crear el creador'))
    );
  }

  /**
   * Edita un creador existente.
   * Endpoint: PUT /ad-creator/editar/{id}
   */
  editarCreador(id: string, data: any): Observable<any> {
    return this.http.put(`${this.base}/ad-creator/editar/${id}`, data).pipe(
      catchError(this.handleError('editar creador', 'No se pudo editar el creador'))
    );
  }

  /**
   * Elimina un creador.
   * Endpoint: DELETE /ad-creator/eliminar/{id}
   */
  eliminarCreador(id: string): Observable<any> {
    return this.http.delete(`${this.base}/ad-creator/eliminar/${id}`).pipe(
      catchError(this.handleError('eliminar creador', 'No se pudo eliminar el creador'))
    );
  }
}
