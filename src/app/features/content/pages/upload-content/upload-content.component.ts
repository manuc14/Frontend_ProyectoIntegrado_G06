import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { FooterComponent } from '../../../../shared/footer/footer.component';
import { ContentCreatorHeaderComponent } from '../../../../shared/components/content-creator-header/content-creator-header.component';
import { TextAreaFieldComponent } from '../../../../shared/textarea-field/textarea-field.component';
import { SelectFieldComponent } from '../../../../shared/select-field/select-field.component';
import { FormToggleComponent } from '../../../../shared/form-components/form-toggle/form-toggle.component';
import { FormInputComponent } from '../../../../shared/form-components/form-input/form-input.component';
import { FormDateComponent } from '../../../../shared/form-components/form-date/form-date.component';
import { ApiService, BackendUser } from '../../../../core/services/api.service';
import { ImageSelectorService } from '../../../../core/services/image-selector.service';
import { FormBaseService } from '../../../../core/services/form-base.service';
import { UploadService } from '../../../../core/services/upload-services/upload.service';
import { Router } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';
import { UPLOAD_LIMITS, UPLOAD_FILE_TYPES } from '../../../../core/constants/form-limits';

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
  imports: [CommonModule, ReactiveFormsModule, FormsModule, FooterComponent, ContentCreatorHeaderComponent, FormInputComponent, TextAreaFieldComponent, FormDateComponent, SelectFieldComponent, FormToggleComponent],
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
  readonly UPLOAD_FILE_TYPES = UPLOAD_FILE_TYPES;

  // Formulario reactivo
  uploadForm!: FormGroup;
  formId = 'upload-content';

  // Estado centralizado
  currentFormState: any = {};

  // Current user
  currentUser: BackendUser | null = null;

  // Archivos
  file: File | null = null;
  localThumbnailFile: File | null = null;
  localThumbnailUrl: string | null = null;

  // Validación
  audioFileValidationError: string | null = null;
  thumbnailValidationError: string | null = null;
  submitted = false;

  // Tags
  tags: string[] = [];
  newTag = '';

  // UI state
  showSuccessMessage = false;
  hideSuccessMessage = false;
  minDate = '';

  private imageStateSubscription?: Subscription;

  // Getters simplificados
  get thumbnails() { return this.currentFormState?.imageState?.images || []; }
  get selectedThumbnail() { return this.currentFormState?.imageState?.selectedImage || ''; }
  get loadingThumbnails() { return this.currentFormState?.imageState?.loading || false; }
  get thumbnailLoadError() { return this.currentFormState?.imageState?.error || false; }
  get selectedThumbnailUrl() { return this.currentFormState?.imageState?.selectedImageUrl || null; }
  get isSubmitting() { return this.currentFormState?.isSubmitting || false; }
  get formError() { return this.currentFormState?.error || null; }

  // Métodos simplificados para el formulario

  addTag() {
    const candidate = this.newTag.trim();
    if (!candidate || this.tags.includes(candidate)) return;
    
    this.tags.push(candidate);
    this.newTag = '';
    this.updateTagsInForm();
  }

  removeTag(index: number) {
    this.tags.splice(index, 1);
    this.updateTagsInForm();
  }

  private updateTagsInForm(): void {
    this.uploadForm.patchValue({ tags: this.tags });
    this.uploadForm.get('tags')?.updateValueAndValidity();
  }

  selectThumbnail(thumbnailPath: string) {
    this.imageSelectorService.selectImage(thumbnailPath, 'thumbnail');
    this.localThumbnailUrl = null;
    this.localThumbnailFile = null;
  }

  clearLocalThumbnail(): void {
    this.localThumbnailUrl = null;
    this.localThumbnailFile = null;
    this.thumbnailValidationError = null;
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const fileName = file.name.trim();
    const maxSizeBytes = UPLOAD_LIMITS.fileMaxSizeMB * 1024 * 1024;
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/aac', 'audio/ogg', 'audio/flac', 'audio/mp3'];

    // Validaciones consolidadas
    if (!fileName || fileName.startsWith('.') || fileName.includes('..')) {
      this.audioFileValidationError = 'Nombre de archivo inválido';
      this.file = null;
      input.value = '';
      return;
    }

    if (file.size > maxSizeBytes) {
      this.audioFileValidationError = `Archivo demasiado grande. Máximo: ${UPLOAD_LIMITS.fileMaxSizeMB}MB`;
      this.file = null;
      input.value = '';
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      this.audioFileValidationError = 'Formato no válido. Permitidos: MP3, WAV, AAC, OGG, FLAC';
      this.file = null;
      input.value = '';
      return;
    }

    // Archivo válido
    this.file = file;
    this.audioFileValidationError = null;
    this.uploadForm.patchValue({ audioUrl: '' });
  }

  onThumbnailSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;

    // Validar tipo de archivo
    const allowedTypes = UPLOAD_FILE_TYPES.image;
    if (!(allowedTypes as readonly string[]).includes(file.type)) {
      this.thumbnailValidationError = 'Formato no válido. Permitidos: JPEG, PNG';
      this.localThumbnailFile = null;
      this.localThumbnailUrl = null;
      input.value = '';
      return;
    }

    // Validar tamaño (5MB máximo para imágenes)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.thumbnailValidationError = 'Imagen demasiado grande. Máximo: 5MB';
      this.localThumbnailFile = null;
      this.localThumbnailUrl = null;
      input.value = '';
      return;
    }

    // Archivo válido
    this.thumbnailValidationError = null;
    this.localThumbnailFile = file;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      this.localThumbnailUrl = e.target?.result as string;
      if (this.localThumbnailUrl) {
        this.imageSelectorService.selectLocalImage(this.localThumbnailUrl);
      }
    };
    reader.readAsDataURL(file);
  }

  async upload() {
    this.submitted = true;
    this.formBaseService.updateFormState(this.formId, { error: null });

    // Sincronizar tags antes de validar
    this.uploadForm.patchValue({ tags: this.tags });

    // Validar campos según el tipo de contenido
    const formValue = this.uploadForm.value;
    const isVideo = formValue.type === 'video';
    const isAudio = formValue.type === 'audio';

    // Validación personalizada según el tipo
    const errors = this.validateForm(formValue, isVideo, isAudio);
    if (errors.length > 0) {
      console.error('Errores de validación:', errors);
      this.formBaseService.updateFormState(this.formId, {
        error: 'Por favor, revisa los campos marcados.'
      });
      return;
    }

    this.formBaseService.updateFormState(this.formId, { isSubmitting: true });

    try {
      const uploadResult = await this.uploadFilesIfNeeded();
      const payload = this.buildPayload(uploadResult);
      await firstValueFrom(this.api.createContent(payload));
      this.handleUploadSuccess();
    } catch (error: any) {
      // Distinguir entre errores de validación del frontend y errores del backend
      if (error instanceof Error && !error.message.includes('HTTP') && !error.message.includes('status')) {
        // Error de validación del frontend (uploadService) - mostrar directamente
        this.formBaseService.updateFormState(this.formId, { error: error.message });
      } else {
        // Error del backend - procesar con handleBackendError
        this.formBaseService.handleBackendError(this.formId, this.uploadForm, error);
      }
    } finally {
      this.formBaseService.updateFormState(this.formId, { isSubmitting: false });
    }
  }

  private validateForm(formValue: any, isVideo: boolean, isAudio: boolean): string[] {
    const errors: string[] = [];
    
    // Campos comunes requeridos
    const requiredCommonFields = ['title', 'vip', 'duration', 'estado', 'ageRestriction'];
    requiredCommonFields.forEach(field => {
      if (!formValue[field]?.trim?.() && !formValue[field]) errors.push(field);
    });
    
    if (!this.tags.length) errors.push('tags');

    // Validaciones específicas por tipo
    if (isVideo && !formValue.url?.trim()) errors.push('url');
    if (isVideo && !formValue.resolution) errors.push('resolution');
    if (isAudio && !this.file && !formValue.audioUrl) errors.push('audioFile');

    return errors;
  }

  private async uploadFilesIfNeeded(): Promise<{audioUrl?: string, thumbnailUrl?: string}> {
    const result: {audioUrl?: string, thumbnailUrl?: string} = {};

    // Subir archivo de audio si existe (el servicio ya valida)
    if (this.file) {
      const audioResponse = await firstValueFrom(this.uploadService.uploadFile(this.file, 'audio'));
      if (!audioResponse?.url) {
        throw new Error('Respuesta inválida del servidor para archivo de audio');
      }
      result.audioUrl = audioResponse.url;
    }

    // Subir thumbnail local si existe (el servicio ya valida)
    if (this.localThumbnailFile) {
      const thumbnailResponse = await firstValueFrom(this.uploadService.uploadFile(this.localThumbnailFile, 'thumbnail'));
      if (!thumbnailResponse?.url) {
        throw new Error('Respuesta inválida del servidor para miniatura');
      }
      result.thumbnailUrl = thumbnailResponse.url;
    }

    return result;
  }

  private buildPayload(uploadResult: {audioUrl?: string, thumbnailUrl?: string} = {}): any {
    const formValue = this.uploadForm.value;
    const isVideo = formValue.type === 'video';
    const ageRestriction = formValue.ageRestriction ? parseInt(formValue.ageRestriction.replace('+', '')) : null;

    return {
      titulo: formValue.title,
      descripcion: formValue.description,
      tipoArchivo: isVideo ? 'Video' : 'Audio',
      urlContenido: isVideo ? formValue.url : (uploadResult.audioUrl ?? formValue.audioUrl ?? null),
      urlMiniatura: uploadResult.thumbnailUrl ?? this.localThumbnailUrl ?? this.selectedThumbnailUrl,
      estado: formValue.estado,
      esUsuarioVip: formValue.vip === 'si',
      tags: this.tags,
      fecha: formValue.fechaExpiracion || null,
      resolucion: isVideo ? formValue.resolution : null,
      restriccionEdad: ageRestriction,
      duracion: formValue.duration
    };
  }

  private handleUploadSuccess(): void {
    this.showSuccessMessage = true;
    this.hideSuccessMessage = false;
    
    setTimeout(() => {
      this.hideSuccessMessage = true;
      setTimeout(() => {
        this.router.navigate(['/content-creator']);
      }, 300);
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

    // Load current user
    this.loadCurrentUser();

    // Cargar thumbnails
    this.imageSelectorService.loadImages('thumbnail');
  }

  ngOnDestroy(): void {
    if (this.imageStateSubscription) {
      this.imageStateSubscription.unsubscribe();
    }
    this.formBaseService.destroyFormState(this.formId);
  }

  private loadCurrentUser(): void {
    const userData = sessionStorage.getItem('currentUser');
    if (!userData) return;

    this.currentUser = JSON.parse(userData);
    const tipoContenido = this.currentUser?.tipoContenido?.toLowerCase();
    if (!tipoContenido) return;

    // Map backend values to form values
    const typeMap: Record<string, 'video' | 'audio'> = {
      'video': 'video',
      'vídeo': 'video',
      'audio': 'audio'
    };

    const type = typeMap[tipoContenido];
    if (type) this.uploadForm.patchValue({ type });
  }

  cancel() {
    this.router.navigate(['/content-creator']);
  }

  // Métodos adicionales para compatibilidad con template
  getThumbnailUrl(thumbnail: string): string {
    return thumbnail;
  }
}
