import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

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
        'audio/mpeg',     // .mp3
        'audio/wav',      // .wav
        'audio/wave',     // .wav (alternativo)
        'audio/ogg',      // .ogg
        'audio/mp4',      // .m4a
        'audio/x-m4a'     // .m4a (alternativo)
      ],
      validExtensions: ['.mp3', '.wav', '.ogg', '.m4a'],
      maxSizeInBytes: 1024 * 1024, // 1 MB
      errorMessages: {
        invalidFile: 'El archivo debe ser de tipo audio (mp3, wav, ogg, m4a)',
        tooLarge: 'El archivo no puede superar 1 MB',
        unsupportedType: 'Tipo de archivo no soportado'
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

    // Validaciones básicas del archivo
    if (!file) {
      return throwError(() => new Error('No se ha seleccionado ningún archivo'));
    }

    if (!this.isValidFile(file, config)) {
      return throwError(() => new Error(config.errorMessages.invalidFile));
    }

    // Validar tamaño máximo
    if (file.size > config.maxSizeInBytes) {
      return throwError(() => new Error(config.errorMessages.tooLarge));
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
   * Valida si el archivo es válido según la configuración
   * @param file Archivo a validar
   * @param config Configuración del tipo de archivo
   * @returns true si es válido
   */
  private isValidFile(file: File, config: UploadConfig): boolean {
    // Verificar MIME type
    const isMimeTypeValid = config.validTypes.includes(file.type);

    // Verificar extensión del archivo
    const fileName = file.name.toLowerCase();
    const isExtensionValid = config.validExtensions.some(ext => fileName.endsWith(ext));

    return isMimeTypeValid || isExtensionValid;
  }

  /**
   * Maneja los errores de las peticiones HTTP
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
}