/**
 * @fileoverview Servicio genérico para operaciones CRUD de entidades administrativas.
 * 
 * Este servicio proporciona:
 * - Operaciones CRUD (Create, Read, Update, Delete) para entidades admin
 * - Manejo unificado de errores con mensajes amigables
 * - Configuración específica por tipo de entidad (usuarios, admins, creadores)
 * - Integración con autenticación JWT
 * 
 * @module AdminEntityService
 * @requires HttpClient - Para comunicación con el backend
 * @requires environment - Configuración de URLs del backend
 */

import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * Interfaz para errores de validación de campos específicos.
 * El backend devuelve esta estructura cuando hay errores en campos individuales.
 * 
 * @interface ValidationError
 */
export interface ValidationError {
  /** Nombre del campo que tiene el error */
  field: string;
  /** Mensaje descriptivo del error */
  message: string;
}

/**
 * Interfaz para la respuesta de error del backend.
 * Estructura estándar de errores devuelta por todas las APIs.
 * 
 * @interface BackendErrorResponse
 */
export interface BackendErrorResponse {
  /** Mensaje general del error */
  message: string;
  /** Detalles adicionales del error (opcional) */
  details?: any;
  /** Número de errores de validación (opcional) */
  validationErrorCount?: number;
  /** Array de errores de validación por campo (opcional) */
  errors?: ValidationError[];
}

/**
 * Interfaz para usuarios estándar del sistema (Usuarios EV).
 * 
 * @interface UserEV
 */
export interface UserEV {
  /** ID único del usuario */
  id: string;
  /** Nombre del usuario */
  nombre: string;
  /** Apellidos del usuario */
  apellidos: string;
  /** Email del usuario */
  correo: string;
  /** Alias público del usuario */
  alias: string;
  /** Indica si el usuario tiene suscripción VIP */
  esVip: boolean;
  /** Fecha de nacimiento en formato ISO */
  fechaNacimiento: string;
  /** Estado de activación del usuario */
  activo: boolean;
  /** URL de la foto de perfil (opcional) */
  foto?: string;
}

/**
 * Interfaz para administradores del sistema (Admins EV).
 * 
 * @interface AdminEV
 */
export interface AdminEV {
  /** ID único del administrador */
  id: string;
  /** Nombre del administrador */
  nombre: string;
  /** Apellidos del administrador */
  apellidos: string;
  /** Email del administrador */
  correo: string;
  /** Alias del administrador */
  alias: string;
  /** Departamento al que pertenece */
  departamento: string;
  /** Estado de activación del administrador */
  activo: boolean;
  /** URL de la foto de perfil (opcional) */
  foto?: string;
}

/**
 * Interfaz para creadores de contenido (Creadores EC).
 * 
 * @interface CreatorEC
 */
export interface CreatorEC {
  /** Descripción del creador */
  descripcion: string;
  /** ID único del creador */
  id: string;
  /** Nombre del creador */
  nombre: string;
  /** Apellidos del creador */
  apellidos: string;
  /** Email del creador */
  correo: string;
  /** Alias público del creador */
  alias: string;
  /** Especialidad o género principal del creador */
  especialidad: string;
  /** Tipo de contenido que crea ('audio' | 'video') */
  tipoContenido: string;
  /** Estado de activación del creador */
  activo: boolean;
  /** URL de la foto de perfil (opcional) */
  foto?: string;
}

/**
 * Configuración para operaciones CRUD de cada tipo de entidad.
 * Define el endpoint y el nombre amigable de la entidad.
 * 
 * @interface EntityConfig
 * @template T - Tipo de la entidad (UserEV | AdminEV | CreatorEC)
 */
export interface EntityConfig<T> {
  /** Ruta del endpoint en la API (ej: '/usuarios-ev') */
  endpoint: string;
  /** Nombre amigable de la entidad para mensajes (ej: 'usuario') */
  entityName: string;
}

