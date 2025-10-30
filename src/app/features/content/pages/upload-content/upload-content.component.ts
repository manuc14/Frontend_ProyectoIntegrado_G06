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

  // Thumbnail local
  localThumbnailUrl: string | null = null;
  localThumbnailFile: File | null = null;
  localThumbnailPreview: string | null = null;

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

  // Errores del template
  fileError: string | null = null;
  resolutionError: string | null = null;

  // Estados de UI
  submitted = false;

  // Tags
  tags: string[] = [];
  newTag = '';

  // Fechas
  minDate = '';

  private imageStateSubscription?: Subscription;

  // Métodos simplificados para el formulario

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

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      // Validar tamaño del archivo
      const maxSizeBytes = UPLOAD_LIMITS.fileMaxSizeMB * 1024 * 1024; // Convertir MB a bytes
      if (file.size > maxSizeBytes) {
        this.audioFileValidationError = `El archivo es demasiado grande. Tamaño máximo: ${UPLOAD_LIMITS.fileMaxSizeMB}MB`;
        this.file = null;
        return;
      }

      // Validar tipo de archivo
      const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/aac', 'audio/ogg', 'audio/flac', 'audio/mp3'];
      if (!allowedTypes.includes(file.type)) {
        this.audioFileValidationError = 'Formato de archivo no válido. Formatos permitidos: MP3, WAV, AAC, OGG, FLAC';
        this.file = null;
        return;
      }

      this.file = file;
      // Limpiar errores previos
      this.audioFileValidationError = null;
      this.audioUploadError = null;
      this.uploadForm.patchValue({ audioUrl: '' });
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

    // Validación específica para contenido de audio
    const formValue = this.uploadForm.value;
    if (formValue.type === 'audio' && !this.file && !formValue.audioUrl) {
      this.formBaseService.updateFormState(this.formId, {
        error: 'Debe proporcionar un archivo de audio o URL.'
      });
      return;
    }

    this.formBaseService.updateFormState(this.formId, { isSubmitting: true });

    try {
      // Subir archivos si es necesario
      const uploadResult = await this.uploadFilesIfNeeded();
      
      // Crear el payload con las URLs de archivos subidos
      const payload = this.buildPayload(uploadResult);
      
      // Crear el contenido en el backend
      await firstValueFrom(this.api.createContent(payload));
      
      this.handleUploadSuccess();
    } catch (error: any) {
      this.formBaseService.handleBackendError(this.formId, this.uploadForm, error);
    } finally {
      this.formBaseService.updateFormState(this.formId, { isSubmitting: false });
    }
  }

  private async uploadFilesIfNeeded(): Promise<{audioUrl?: string, thumbnailUrl?: string}> {
    const result: {audioUrl?: string, thumbnailUrl?: string} = {};

    // Subir archivo de audio si existe
    if (this.file) {
      const audioResponse = await firstValueFrom(this.uploadService.uploadFile(this.file, 'audio'));
      if (!audioResponse?.url) {
        throw new Error('Respuesta inválida del servidor para archivo de audio');
      }
      result.audioUrl = audioResponse.url;
    }

    // Subir thumbnail local si existe
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
      restriccionEdad: this.parseAgeRestriction(formValue.ageRestriction),
      duracion: formValue.duration
    };
  }

  private parseAgeRestriction(ageRestriction: string): number | null {
    return ageRestriction ? parseInt(ageRestriction.replace('+', '')) : null;
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
    if (!userData) {
      return;
    }

    this.currentUser = JSON.parse(userData);
    const tipoContenido = this.currentUser?.tipoContenido?.toLowerCase();

    if (!tipoContenido) {
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
    }
  }

  cancel() {
    this.router.navigate(['/content-creator']);
  }

  // Métodos adicionales para compatibilidad con template
  getThumbnailUrl(thumbnail: string): string {
    return thumbnail;
  }
}
