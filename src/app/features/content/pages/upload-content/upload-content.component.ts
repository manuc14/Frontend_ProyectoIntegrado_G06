import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { FooterComponent } from '../../../../shared/footer/footer.component';
import { ContentCreatorHeaderComponent } from '../../../../shared/components/content-creator-header/content-creator-header.component';
import { CreatorSidebarComponent } from '../../../../shared/components/creator-sidebar/creator-sidebar.component';
import { TextAreaFieldComponent } from '../../../../shared/textarea-field/textarea-field.component';
import { SelectFieldComponent } from '../../../../shared/select-field/select-field.component';
import { FormToggleComponent } from '../../../../shared/form-components/form-toggle/form-toggle.component';
import { FormInputComponent } from '../../../../shared/form-components/form-input/form-input.component';
import { FormDateComponent } from '../../../../shared/form-components/form-date/form-date.component';
import { ApiService, BackendUser } from '../../../../core/services/api.service';
import { ImageSelectorService, ImageSelectorState } from '../../../../core/services/image-selector.service';
import { FormBaseService, FormState } from '../../../../core/services/form-base.service';
import { UploadService } from '../../../../core/services/upload-services/upload.service';
import { Router } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';
import { UPLOAD_LIMITS, UPLOAD_FILE_TYPES } from '../../../../core/constants/form-limits';
import { executeAsyncOperation } from '../../../../core/utils/observable.helpers';

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
  imports: [CommonModule, ReactiveFormsModule, FormsModule, FooterComponent, ContentCreatorHeaderComponent, CreatorSidebarComponent, FormInputComponent, TextAreaFieldComponent, FormDateComponent, SelectFieldComponent, FormToggleComponent],
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
  minDate = '';

  private imageStateSubscription?: Subscription;

  get is4KWithoutVip(): boolean {
    const formValue = this.uploadForm?.value;
    return formValue?.type === 'video' && formValue?.resolution === '4K' && formValue?.vip !== 'si';
  }

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
    const validationError = file && this.validateAudioFile(file);
    if (validationError) {
      this.audioFileValidationError = validationError;
      this.file = null;
      this.resetFileInput(input);
    } else if (file) {
      this.file = file;
      this.audioFileValidationError = null;
      this.uploadForm.patchValue({ audioUrl: '' });
    }
  }

  private validateAudioFile(file: File): string | null {
    const result = this.uploadService.validateAudioFile(file);
    return result.ok ? null : result.error!;
  }

  onThumbnailSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const validationError = file && this.validateThumbnailFile(file);
    if (validationError) {
      this.thumbnailValidationError = validationError;
      this.localThumbnailFile = null;
      this.localThumbnailUrl = null;
      this.resetFileInput(input);
    } else if (file) {
      this.thumbnailValidationError = null;
      this.localThumbnailFile = file;
      this.loadThumbnailPreview(file);
    }
  }

  private resetFileInput(input: HTMLInputElement): void {
    input.value = '';
  }

  private validateThumbnailFile(file: File): string | null {
    const result = this.uploadService.validateThumbnailFile(file);
    return result.ok ? null : result.error!;
  }

  private loadThumbnailPreview(file: File): void {
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
    this.uploadForm.patchValue({ tags: this.tags });

    // Early return si el formulario es inválido
    if (this.uploadForm.invalid || this.validateForm(this.uploadForm.value).length > 0) {
      this.formBaseService.updateFormState(this.formId, { error: 'Por favor, revisa los campos marcados.' });
      return;
    }

    await executeAsyncOperation(
      async () => {
        const uploadResult = await this.uploadFilesIfNeeded();
        const payload = this.buildPayload(uploadResult);
        await firstValueFrom(this.api.createContent(payload));
      },
      {
        formId: this.formId,
        formService: this.formBaseService,
        form: this.uploadForm,
        router: this.router,
        successRoute: '/content-creator'
      }
    );
  }

  private validateForm(formValue: Partial<UploadContentForm>): string[] {
    const isAudio = formValue.type === 'audio';
    const isVideo = formValue.type === 'video';
    const checks = [
      { condition: this.tags.length === 0, error: 'tags' },
      { condition: isAudio && !this.file && !formValue.audioUrl?.trim(), error: 'audioFile' },
      { condition: isVideo && formValue.resolution === '4K' && formValue.vip !== 'si', error: '4kRequiresVip' }
    ];
    return checks.filter(check => check.condition).map(check => check.error);
  }

  private async uploadFilesIfNeeded(): Promise<{audioUrl?: string, thumbnailUrl?: string}> {
    return firstValueFrom(this.uploadService.uploadMultipleFiles(this.file || undefined, this.localThumbnailFile || undefined));
  }

  private buildPayload(uploadResult: {audioUrl?: string, thumbnailUrl?: string} = {}): Record<string, unknown> {
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
      resolucion: isVideo ? formValue.resolution : null,
      restriccionEdad: ageRestriction,
      duracion: formValue.duration,
      ...(formValue.fechaExpiracion && { disponibleHasta: formValue.fechaExpiracion })
    };
  }

  ngOnInit(): void {
    this.initializeMinDate();
    this.initializeForm();
    this.loadCurrentUser();
    this.imageSelectorService.loadImages('thumbnail');
  }

  private initializeMinDate(): void {
    const t = new Date();
    this.minDate = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  }

  private initializeForm(): void {
    this.uploadForm = this.formBaseService.createFormGroup<UploadContentForm>({
      title: '', description: '', type: '', vip: '', url: '', audioUrl: '',
      duration: '', estado: '', ageRestriction: '', resolution: '', fechaExpiracion: '', tags: []
    });

    this.formBaseService.createFormState(this.formId, {});
    this.formBaseService.getFormState(this.formId)?.subscribe((state: FormState) => {
      this.currentFormState = state;
    });

    this.imageStateSubscription = this.imageSelectorService.getState().subscribe((state: ImageSelectorState) => {
      this.formBaseService.updateFormState(this.formId, { imageState: state });
    });
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

    this.currentUser = JSON.parse(userData) as BackendUser;
    const tipo = this.currentUser?.tipoContenido?.toLowerCase();
    const type = tipo && { 'video': 'video', 'vídeo': 'video', 'audio': 'audio' }[tipo];
    if (type) this.uploadForm.patchValue({ type });
  }

  cancel() {
    this.router.navigate(['/content-creator']);
  }
}
