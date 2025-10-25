import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { FooterComponent } from '../../shared/footer/footer.component';
import { ContentCreatorHeaderComponent } from '../../shared/components/content-creator-header/content-creator-header.component';
import { ApiService, BackendUser } from '../../core/services/api.service';
import { ImageSelectorService } from '../../core/services/image-selector.service';
import { FormBaseService } from '../../core/services/form-base.service';
import { UploadService } from '../../core/services/upload-services/upload.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { UPLOAD_LIMITS } from '../../core/constants/form-limits';

// Interface tipada para el formulario de upload
export interface UploadContentForm {
  title: string;
  description: string;
  type: 'video' | 'audio' | '';
  vip: 'si' | 'no' | '';
  url: string;
  audioUrl: string;
  duration: string;
  estado: string;
  ageRestriction: string;
  resolution: string;
  fechaExpiracion: string;
  tags: string[];
}

@Component({
  selector: 'app-upload-content',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, FooterComponent, ContentCreatorHeaderComponent],
  templateUrl: './upload-content.component.html',
  styleUrls: ['./upload-content.component.scss']
})
export class UploadContentComponent implements OnInit, OnDestroy {
  constructor(
    private api: ApiService,
    private router: Router,
    private fb: FormBuilder,
    private formBaseService: FormBaseService,
    public imageSelectorService: ImageSelectorService,
    private uploadService: UploadService
  ) {}

  // Constants for template access
  readonly UPLOAD_LIMITS = UPLOAD_LIMITS;

  // Formulario reactivo
  uploadForm!: FormGroup;
  formId: string = 'upload-content';

  // Estado centralizado
  private currentFormState: any = {};

  // Propiedades calculadas para compatibilidad con template
  get thumbnails(): string[] {
    return this.currentFormState?.imageState?.images || [];
  }

  get selectedThumbnail(): string {
    return this.currentFormState?.imageState?.selectedImage || '';
  }

  get loadingThumbnails(): boolean {
    return this.currentFormState?.imageState?.loading || false;
  }

  get thumbnailLoadError(): boolean {
    return this.currentFormState?.imageState?.error || false;
  }

  get selectedThumbnailUrl(): string | null {
    return this.currentFormState?.imageState?.selectedImageUrl || null;
  }

  get isSubmitting(): boolean {
    return this.currentFormState?.isSubmitting || false;
  }

  get formError(): string | null {
    return this.currentFormState?.error || null;
  }

  // Current user
  currentUser: BackendUser | null = null;

  // Archivo seleccionado
  selectedFile: File | null = null;

  // Thumbnail local
  localThumbnailUrl: string | null = null;
  localThumbnailFile: File | null = null;
  localThumbnailPreview: string | null = null;

  // Propiedades del template (temporal para compatibilidad)
  type: 'video' | 'audio' | '' = '';
  vip: 'si' | 'no' | '' = '';
  url = '';
  audioUrl: string | null = null;
  resolution = '';
  estado = '';
  ageRestriction = '';
  fechaExpiracion = '';
  duration = '';

  // Errores del template (temporal)
  typeError: string | null = null;
  fileError: string | null = null;
  resolutionError: string | null = null;
  fechaError: string | null = null;

  // Estados de UI
  submitted = false;

  // Control de visibilidad del selector de tipo
  showTypeSelector = true;

  // Propiedades adicionales para compatibilidad con template
  file: File | null = null;
  audioUploading = false;
  audioFileValidationError: string | null = null;
  audioUploadError: string | null = null;
  isUploading = false;
  showSuccessMessage = false;
  hideSuccessMessage = false;
  showThumbnailSuccessMessage = false;
  hideThumbnailSuccessMessage = false;

  // Tags
  tags: string[] = [];
  newTag = '';

  // Fechas
  minDate = '';

  private imageStateSubscription?: Subscription;
  private formValueSubscription?: Subscription;

  get titleCount() {
    return this.uploadForm.get('title')?.value?.length || 0;
  }

  get descCount() {
    return this.uploadForm.get('description')?.value?.length || 0;
  }

  // Métodos simplificados para el formulario
  onTitleInput(ev: Event) {
    const value = (ev.target as HTMLInputElement).value;
    this.uploadForm.patchValue({ title: value.slice(0, UPLOAD_LIMITS.titleLimit) });
  }

  onDescriptionInput(ev: Event) {
    const value = (ev.target as HTMLTextAreaElement).value;
    this.uploadForm.patchValue({ description: value.slice(0, UPLOAD_LIMITS.descLimit) });
  }

  onTypeChange(type: 'video' | 'audio' | '') {
    this.uploadForm.patchValue({ type });
    this.type = type; // Sincronizar propiedad del template
    // Limpiar campos relacionados
    if (type === 'video') {
      this.selectedFile = null;
      this.uploadForm.patchValue({ audioUrl: '' });
    } else if (type === 'audio') {
      this.uploadForm.patchValue({ url: '', resolution: '' });
      if (this.selectedFile && this.isVideoFileType(this.selectedFile)) {
        this.selectedFile = null;
      }
    } else {
      this.selectedFile = null;
    }
  }

