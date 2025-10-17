import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * Interfaz para la respuesta del backend al subir un archivo de audio
 */
export interface AudioUploadResponse {
  url: string;
  filename: string;
  originalName: string;
}

/**
 * Servicio para manejar la subida de archivos de audio al backend
 */
@Injectable({
  providedIn: 'root'
})
export class UploadAudioService {
  private readonly baseUrl = 'http://localhost:8080/api';
  private readonly uploadEndpoint = `${this.baseUrl}/uploads/audio`;

  constructor(private http: HttpClient) {}

  /**
   * Sube un archivo de audio al backend
   * @param file Archivo de audio a subir
   * @returns Observable con la respuesta del servidor
   */
  uploadAudio(file: File): Observable<AudioUploadResponse> {
    // Validaciones básicas del archivo
    if (!file) {
      return throwError(() => new Error('No se ha seleccionado ningún archivo'));
    }

    if (!this.isValidAudioFile(file)) {
      return throwError(() => new Error('El archivo debe ser de tipo audio (mp3, wav, ogg, m4a)'));
    }

    // Validar tamaño máximo (1 MB)
    const maxSizeInBytes = 1024 * 1024; // 1 MB
    if (file.size > maxSizeInBytes) {
      return throwError(() => new Error('El archivo no puede superar 1 MB'));
    }

    // Crear FormData para enviar el archivo
    const formData = new FormData();
    formData.append('file', file, file.name);

    // Realizar la petición POST
    return this.http.post<AudioUploadResponse>(this.uploadEndpoint, formData)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Valida si el archivo es un tipo de audio válido
   * @param file Archivo a validar
   * @returns true si es un archivo de audio válido
   */
  private isValidAudioFile(file: File): boolean {
    const validTypes = [
      'audio/mpeg',     // .mp3
      'audio/wav',      // .wav
      'audio/wave',     // .wav (alternativo)
      'audio/ogg',      // .ogg
      'audio/mp4',      // .m4a
      'audio/x-m4a'     // .m4a (alternativo)
    ];

    const validExtensions = ['.mp3', '.wav', '.ogg', '.m4a'];
    
    // Verificar MIME type
    const isMimeTypeValid = validTypes.includes(file.type);
    
    // Verificar extensión del archivo
    const fileName = file.name.toLowerCase();
    const isExtensionValid = validExtensions.some(ext => fileName.endsWith(ext));
    
    return isMimeTypeValid || isExtensionValid;
  }

  /**
   * Maneja los errores de las peticiones HTTP
   * @param error Error recibido
   * @returns Observable con error formateado
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Error desconocido al subir el archivo';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      switch (error.status) {
        case 400:
          errorMessage = 'Archivo inválido o datos incorrectos';
          break;
        case 413:
          errorMessage = 'El archivo es demasiado grande (máximo 1 MB)';
          break;
        case 415:
          errorMessage = 'Tipo de archivo no soportado';
          break;
        case 500:
          errorMessage = 'Error interno del servidor';
          break;
        case 0:
          errorMessage = 'No se pudo conectar con el servidor';
          break;
        default:
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else {
            errorMessage = `Error del servidor: ${error.status}`;
          }
      }
    }

    console.error('Error en upload audio service:', error);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Obtiene la URL completa para acceder a un archivo de audio
   * @param relativePath Ruta relativa del archivo (ej: "/api/files/audio/uuid.mp3")
   * @returns URL completa del archivo
   */
  getAudioUrl(relativePath: string): string {
    if (relativePath.startsWith('http')) {
      return relativePath;
    }
    
    // Si la ruta relativa no empieza con '/', la agregamos
    const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    return `${this.baseUrl.replace('/api', '')}${cleanPath}`;
  }
}