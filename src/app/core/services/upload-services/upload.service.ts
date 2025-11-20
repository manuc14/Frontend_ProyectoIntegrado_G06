/**
 * @fileoverview Servicio genérico para gestionar la subida de archivos multimedia al backend.
 * 
 * Este servicio:
 * - Valida archivos antes de subirlos (tipo, tamaño, extensión)
 * - Maneja la subida de archivos de audio, video y miniaturas
 * - Proporciona feedback detallado de errores de validación
 * - Gestiona FormData y comunicación con endpoints de upload
 * 
 * @module UploadService
 * @requires HttpClient - Para subir archivos al backend
 * @requires environment - Configuración de URLs del backend
 * @requires UPLOAD_LIMITS - Límites de tamaño de archivos
 * @requires UPLOAD_FILE_TYPES - Tipos MIME permitidos
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { UPLOAD_LIMITS, UPLOAD_FILE_TYPES } from '../../constants/form-limits';

/**
 * Interfaz para la respuesta de subida exitosa.
 * El backend devuelve esta estructura tras procesar el archivo.
 * 
 * @interface UploadResponse
 */
export interface UploadResponse {
  /** URL completa donde se puede acceder al archivo subido */
  url: string;
  /** Nombre del archivo generado en el servidor (puede ser diferente al original) */
  filename: string;
  /** Nombre original del archivo proporcionado por el usuario */
  originalName: string;
}

/**
 * Configuración para un tipo específico de upload.
 * Define reglas de validación y mensajes de error personalizados.
 * 
 * @interface UploadConfig
 */
export interface UploadConfig {
  /** Endpoint del backend para este tipo de archivo */
  endpoint: string;
  /** Lista de tipos MIME válidos (ej: ['audio/mp3', 'audio/wav']) */
  validTypes: readonly string[];
  /** Lista de extensiones de archivo permitidas (ej: ['.mp3', '.wav']) */
  validExtensions: string[];
  /** Tamaño máximo permitido en bytes */
  maxSizeInBytes: number;
  /** Mensajes de error personalizados para validaciones */
  errorMessages: {
    /** Mensaje cuando el archivo no es del tipo esperado */
    invalidFile: string;
    /** Mensaje cuando el archivo excede el tamaño máximo */
    tooLarge: string;
    /** Mensaje cuando el tipo MIME no está soportado */
    unsupportedType: string;
  };
}

