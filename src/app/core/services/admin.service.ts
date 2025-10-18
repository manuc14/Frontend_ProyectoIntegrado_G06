import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { extractApiErrorMessage } from '../utils/error-utils';
import { environment } from '../../../environments/environment';

/*
 * Interfaz para el administrador devuelto por el endpoint ad-admin
 * Contiene toda la información de administración de administradores
 */
export interface AdminEV {
  id: string;
  nombre: string;
  apellidos: string;
  correo: string;
  alias: string;
  departamento: string;
  activo: boolean;
  foto?: string;
}

/*
 * AdminService
 * Servicio para la gestión de administradores.
 * Maneja las comunicaciones HTTP con el endpoint ad-admin del backend.
 * Incluye manejo de errores centralizado siguiendo el patrón del ApiService.
 */
@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  // URL base configurada según el entorno (development/production)
  private base = environment.baseApiUrl;

  /**
   * Maneja errores HTTP y devuelve mensajes amigables para el usuario.
   * Evita mostrar errores técnicos como "404 Not Found" al usuario.
   */
  private handleError(operation = 'operación', defaultMessage = 'Ha ocurrido un error inesperado') {
    return (error: HttpErrorResponse): Observable<never> => {
      let adminMessage = 'Se ha producido un error inesperado. Inténtelo de nuevo más tarde.';

      const e = extractApiErrorMessage(error);
      if (e?.message) adminMessage = e.message;

      console.error(`Error en ${operation}:`, error);
      return throwError(() => new Error(adminMessage));
    };
  }

  /**
   * Obtiene la lista completa de administradores para administración.
   * Endpoint: GET /ad-admin
   * Incluye manejo de errores centralizado.
   */
  listarAdministradores(): Observable<AdminEV[]> {
    return this.http.get<AdminEV[]>(`${this.base}/ad-admin`).pipe(
      catchError(this.handleError('listar administradores', 'No se pudieron cargar los administradores'))
    );
  }

  /**
   * Crea un nuevo administrador.
   * Endpoint: POST /ad-admin/crear
   */
  crearAdministrador(formData: FormData): Observable<any> {
    return this.http.post(`${this.base}/ad-admin/crear`, formData).pipe(
      catchError(this.handleError('crear administrador', 'No se pudo crear el administrador'))
    );
  }

  /**
   * Edita un administrador existente.
   * Endpoint: PUT /ad-admin/editar/{id}
   */
  editarAdministrador(id: string, data: any): Observable<any> {
    return this.http.put(`${this.base}/ad-admin/editar/${id}`, data).pipe(
      catchError(this.handleError('editar administrador', 'No se pudo editar el administrador'))
    );
  }

  /**
   * Elimina un administrador.
   * Endpoint: DELETE /ad-admin/eliminar/{id}
   */
  eliminarAdministrador(id: string): Observable<any> {
    return this.http.delete(`${this.base}/ad-admin/eliminar/${id}`).pipe(
      catchError(this.handleError('eliminar administrador', 'No se pudo eliminar el administrador'))
    );
  }
}