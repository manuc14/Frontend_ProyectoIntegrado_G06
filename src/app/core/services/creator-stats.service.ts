import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface TopContent {
  contenidoId: string;
  title: string;
  thumbnail: string;
  metricValue: string;
  metricRawValue: number;
}

@Injectable({
  providedIn: 'root'
})
export class CreatorStatsService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.baseApiUrl}/creator-stats`;
  private readonly logPrefix = '[CREATOR STATS SERVICE]';

  private handleError(context: string) {
    return (error: any): Observable<never> => {
      console.error(`${this.logPrefix} Error ${context}:`, error);
      return throwError(() => error);
    };
  }

  obtenerTopReproducciones(
    limit: number = 5,
    fechaInicio?: string,
    fechaFin?: string,
    tipo?: string
  ): Observable<TopContent[]> {
    console.log(`${this.logPrefix} obtenerTopReproducciones(limit=${limit}, tipo=${tipo})`);

    let params = new HttpParams().set('limit', limit.toString());
    if (fechaInicio) params = params.set('fechaInicio', fechaInicio);
    if (fechaFin) params = params.set('fechaFin', fechaFin);
    if (tipo && tipo !== 'Todos') params = params.set('tipo', tipo);

    return this.http.get<TopContent[]>(`${this.API_URL}/top-reproducciones`, { params }).pipe(
      tap(res => console.log(`${this.logPrefix} Top reproducciones recibidas:`, res.length)),
      catchError(this.handleError('obteniendo top reproducciones'))
    );
  }

  obtenerTopValoraciones(
    limit: number = 5,
    fechaInicio?: string,
    fechaFin?: string,
    tipo?: string
  ): Observable<TopContent[]> {
    console.log(`${this.logPrefix} obtenerTopValoraciones(limit=${limit}, tipo=${tipo})`);

    let params = new HttpParams().set('limit', limit.toString());
    if (fechaInicio) params = params.set('fechaInicio', fechaInicio);
    if (fechaFin) params = params.set('fechaFin', fechaFin);
    if (tipo && tipo !== 'Todos') params = params.set('tipo', tipo);

    return this.http.get<TopContent[]>(`${this.API_URL}/top-valoraciones`, { params }).pipe(
      tap(res => console.log(`${this.logPrefix} Top valoraciones recibidas:`, res.length)),
      catchError(this.handleError('obteniendo top valoraciones'))
    );
  }

  obtenerTopEspecialidades(
    limit: number = 5,
    fechaInicio?: string,
    fechaFin?: string
  ): Observable<TopContent[]> {
    console.log(`${this.logPrefix} obtenerTopEspecialidades(limit=${limit})`);

    let params = new HttpParams().set('limit', limit.toString());
    if (fechaInicio) params = params.set('fechaInicio', fechaInicio);
    if (fechaFin) params = params.set('fechaFin', fechaFin);

    return this.http.get<TopContent[]>(`${this.API_URL}/top-especialidades`, { params }).pipe(
      tap(res => console.log(`${this.logPrefix} Top especialidades recibidas:`, res.length)),
      catchError(this.handleError('obteniendo top especialidades'))
    );
  }
}
