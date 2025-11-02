/**
 * @fileoverview Servicio para gestionar la selección de imágenes (avatares y miniaturas).
 * 
 * Este servicio:
 * - Gestiona el estado de selección de avatares y miniaturas
 * - Carga imágenes disponibles desde el backend
 * - Proporciona URLs completas para las imágenes seleccionadas
 * - Maneja estados de carga y error
 * 
 * @module ImageSelectorService
 * @requires ApiService - Para cargar avatares y miniaturas del backend
 * @requires BehaviorSubject - Para gestión reactiva del estado
 */

import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';
import { AvatarsResponseDto } from '../models/media.models';

/**
 * Tipo de imagen que se puede seleccionar.
 * @typedef {'avatar' | 'thumbnail'} ImageType
 */
export type ImageType = 'avatar' | 'thumbnail';

/**
 * Interfaz que representa el estado completo del selector de imágenes.
 * 
 * @interface ImageSelectorState
 */
export interface ImageSelectorState {
  /** Lista de rutas de imágenes disponibles */
  images: string[];
  /** Ruta de la imagen por defecto del sistema */
  defaultImage: string;
  /** Ruta de la imagen actualmente seleccionada */
  selectedImage: string;
  /** Indica si se están cargando las imágenes */
  loading: boolean;
  /** Indica si hubo un error al cargar las imágenes */
  error: boolean;
  /** URL completa de la imagen seleccionada (null si no hay selección) */
  selectedImageUrl: string | null;
}

/**
 * Servicio para gestionar la selección de imágenes (avatares y miniaturas).
 * 
 * Proporciona un estado centralizado para la selección de imágenes en
 * formularios de registro, creación de contenido, etc. Gestiona la carga
 * de imágenes disponibles desde el backend y la construcción de URLs.
 * 
 * El estado es reactivo mediante BehaviorSubject, permitiendo a los componentes
 * suscribirse a cambios en tiempo real.
 * 
 * @class ImageSelectorService
 * @injectable
 */
@Injectable({
  providedIn: 'root'
})
export class ImageSelectorService {
  /** BehaviorSubject que mantiene el estado actual del selector */
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
   * Obtiene el estado del selector como observable.
   * 
   * Permite a los componentes suscribirse a cambios en el estado
   * de forma reactiva.
   * 
   * @returns {Observable<ImageSelectorState>} Observable con el estado actual
   * 
   * @example
   * ```typescript
   * this.imageSelectorService.getState().subscribe(state => {
   *   this.images = state.images;
   *   this.isLoading = state.loading;
   *   this.selectedUrl = state.selectedImageUrl;
   * });
   * ```
   */
  getState(): Observable<ImageSelectorState> {
    return this.state$.asObservable();
  }

  /**
   * Obtiene el estado actual del selector de forma síncrona.
   * 
   * Útil cuando se necesita acceder al estado sin suscripción,
   * por ejemplo para leer el valor seleccionado al enviar un formulario.
   * 
   * @returns {ImageSelectorState} Estado actual del selector
   * 
   * @example
   * ```typescript
   * const currentState = this.imageSelectorService.getCurrentState();
   * const selectedImage = currentState.selectedImage;
   * console.log('Imagen seleccionada:', selectedImage);
   * ```
   */
  getCurrentState(): ImageSelectorState {
    return this.state$.value;
  }

  /**
   * Carga las imágenes disponibles desde el backend.
   * 
   * Según el tipo especificado, carga avatares o miniaturas disponibles
   * y actualiza el estado con la lista recibida. Gestiona estados de
   * carga y error automáticamente.
   * 
   * @param {ImageType} type - Tipo de imágenes a cargar ('avatar' | 'thumbnail')
   * 
   * @example
   * ```typescript
   * // Cargar avatares
   * this.imageSelectorService.loadImages('avatar');
   * 
   * // Cargar miniaturas
   * this.imageSelectorService.loadImages('thumbnail');
   * ```
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
   * Maneja el éxito de la carga de imágenes desde el backend.
   * 
   * Actualiza el estado con las imágenes cargadas y selecciona
   * automáticamente la imagen por defecto. Construye la URL completa
   * de la imagen seleccionada.
   * 
   * @param {string[]} images - Lista de rutas de imágenes disponibles
   * @param {string} defaultImage - Ruta de la imagen por defecto
   * @param {ImageType} type - Tipo de imagen cargada
   * @private
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
   * Maneja errores durante la carga de imágenes.
   * 
   * Actualiza el estado para indicar el error y detener la carga.
   * Registra el error en consola para debugging.
   * 
   * @param {any} error - Error recibido del backend
   * @private
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
   * Selecciona una imagen predefinida del catálogo.
   * 
   * Actualiza el estado con la imagen seleccionada y construye su URL completa.
   * Se usa cuando el usuario elige una imagen del grid de opciones disponibles.
   * 
   * @param {string} imagePath - Ruta relativa de la imagen seleccionada
   * @param {ImageType} type - Tipo de imagen ('avatar' | 'thumbnail')
   * 
   * @example
   * ```typescript
   * // Seleccionar un avatar predefinido
   * this.imageSelectorService.selectImage('/avatars/avatar3.png', 'avatar');
   * 
   * // Seleccionar una miniatura predefinida
   * this.imageSelectorService.selectImage('/thumbnails/thumb2.jpg', 'thumbnail');
   * ```
   */
  selectImage(imagePath: string, type: ImageType): void {
    const fullUrl = this.getFullImageUrl(imagePath, type);
    this.updateState({
      selectedImage: imagePath,
      selectedImageUrl: fullUrl
    });
  }

