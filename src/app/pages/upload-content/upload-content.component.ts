import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { UploadThumbnailComponent } from '../../shared/upload-thumbnail/upload-thumbnail.component';
import { ApiService } from '../../core/services/api.service';
import { UploadService } from '../../core/services/upload.service';
import { lastValueFrom } from 'rxjs';
import { Router } from '@angular/router';

// Interfaces para respuestas del backend
interface ThumbnailsResponse {
  thumbnails: string[];
  defaultThumbnail: string;
}

@Component({
  selector: 'app-upload-content',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent, UploadThumbnailComponent],
  templateUrl: './upload-content.component.html',
  styleUrls: ['./upload-content.component.scss']
})
export class UploadContentComponent implements OnInit, AfterViewInit {
  @ViewChild('uploadThumbnailComponent') uploadThumbnailComponent?: UploadThumbnailComponent;
  
  constructor(
    private api: ApiService, 
    private router: Router,
    private uploadAudioService: UploadService
  ) {}
  // form model
  title = '';
  description = '';
  file: File | null = null;
  // thumbnail selection (from backend)
  thumbnails: string[] = [];
  defaultThumbnail = '';
  selectedThumbnail = '';
  loadingThumbnails = false;
  thumbnailLoadError = false;
  selectedThumbnailUrl: string | null = null;
  // local thumbnail upload
  localThumbnailUrl: string | null = null;
  localThumbnailFile: File | null = null;
  type: 'video' | 'audio' | '' = '';
  vip: 'si' | 'no' | '' = '';
  url = '';
  audioUrl = '';
  resolution = '';
  estado = '';
  disponibilidad = '';
  // fecha de expiración/disponibilidad en formato AAAA-MM-DD
  fechaExpiracion = '';
  fechaError: string | null = null;
  minDate = '';
  duration = '';
  ageRestriction = '';
  tags: string[] = [];
  newTag = '';
  tagsError: string | null = null;

  // field-specific errors
  urlError: string | null = null;

  // form state messages
  formError: string | null = null;
  formSuccess: string | null = null;

  // success message state
  showSuccessMessage = false;
  hideSuccessMessage = false;
  // thumbnail success message state
  showThumbnailSuccessMessage = false;
  hideThumbnailSuccessMessage = false;

  // audio upload state
  audioUploading = false;
  audioUploadError: string | null = null;

  // limits
  readonly titleLimit = 50;
  readonly descLimit = 500;

  // computed properties for character counts
  get titleCount() { return this.title.length; }
  get descCount() { return this.description.length; }

  onTitleInput(ev: Event) {
    const v = (ev.target as HTMLInputElement).value || '';
    if (v.length > this.titleLimit) {
      this.title = v.slice(0, this.titleLimit);
    } else {
      this.title = v;
    }
  }

  onDescriptionInput(ev: Event) {
    const v = (ev.target as HTMLTextAreaElement).value || '';
    if (v.length > this.descLimit) {
      this.description = v.slice(0, this.descLimit);
    } else {
      this.description = v;
    }
  }

  // Método para manejar input de URL (solo video)
  onUrlInput(ev: Event) {
    if (this.type === 'audio') {
      // Prevenir escritura si está en modo audio
      ev.preventDefault();
      // no continuar cuando está en modo audio
    }
    // Permitir la escritura normal si está en modo video o sin selección
    const v = (ev.target as HTMLInputElement).value || '';
    this.url = v;
  }

  // Método para manejar input de archivo de audio (solo audio)
  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const selectedFile = input.files?.length ? input.files[0] : null;
    