  addTag() {
    const candidate = this.newTag.trim();
    if (!candidate) {
      return;
    }
    if (this.tags.includes(candidate)) {
      return;
    }
    this.tags.push(candidate);
    this.newTag = '';
    this.uploadForm.patchValue({ tags: this.tags });
  }

  removeTag(index: number) {
    this.tags.splice(index, 1);
    this.uploadForm.patchValue({ tags: this.tags });
  }

  selectThumbnail(thumbnailPath: string) {
    this.imageSelectorService.selectImage(thumbnailPath, 'thumbnail');
    this.localThumbnailUrl = null;
    this.localThumbnailFile = null;
  }

  clearLocalThumbnail(): void {
    this.localThumbnailUrl = null;
    this.localThumbnailFile = null;
    this.localThumbnailPreview = null;
  }

  private isVideoFileType(file: File): boolean {
    return file.type.startsWith('video/');
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.selectedFile = file;
      this.file = file; // Sincronizar con la propiedad del template
      // Limpiar errores previos
      this.audioFileValidationError = null;
      this.audioUploadError = null;
      this.audioUrl = null;
    }
  }

  onThumbnailSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.localThumbnailFile = file;
      // Crear preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        this.localThumbnailPreview = e.target?.result as string;
        this.localThumbnailUrl = this.localThumbnailPreview;
        this.imageSelectorService.selectLocalImage(this.localThumbnailUrl);
      };
      reader.readAsDataURL(file);
    }
  }

  async upload() {
    this.submitted = true;
    this.formBaseService.updateFormState(this.formId, { error: null });

    if (this.uploadForm.invalid) {
      this.formBaseService.updateFormState(this.formId, {
        error: 'Por favor, revisa los campos marcados.'
      });
      return;
    }

    // Validaciones adicionales
    if (!this.validateUpload()) return;

    this.formBaseService.updateFormState(this.formId, { isSubmitting: true });

    try {
      // Subir archivos si es necesario
      const uploadResult = await this.uploadFilesIfNeeded();
      
      // Crear el payload con las URLs de archivos subidos
      const payload = this.buildPayload(uploadResult);
      
      // Crear el contenido en el backend
      await this.api.createContent(payload).toPromise();
      
      this.handleUploadSuccess();
    } catch (error: any) {
      this.formBaseService.handleBackendError(this.formId, this.uploadForm, error);
    } finally {
      this.formBaseService.updateFormState(this.formId, { isSubmitting: false });
    }
  }

  private validateUpload(): boolean {
    const formValue = this.uploadForm.value;

    // Validar archivo para audio (esta validación específica no puede hacerse en FormBaseService)
    if (formValue.type === 'audio' && !this.selectedFile && !formValue.audioUrl) {
      this.formBaseService.updateFormState(this.formId, {
        error: 'Debe proporcionar un archivo de audio o URL.'
      });
      return false;
    }

    return true;
  }

  private async uploadFilesIfNeeded(): Promise<{audioUrl?: string, thumbnailUrl?: string}> {
    const formValue = this.uploadForm.value;
    const result: {audioUrl?: string, thumbnailUrl?: string} = {};

    // Subir archivo de audio si se seleccionó uno
    if (formValue.type === 'audio' && this.selectedFile) {
      try {
        const audioResponse = await this.uploadService.uploadFile(this.selectedFile, 'audio').toPromise();
        if (audioResponse?.url) {
          result.audioUrl = audioResponse.url;
        } else {
          throw new Error('Respuesta inválida del servidor para archivo de audio');
        }
      } catch (error) {
        throw new Error('Error al subir el archivo de audio: ' + (error as any)?.message || 'Error desconocido');
      }
    }

    // Subir thumbnail local si se seleccionó una
    if (this.localThumbnailFile) {
      try {
        const thumbnailResponse = await this.uploadService.uploadFile(this.localThumbnailFile, 'thumbnail').toPromise();
        if (thumbnailResponse?.url) {
          result.thumbnailUrl = thumbnailResponse.url;
        } else {
          throw new Error('Respuesta inválida del servidor para miniatura');
        }
      } catch (error) {
        throw new Error('Error al subir la miniatura: ' + (error as any)?.message || 'Error desconocido');
      }
    }

    return result;
  }

  private buildPayload(uploadResult: {audioUrl?: string, thumbnailUrl?: string} = {}): any {
    const formValue = this.uploadForm.value;
    const thumbnailUrl = uploadResult.thumbnailUrl || this.localThumbnailUrl || this.selectedThumbnailUrl;

    return {
      titulo: formValue.title,
      descripcion: formValue.description,
      tipoArchivo: formValue.type === 'video' ? 'Video' : 'Audio',
      urlContenido: formValue.type === 'video' ? formValue.url : (uploadResult.audioUrl || formValue.audioUrl || null),
      urlMiniatura: thumbnailUrl,
      estado: formValue.estado,
      esUsuarioVip: formValue.vip === 'si',
      tags: this.tags,
      fecha: formValue.fechaExpiracion || null,
      resolucion: formValue.type === 'video' ? formValue.resolution : null,
      restriccionEdad: formValue.ageRestriction ? parseInt(formValue.ageRestriction.replace('+', '')) : null,
      duracion: formValue.duration
    };
  }

  private handleUploadSuccess(): void {
    // Mostrar mensaje de éxito
    this.showSuccessMessage = true;
    this.hideSuccessMessage = false;
    
    // Ocultar el mensaje después de 3 segundos y navegar
    setTimeout(() => {
      this.hideSuccessMessage = true;
      setTimeout(() => {
        this.showSuccessMessage = false;
        // Navegar de vuelta al content-creator
        this.router.navigate(['/content-creator']);
      }, 300); // Tiempo para la animación de ocultar
    }, 3000);
  }

  ngOnInit(): void {
    // Crear fecha mínima
    const t = new Date();
    const yyyy = t.getFullYear();
    const mm = String(t.getMonth() + 1).padStart(2, '0');
    const dd = String(t.getDate()).padStart(2, '0');
    this.minDate = `${yyyy}-${mm}-${dd}`;

    // Crear formulario reactivo
    this.uploadForm = this.formBaseService.createFormGroup<UploadContentForm>({
      title: '',
      description: '',
      type: '',
      vip: '',
      url: '',
      audioUrl: '',
      duration: '',
      estado: '',
      ageRestriction: '',
      resolution: '',
      fechaExpiracion: '',
      tags: []
    });

    // Crear estado del formulario
    this.formBaseService.createFormState(this.formId, {});

    // Suscribirse al estado del formulario
    this.formBaseService.getFormState(this.formId)?.subscribe((state: any) => {
      this.currentFormState = state;
    });

    // Suscribirse al estado de imágenes
    this.imageStateSubscription = this.imageSelectorService.getState().subscribe((state: any) => {
      // Actualizar el estado del formulario con el estado de imágenes
      this.formBaseService.updateFormState(this.formId, { imageState: state });
    });

    // Suscribirse a cambios del formulario para sincronizar propiedades del template
    this.formValueSubscription = this.uploadForm.valueChanges.subscribe(values => {
      this.type = values.type || '';
      this.vip = values.vip || '';
      this.url = values.url || '';
      this.audioUrl = values.audioUrl || '';
      this.duration = values.duration || '';
      this.estado = values.estado || '';
      this.ageRestriction = values.ageRestriction || '';
      this.resolution = values.resolution || '';
      this.fechaExpiracion = values.fechaExpiracion || '';
    });

    // Load current user
    this.loadCurrentUser();

    // Cargar thumbnails
    this.imageSelectorService.loadImages('thumbnail');
  }

  ngOnDestroy(): void {
    if (this.imageStateSubscription) {
      this.imageStateSubscription.unsubscribe();
    }
    if (this.formValueSubscription) {
      this.formValueSubscription.unsubscribe();
    }
    this.formBaseService.destroyFormState(this.formId);
  }

  private loadCurrentUser(): void {
    const userData = sessionStorage.getItem('currentUser');
    if (!userData) {
      this.showTypeSelector = true;
      return;
    }

    this.currentUser = JSON.parse(userData);
    const tipoContenido = this.currentUser?.tipoContenido?.toLowerCase();

    if (!tipoContenido) {
      this.showTypeSelector = true;
      return;
    }

    // Map backend values to form values
    const typeMap: Record<string, 'video' | 'audio'> = {
      'video': 'video',
      'vídeo': 'video',
      'audio': 'audio'
    };

    const type = typeMap[tipoContenido];

    if (type) {
      this.uploadForm.patchValue({ type });
      this.onTypeChange(type);
      this.type = type;
      this.showTypeSelector = false;
    } else {
      this.showTypeSelector = true;
    }
  }

  cancel() {
    this.router.navigate(['/content-creator']);
  }

  // Métodos adicionales para compatibilidad con template
  getThumbnailUrl(thumbnail: string): string {
    return thumbnail;
  }

  onVipChange() {
    // Actualizar el formulario reactivo con el valor actual
    this.uploadForm.patchValue({ vip: this.vip });
  }

  onUrlInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.uploadForm.patchValue({ url: value });
  }

  onDurationChange() {
    // Actualizar el formulario reactivo
    this.uploadForm.patchValue({ duration: this.duration });
  }

  onEstadoChange() {
    // Actualizar el formulario reactivo
    this.uploadForm.patchValue({ estado: this.estado });
  }

  onResolutionChange() {
    // Actualizar el formulario reactivo
    this.uploadForm.patchValue({ resolution: this.resolution });
  }

  onAgeRestrictionChange() {
    // Actualizar el formulario reactivo
    this.uploadForm.patchValue({ ageRestriction: this.ageRestriction });
  }

  validarFecha() {
    // Validación básica de fecha
    const fecha = this.uploadForm.get('fechaExpiracion')?.value;
    if (fecha && fecha < this.minDate) {
      this.fechaError = 'La fecha de expiración no puede ser anterior a hoy';
    } else {
      this.fechaError = null;
    }
  }
}