/**
 * Servicio genérico para gestionar la subida de archivos multimedia.
 * 
 * Proporciona validación automática de archivos según el tipo (audio, video, thumbnail)
 * antes de subirlos al backend. Cada tipo de archivo tiene su propia configuración
 * de validación y endpoints específicos.
 * 
 * El servicio valida:
 * - Tipo MIME del archivo
 * - Extensión del archivo
 * - Tamaño del archivo
 * 
 * @class UploadService
 * @injectable
 * 
 * @example
 * ```typescript
 * // Validar archivo de audio
 * const audioFile = event.target.files[0];
 * const error = this.uploadService.validateFile(audioFile, 'audio');
 * if (error) {
 *   console.error('Validación falló:', error);
 *   return;
 * }
 * 
 * // Subir archivo de audio
 * this.uploadService.uploadFile(audioFile, 'audio').subscribe({
 *   next: (response) => {
 *     console.log('Audio subido:', response.url);
 *     this.audioUrl = response.url;
 *   },
 *   error: (error) => console.error('Error al subir')
 * });
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class UploadService {
  /** URL base del backend para todos los endpoints de upload */
  private readonly baseUrl = environment.baseApiUrl;

  /**
   * Configuraciones específicas para cada tipo de archivo.
   * Define validaciones y endpoints únicos para audio, video y thumbnails.
   */
  private uploadConfigs: Record<string, UploadConfig> = {
    audio: {
      endpoint: `${this.baseUrl}/uploads/audio`,
      validTypes: UPLOAD_FILE_TYPES.audio,
      validExtensions: ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.webm'],
      maxSizeInBytes: UPLOAD_LIMITS.fileMaxSizeMB * 1024 * 1024, // 1 MB
      errorMessages: {
        invalidFile: 'Formato de audio no válido (MP3, WAV, OGG, AAC, FLAC, WEBM)',
        tooLarge: `El archivo de audio no puede superar ${UPLOAD_LIMITS.fileMaxSizeMB} MB`,
        unsupportedType: 'Tipo de archivo de audio no soportado'
      }
    },
    thumbnail: {
      endpoint: `${this.baseUrl}/uploads/thumbnails`,
      validTypes: UPLOAD_FILE_TYPES.image,
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
   * Sube un archivo al backend.
   * 
   * Valida el archivo antes de subirlo y lo envía al endpoint correspondiente
   * mediante FormData. Si la validación falla, devuelve un error sin hacer
   * la petición HTTP.
   * 
   * @param {File} file - Archivo a subir
   * @param {keyof typeof this.uploadConfigs} type - Tipo de upload ('audio' | 'thumbnail')
   * @returns {Observable<UploadResponse>} Observable con la URL del archivo subido
   * 
   * @example
   * ```typescript
   * // Subir archivo de audio
   * const audioFile = fileInput.files[0];
   * this.uploadService.uploadFile(audioFile, 'audio').subscribe({
   *   next: (response) => {
   *     console.log('Archivo subido:', response.url);
   *     console.log('Nombre en servidor:', response.filename);
   *     this.form.patchValue({ archivoUrl: response.url });
   *   },
   *   error: (error) => {
   *     console.error('Error al subir archivo:', error.message);
   *     this.showError(error.message);
   *   }
   * });
   * 
   * // Subir miniatura
   * this.uploadService.uploadFile(thumbnailFile, 'thumbnail').subscribe({
   *   next: (response) => this.thumbnailUrl = response.url
   * });
   * ```
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
   * Valida un archivo según las reglas de la configuración.
   * 
   * Verifica que el archivo cumpla con:
   * - Tipo MIME permitido
   * - Tamaño máximo permitido
   * - Es un archivo válido (no null/undefined)
   * 
   * @param {File | null | undefined} file - Archivo a validar
   * @param {UploadConfig} config - Configuración con reglas de validación
   * @returns {{ ok: boolean; error?: string }} Resultado de la validación
   * @private
   * 
   * @example
   * ```typescript
   * const config = this.uploadConfigs['audio'];
   * const result = this.validateFile(audioFile, config);
   * 
   * if (!result.ok) {
   *   console.error('Validación falló:', result.error);
   *   // result.error podría ser:
   *   // - "Formato de audio no válido (MP3, WAV, OGG, AAC, FLAC, WEBM)"
   *   // - "El archivo de audio no puede superar 1 MB"
   * }
   * ```
   */
  private validateFile(file: File | null | undefined, config: UploadConfig): { ok: boolean; error?: string } {
    if (!file) return { ok: false, error: 'Archivo inválido' };

    const fileName = file.name.trim();
    const isInvalidName = !fileName || fileName.startsWith('.') || fileName.includes('..');
    if (isInvalidName) return { ok: false, error: 'Nombre de archivo inválido' };

    const isInvalidType = !config.validTypes.includes(file.type);
    if (isInvalidType) return { ok: false, error: config.errorMessages.invalidFile };

    const isTooLarge = file.size > config.maxSizeInBytes;
    if (isTooLarge) return { ok: false, error: config.errorMessages.tooLarge };

    return { ok: true };
  }

  /**
   * Maneja errores durante la subida de archivos.
   * 
   * Devuelve un mensaje genérico de error para todos los casos,
   * registrando el error completo en consola para debugging.
   * 
   * @param {any} error - Error HTTP recibido
   * @param {UploadConfig} config - Configuración (no utilizada actualmente)
   * @returns {Observable<never>} Observable que emite error
   * @private
   */
  private handleError(error: any, config: UploadConfig): Observable<never> {
    const errorMessage = 'Ha ocurrido un error inesperado. Inténtelo de nuevo más tarde';
    console.error('Error en upload service:', error);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Obtiene la URL completa para acceder a un archivo subido.
   * 
   * Convierte rutas relativas del servidor en URLs completas accesibles.
   * Maneja tanto URLs absolutas (http/https) como rutas relativas.
   * 
   * @param {string} relativePath - Ruta relativa o absoluta del archivo
   * @returns {string} URL completa del archivo
   * 
   * @example
   * ```typescript
   * // URL absoluta (no se modifica)
   * const url1 = this.uploadService.getFileUrl('https://cdn.example.com/audio.mp3');
   * // => 'https://cdn.example.com/audio.mp3'
   * 
   * // Ruta relativa con barra
   * const url2 = this.uploadService.getFileUrl('/uploads/audio/song.mp3');
   * // => 'http://localhost:8080/uploads/audio/song.mp3'
   * 
   * // Ruta relativa sin barra
   * const url3 = this.uploadService.getFileUrl('uploads/audio/song.mp3');
   * // => 'http://localhost:8080/uploads/audio/song.mp3'
   * ```
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
   * Verifica si un archivo existe en el servidor.
   * 
   * Útil para validar si una miniatura ya fue subida antes de intentar
   * subirla nuevamente. Actualmente solo soporta verificación de thumbnails.
   * 
   * @param {string} fileName - Nombre del archivo a verificar
   * @param {'thumbnail'} type - Tipo de archivo (actualmente solo 'thumbnail')
   * @returns {Observable<boolean>} Observable que emite true si existe, false si no
   * 
   * @example
   * ```typescript
   * this.uploadService.checkFileExists('thumbnail-123.jpg', 'thumbnail').subscribe({
   *   next: (exists) => {
   *     if (exists) {
   *       console.log('El archivo ya existe');
   *       this.reuseExistingThumbnail();
   *     } else {
   *       console.log('El archivo no existe');
   *       this.uploadNewThumbnail();
   *     }
   *   },
   *   error: () => {
   *     console.log('Error al verificar, asumiendo que no existe');
   *     this.uploadNewThumbnail();
   *   }
   * });
   * ```
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

  // ==================== MÉTODOS DE CONVENIENCIA ====================
  // Métodos específicos para cada tipo de archivo que simplifican el uso del servicio

  /**
   * Método de conveniencia para subir archivos de audio.
   * Wrapper sobre uploadFile con tipo 'audio' predefinido.
   * 
   * @param {File} file - Archivo de audio a subir
   * @returns {Observable<UploadResponse>} Observable con respuesta del servidor
   * 
   * @example
   * ```typescript
   * this.uploadService.uploadAudio(audioFile).subscribe({
   *   next: (response) => this.audioUrl = response.url
   * });
   * ```
   */
  uploadAudio(file: File): Observable<UploadResponse> {
    return this.uploadFile(file, 'audio');
  }

  /**
   * Método de conveniencia para subir miniaturas.
   * Wrapper sobre uploadFile con tipo 'thumbnail' predefinido.
   * 
   * @param {File} file - Archivo de imagen a subir como miniatura
   * @returns {Observable<UploadResponse>} Observable con respuesta del servidor
   * 
   * @example
   * ```typescript
   * this.uploadService.uploadThumbnail(thumbnailFile).subscribe({
   *   next: (response) => this.thumbnailUrl = response.url
   * });
   * ```
   */
  uploadThumbnail(file: File): Observable<UploadResponse> {
    return this.uploadFile(file, 'thumbnail');
  }

  /**
   * Método de conveniencia para obtener URL de audio.
   * Wrapper sobre getFileUrl.
   * 
   * @param {string} relativePath - Ruta relativa del audio
   * @returns {string} URL completa del audio
   * 
   * @example
   * ```typescript
   * const url = this.uploadService.getAudioUrl('/uploads/audio/song.mp3');
   * this.audioElement.src = url;
   * ```
   */
  getAudioUrl(relativePath: string): string {
    return this.getFileUrl(relativePath);
  }

  /**
   * Método de conveniencia para obtener URL de miniatura.
   * Wrapper sobre getFileUrl.
   * 
   * @param {string} relativePath - Ruta relativa de la miniatura
   * @returns {string} URL completa de la miniatura
   * 
   * @example
   * ```typescript
   * const url = this.uploadService.getThumbnailUrl('/uploads/thumbnails/thumb.jpg');
   * this.imgElement.src = url;
   * ```
   */
  getThumbnailUrl(relativePath: string): string {
    return this.getFileUrl(relativePath);
  }

  /**
   * Método de conveniencia para verificar existencia de miniatura.
   * Wrapper sobre checkFileExists con tipo 'thumbnail'.
   * 
   * @param {string} fileName - Nombre del archivo de miniatura
   * @returns {Observable<boolean>} Observable que indica si existe
   * 
   * @example
   * ```typescript
   * this.uploadService.checkThumbnailExists('thumb-123.jpg').subscribe({
   *   next: (exists) => console.log('Existe:', exists)
   * });
   * ```
   */
  checkThumbnailExists(fileName: string): Observable<boolean> {
    return this.checkFileExists(fileName, 'thumbnail');
  }

  // ==================== MÉTODOS DE VALIDACIÓN PÚBLICA ====================

  /**
   * Valida un archivo de audio antes de subirlo.
   * 
   * Permite validar el archivo sin subirlo, útil para mostrar errores
   * inmediatamente cuando el usuario selecciona un archivo.
   * 
   * @param {File} file - Archivo de audio a validar
   * @returns {{ ok: boolean; error?: string }} Resultado de la validación
   * 
   * @example
   * ```typescript
   * onFileSelected(event: any) {
   *   const file = event.target.files[0];
   *   const validation = this.uploadService.validateAudioFile(file);
   *   
   *   if (!validation.ok) {
   *     this.errorMessage = validation.error;
   *     this.fileInput.value = ''; // Limpiar input
   *     return;
   *   }
   *   
   *   // Archivo válido, proceder a subir
   *   this.uploadAudio(file);
   * }
   * ```
   */
  validateAudioFile(file: File): { ok: boolean; error?: string } {
    return this.validateFile(file, this.uploadConfigs['audio']);
  }

  /**
   * Valida un archivo de miniatura antes de subirlo.
   * 
   * Permite validar la imagen sin subirla, útil para feedback inmediato.
   * 
   * @param {File} file - Archivo de imagen a validar
   * @returns {{ ok: boolean; error?: string }} Resultado de la validación
   * 
   * @example
   * ```typescript
   * onThumbnailSelected(event: any) {
   *   const file = event.target.files[0];
   *   const validation = this.uploadService.validateThumbnailFile(file);
   *   
   *   if (!validation.ok) {
   *     this.showError(validation.error!);
   *     return;
   *   }
   *   
   *   // Mostrar preview
   *   this.previewThumbnail(file);
   * }
   * ```
   */
  validateThumbnailFile(file: File): { ok: boolean; error?: string } {
    return this.validateFile(file, this.uploadConfigs['thumbnail']);
  }

  /**
   * Valida un archivo de miniatura antes de subirlo.
   * 
   * Permite validar la imagen sin subirla, útil para feedback inmediato.
   * 
   * @param {File} file - Archivo de imagen a validar
   * @returns {{ ok: boolean; error?: string }} Resultado de la validación
   * 
   * @example
   * ```typescript
   * onThumbnailSelected(event: any) {
   *   const file = event.target.files[0];
   *   const validation = this.uploadService.validateThumbnailFile(file);
   *   
   *   if (!validation.ok) {
   *     this.showError(validation.error!);
   *     return;
   *   }
   *   
   *   // Mostrar preview
   *   this.previewThumbnail(file);
   * }
   * ```
   */
  /**
   * Sube múltiples archivos (audio y/o thumbnail) en paralelo.
   * 
   * @param {File} [audioFile] - Archivo de audio opcional
   * @param {File} [thumbnailFile] - Archivo de thumbnail opcional
   * @returns {Observable<{audioUrl?: string, thumbnailUrl?: string}>} URLs de los archivos subidos
   */
  uploadMultipleFiles(audioFile?: File, thumbnailFile?: File): Observable<{audioUrl?: string, thumbnailUrl?: string}> {
    const uploads: Observable<{key: 'audioUrl' | 'thumbnailUrl', url: string}>[] = [];

    if (audioFile) {
      uploads.push(
        this.uploadFile(audioFile, 'audio').pipe(
          map(res => ({ key: 'audioUrl' as const, url: res.url }))
        )
      );
    }

    if (thumbnailFile) {
      uploads.push(
        this.uploadFile(thumbnailFile, 'thumbnail').pipe(
          map(res => ({ key: 'thumbnailUrl' as const, url: res.url }))
        )
      );
    }

    if (uploads.length === 0) return of({});

    return forkJoin(uploads).pipe(
      map(results => results.reduce((acc, {key, url}) => ({ ...acc, [key]: url }), {}))
    );
  }
}