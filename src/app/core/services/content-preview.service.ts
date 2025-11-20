import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// Interfaces para las respuestas
export interface InfoContenidoResponse {
  valoracionMedia: number;
  miValoracion: number | null;
  yaReprodujo: boolean;
  esFavorito: boolean;
}

export interface ToggleFavoritoResponse {
  agregado: boolean;
  mensaje: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContentPreviewService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.baseApiUrl}/contenido-viewer`;
  private readonly logPrefix = '[CONTENT PREVIEW SERVICE]';

  /**
   * Obtiene información completa del contenido (valoración, favorito, etc.)
   */
  obtenerInfoCompleta(contenidoId: string): Observable<InfoContenidoResponse> {
    console.log(`${this.logPrefix} Obteniendo información completa para: ${contenidoId}`);

    return this.http.get<InfoContenidoResponse>(
      `${this.API_URL}/${contenidoId}`
    ).pipe(
      tap((response) => console.log(`${this.logPrefix} Info obtenida:`, response)),
      catchError((error) => {
        console.error(`${this.logPrefix} Error al obtener info:`, error);
        throw error;
      })
    );
  }

  /**
   * Alterna el estado de favorito del contenido
   */
  toggleFavorito(contenidoId: string): Observable<ToggleFavoritoResponse> {
    console.log(`${this.logPrefix} Toggling favorito para: ${contenidoId}`);

    return this.http.post<ToggleFavoritoResponse>(
      `${this.API_URL}/${contenidoId}/favorito`,
      { contenidoId }
    ).pipe(
      tap((response) => console.log(`${this.logPrefix} Favorito actualizado:`, response)),
      catchError((error) => {
        console.error(`${this.logPrefix} Error al actualizar favorito:`, error);
        throw error;
      })
    );
  }

  /**
   * Registra una reproducción del contenido
   */
  registrarReproduccion(contenidoId: string): Observable<void> {
    console.log(`${this.logPrefix} Registrando reproducción para contenido: ${contenidoId}`);

    return this.http.post<void>(
      `${this.API_URL}/${contenidoId}/reproduccion`,
      { contenidoId }
    ).pipe(
      tap(() => console.log(`${this.logPrefix} Reproducción registrada exitosamente`)),
      catchError((error) => {
        console.error(`${this.logPrefix} Error al registrar reproducción:`, error);
        throw error;
      })
    );
  }

  /**
   * Registra la valoración del usuario para un contenido
   */
  valorarContenido(contenidoId: string, valoracion: number): Observable<void> {
    console.log(`${this.logPrefix} Valorando contenido ${contenidoId} con ${valoracion} estrellas`);

    return this.http.post<void>(
      `${this.API_URL}/${contenidoId}/valorar`,
      { contenidoId, valoracion }
    ).pipe(
      tap(() => console.log(`${this.logPrefix} Valoración registrada exitosamente`)),
      catchError((error) => {
        console.error(`${this.logPrefix} Error al valorar contenido:`, error);
        throw error;
      })
    );
  }
}
