import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * Interfaz para el contenido disponible del backend
 */
export interface Contenido {
  id: string;
  titulo: string;
  descripcion?: string;
  ficheroUrl: string;
  miniaturaUrl: string;
  duracion?: number;
  autorId: string;
  tipo: string; // 👈 VIDEO o AUDIO
}

/**
 * Interfaz para la petición de creación/actualización de lista
 */
export interface ListaCreateRequest {
  nombre: string;
  descripcion: string;
  visible: boolean;
  dominantType: string;
  items: Contenido[];
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

@Injectable({
  providedIn: 'root'
})
export class PublicListService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.baseApiUrl}/content-creator/listas`;

  /**
   * Obtiene todas las listas del creador
   * GET /api/content-creator/listas
   */
  getMyLists(): Observable<ListaPublicaResponse[]> {
    console.log('🌐 Obteniendo listas del creador...');
    return this.http.get<ListaPublicaResponse[]>(this.apiUrl, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(listas => {
        console.log('✅ Listas obtenidas:', listas);
        // Mapear items de cada lista
        return listas.map(lista => ({
          ...lista,
          items: lista.items.map(item => this.mapBackendToContenido(item))
        }));
      }),
      catchError(this.handleError('obtener mis listas'))
    );
  }

  /**
   * Obtiene contenido disponible para crear lista
   * GET /api/content-creator/listas/crear
   */
  getAvailableContent(): Observable<Contenido[]> {
    console.log('🌐 Obteniendo contenido disponible...');
    return this.http.get<any[]>(`${this.apiUrl}/crear`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(contenidos => {
        const mapped = contenidos.map(c => this.mapBackendToContenido(c));
        console.log('✅ Contenido disponible obtenido:', mapped.length, 'elementos');
        return mapped;
      }),
      catchError(this.handleError('obtener contenido disponible'))
    );
  }

  /**
   * Obtiene lista por ID
   * GET /api/content-creator/listas/{id}
   */
  getListById(id: string): Observable<ListaPublicaResponse> {
    console.log('🌐 Obteniendo lista con ID:', id);
    return this.http.get<any>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(lista => {
        console.log('✅ Lista obtenida:', lista);
        // Mapear items de la lista
        return {
          ...lista,
          items: lista.items.map((item: any) => this.mapBackendToContenido(item))
        };
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
  getAddCandidates(id: string): Observable<Contenido[]> {
    console.log('🌐 Obteniendo candidatos para lista:', id);
    return this.http.get<any[]>(`${this.apiUrl}/agregar/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(contenidos => {
        const mapped = contenidos.map(c => this.mapBackendToContenido(c));
        console.log('✅ Candidatos obtenidos:', mapped.length, 'elementos');
        console.log('🔍 Tipos de candidatos:', mapped.map(c => c.tipo));
        return mapped;
      }),
      catchError(this.handleError('obtener candidatos'))
    );
  }

  /**
   * Añade contenidos a lista existente
   * PATCH /api/content-creator/listas/agregar-contenidos/{id}
   */
  addContentsToList(id: string, contenidos: Contenido[]): Observable<Contenido[]> {
    console.log('🌐 Añadiendo contenidos a lista:', id, contenidos);
    return this.http.patch<any[]>(`${this.apiUrl}/agregar-contenidos/${id}`, contenidos, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('✅ Contenidos añadidos exitosamente:', response);
        return response.map(c => this.mapBackendToContenido(c));
      }),
      catchError(this.handleError('añadir contenidos'))
    );
  }

  /**
   * 🔥 Mapea contenido del backend al formato del frontend
   * CRÍTICO: Convierte tipoArchivo → tipo
   */
  private mapBackendToContenido(backend: any): Contenido {
    const mapped: Contenido = {
      id: backend.id,
      titulo: backend.titulo,
      descripcion: backend.descripcion,
      ficheroUrl: backend.ficheroUrl,
      miniaturaUrl: backend.miniaturaUrl || backend.foto || '',
      duracion: backend.duracion,
      autorId: backend.creador?.nombre || backend.autorId || 'Desconocido',
      tipo: backend.tipoArchivo || backend.tipo || 'VIDEO'
    };

    // Log de debugging
    if (!backend.tipoArchivo && !backend.tipo) {
      console.warn('⚠️ Contenido sin tipo:', backend);
    }

    return mapped;
  }

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
   * Maneja errores HTTP
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
