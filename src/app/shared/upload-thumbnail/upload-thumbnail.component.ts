import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadService, UploadResponse } from '../../core/services/upload-services/upload.service';

/**
 * Estados posibles del componente de subida de miniaturas
 */
export type ThumbnailUploadState = 'idle' | 'uploading' | 'success' | 'error';

/**
 * Interfaz para los datos de la miniatura procesada
 */
export interface ThumbnailData {
  file: File;
  uploadedUrl?: string;
  state: ThumbnailUploadState;
  errorMessage?: string;
}

/**
 * Componente para manejar la lógica de subida de miniaturas.
 * NO tiene interfaz propia, solo maneja la funcionalidad de subida
 * y se comunica con el componente padre via @Output()
 */
@Component({
  selector: 'app-upload-thumbnail',
  standalone: true,
  imports: [CommonModule],
  template: '', // Sin template - solo lógica
  styles: []
})
export class UploadThumbnailComponent {
  
  // Estado interno del componente
  thumbnailData: ThumbnailData | null = null;
  showSuccessMessage: boolean = false;

  // Eventos para comunicación con el componente padre
  @Output() thumbnailUploaded = new EventEmitter<string>();
  @Output() thumbnailCleared = new EventEmitter<void>();
  @Output() uploadStateChanged = new EventEmitter<ThumbnailUploadState>();
  @Output() successMessageChanged = new EventEmitter<boolean>();

  constructor(private uploadThumbnailService: UploadService) {}

  /**
   * Método principal que recibe el archivo seleccionado desde upload-content
   * @param file Archivo de imagen seleccionado
   */
  onFileSelected(file: File): void {
    if (!file) {
      this.clearThumbnail();
      return;
    }

    // Crear datos iniciales de la miniatura
    this.thumbnailData = {
      file,
      state: 'idle'
    };

    // Emitir cambio de estado
    this.uploadStateChanged.emit('idle');

    // Subir automáticamente
    this.uploadThumbnail();
  }

  /**
   * Sube la miniatura al backend usando el servicio
   */
  private uploadThumbnail(): void {
    if (!this.thumbnailData) return;

    // Cambiar estado a subiendo
    this.thumbnailData.state = 'uploading';
    this.uploadStateChanged.emit('uploading');

    console.log('Subiendo miniatura:', this.thumbnailData.file.name);

    // Llamar al servicio
    this.uploadThumbnailService.uploadThumbnail(this.thumbnailData.file).subscribe({
      next: (response: UploadResponse) => {
        this.handleUploadSuccess(response);
      },
      error: (error: Error) => {
        this.handleUploadError(error);
      }
    });
  }

  /**
   * Maneja el éxito de la subida
   * @param response Respuesta del backend
   */
  private handleUploadSuccess(response: UploadResponse): void {
    if (!this.thumbnailData) return;

    console.log('Miniatura subida exitosamente:', response);

    // Actualizar estado
    this.thumbnailData.state = 'success';
    this.thumbnailData.uploadedUrl = response.url;
    this.thumbnailData.errorMessage = undefined;

    // Mostrar mensaje de éxito
    this.showSuccessMessage = true;
    this.successMessageChanged.emit(true);

    // Emitir eventos
    this.uploadStateChanged.emit('success');
    this.thumbnailUploaded.emit(response.url);

    console.log('URL de miniatura emitida al componente padre:', response.url);

    // Ocultar mensaje después de 2 segundos
    setTimeout(() => {
      this.showSuccessMessage = false;
      this.successMessageChanged.emit(false);
    }, 2000);
  }

  /**
   * Maneja los errores de subida
   * @param error Error recibido
   */
  private handleUploadError(error: Error): void {
    if (!this.thumbnailData) return;

    console.error('Error al subir miniatura:', error);

    // Actualizar estado
    this.thumbnailData.state = 'error';
    this.thumbnailData.errorMessage = error.message || 'Error desconocido al subir la miniatura';

    // Emitir cambio de estado
    this.uploadStateChanged.emit('error');
  }

  /**
   * Reintenta la subida
   */
  retryUpload(): void {
    if (this.thumbnailData?.state === 'error') {
      this.uploadThumbnail();
    }
  }

  /**
   * Limpia la miniatura actual (llamado desde el componente padre)
   */
  public clearThumbnail(): void {
    this.thumbnailData = null;
    this.thumbnailCleared.emit();
    this.uploadStateChanged.emit('idle');
  }

  /**
   * Getters públicos para acceso desde el componente padre
   */
  public get currentState(): ThumbnailUploadState {
    return this.thumbnailData?.state ?? 'idle';
  }

  public get uploadedUrl(): string | undefined {
    return this.thumbnailData?.uploadedUrl;
  }

  public get hasFile(): boolean {
    return !!this.thumbnailData;
  }

  public get isUploading(): boolean {
    return this.thumbnailData?.state === 'uploading' || false;
  }

  public get errorMessage(): string | undefined {
    return this.thumbnailData?.errorMessage;
  }

  public get isShowingSuccessMessage(): boolean {
    return this.showSuccessMessage;
  }
}