/**
 * Servicio genérico para la gestión de entidades administrativas.
 * 
 * Proporciona operaciones CRUD (Create, Read, Update, Delete) para tres
 * tipos de entidades administrativas:
 * - Usuarios EV (usuarios estándar del sistema)
 * - Admins EV (administradores)
 * - Creadores EC (creadores de contenido)
 * 
 * Todas las operaciones requieren autenticación JWT y manejan errores
 * de forma uniforme. El servicio es genérico y puede trabajar con cualquier
 * tipo de entidad mediante configuración.
 * 
 * @class AdminEntityService
 * @injectable
 * 
 * @example
 * ```typescript
 * // Listar usuarios
 * this.adminEntityService.listarEntidades<UserEV>('user').subscribe(users => {
 *   this.userList = users;
 * });
 * 
 * // Crear admin
 * const newAdmin = { nombre: 'Juan', correo: 'juan@example.com', ... };
 * this.adminEntityService.crearEntidad('admin', newAdmin).subscribe();
 * 
 * // Editar creador
 * this.adminEntityService.editarEntidad('creator', id, updatedData).subscribe();
 * 
 * // Eliminar usuario
 * this.adminEntityService.eliminarEntidad('user', userId).subscribe();
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class AdminEntityService {
  /** Cliente HTTP para peticiones */
  private http = inject(HttpClient);
  /** URL base de la API del backend */
  private base = environment.baseApiUrl;

  /**
   * Configuraciones específicas para cada tipo de entidad.
   * Define el endpoint y el nombre amigable para mensajes.
   */
  private entityConfigs = {
    user: { endpoint: 'ad-user', entityName: 'usuario' } as EntityConfig<UserEV>,
    admin: { endpoint: 'ad-admin', entityName: 'administrador' } as EntityConfig<AdminEV>,
    creator: { endpoint: 'ad-creator', entityName: 'creador' } as EntityConfig<CreatorEC>
  };

  /**
   * Obtiene los headers HTTP con el token de autenticación.
   * 
   * Recupera el token JWT del sessionStorage y lo incluye en los headers
   * para autenticar las peticiones al backend.
   * 
   * @returns {HttpHeaders} Headers con Authorization y Content-Type
   * @private
   */
  private getAuthHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Maneja errores HTTP de forma genérica.
   * 
   * Operador RxJS para catchError que propaga el error sin modificar,
   * permitiendo que los componentes manejen la lógica de error específica.
   * 
   * @returns {Function} Operador para catchError
   * @private
   */
  private handleError() {
    return (error: HttpErrorResponse): Observable<never> => throwError(() => error);
  }

  /**
   * Obtiene la lista completa de entidades de un tipo específico.
   * 
   * Recupera todas las entidades del tipo indicado (usuarios, admins o creadores)
   * desde el backend. Requiere autenticación.
   * 
   * @template T - Tipo de entidad (UserEV | AdminEV | CreatorEC)
   * @param {keyof typeof this.entityConfigs} tipo - Tipo de entidad ('user' | 'admin' | 'creator')
   * @returns {Observable<T[]>} Observable con array de entidades
   * 
   * @example
   * ```typescript
   * // Listar todos los usuarios
   * this.adminEntityService.listarEntidades<UserEV>('user').subscribe({
   *   next: (users) => {
   *     this.totalUsers = users.length;
   *     this.userList = users;
   *   },
   *   error: (error) => console.error('Error al cargar usuarios')
   * });
   * 
   * // Listar creadores de contenido
   * this.adminEntityService.listarEntidades<CreatorEC>('creator').subscribe({
   *   next: (creators) => this.creatorList = creators
   * });
   * ```
   */
  listarEntidades<T>(tipo: keyof typeof this.entityConfigs): Observable<T[]> {
    const config = this.entityConfigs[tipo];
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
    });
    return this.http.get<T[]>(`${this.base}/${config.endpoint}`, { headers }).pipe(
      catchError(this.handleError())
    );
  }

  /**
   * Crea una nueva entidad en el sistema.
   * 
   * Envía los datos de una nueva entidad al backend para crearla.
   * Soporta tanto JSON como FormData (para entidades con archivos).
   * 
   * @param {keyof typeof this.entityConfigs} tipo - Tipo de entidad a crear
   * @param {any} data - Datos de la entidad (puede ser objeto JSON o FormData)
   * @returns {Observable<any>} Observable con la respuesta del servidor
   * 
   * @example
   * ```typescript
   * // Crear usuario con JSON
   * const userData = {
   *   nombre: 'Ana',
   *   apellidos: 'López',
   *   correo: 'ana@example.com',
   *   alias: 'analopez',
   *   fechaNacimiento: '1992-03-15',
   *   esVip: false,
   *   activo: true
   * };
   * 
   * this.adminEntityService.crearEntidad('user', userData).subscribe({
   *   next: (response) => console.log('Usuario creado:', response),
   *   error: (error) => console.error('Error al crear usuario')
   * });
   * 
   * // Crear creador con FormData (incluye foto)
   * const formData = new FormData();
   * formData.append('nombre', 'Carlos');
   * formData.append('foto', imageFile);
   * 
   * this.adminEntityService.crearEntidad('creator', formData).subscribe();
   * ```
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
      catchError(this.handleError())
    );
  }

  /**
   * Edita una entidad existente.
   * 
   * Actualiza los datos de una entidad específica identificada por su ID.
   * Soporta tanto JSON como FormData.
   * 
   * @param {keyof typeof this.entityConfigs} tipo - Tipo de entidad a editar
   * @param {string} id - ID de la entidad a editar
   * @param {any} data - Datos actualizados de la entidad
   * @returns {Observable<any>} Observable con la respuesta del servidor
   * 
   * @example
   * ```typescript
   * const updatedUser = {
   *   nombre: 'Ana María',
   *   apellidos: 'López García',
   *   esVip: true
   * };
   * 
   * this.adminEntityService.editarEntidad('user', userId, updatedUser).subscribe({
   *   next: (response) => {
   *     console.log('Usuario actualizado');
   *     this.refreshList();
   *   },
   *   error: (error) => console.error('Error al actualizar')
   * });
   * ```
   */
  editarEntidad(tipo: keyof typeof this.entityConfigs, id: string, data: any): Observable<any> {
    const config = this.entityConfigs[tipo];
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.base}/${config.endpoint}/editar/${id}`, data, { headers }).pipe(
      catchError(this.handleError())
    );
  }

  /**
   * Elimina una entidad del sistema.
   * 
   * Elimina permanentemente una entidad identificada por su ID.
   * Esta operación no se puede deshacer.
   * 
   * @param {keyof typeof this.entityConfigs} tipo - Tipo de entidad a eliminar
   * @param {string} id - ID de la entidad a eliminar
   * @returns {Observable<any>} Observable con la respuesta del servidor
   * 
   * @example
   * ```typescript
   * if (confirm('¿Estás seguro de eliminar este usuario?')) {
   *   this.adminEntityService.eliminarEntidad('user', userId).subscribe({
   *     next: () => {
   *       console.log('Usuario eliminado');
   *       this.userList = this.userList.filter(u => u.id !== userId);
   *     },
   *     error: (error) => console.error('Error al eliminar')
   *   });
   * }
   * ```
   */
  eliminarEntidad(tipo: keyof typeof this.entityConfigs, id: string): Observable<any> {
    const config = this.entityConfigs[tipo];
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.base}/${config.endpoint}/eliminar/${id}`, { headers }).pipe(
      catchError(this.handleError())
    );
  }
}
