import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Contenido } from '../models/contenido.models';

export type { Contenido } from '../models/contenido.models';

export interface ListaCreateRequest {
  nombre: string;
  descripcion: string;
  visible: boolean;
  dominantType: string;
  items: any[];
}

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

const DEFAULT_VALUES = {
  ESTADO: 'PUBLICO' as const,
  TIPO: 'VIDEO' as const,
  RESTRICCION_EDAD: 0,
  DURACION: 0,
  EMPTY_STRING: '',
  EMPTY_ARRAY: [] as string[]
} as const;

@Injectable({
  providedIn: 'root'
})
export class PublicListService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.baseApiUrl}/content-creator/listas`;
  private readonly catalogUrl = `${environment.baseApiUrl}/listas`;

  getPublicLists(): Observable<ListaPublicaResponse[]> {
    console.log('🌐 Obteniendo listas públicas del catálogo...');
    return this.http.get<ListaPublicaResponse[]>(this.catalogUrl, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(listas => this.processPublicLists(listas)),
      catchError(error => this.handleCatalogError(error))
    );
  }

  getMyLists(): Observable<ListaPublicaResponse[]> {
    console.log('🌐 Obteniendo listas del creador...');
    return this.http.get<ListaPublicaResponse[]>(this.apiUrl, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(listas => this.processCreatorLists(listas)),
      catchError(this.handleError('obtener mis listas'))
    );
  }

  getAvailableContent(): Observable<any[]> {
    console.log('🌐 Obteniendo contenido disponible...');
    return this.http.get<any[]>(`${this.apiUrl}/crear`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(contenidos => console.log('✅ Contenido disponible obtenido:', contenidos.length, 'elementos')),
      catchError(this.handleError('obtener contenido disponible'))
    );
  }

  getListById(id: string): Observable<ListaPublicaResponse> {
    console.log('🌐 Obteniendo lista con ID:', id);
    return this.getMyLists().pipe(
      map(listas => this.findListById(listas, id)),
      catchError(this.handleError('obtener detalles de lista'))
    );
  }

  createPublicList(request: ListaCreateRequest): Observable<ListaPublicaResponse> {
    console.log('🌐 Creando lista pública:', request);
    return this.http.post<ListaPublicaResponse>(`${this.apiUrl}/crear`, request, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => console.log('✅ Lista creada exitosamente:', response)),
      catchError(this.handleError('crear lista pública'))
    );
  }

  updatePublicList(id: string, request: ListaCreateRequest): Observable<ListaPublicaResponse> {
    console.log('🌐 Actualizando lista con ID:', id, request);
    return this.http.put<ListaPublicaResponse>(`${this.apiUrl}/editar/${id}`, request, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => console.log('✅ Lista actualizada exitosamente:', response)),
      catchError(this.handleError('actualizar lista pública'))
    );
  }

  deleteList(id: string): Observable<void> {
    console.log('🌐 Eliminando lista con ID:', id);
    return this.http.delete<void>(`${this.apiUrl}/eliminar/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => console.log('✅ Lista eliminada exitosamente')),
      catchError(this.handleError('eliminar lista'))
    );
  }

  getAddCandidates(id: string): Observable<any[]> {
    console.log('🌐 Obteniendo candidatos para lista:', id);
    return this.http.get<any[]>(`${this.apiUrl}/agregar/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(contenidos => console.log('✅ Candidatos obtenidos:', contenidos.length, 'elementos')),
      catchError(this.handleError('obtener candidatos'))
    );
  }

  addContentsToList(id: string, contenidos: any[]): Observable<Contenido[]> {
    console.log('🌐 Añadiendo contenidos a lista:', id, contenidos);
    return this.http.patch<any[]>(`${this.apiUrl}/agregar-contenidos/${id}`, contenidos, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('✅ Contenidos añadidos exitosamente:', response);
        return Array.isArray(response) ? response.map(item => this.mapBackendToContenido(item)) : [];
      }),
      catchError(this.handleError('añadir contenidos'))
    );
  }

  private processPublicLists(listas: ListaPublicaResponse[]): ListaPublicaResponse[] {
    console.log('✅ Listas públicas obtenidas:', listas);
    return listas
      .filter(lista => lista.visible)
      .map(lista => ({
        ...lista,
        items: lista.items
          .filter((item: any) => item.estado === 'PUBLICO')
          .map(item => this.mapBackendToContenido(item))
      }));
  }

  private processCreatorLists(listas: ListaPublicaResponse[]): ListaPublicaResponse[] {
    console.log('✅ Listas obtenidas:', listas);
    return listas.map(lista => ({
      ...lista,
      items: lista.items.map(item => this.mapBackendToContenido(item))
    }));
  }

  private mapBackendToContenido(backend: any): Contenido {
    if (!backend) throw new Error('Contenido vacío');
    const { id: backendId, tipoArchivo, ...rest } = backend;
    return {
      ...rest,
      _id: backendId ?? rest._id,
      tipo: tipoArchivo || rest.tipo,
      foto: rest.miniaturaUrl,
      fechaEstado: new Date(rest.fechaEstado),
      disponibleHasta: rest.disponibleHasta ? new Date(rest.disponibleHasta) : null,
      creador: this.normalizeCreador(backend)
    } as Contenido;
  }

  private normalizeCreador(backend: any): { nombre: string; avatar: string } | undefined {
    const nombreCreador = backend.creador?.nombre || backend.autorId;
    return nombreCreador ? {
      nombre: nombreCreador,
      avatar: backend.creador?.avatar || DEFAULT_VALUES.EMPTY_STRING
    } : undefined;
  }

  private findListById(listas: ListaPublicaResponse[], id: string): ListaPublicaResponse {
    const lista = listas.find(l => l.id === id);
    if (!lista) throw new Error(`Lista con ID ${id} no encontrada`);
    return lista;
  }

  private getAuthHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private logError(context: string, error: any): void {
    console.error(`❌ Error en ${context}:`, error);
    console.error('❌ Status:', error.status);
    console.error('❌ Message:', error.message);
    console.error('❌ Error completo:', error);
  }

  private handleCatalogError(error: any): Observable<ListaPublicaResponse[]> {
    this.logError('obtener listas públicas del catálogo', error);
    return of([]);
  }

  private handleError = (operation: string) => (error: any): Observable<never> => {
    this.logError(operation, error);
    const message = error.error?.message || error.message || `Error al ${operation}`;
    return throwError(() => ({ ...error, message }));
  };
}