  /**
   * Selecciona una imagen subida localmente por el usuario.
   * 
   * Se usa para miniaturas personalizadas cuando el usuario sube su propia
   * imagen en lugar de usar una predefinida. La URL debe ser un Data URL
   * o Blob URL generado tras leer el archivo.
   * 
   * @param {string} url - URL local de la imagen (Data URL o Blob URL)
   * 
   * @example
   * ```typescript
   * // Después de leer un archivo con FileReader
   * const reader = new FileReader();
   * reader.onload = (e) => {
   *   const dataUrl = e.target?.result as string;
   *   this.imageSelectorService.selectLocalImage(dataUrl);
   * };
   * reader.readAsDataURL(imageFile);
   * ```
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
   * Obtiene la URL completa de una imagen según su tipo.
   * 
   * Delega en ApiService para construir la URL completa correcta
   * dependiendo del tipo de imagen (avatar o miniatura).
   * 
   * @param {string} relativePath - Ruta relativa de la imagen
   * @param {ImageType} type - Tipo de imagen
   * @returns {string} URL completa de la imagen
   * 
   * @example
   * ```typescript
   * const avatarUrl = this.imageSelectorService.getFullImageUrl('/avatars/avatar1.png', 'avatar');
   * // => '/resources/avatars/avatar1.png'
   * 
   * const thumbUrl = this.imageSelectorService.getFullImageUrl('/thumbnails/thumb1.jpg', 'thumbnail');
   * // => '/resources/thumbnails/thumb1.jpg'
   * ```
   */
  getFullImageUrl(relativePath: string, type: ImageType): string {
    return type === 'avatar'
      ? this.apiService.getFullAvatarUrl(relativePath)
      : this.apiService.getFullThumbnailUrl(relativePath);
  }

  /**
   * Extrae el nombre del archivo de una ruta de imagen.
   * 
   * Útil para mostrar solo el nombre del archivo en la UI
   * en lugar de la ruta completa.
   * 
   * @param {string} imagePath - Ruta completa de la imagen
   * @returns {string} Nombre del archivo con extensión
   * 
   * @example
   * ```typescript
   * const name = this.imageSelectorService.extractImageFileName('/avatars/avatar1.png');
   * // => 'avatar1.png'
   * 
   * const name2 = this.imageSelectorService.extractImageFileName('/resources/thumbnails/thumb.jpg');
   * // => 'thumb.jpg'
   * ```
   */
  extractImageFileName(imagePath: string): string {
    if (!imagePath) return '';
    return imagePath.split('/').pop() ?? '';
  }

  /**
   * Resetea el estado del servicio a sus valores iniciales.
   * 
   * Limpia todas las imágenes cargadas y la selección actual.
   * Útil cuando se navega entre diferentes formularios o se cancela
   * una operación.
   * 
   * @example
   * ```typescript
   * // Al cancelar un formulario
   * this.imageSelectorService.reset();
   * 
   * // Al cambiar de tipo de imagen
   * this.imageSelectorService.reset();
   * this.imageSelectorService.loadImages('thumbnail');
   * ```
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
   * Actualiza el estado del servicio de forma parcial.
   * 
   * Combina el estado actual con las actualizaciones proporcionadas,
   * manteniendo los valores no modificados. Es el método interno usado
   * por todas las operaciones del servicio para actualizar el estado.
   * 
   * @param {Partial<ImageSelectorState>} updates - Propiedades del estado a actualizar
   * @private
   * 
   * @example
   * ```typescript
   * // Solo actualiza loading, mantiene el resto igual
   * this.updateState({ loading: true });
   * 
   * // Actualiza múltiples propiedades
   * this.updateState({
   *   selectedImage: '/avatars/avatar5.png',
   *   selectedImageUrl: '/resources/avatars/avatar5.png'
   * });
   * ```
   */
  private updateState(updates: Partial<ImageSelectorState>): void {
    const currentState = this.getCurrentState();
    this.state$.next({ ...currentState, ...updates });
  }
}
