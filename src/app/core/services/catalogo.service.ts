import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Contenido } from '../models/contenido.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CatalogoService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.baseApiUrl}/contenidos`;
  private readonly logPrefix = '[CATALOGO SERVICE]';

  private mapContenido = (raw: any): Contenido => {
    if (!raw) throw new Error('Contenido vacío');
    const { id: backendId, tipoArchivo, ...rest } = raw;
    return {
      ...rest,
      _id: backendId ?? rest._id,
      tipo: tipoArchivo || rest.tipo,
      foto: rest.miniaturaUrl,
      fechaEstado: new Date(rest.fechaEstado),
      disponibleHasta: rest.disponibleHasta ? new Date(rest.disponibleHasta) : null,
      creador: this.normalizeCreador(raw)
    } as Contenido;
  };

  private normalizeCreador(backend: any): { nombre: string; avatar: string } | undefined {
    const nombreCreador = backend.creador?.nombre || backend.autorAlias;
    return nombreCreador ? {
      nombre: nombreCreador,
      avatar: backend.creador?.avatar || ''
    } : undefined;
  }

  private mapContenidos = (arr: any[]): Contenido[] => (arr || []).map(this.mapContenido);

  private handleError(context: string) {
    return (error: any): Observable<never> => {
      console.error(` ${this.logPrefix} Error ${context}:`, error);
      return throwError(() => error);
    };
  }

  getContenidoById(id: string): Observable<Contenido> {
    console.log(` ${this.logPrefix} getContenidoById(${id})`);
    return this.http.get<any>(`${this.API_URL}/${id}`).pipe(
      map(this.mapContenido),
      tap(contenido => console.log(` ${this.logPrefix} Contenido recibido:`, contenido._id)),
      catchError(this.handleError(`obteniendo contenido ${id}`))
    );
  }

  getContenidos(): Observable<Contenido[]> {
    return this.http.get<any[]>(this.API_URL).pipe(
      map(this.mapContenidos),
      tap(res => console.log(` ${this.logPrefix} Contenidos recibidos:`, res.length)),
      catchError(this.handleError('obteniendo contenidos'))
    );
  }

  getContenidosPublicos(): Observable<Contenido[]> {
    return this.http.get<any[]>(`${this.API_URL}/publicos`).pipe(
      map(this.mapContenidos),
      tap(res => console.log(` ${this.logPrefix} Contenidos p�blicos recibidos:`, res.length)),
      catchError(this.handleError('obteniendo contenidos p�blicos'))
    );
  }

  getContenidosPrivados(): Observable<Contenido[]> {
    return this.http.get<any[]>(`${this.API_URL}/privados`).pipe(
      map(this.mapContenidos),
      tap(res => console.log(` ${this.logPrefix} Contenidos privados recibidos:`, res.length)),
      catchError(this.handleError('obteniendo contenidos privados'))
    );
  }
}
