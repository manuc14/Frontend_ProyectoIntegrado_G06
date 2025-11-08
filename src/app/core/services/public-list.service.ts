import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Contenido, ResolucionVideo } from '../models/contenido.models';

// Re-exportar Contenido para otros componentes
export type { Contenido } from '../models/contenido.models';

/**
 * Interfaz para la petición de creación/actualización de lista
 */
export interface ListaCreateRequest {
  nombre: string;
  descripcion: string;
  visible: boolean;
  dominantType: string;
  items: any[];
}

/**
 * Interfaz para la respuesta del backend de lista pública
 */
export interface ListaPublicaResponse {
  id: string;
  creatorId: string;
  nombre: string;
  descripcion: string;
  publica: boolean;
  visible: boolean;
  dominantType: string;
  items: Contenido[];
  createdAt: string;
  updatedAt?: string;
}

/**
 * Constantes de valores por defecto
 */
const DEFAULT_VALUES = {
  ESTADO: 'PUBLICO' as const,
  TIPO: 'VIDEO' as const,
  RESTRICCION_EDAD: 0,
  DURACION: 0,
  EMPTY_STRING: '',
  EMPTY_ARRAY: [] as string[]
} as const;

/**
 * Servicio para gestión de listas públicas y contenido
 * Optimizado para baja complejidad ciclomática y alta cohesión
 */
