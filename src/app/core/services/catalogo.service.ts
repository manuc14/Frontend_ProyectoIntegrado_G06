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
    if (!raw) throw new Error('Contenido vac�o');
    const { id: backendId, tipoArchivo, ...rest } = raw;
    return { ...rest, _id: backendId ?? rest._id, tipo: tipoArchivo || rest.tipo } as Contenido;
  };

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
