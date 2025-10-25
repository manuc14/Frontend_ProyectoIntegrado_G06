import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';
import { AvatarsResponseDto } from '../models/media.models';

export type ImageType = 'avatar' | 'thumbnail';

export interface ImageSelectorState {
  images: string[];
  defaultImage: string;
  selectedImage: string;
  loading: boolean;
  error: boolean;
  selectedImageUrl: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ImageSelectorService {
  private state$ = new BehaviorSubject<ImageSelectorState>({
    images: [],
    defaultImage: '',
    selectedImage: '',
    loading: false,
    error: false,
    selectedImageUrl: null
  });

  constructor(private apiService: ApiService) {}

  /**
   * Obtiene el estado actual como observable
   */
  getState(): Observable<ImageSelectorState> {
    return this.state$.asObservable();
  }

  /**
   * Obtiene el estado actual como valor
   */
  getCurrentState(): ImageSelectorState {
    return this.state$.value;
  }

  /**
   * Carga las imágenes desde el backend según el tipo
   */
  loadImages(type: ImageType): void {
    this.updateState({ loading: true, error: false });

    if (type === 'avatar') {
      this.apiService.getAvatars().subscribe({
        next: (response: AvatarsResponseDto) => {
          this.handleLoadSuccess(response.avatars || [], response.defaultAvatar || '', type);
        },
        error: (error: any) => {
          this.handleLoadError(error);
        }
      });
    } else {
      this.apiService.getThumbnails().subscribe({
        next: (response: {thumbnails: string[], defaultThumbnail: string}) => {
          this.handleLoadSuccess(response.thumbnails || [], response.defaultThumbnail || '', type);
        },
        error: (error: any) => {
          this.handleLoadError(error);
        }
      });
    }
  }

  /**
   * Maneja el éxito de la carga de imágenes
   */
  private handleLoadSuccess(images: string[], defaultImage: string, type: ImageType): void {
    this.updateState({
      images,
      defaultImage,
      selectedImage: defaultImage,
      selectedImageUrl: defaultImage ? this.getFullImageUrl(defaultImage, type) : null,
      loading: false,
      error: false
    });
  }

  /**
   * Maneja el error de la carga de imágenes
   */
  private handleLoadError(error: any): void {
    console.error('Error al cargar imágenes:', error);
    this.updateState({
      images: [],
      defaultImage: '',
      selectedImage: '',
      selectedImageUrl: null,
      loading: false,
      error: true
    });
  }

  /**
   * Selecciona una imagen predefinida
   */
  selectImage(imagePath: string, type: ImageType): void {
    const fullUrl = this.getFullImageUrl(imagePath, type);
    this.updateState({
      selectedImage: imagePath,
      selectedImageUrl: fullUrl
    });
  }

  /**
   * Selecciona una imagen subida localmente (para thumbnails)
   */
  selectLocalImage(url: string): void {
    this.updateState({
      selectedImage: '',
      selectedImageUrl: url
    });
  }

  /**
   * Limpia la selección de imagen local
   */
  clearLocalImage(): void {
    const currentState = this.getCurrentState();
    this.updateState({
      selectedImage: currentState.defaultImage,
      selectedImageUrl: currentState.defaultImage ? this.getFullImageUrl(currentState.defaultImage, 'thumbnail') : null
    });
  }

  /**
   * Obtiene la URL completa de una imagen
   */
  getFullImageUrl(relativePath: string, type: ImageType): string {
    return type === 'avatar'
      ? this.apiService.getFullAvatarUrl(relativePath)
      : this.apiService.getFullThumbnailUrl(relativePath);
  }

  /**
   * Extrae el nombre del archivo de una ruta de imagen
   */
  extractImageFileName(imagePath: string): string {
    if (!imagePath) return '';
    return imagePath.split('/').pop() ?? '';
  }

  /**
   * Resetea el estado del servicio
   */
  reset(): void {
    this.state$.next({
      images: [],
      defaultImage: '',
      selectedImage: '',
      loading: false,
      error: false,
      selectedImageUrl: null
    });
  }

  /**
   * Actualiza el estado interno
   */
  private updateState(updates: Partial<ImageSelectorState>): void {
    const currentState = this.getCurrentState();
    this.state$.next({ ...currentState, ...updates });
  }
}
