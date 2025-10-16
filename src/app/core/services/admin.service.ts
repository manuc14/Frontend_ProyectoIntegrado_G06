import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

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

// Interfaz para errores de validación del backend
export interface ValidationError {
  field: string;
  message: string;
}

export interface BackendErrorResponse {
  message: string;
  details?: any;
  validationErrorCount?: number;
  errors?: ValidationError[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private base = environment.baseApiUrl;

  /**
   * Maneja errores HTTP y extrae errores de validación
   */
  private handleError(operation = 'operación') {
    return (error: HttpErrorResponse): Observable<never> => {
      let errorResponse: BackendErrorResponse = {
        message: 'Ha ocurrido un error inesperado',
        errors: [],
      };

      if (error.error && typeof error.error === 'object') {
        // El backend devuelve un objeto con detalles
        errorResponse = {
          message: error.error.message || 'Error en la operación', // Priorizar el mensaje del backend
          details: error.error.details || null,
          validationErrorCount: error.error.validationErrorCount || 0,
          errors: this.extractValidationErrors(error.error),
        };
      } else if (error.error && typeof error.error === 'string') {
        // El backend devuelve un mensaje de error como texto plano
        errorResponse.message = error.error;
      } else {
        // Mensajes genéricos según código de estado
        switch (error.status) {
          case 400:
            errorResponse.message = error.error?.message || 'Los datos enviados no son válidos';
            break;
          case 409:
            errorResponse.message = error.error?.message || 'Ya existe un registro con esta información';
            break;
          case 500:
            errorResponse.message = error.error?.message || 'Error interno del servidor';
            break;
          default:
            errorResponse.message = error.error?.message || 'Error al procesar la solicitud';
        }
      }

      console.error(`Error en ${operation}:`, error);
      return throwError(() => errorResponse);
    };
  }

  /**
   * Extrae los errores de validación del response del backend
   */
  private extractValidationErrors(errorBody: any): ValidationError[] {
    const errors: ValidationError[] = [];

    // Si el backend devuelve un objeto 'details' con los errores
    if (errorBody.details && typeof errorBody.details === 'object') {
      Object.keys(errorBody.details).forEach(field => {
        const messages = errorBody.details[field];
        if (Array.isArray(messages)) {
          messages.forEach(msg => {
            errors.push({ field: this.mapBackendFieldToFrontend(field), message: msg });
          });
        } else if (typeof messages === 'string') {
          errors.push({ field: this.mapBackendFieldToFrontend(field), message: messages });
        }
      });
    }

    // Si el backend devuelve un mensaje general, intentar extraer el campo
    if (errorBody.message && !errors.length) {
      const message = errorBody.message.toLowerCase();
      if (message.includes('correo') || message.includes('email')) {
        errors.push({ field: 'correo', message: errorBody.message });
      } else if (message.includes('alias')) {
        errors.push({ field: 'alias', message: errorBody.message });
      } else if (message.includes('contraseña')) {
        errors.push({ field: 'contrasena', message: errorBody.message });
      } else if (message.includes('departamento')) {
        errors.push({ field: 'departamento', message: errorBody.message });
      } else {
        // Error general
        errors.push({ field: '_general', message: errorBody.message });
      }
    }

    return errors;
  }

  /**
   * Mapea nombres de campos del backend a nombres del frontend
   */
  private mapBackendFieldToFrontend(backendField: string): string {
    const fieldMap: { [key: string]: string } = {
      'email': 'correo',
      'correo': 'correo',
      'password': 'contrasena',
      'contrasena': 'contrasena',
      'repetirPassword': 'confirmarContrasena',
      'confirmarContrasena': 'confirmarContrasena',
      'nombre': 'nombre',
      'apellidos': 'apellidos',
      'alias': 'alias',
      'departamento': 'departamento'
    };

    return fieldMap[backendField] || backendField;
  }

  /**
   * Lista todos los administradores
   */
  listarAdministradores(): Observable<AdminEV[]> {
    return this.http.get<AdminEV[]>(`${this.base}/ad-admin`).pipe(
      catchError(this.handleError('listar administradores'))
    );
  }

  /**
   * Crea un nuevo administrador
   */
  crearAdministrador(formData: FormData): Observable<any> {
    return this.http.post(`${this.base}/ad-admin/crear`, formData).pipe(
      catchError(this.handleError('crear administrador'))
    );
  }

  /**
   * Edita un administrador existente
   */
  editarAdministrador(id: string, data: any): Observable<any> {
    return this.http.put(`${this.base}/ad-admin/editar/${id}`, data).pipe(
      catchError(this.handleError('editar administrador'))
    );
  }

  /**
   * Elimina un administrador
   */
  eliminarAdministrador(id: string): Observable<any> {
    return this.http.delete(`${this.base}/ad-admin/eliminar/${id}`).pipe(
      catchError(this.handleError('eliminar administrador'))
    );
  }
}