@Injectable({
  providedIn: 'root'
})
export class PublicListService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.baseApiUrl}/content-creator/listas`;
  private readonly catalogUrl = `${environment.baseApiUrl}/listas`;

  /**
   * Obtiene todas las listas públicas y visibles del catálogo (para usuarios normales)
   * GET /api/listas
   */
  getPublicLists(): Observable<ListaPublicaResponse[]> {
    console.log('🌐 Obteniendo listas públicas del catálogo...');
    
    return this.http.get<ListaPublicaResponse[]>(this.catalogUrl, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(listas => this.processPublicLists(listas)),
      catchError(error => this.handleCatalogError(error))
    );
  }

  /**
   * Obtiene todas las listas del creador (incluye visibles y no visibles)
   * GET /api/content-creator/listas
   */
  getMyLists(): Observable<ListaPublicaResponse[]> {
    console.log('🌐 Obteniendo listas del creador...');
    
    return this.http.get<ListaPublicaResponse[]>(this.apiUrl, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(listas => this.processCreatorLists(listas)),
      catchError(this.handleError('obtener mis listas'))
    );
  }

  /**
   * Obtiene contenido disponible para crear lista
   * GET /api/content-creator/listas/crear
   */
  getAvailableContent(): Observable<any[]> {
    console.log('🌐 Obteniendo contenido disponible...');
    
    return this.http.get<any[]>(`${this.apiUrl}/crear`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(contenidos => {
        console.log('✅ Contenido disponible obtenido:', contenidos.length, 'elementos');
        return contenidos;
      }),
      catchError(this.handleError('obtener contenido disponible'))
    );
  }

  /**
   * Obtiene lista por ID
   * Como el backend no tiene endpoint GET /api/content-creator/listas/{id},
   * obtenemos todas las listas y filtramos por ID
   */
  getListById(id: string): Observable<ListaPublicaResponse> {
    console.log('🌐 Obteniendo lista con ID:', id);
    
    return this.getMyLists().pipe(
      map(listas => {
        const lista = listas.find(l => l.id === id);
        if (!lista) {
          throw new Error(`Lista con ID ${id} no encontrada`);
        }
        return lista;
      }),
      catchError(this.handleError('obtener detalles de lista'))
    );
  }

  /**
   * Crea lista pública
   * POST /api/content-creator/listas/crear
   */
  createPublicList(request: ListaCreateRequest): Observable<ListaPublicaResponse> {
    console.log('🌐 Creando lista pública:', request);
    
    return this.http.post<ListaPublicaResponse>(`${this.apiUrl}/crear`, request, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('✅ Lista creada exitosamente:', response);
        return response;
      }),
      catchError(this.handleError('crear lista pública'))
    );
  }

  /**
   * Actualiza lista pública
   * PUT /api/content-creator/listas/editar/{id}
   */
  updatePublicList(id: string, request: ListaCreateRequest): Observable<ListaPublicaResponse> {
    console.log('🌐 Actualizando lista con ID:', id, request);
    
    return this.http.put<ListaPublicaResponse>(`${this.apiUrl}/editar/${id}`, request, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('✅ Lista actualizada exitosamente:', response);
        return response;
      }),
      catchError(this.handleError('actualizar lista pública'))
    );
  }

  /**
   * Elimina lista
   * DELETE /api/content-creator/listas/eliminar/{id}
   */
  deleteList(id: string): Observable<void> {
    console.log('🌐 Eliminando lista con ID:', id);
    
    return this.http.delete<void>(`${this.apiUrl}/eliminar/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(() => {
        console.log('✅ Lista eliminada exitosamente');
      }),
      catchError(this.handleError('eliminar lista'))
    );
  }

  /**
   * Obtiene candidatos para agregar a lista existente
   * GET /api/content-creator/listas/agregar/{id}
   */
  getAddCandidates(id: string): Observable<any[]> {
    console.log('🌐 Obteniendo candidatos para lista:', id);
    
    return this.http.get<any[]>(`${this.apiUrl}/agregar/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(contenidos => {
        console.log('✅ Candidatos obtenidos:', contenidos.length, 'elementos');
        return contenidos;
      }),
      catchError(this.handleError('obtener candidatos'))
    );
  }

  /**
   * Añade contenidos a lista existente
   * PATCH /api/content-creator/listas/agregar-contenidos/{id}
   */
  addContentsToList(id: string, contenidos: any[]): Observable<Contenido[]> {
    console.log('🌐 Añadiendo contenidos a lista:', id, contenidos);
    
    return this.http.patch<any[]>(`${this.apiUrl}/agregar-contenidos/${id}`, contenidos, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('✅ Contenidos añadidos exitosamente:', response);
        return this.mapItemsToContenido(response);
      }),
      catchError(this.handleError('añadir contenidos'))
    );
  }

  // ========================================================================================
  // MÉTODOS PRIVADOS DE PROCESAMIENTO DE LISTAS
  // ========================================================================================

  /**
   * Procesa listas públicas filtrando por visibilidad y contenido público
   */
  private processPublicLists(listas: ListaPublicaResponse[]): ListaPublicaResponse[] {
    console.log('✅ Listas públicas obtenidas:', listas);
    
    return listas
      .filter(lista => this.isVisibleList(lista))
      .map(lista => this.filterPublicContentInList(lista));
  }

  /**
   * Procesa listas del creador mapeando todos los items
   */
  private processCreatorLists(listas: ListaPublicaResponse[]): ListaPublicaResponse[] {
    console.log('✅ Listas obtenidas:', listas);
    
    return listas.map(lista => ({
      ...lista,
      items: this.mapItemsToContenido(lista.items)
    }));
  }

  /**
   * Procesa respuesta de una lista individual
   */
  private processListResponse(lista: any): ListaPublicaResponse {
    console.log('✅ Lista obtenida:', lista);
    
    return {
      ...lista,
      items: this.mapItemsToContenido(lista.items)
    };
  }

  /**
   * Filtra contenido público dentro de una lista
   */
  private filterPublicContentInList(lista: ListaPublicaResponse): ListaPublicaResponse {
    return {
      ...lista,
      items: lista.items
        .filter((item: any) => this.isPublicContent(item))
        .map(item => this.mapBackendToContenido(item))
    };
  }

  // ========================================================================================
  // PREDICADOS DE FILTRADO
  // ========================================================================================

  /**
   * Verifica si una lista es visible
   */
  private isVisibleList(lista: ListaPublicaResponse): boolean {
    return lista.visible === true;
  }

  /**
   * Verifica si un contenido es público
   * Solo permite contenido con estado explícitamente PUBLICO
   */
  private isPublicContent(item: any): boolean {
    return item.estado === 'PUBLICO';
  }

  // ========================================================================================
  // MÉTODOS DE MAPEO Y TRANSFORMACIÓN
  // ========================================================================================

  /**
   * Mapea un array de items del backend a Contenido[]
   */
  private mapItemsToContenido(items: any[]): Contenido[] {
    if (!Array.isArray(items)) {
      return [];
    }
    return items.map(item => this.mapBackendToContenido(item));
  }

  /**
   * Mapea un item del backend al modelo Contenido del frontend
   * Refactorizado para reducir complejidad ciclomática
   */
  private mapBackendToContenido(backend: any): Contenido {
    return {
      _id: this.extractId(backend),
      titulo: backend.titulo || DEFAULT_VALUES.EMPTY_STRING,
      descripcion: backend.descripcion || DEFAULT_VALUES.EMPTY_STRING,
      ficheroUrl: backend.ficheroUrl || DEFAULT_VALUES.EMPTY_STRING,
      miniaturaUrl: this.extractMiniaturaUrl(backend),
      foto: this.extractMiniaturaUrl(backend),
      duracion: backend.duracion || DEFAULT_VALUES.DURACION,
      contenidoVip: this.normalizeContenidoVip(backend.contenidoVip),
      estado: backend.estado || DEFAULT_VALUES.ESTADO,
      fechaEstado: this.normalizeFechaEstado(backend.fechaEstado),
      tipo: this.normalizeTipo(backend),
      restriccionEdad: this.normalizeRestriccionEdad(backend.restriccionEdad),
      tags: this.normalizeTags(backend.tags),
      resolucion: this.normalizeResolucion(backend.resolucion),
      creador: this.normalizeCreador(backend),
      categoria: backend.categoria || DEFAULT_VALUES.EMPTY_STRING
    };
  }

  // ========================================================================================
  // NORMALIZADORES DE CAMPOS (Funciones puras de transformación)
  // ========================================================================================

  /**
   * Extrae el ID del item del backend
   */
  private extractId(backend: any): string {
    return backend.id || backend._id || DEFAULT_VALUES.EMPTY_STRING;
  }

  /**
   * Extrae y construye la URL completa de miniatura del backend
   * Si el backend devuelve solo el nombre del archivo, añade el baseResourceUrl
   */
  private extractMiniaturaUrl(backend: any): string {
    const miniaturaUrl = backend.miniaturaUrl || backend.foto;
    
    if (!miniaturaUrl) {
      return DEFAULT_VALUES.EMPTY_STRING;
    }
    
    // Si ya es una URL completa (http, https o ruta absoluta), devolverla tal cual
    if (miniaturaUrl.startsWith('http') || miniaturaUrl.startsWith('/')) {
      return miniaturaUrl;
    }
    
    // Si es solo el nombre del archivo (ej: 00ebf669-1864-48c5-9eb9-5b390f0fca6b.png)
    // construir la ruta completa
    return `${environment.baseResourceUrl}/miniaturas/${miniaturaUrl}`;
  }

  /**
   * Normaliza el tipo de contenido
   */
  private normalizeTipo(backend: any): 'VIDEO' | 'AUDIO' {
    return backend.tipoArchivo || backend.tipo || DEFAULT_VALUES.TIPO;
  }

  /**
   * Normaliza la fecha de estado
   */
  private normalizeFechaEstado(fecha: any): Date {
    return fecha ? new Date(fecha) : new Date();
  }

  /**
   * Normaliza tags asegurando que siempre sea un array válido
   * Early return para simplificar lógica
   */
  private normalizeTags(tags: any): string[] {
    if (!Array.isArray(tags)) {
      return DEFAULT_VALUES.EMPTY_ARRAY;
    }
    
    if (tags.length === 0) {
      return DEFAULT_VALUES.EMPTY_ARRAY;
    }
    
    return tags;
  }

  /**
   * Normaliza resolución - solo existe si tiene valor válido
   * Early return para reducir anidación
   */
  private normalizeResolucion(resolucion: any): ResolucionVideo | undefined {
    if (!resolucion) {
      return undefined;
    }
    
    if (resolucion === null) {
      return undefined;
    }
    
    return resolucion as ResolucionVideo;
  }

  /**
   * Normaliza contenidoVip a booleano explícito
   */
  private normalizeContenidoVip(contenidoVip: any): boolean {
    return contenidoVip === true;
  }

  /**
   * Normaliza restricción de edad a número válido
   * Early return para claridad
   */
  private normalizeRestriccionEdad(restriccionEdad: any): number {
    if (typeof restriccionEdad !== 'number') {
      return DEFAULT_VALUES.RESTRICCION_EDAD;
    }
    
    if (restriccionEdad <= 0) {
      return DEFAULT_VALUES.RESTRICCION_EDAD;
    }
    
    return restriccionEdad;
  }

  /**
   * Normaliza información del creador
   * Early return para reducir complejidad
   */
  private normalizeCreador(backend: any): { nombre: string; avatar: string } | undefined {
    const nombreCreador = backend.creador?.nombre || backend.autorId;
    
    if (!nombreCreador) {
      return undefined;
    }
    
    return {
      nombre: nombreCreador,
      avatar: backend.creador?.avatar || DEFAULT_VALUES.EMPTY_STRING
    };
  }

  // ========================================================================================
  // UTILIDADES HTTP
  // ========================================================================================

  /**
   * Obtiene headers HTTP con token de autenticación
   */
  private getAuthHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Maneja errores del catálogo con estrategia de recuperación
   * Retorna array vacío para no bloquear la UI
   */
  private handleCatalogError(error: any): Observable<ListaPublicaResponse[]> {
    console.error('❌ Error en obtener listas públicas del catálogo:', error);
    console.error('❌ Status:', error.status);
    console.error('❌ Message:', error.message);
    console.error('❌ Error completo:', error);
    
    // Retornar array vacío en caso de error para que no bloquee la UI
    return of([]);
  }

  /**
   * Maneja errores HTTP genéricos con propagación
   */
  private handleError(operation: string) {
    return (error: any): Observable<never> => {
      console.error(`❌ Error en ${operation}:`, error);
      console.error('❌ Status:', error.status);
      console.error('❌ Message:', error.message);
      console.error('❌ Error completo:', error);

      const message = error.error?.message || error.message || `Error al ${operation}`;
      return throwError(() => ({ ...error, message }));
    };
  }
}