    if (this.type === 'video') {
      this.handleVideoFileSelection(input);
    } else if (this.type === 'audio' && selectedFile) {
      await this.handleAudioFileSelection(selectedFile, input);
    } else if (selectedFile) {
      this.handleNoTypeSelected(input);
    } else {
      this.file = null;
    }
  }

  private handleVideoFileSelection(input: HTMLInputElement): void {
    console.warn('Para videos, utiliza el campo URL. La subida de archivos está deshabilitada.');
    this.clearFileInput(input);
  }

  private async handleAudioFileSelection(selectedFile: File, input: HTMLInputElement): Promise<void> {
    this.file = selectedFile;
    console.log('Selected audio file:', selectedFile.name);
    
    // El servicio UploadAudioService maneja todas las validaciones
    await this.uploadAudioFile(selectedFile);
  }



  private async uploadAudioFile(selectedFile: File): Promise<void> {
    this.audioUploading = true;
    this.audioUploadError = null;
    
    try {
      console.log('Subiendo archivo de audio al backend...');
      const response = await lastValueFrom(this.uploadAudioService.uploadAudio(selectedFile));
      this.handleUploadResponse(response);
    } catch (error: any) {
      this.handleUploadError(error);
    }
  }

  private handleUploadResponse(response: any): void {
    if (response?.url) {
      this.audioUrl = response.url;
      this.audioUploading = false;
      console.log('Archivo de audio subido exitosamente:', response.url);
    } else {
      console.error('La respuesta del servidor no contiene URL válida');
      this.setUploadError('Error: respuesta inválida del servidor');
    }
  }

  private handleUploadError(error: any): void {
    console.error('Error al subir archivo de audio:', error);
    const errorMessage = this.extractErrorMessage(error);
    this.setUploadError(errorMessage);
  }

  private extractErrorMessage(error: any): string {
    if (error?.error?.message) {
      return error.error.message;
    }
    if (error?.message) {
      return error.message;
    }
    return 'Error al subir el archivo. Inténtalo de nuevo.';
  }

  private setUploadError(message: string): void {
    this.audioUrl = '';
    this.audioUploading = false;
    this.audioUploadError = message;
  }

  private handleNoTypeSelected(input: HTMLInputElement): void {
    console.warn('Selecciona primero el tipo de archivo (Video o Audio)');
    this.clearFileInput(input);
  }

  private clearFileInput(input: HTMLInputElement): void {
    input.value = '';
    this.file = null;
  }

  // Validar si el archivo es de tipo video
  private isVideoFileType(file: File): boolean {
    const videoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm', 'video/mkv'];
    const hasVideoMimeType = videoTypes.some(type => file.type.startsWith(type.split('/')[0]));
    const hasVideoExtension = /\.(mp4|avi|mov|wmv|webm|mkv)$/i.test(file.name);
    return hasVideoMimeType || hasVideoExtension;
  }

  onThumbnailSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) {
      this.selectedThumbnailUrl = null;
      this.localThumbnailFile = null;
      return;
    }
    const file = files[0];
    
    // Guardar el archivo para el componente de subida
    this.localThumbnailFile = file;
    
    // Limpiar miniatura seleccionada del backend cuando se sube archivo local
    this.selectedThumbnail = '';
    this.selectedThumbnailUrl = null;
    
    // Pasar el archivo al componente de subida (se hará en el próximo ciclo de detección)
    setTimeout(() => {
      if (this.uploadThumbnailComponent) {
        this.uploadThumbnailComponent.onFileSelected(file);
      }
    }, 0);
    
    console.log('Archivo de miniatura seleccionado:', file.name);
  }

  /* Marca una miniatura como seleccionada y actualiza la URL. */
  selectThumbnail(thumbnailPath: string) {
    this.selectedThumbnail = thumbnailPath;
    this.selectedThumbnailUrl = this.getThumbnailUrl(thumbnailPath);
    // Limpiar miniatura local si se selecciona una del backend
    this.localThumbnailUrl = null;
    this.localThumbnailFile = null;
  }

  /**
   * Maneja cuando se sube exitosamente una miniatura local
   * @param uploadedUrl URL devuelta por el backend
   */
  onLocalThumbnailUploaded(uploadedUrl: string): void {
    console.log('Miniatura local subida exitosamente:', uploadedUrl);
    this.localThumbnailUrl = uploadedUrl;
    
    // Limpiar selección de miniaturas del backend
    this.selectedThumbnail = '';
    this.selectedThumbnailUrl = null;
    
    // Mostrar mensaje de éxito
    this.showThumbnailSuccessToast();
  }

  /**
   * Maneja cuando se limpia la miniatura local
   */
  onLocalThumbnailCleared(): void {
    console.log('Miniatura local eliminada');
    this.localThumbnailUrl = null;
    this.localThumbnailFile = null;
  }

  /* Obtiene la URL completa de la miniatura para mostrar la imagen. */
  getThumbnailUrl(relativePath: string): string {
    return this.api.getFullThumbnailUrl(relativePath);
  }

  // when switching type, clear/disable fields as needed
  onTypeChange(t: 'video'|'audio'|'') {
    this.type = t;
    
    if (t === 'video') {
      // Limpiar archivo (video no permite subida de archivos)
      this.file = null;
      // Limpiar errores de otros campos
      this.urlError = null;
      console.log('Modo video activado. Solo URL disponible. Subida de archivos deshabilitada.');
    } else if (t === 'audio') {
      // Limpiar campos específicos de video
      this.url = '';
      this.resolution = '';
      // Limpiar errores de video
      this.urlError = null;
      // Limpiar archivo si era de video (aunque no debería haber ninguno)
      if (this.file && this.isVideoFileType(this.file)) {
        this.file = null;
      }
      console.log('Modo audio activado. Campos de video deshabilitados.');
    } else {
      // Si no hay tipo seleccionado, limpiar archivo
      this.file = null;
      console.log('Tipo de archivo no seleccionado. Selecciona Video o Audio para continuar.');
    }
  }

  addTag() {
    const candidate = this.newTag.trim();
    if (!candidate) {
      this.tagsError = 'El tag no puede estar vacío';
      return;
    }

    // case-insensitive duplicate check
    const exists = this.tags.some(t => t.toLowerCase() === candidate.toLowerCase());
    if (exists) {
      // don't add duplicates
      this.tagsError = 'Ya existe ese tag';
      this.newTag = '';
      return;
    }

    this.tags.push(candidate);
    this.newTag = '';
    // clear any validation error about tags
    this.tagsError = null;
    // focus tag input if present
    try {
      const el = document.querySelector('input[name="newTag"]');
      (el as HTMLInputElement | null)?.focus();
    } catch {}
  }

  private validateBasic(): { ok: boolean; message?: string } {
    if (!this.title) { return { ok: false, message: 'Título requerido' }; }
    if (!this.type) { return { ok: false, message: 'Tipo de archivo requerido' }; }
    if (this.tags.length === 0) { return { ok: false, message: 'Debe añadir al menos un tag antes de enviar' }; }
    return { ok: true };
  }

  private validateTypeSpecific(): { ok: boolean; message?: string } {
    if (this.type === 'video') {
      if (!this.url) { return { ok: false, message: 'Para video: proporciona una URL' }; }
      if (!this.resolution) { return { ok: false, message: 'Resolución requerida para video' }; }
    }
    if (this.type === 'audio') {
      if (!this.file) { return { ok: false, message: 'Para audio: sube un archivo desde tu dispositivo' }; }
      // La validación del tipo de archivo la maneja UploadAudioService
    }
    return { ok: true };
  }

  private validateRequiredFields(): { ok: boolean; message?: string } {
    if (!this.duration) { return { ok: false, message: 'Duración requerida' }; }
    if (!this.estado) { return { ok: false, message: 'Estado requerido' }; }
    if (!this.ageRestriction) { return { ok: false, message: 'Restricción de edad requerida' }; }
    return { ok: true };
  }

  /**
   * Valida que `fechaExpiracion` tenga el formato YYYY-MM-DD si se proporciona.
   * Devuelve true si es válido o está vacío, false si tiene formato incorrecto.
   */
  validarFecha(): boolean {
    const val = (this.fechaExpiracion || '').trim();
    
    // Si está vacío, es válido (campo opcional)
    if (!val) {
      this.fechaError = null;
      return true;
    }
    
    const re = /^\d{4}-\d{2}-\d{2}$/;
    const ok = re.test(val);
    if (!ok) {
      this.fechaError = '⚠️ Por favor, introduce una fecha válida en formato AAAA-MM-DD.';
      return false;
    }

    // Check not a past date
    const [y, m, d] = val.split('-').map(s => Number(s));
    const date = new Date(y, m - 1, d);
    // normalize to midnight
    date.setHours(0,0,0,0);
    const today = new Date();
    today.setHours(0,0,0,0);
    if (date < today) {
      this.fechaError = '⚠️ La fecha no puede ser anterior a hoy.';
      return false;
    }

    this.fechaError = null;
    return true;
  }

  /**
   * Valida que la URL del video tenga el formato correcto
   * Debe empezar por http:// o https://
   */
  validarUrl(): boolean {
    const val = (this.url || '').trim();
    
    // Si está vacío, limpiar error (será validado como campo requerido en otra parte)
    if (!val) {
      this.urlError = null;
      return true;
    }
    
    // Verificar que empiece por http:// o https://
    if (!val.startsWith('http://') && !val.startsWith('https://')) {
      this.urlError = 'La URL debe empezar por http:// o https://';
      return false;
    }
    
    // Verificar que sea una URL válida básicamente
    try {
      new URL(val);
      this.urlError = null;
      return true;
    } catch {
      this.urlError = 'Por favor, introduce una URL válida';
      return false;
    }
  }

  removeTag(index: number) {
    this.tags.splice(index, 1);
    if (this.tags.length === 0) {
      // keep the error state until user tries again or adds a tag
      // but clear previous errors when they remove/modify
      this.tagsError = null;
    }
  }

  async upload() {
    this.formError = null;
    this.formSuccess = null;

    const validationResult = this.validateAllFields();
    if (!validationResult.isValid) {
      this.handleValidationError(validationResult.message!);
      return;
    }

    const payload = this.buildPayload();

    try {
      await lastValueFrom(this.api.createContent(payload));
      this.handleUploadSuccess();
    } catch (err: any) {
      this.handleUploadError(err);
    }
  }

  private validateAllFields(): { isValid: boolean; message?: string } {
    const basic = this.validateBasic();
    if (!basic.ok) {
      return { isValid: false, message: basic.message };
    }

    const typeCheck = this.validateTypeSpecific();
    if (!typeCheck.ok) {
      return { isValid: false, message: typeCheck.message };
    }

    const required = this.validateRequiredFields();
    if (!required.ok) {
      return { isValid: false, message: required.message };
    }

    if (this.fechaExpiracion && !this.validarFecha()) {
      return { isValid: false, message: 'Fecha de disponibilidad inválida' };
    }

    if (this.type === 'video' && !this.validarUrl()) {
      return { isValid: false, message: 'URL del video inválida' };
    }

    const missing = this.getMissingRequiredFields();
    if (missing.length > 0) {
      return { isValid: false, message: 'Faltan campos obligatorios: ' + missing.join(', ') };
    }

    return { isValid: true };
  }

  private handleValidationError(message: string): void {
    if (message.includes('tag')) {
      this.tagsError = message;
    }
    this.formError = message || 'Formulario inválido';
  }

  private buildPayload(): any {
    // Priorizar miniatura local sobre la seleccionada del backend
    const thumbnailUrl = this.localThumbnailUrl ?? this.selectedThumbnailUrl;
    
    return {
      titulo: this.title,
      descripcion: this.description,
      tipoArchivo: this.type === 'video' ? 'Video' : 'Audio',
      urlContenido: this.type === 'video' ? this.url : (this.audioUrl || null),
      urlMiniatura: thumbnailUrl,
      estado: this.estado,
      esUsuarioVip: this.vip === 'si',
      tags: this.tags,
      fecha: this.fechaExpiracion || null,
      resolucion: this.type === 'video' ? this.resolution : null,
      restriccionEdad: this.ageRestriction ? parseInt(this.ageRestriction.replace('+', '')) : null,
      duracion: this.duration
    };
  }

  private handleUploadSuccess(): void {
    this.formSuccess = 'Contenido guardado correctamente.';
    this.showSuccessToast();
    setTimeout(() => {
      this.router.navigate(['/content-creator']);
    }, 2500);
  }

  ngOnInit(): void {
    const t = new Date();
    const yyyy = t.getFullYear();
    const mm = String(t.getMonth() + 1).padStart(2, '0');
    const dd = String(t.getDate()).padStart(2, '0');
    this.minDate = `${yyyy}-${mm}-${dd}`;

    // Cargar miniaturas desde el backend
    this.loadThumbnails();
  }

  ngAfterViewInit(): void {
    // Configuración adicional después de que la vista se haya inicializado
  }

  /**
   * Muestra el mensaje de éxito con animaciones suaves
   */
  private showSuccessToast(): void {
    // Reset states
    this.hideSuccessMessage = false;
    
    // Show the toast with entrance animation
    setTimeout(() => {
      this.showSuccessMessage = true;
    }, 50);
    
    // Start hide animation after 2 seconds
    setTimeout(() => {
      this.hideSuccessMessage = true;
    }, 2000);
    
    // Completely hide after animation finishes
    setTimeout(() => {
      this.showSuccessMessage = false;
      this.hideSuccessMessage = false;
    }, 2500);
  }

  /**
   * Muestra el mensaje de éxito para la miniatura
   */
  private showThumbnailSuccessToast(): void {
    // Reset state
    this.hideThumbnailSuccessMessage = false;
    
    // Show the toast with entrance animation
    setTimeout(() => {
      this.showThumbnailSuccessMessage = true;
    }, 50);
    
    // Start hide animation after 2 seconds (más rápido que el mensaje principal)
    setTimeout(() => {
      this.hideThumbnailSuccessMessage = true;
    }, 2000);
    
    // Completely hide after animation finishes
    setTimeout(() => {
      this.showThumbnailSuccessMessage = false;
      this.hideThumbnailSuccessMessage = false;
    }, 2500);
  }

  /**
   * Carga las miniaturas disponibles del backend.
   */
  loadThumbnails() {
    this.loadingThumbnails = true;
    this.thumbnailLoadError = false;
    this.api.getThumbnails().subscribe({
      next: (response: ThumbnailsResponse) => {
        // La API devuelve un objeto con la lista de miniaturas y la miniatura por defecto
        this.thumbnails = response?.thumbnails || [];
        this.defaultThumbnail = response?.defaultThumbnail || '';
        this.selectedThumbnail = this.defaultThumbnail;
        // Actualizar la URL seleccionada con la miniatura por defecto
        this.selectedThumbnailUrl = this.defaultThumbnail ? this.getThumbnailUrl(this.defaultThumbnail) : null;
      },
      error: (error: any) => {
        console.error('Error al cargar miniaturas:', error);
        // Mostrar mensaje de error y configurar miniatura por defecto vacía
        this.loadingThumbnails = false;
        this.thumbnailLoadError = true;
        this.thumbnails = [];
        this.defaultThumbnail = '';
        this.selectedThumbnail = '';
        this.selectedThumbnailUrl = null;
      },
      complete: () => {
        this.loadingThumbnails = false;
      }
    });
  }

  /* Extrae el nombre del archivo de una ruta de miniatura */
  private extractThumbnailFileName(thumbnailPath: string): string {
    if (!thumbnailPath) return '';
    // Extraer el nombre del archivo de la ruta (ej: "/thumbnails/thumb1.png" -> "thumb1.png")
    return thumbnailPath.split('/').pop() ?? '';
  }

  cancel() {
    this.router.navigate(['/content-creator']);
  }

  /**
   * Devuelve un array con los nombres de los campos obligatorios que no están completos.
   */
  getMissingRequiredFields(): string[] {
    const missing: string[] = [];

    // Tipo de archivo
    if (!this.type) {
      missing.push('Tipo de archivo');
    }

    // Contenido VIP
    if (!this.vip) {
      missing.push('Contenido VIP');
    }

    // URL (video) OR archivo (audio)
    if (this.type === 'video') {
      if (!this.url && !this.audioUrl) { // support older url field or new audioUrl
        missing.push('URL');
      }
    } else if (this.type === 'audio') {
      if (!this.file) {
        missing.push('Archivo (audio)');
      }
    } else {
      // if type not selected, both url/file are effectively missing; add a generic note
      missing.push('URL o Archivo');
    }

    return missing;
  }
}