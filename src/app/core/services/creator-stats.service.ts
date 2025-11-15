import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface TopReproducciones {
  nombre: string;
  reproducciones: number;
  miniatura: string;
}

export interface TopValoracion {
  nombre: string;
  valoracion: number;
  miniatura: string;
}

export interface TopEspecialidad {
  especialidad: string;
  reproducciones: number;
}

export interface ReproduccionesPorDia {
  fecha: string;
  reproducciones: number;
}

export interface EstadisticasResponse {
  topPorReproducciones: TopReproducciones[];
  topPorValoracion: TopValoracion[];
  topPorEspecialidad: TopEspecialidad[];
  usuariosVip: number;
  usuariosTotales: number;
  reproduccionesTotales: number;
  reproduccionesSemana: ReproduccionesPorDia[];
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

  obtenerEstadisticasGlobales(): Observable<EstadisticasResponse> {
    console.log(`${this.logPrefix} Obteniendo estadísticas globales`);

    return this.http.get<EstadisticasResponse>(this.API_URL).pipe(
      tap(res => console.log(`${this.logPrefix} Estadísticas recibidas:`, res)),
      catchError(this.handleError('obteniendo estadísticas globales'))
    );
  }
}
