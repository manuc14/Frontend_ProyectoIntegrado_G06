import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

// Interfaces comunes para uploads
export interface UploadResponse {
  url: string;
  filename: string;
  originalName: string;
}

// Configuración para diferentes tipos de upload
export interface UploadConfig {
  endpoint: string;
  validTypes: string[];
  validExtensions: string[];
  maxSizeInBytes: number;
  errorMessages: {
    invalidFile: string;
    tooLarge: string;
    unsupportedType: string;
  };
}

/**
 * UploadService
 * Servicio genérico para manejar la subida de archivos al backend.
 * Soporta diferentes tipos de archivos con configuraciones específicas.
 */
@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private readonly baseUrl = environment.baseApiUrl;

  // Configuraciones para diferentes tipos de upload
  private uploadConfigs: Record<string, UploadConfig> = {
    audio: {
      endpoint: `${this.baseUrl}/uploads/audio`,
      validTypes: [
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'audio/wave',
        'audio/x-wav',
        'audio/ogg',
        'audio/aac',
        'audio/flac',
        'audio/webm'
      ],
      validExtensions: ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.webm'],
      maxSizeInBytes: 1 * 1024 * 1024, // 1 MB
      errorMessages: {
        invalidFile: 'Formato de audio no válido (MP3, WAV, OGG, AAC, FLAC, WEBM)',
        tooLarge: 'El archivo de audio no puede superar 1 MB',
        unsupportedType: 'Tipo de archivo de audio no soportado'
      }
    },
    thumbnail: {
      endpoint: `${this.baseUrl}/uploads/thumbnails`,
      validTypes: [
        'image/jpeg',     // .jpg, .jpeg
        'image/jpg',      // .jpg (alternativo)
        'image/png'       // .png
      ],
      validExtensions: ['.jpg', '.jpeg', '.png'],
      maxSizeInBytes: 5 * 1024 * 1024, // 5 MB
      errorMessages: {
        invalidFile: 'El archivo debe ser una imagen (JPEG, PNG)',
        tooLarge: 'El archivo no puede superar 5 MB',
        unsupportedType: 'Tipo de archivo no soportado (solo JPEG y PNG)'
      }
    }
  };

  constructor(private http: HttpClient) {}

  /**
   * Sube un archivo al backend según el tipo especificado
   * @param file Archivo a subir
   * @param type Tipo de upload ('audio' | 'thumbnail')
   * @returns Observable con la respuesta del servidor
   */
  uploadFile(file: File, type: keyof typeof this.uploadConfigs): Observable<UploadResponse> {
    const config = this.uploadConfigs[type];

    // Validaciones básicas del archivo usando validateFile
    const validation = this.validateFile(file, config);
    if (!validation.ok) {
      return throwError(() => new Error(validation.error));
    }

    // Crear FormData para enviar el archivo
    const formData = new FormData();
    formData.append('file', file, file.name);

    // Realizar la petición POST
    return this.http.post<UploadResponse>(config.endpoint, formData)
      .pipe(
        catchError(error => this.handleError(error, config))
      );
  }

  /**
   * Valida si el archivo es válido según la configuración (adaptado de UploadAudioService)
   * @param file Archivo a validar
   * @param config Configuración del tipo de archivo
   * @returns { ok: boolean; error?: string }
   */
  private validateFile(file: File | null | undefined, config: UploadConfig): { ok: boolean; error?: string } {
    if (!file) return { ok: false, error: 'Archivo inválido' };

    // Determinar el tipo de archivo basado en el config (audio o image)
    const typePrefix = config.endpoint.includes('audio') ? 'audio' : 'image';

    const handlers: Record<string, (f: File) => { ok: boolean; error?: string }> = {
      audio: (f: File) => {
        const isAudioMime = f.type.startsWith('audio/');
        const allowed = config.validTypes.includes(f.type);
        if (!isAudioMime || !allowed) return { ok: false, error: config.errorMessages.invalidFile };
        if (f.size > config.maxSizeInBytes) return { ok: false, error: config.errorMessages.tooLarge };
        return { ok: true };
      },
      image: (f: File) => {
        if (!f.type.startsWith('image/') || !config.validTypes.includes(f.type)) return { ok: false, error: config.errorMessages.invalidFile };
        if (f.size > config.maxSizeInBytes) return { ok: false, error: config.errorMessages.tooLarge };
        return { ok: true };
      }
    };

    const fn = handlers[typePrefix];
    return fn ? fn(file) : { ok: true };
  }

  /**
   * Maneja los errores de las peticiones HTTP (mejorado con casos detallados)
   * @param error Error recibido
   * @param config Configuración del upload
   * @returns Observable con error formateado
   */
  private handleError(error: any, config: UploadConfig): Observable<never> {
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
          errorMessage = config.errorMessages.tooLarge;
          break;
        case 415:
          errorMessage = config.errorMessages.unsupportedType;
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

    console.error('Error en upload service:', error);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Obtiene la URL completa para acceder a un archivo
   * @param relativePath Ruta relativa del archivo
   * @returns URL completa del archivo
   */
  getFileUrl(relativePath: string): string {
    if (relativePath.startsWith('http')) {
      return relativePath;
    }

    // Si la ruta relativa no empieza con '/', la agregamos
    const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    return `${this.baseUrl.replace('/api', '')}${cleanPath}`;
  }

  /**
   * Verifica si un archivo existe en el servidor (solo para thumbnails)
   * @param fileName Nombre del archivo
   * @returns Observable<boolean> indicando si existe
   */
  checkFileExists(fileName: string, type: 'thumbnail'): Observable<boolean> {
    const checkUrl = `${this.baseUrl}/files/thumbnails/${fileName}/exists`;
    return this.http.get<boolean>(checkUrl)
      .pipe(
        catchError(() => {
          // Si hay error, asumimos que no existe
          return throwError(() => new Error('No se pudo verificar la existencia del archivo'));
        })
      );
  }

  // Métodos específicos para compatibilidad
  uploadAudio(file: File): Observable<UploadResponse> {
    return this.uploadFile(file, 'audio');
  }

  uploadThumbnail(file: File): Observable<UploadResponse> {
    return this.uploadFile(file, 'thumbnail');
  }

  getAudioUrl(relativePath: string): string {
    return this.getFileUrl(relativePath);
  }

  getThumbnailUrl(relativePath: string): string {
    return this.getFileUrl(relativePath);
  }

  checkThumbnailExists(fileName: string): Observable<boolean> {
    return this.checkFileExists(fileName, 'thumbnail');
  }

  // Public validation methods
  validateAudioFile(file: File): { ok: boolean; error?: string } {
    return this.validateFile(file, this.uploadConfigs['audio']);
  }

  validateThumbnailFile(file: File): { ok: boolean; error?: string } {
    return this.validateFile(file, this.uploadConfigs['thumbnail']);
  }
}