import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * Interfaz para la respuesta del backend al subir una miniatura
 */
export interface ThumbnailUploadResponse {
  url: string;
  filename: string;
  originalName: string;
}

/**
 * Servicio para manejar la subida de miniaturas al backend
 */
@Injectable({
  providedIn: 'root'
})
export class UploadThumbnailService {
  private readonly baseUrl = 'http://localhost:8080/api';
  private readonly uploadEndpoint = `${this.baseUrl}/uploads/thumbnails`;

  constructor(private http: HttpClient) {}

  /**
   * Sube una miniatura al backend
   * @param file Archivo de imagen a subir
   * @returns Observable con la respuesta del servidor
   */
  uploadThumbnail(file: File): Observable<ThumbnailUploadResponse> {
    // Validaciones básicas del archivo
    if (!file) {
      return throwError(() => new Error('No se ha seleccionado ningún archivo'));
    }

    if (!this.isValidImageFile(file)) {
      return throwError(() => new Error('El archivo debe ser una imagen (JPEG, PNG)'));
    }

    // Validar tamaño máximo (5 MB)
    const maxSizeInBytes = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSizeInBytes) {
      return throwError(() => new Error('El archivo no puede superar 5 MB'));
    }

    // Crear FormData para enviar el archivo
    const formData = new FormData();
    formData.append('file', file, file.name);

    // Realizar la petición POST
    return this.http.post<ThumbnailUploadResponse>(this.uploadEndpoint, formData)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Valida si el archivo es una imagen válida
   * @param file Archivo a validar
   * @returns true si es una imagen válida
   */
  private isValidImageFile(file: File): boolean {
    const validTypes = [
      'image/jpeg',     // .jpg, .jpeg
      'image/jpg',      // .jpg (alternativo)
      'image/png'       // .png
    ];

    const validExtensions = ['.jpg', '.jpeg', '.png'];
    
    // Verificar MIME type
    const isMimeTypeValid = validTypes.includes(file.type);
    
    // Verificar extensión del archivo como fallback
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
    let errorMessage = 'Error desconocido al subir la miniatura';

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
          errorMessage = 'El archivo es demasiado grande (máximo 5 MB)';
          break;
        case 415:
          errorMessage = 'Tipo de archivo no soportado (solo JPEG y PNG)';
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

    console.error('Error en upload thumbnail service:', error);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Obtiene la URL completa para acceder a una miniatura
   * @param relativePath Ruta relativa de la miniatura (ej: "/api/files/thumbnails/uuid.jpg")
   * @returns URL completa de la miniatura
   */
  getThumbnailUrl(relativePath: string): string {
    if (relativePath.startsWith('http')) {
      return relativePath;
    }
    
    // Si la ruta relativa no empieza con '/', la agregamos
    const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    return `${this.baseUrl.replace('/api', '')}${cleanPath}`;
  }

  /**
   * Verifica si una miniatura existe en el servidor
   * @param fileName Nombre del archivo de la miniatura
   * @returns Observable<boolean> indicando si existe
   */
  checkThumbnailExists(fileName: string): Observable<boolean> {
    const checkUrl = `${this.baseUrl}/files/thumbnails/${fileName}/exists`;
    return this.http.get<boolean>(checkUrl)
      .pipe(
        catchError(() => {
          // Si hay error, asumimos que no existe
          return throwError(() => new Error('No se pudo verificar la existencia de la miniatura'));
        })
      );
  }
}