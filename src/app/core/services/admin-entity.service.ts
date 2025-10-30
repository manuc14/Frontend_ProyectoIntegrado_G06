import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// Interfaces comunes
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

// Interfaces específicas para cada entidad
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

// Configuración para cada tipo de entidad
export interface EntityConfig<T> {
  endpoint: string;
  entityName: string;
}

/**
 * AdminEntityService
 * Servicio genérico para la gestión de entidades administrativas (usuarios, admins, creadores).
 * Maneja operaciones CRUD comunes para diferentes tipos de entidades.
 */
@Injectable({
  providedIn: 'root'
})
export class AdminEntityService {
  private http = inject(HttpClient);
  private base = environment.baseApiUrl;

  // Configuraciones para cada entidad
  private entityConfigs = {
    user: { endpoint: 'ad-user', entityName: 'usuario' } as EntityConfig<UserEV>,
    admin: { endpoint: 'ad-admin', entityName: 'administrador' } as EntityConfig<AdminEV>,
    creator: { endpoint: 'ad-creator', entityName: 'creador' } as EntityConfig<CreatorEC>
  };

  /**
   * Obtiene los headers HTTP con el token de autenticación
   */
  private getAuthHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Maneja errores HTTP y devuelve mensajes amigables para el usuario.
   */
  private handleError(operation: string, entityName: string, defaultMessage = 'Ha ocurrido un error inesperado') {
    return (error: HttpErrorResponse): Observable<never> => {
      return throwError(() => error);
    };
  }  /**
   * Obtiene la lista completa de entidades para administración.
   */
  listarEntidades<T>(tipo: keyof typeof this.entityConfigs): Observable<T[]> {
    const config = this.entityConfigs[tipo];
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
    });
    return this.http.get<T[]>(`${this.base}/${config.endpoint}`, { headers }).pipe(
      catchError(this.handleError(`listar ${config.entityName}s`, config.entityName, `No se pudieron cargar los ${config.entityName}s`))
    );
  }

  /**
   * Crea una nueva entidad.
   */
  crearEntidad(tipo: keyof typeof this.entityConfigs, data: any): Observable<any> {
    const config = this.entityConfigs[tipo];
    let headers = new HttpHeaders({
      'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
    });
    if (!(data instanceof FormData)) {
      headers = headers.set('Content-Type', 'application/json');
    }
    return this.http.post(`${this.base}/${config.endpoint}/crear`, data, { headers }).pipe(
      catchError(this.handleError(`crear ${config.entityName}`, config.entityName, `No se pudo crear el ${config.entityName}`))
    );
  }

  /**
   * Edita una entidad existente.
   */
  editarEntidad(tipo: keyof typeof this.entityConfigs, id: string, data: any): Observable<any> {
    const config = this.entityConfigs[tipo];
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.base}/${config.endpoint}/editar/${id}`, data, { headers }).pipe(
      catchError(this.handleError(`editar ${config.entityName}`, config.entityName, `No se pudo editar el ${config.entityName}`))
    );
  }

  /**
   * Elimina una entidad.
   */
  eliminarEntidad(tipo: keyof typeof this.entityConfigs, id: string): Observable<any> {
    const config = this.entityConfigs[tipo];
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.base}/${config.endpoint}/eliminar/${id}`, { headers }).pipe(
      catchError(this.handleError(`eliminar ${config.entityName}`, config.entityName, `No se pudo eliminar el ${config.entityName}`))
    );
  }

  // Métodos específicos para compatibilidad
  listarUsuarios(): Observable<UserEV[]> {
    return this.listarEntidades<UserEV>('user');
  }

  crearUsuario(formData: FormData): Observable<any> {
    return this.crearEntidad('user', formData);
  }

  editarUsuario(id: string, data: any): Observable<any> {
    return this.editarEntidad('user', id, data);
  }

  eliminarUsuario(id: string): Observable<any> {
    return this.eliminarEntidad('user', id);
  }

  listarAdministradores(): Observable<AdminEV[]> {
    return this.listarEntidades<AdminEV>('admin');
  }

  crearAdministrador(formData: FormData): Observable<any> {
    return this.crearEntidad('admin', formData);
  }

  editarAdministrador(id: string, data: any): Observable<any> {
    return this.editarEntidad('admin', id, data);
  }

  eliminarAdministrador(id: string): Observable<any> {
    return this.eliminarEntidad('admin', id);
  }

  listarCreadores(): Observable<CreatorEC[]> {
    return this.listarEntidades<CreatorEC>('creator');
  }

  crearCreador(formData: FormData): Observable<any> {
    return this.crearEntidad('creator', formData);
  }

  editarCreador(id: string, data: any): Observable<any> {
    return this.editarEntidad('creator', id, data);
  }

  eliminarCreador(id: string): Observable<any> {
    return this.eliminarEntidad('creator', id);
  }
}