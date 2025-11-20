import { Component, OnInit, OnDestroy, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
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
import { CatalogoService } from '../../../../core/services/catalogo.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';
import { UPLOAD_LIMITS, UPLOAD_FILE_TYPES, PREDEFINED_TAGS } from '../../../../core/constants/form-limits';
import { executeAsyncOperation } from '../../../../core/utils/observable.helpers';
import { videoUrlValidator } from '../../../../core/validators/form.validators';

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
  @Input() contentId?: string; // When provided, enables edit mode
  
  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    public formBaseService: FormBaseService,
    public imageSelectorService: ImageSelectorService,
    private uploadService: UploadService,
    private catalogoService: CatalogoService,
    private cdr: ChangeDetectorRef
  ) {}

  // Constants for template access
  readonly UPLOAD_LIMITS = UPLOAD_LIMITS;
  readonly UPLOAD_FILE_TYPES = UPLOAD_FILE_TYPES;
  readonly PREDEFINED_TAGS = PREDEFINED_TAGS;

  // Formulario reactivo
  uploadForm!: FormGroup;
  formId = 'upload-content';
  
  // Edit mode tracking
  isEditMode = false;
  originalContentType: 'video' | 'audio' | '' = '';
  canEditContent = true; // True if content type matches creator type
  isVideoContent = false; // Helper para template: si es contenido de video

  // Estado centralizado
  currentFormState: any = {};

  // Current user
  currentUser: BackendUser | null = null;

  // Archivos
  file: File | null = null;
  localThumbnailFile: File | null = null;
  localThumbnailUrl: string | null = null;
  existingThumbnailUrl: string | null = null;
  contentMiniaturaUrl: string | null = null;

  // Validación
  audioFileValidationError: string | null = null;
  thumbnailValidationError: string | null = null;
  submitted = false;

  // Tags
  selectedTags: string[] = [];

  // UI state
  minDate = '';

  private imageStateSubscription?: Subscription;
  private typeChangeSubscription?: Subscription;
  private fechaExpiracionSubscription?: Subscription;
  private vipChangeSubscription?: Subscription;

  get is4KWithoutVip(): boolean {
    const formValue = this.uploadForm?.value;
    return formValue?.type === 'video' && formValue?.resolution === '4K' && formValue?.vip !== 'si';
  }

  // Getter para deshabilitar opción 4K si no es VIP
  get is4KDisabled(): boolean {
    const formValue = this.uploadForm?.value;
    return formValue?.vip !== 'si';
  }

  // Getters simplificados
  get thumbnails() { return this.currentFormState?.imageState?.images?.filter((t: string) => !t.startsWith('/api/files/')) || []; }
  get selectedThumbnail() { return this.currentFormState?.imageState?.selectedImageUrl || ''; }
  get loadingThumbnails() { return this.currentFormState?.imageState?.loading || false; }
  get thumbnailLoadError() { return this.currentFormState?.imageState?.error || false; }
  get selectedThumbnailUrl() { return this.currentFormState?.imageState?.selectedImageUrl || null; }
  get isSubmitting() { return this.currentFormState?.isSubmitting || false; }
  get formError() { return this.currentFormState?.error || null; }

  // Métodos simplificados para el formulario

  toggleTag(tag: string) {
    const index = this.selectedTags.indexOf(tag);
    if (index > -1) {
      this.selectedTags.splice(index, 1);
    } else {
      this.selectedTags.push(tag);
    }
    this.updateTagsInForm();
  }

  isTagSelected(tag: string): boolean {
    return this.selectedTags.includes(tag);
  }

  private updateTagsInForm(): void {
    this.uploadForm.patchValue({ tags: this.selectedTags });
    this.uploadForm.get('tags')?.updateValueAndValidity();
  }

  selectThumbnail(thumbnailPath: string) {
    this.imageSelectorService.selectImage(thumbnailPath, 'thumbnail');
    this.localThumbnailUrl = null;
    this.localThumbnailFile = null;
    this.existingThumbnailUrl = null;
  }

  clearLocalThumbnail(): void {
    this.localThumbnailUrl = null;
    this.localThumbnailFile = null;
    this.existingThumbnailUrl = null;
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
    
    // Check if user can edit (in edit mode)
    if (this.isEditMode && !this.canEditContent) {
      this.formBaseService.updateFormState(this.formId, { 
        error: 'No puedes editar este contenido porque no coincide con tu tipo de creador.' 
      });
      return;
    }
    
    this.uploadForm.patchValue({ tags: this.selectedTags });

    // Validar formulario
    const formErrors = this.validateForm(this.uploadForm.value);

    // Early return si el formulario es inválido
    if (this.uploadForm.invalid || formErrors.length > 0) {
      this.formBaseService.updateFormState(this.formId, { error: 'Por favor, revisa los campos marcados.' });
      return;
    }

    await executeAsyncOperation(
      async () => {
        const uploadResult = await this.uploadFilesIfNeeded();
        const payload = this.buildPayload(uploadResult);
        
        // Use update API for edit mode, create API for new content
        if (this.isEditMode && this.contentId) {
          await firstValueFrom(this.api.updateContent(this.contentId, payload));
        } else {
          await firstValueFrom(this.api.createContent(payload));
        }
      },
      {
        formId: this.formId,
        formService: this.formBaseService,
        form: this.uploadForm,
        router: this.router,
        successRoute: '/creator/catalog'
      }
    );
  }

  private validateForm(formValue: Partial<UploadContentForm>): string[] {
    const isAudio = formValue.type === 'audio';
    const checks = [
      { condition: this.selectedTags.length === 0, error: 'tags' },
      { condition: isAudio && !this.file && !formValue.audioUrl?.trim(), error: 'audioFile' }
    ];
    return checks.filter(check => check.condition).map(check => check.error);
  }

  private async uploadFilesIfNeeded(): Promise<{audioUrl?: string, thumbnailUrl?: string}> {
    return firstValueFrom(this.uploadService.uploadMultipleFiles(this.file || undefined, this.localThumbnailFile || undefined));
  }

  private buildPayload(uploadResult: {audioUrl?: string, thumbnailUrl?: string} = {}): Record<string, unknown> {
    // Usar getRawValue() para incluir los controles deshabilitados en edit mode
    const formValue = this.uploadForm.getRawValue();
    const isVideo = formValue.type === 'video';
    const ageRestriction = formValue.ageRestriction ? parseInt(formValue.ageRestriction.replace('+', '')) : null;

    const payload = {
      titulo: formValue.title,
      descripcion: formValue.description,
      tipoArchivo: isVideo ? 'Video' : 'Audio',
      urlContenido: isVideo ? formValue.url : (uploadResult.audioUrl ?? formValue.audioUrl ?? null),
      urlMiniatura: uploadResult.thumbnailUrl ?? this.localThumbnailUrl ?? this.selectedThumbnailUrl ?? this.existingThumbnailUrl,
      estado: formValue.estado,
      esUsuarioVip: formValue.vip === 'si',
      tags: this.selectedTags,
      resolucion: isVideo ? formValue.resolution : null,
      restriccionEdad: ageRestriction,
      duracion: formValue.duration,
      ...(formValue.fechaExpiracion && { disponibleHasta: formValue.fechaExpiracion })
    };

    return payload;
  }

  ngOnInit(): void {
    this.initializeMinDate();
    this.initializeForm();
    this.loadCurrentUser();
    this.imageSelectorService.loadImages('thumbnail');
    
    // Check localStorage for contentId (similar to content-preview)
    const localContentId = localStorage.getItem('currentContentId');
    if (localContentId) {
      this.contentId = localContentId;
    }
    
    // Load existing content if contentId is present
    if (this.contentId) {
      this.isEditMode = true;
      this.loadContentForEdit();
      // Clear the localStorage ID after loading
      localStorage.removeItem('currentContentId');
    }
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
    
    // Escuchar cambios en el tipo de contenido para aplicar/quitar validadores dinámicamente
    this.typeChangeSubscription = this.uploadForm.get('type')?.valueChanges.subscribe((type: string) => {
      const urlControl = this.uploadForm.get('url');
      const resolutionControl = this.uploadForm.get('resolution');
      
      // Actualizar bandera para mostrar/ocultar campos en el template
      this.isVideoContent = type === 'video';

      if (type === 'video') {
        // Para video: aplicar validadores
        urlControl?.setValidators([videoUrlValidator()]);
        resolutionControl?.setValidators([Validators.required]);
      } else {
        // Para audio: sin validadores
        urlControl?.clearValidators();
        resolutionControl?.clearValidators();
      }
      
      urlControl?.updateValueAndValidity();
      resolutionControl?.updateValueAndValidity();
    }) ?? new Subscription();


    this.formBaseService.createFormState(this.formId, {});
    this.formBaseService.getFormState(this.formId)?.subscribe((state: FormState) => {
      this.currentFormState = state;
    });

    this.imageStateSubscription = this.imageSelectorService.getState().subscribe((state: ImageSelectorState) => {
      this.formBaseService.updateFormState(this.formId, { imageState: state });
    });

    // Logs para fechaExpiracion
    this.fechaExpiracionSubscription = this.uploadForm.get('fechaExpiracion')?.valueChanges.subscribe((value: string) => {
      // Debug logs removed
    });

    // Suscripción para cambio de VIP - ajustar resolución si necesario
    this.vipChangeSubscription = this.uploadForm.get('vip')?.valueChanges.subscribe((vipValue: string) => {
      const resolutionControl = this.uploadForm.get('resolution');
      const currentResolution = resolutionControl?.value;
      
      // Si se cambia de VIP a NO-VIP y la resolución es 4K, bajar a 1080p
      if (vipValue !== 'si' && currentResolution === '4K') {
        resolutionControl?.setValue('1080p');
        resolutionControl?.updateValueAndValidity();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.imageStateSubscription) {
      this.imageStateSubscription.unsubscribe();
    }
    if (this.typeChangeSubscription) {
      this.typeChangeSubscription.unsubscribe();
    }
    if (this.fechaExpiracionSubscription) {
      this.fechaExpiracionSubscription.unsubscribe();
    }
    if (this.vipChangeSubscription) {
      this.vipChangeSubscription.unsubscribe();
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
  
  private loadContentForEdit(): void {
    if (!this.contentId) return;

    this.catalogoService.getContenidoById(this.contentId).subscribe({
      next: (content) => {
        this.setContentType(content);
        this.selectedTags = [...(content.tags || [])];
        const fechaFormateada = this.formatExpirationDate(content.disponibleHasta);
        const estadoNormalizado = this.normalizeEstado(content.estado);
        this.populateForm(content, fechaFormateada, estadoNormalizado);
        this.handleThumbnail(content);
        this.disableFieldsForEdit();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading content for edit:', err);
        this.formBaseService.updateFormState(this.formId, {
          error: 'No se pudo cargar el contenido para editar'
        });
      }
    });
  }

  private setContentType(content: any): void {
    const contentType = content.tipo === 'VIDEO' ? 'video' : 'audio';
    this.originalContentType = contentType;
    this.isVideoContent = contentType === 'video';

    const creatorType = this.currentUser?.tipoContenido?.toLowerCase();
    const normalizedCreatorType = creatorType === 'vídeo' ? 'video' : creatorType;
    this.canEditContent = normalizedCreatorType === contentType;
  }

  private formatExpirationDate(disponibleHasta: any): string {
    if (!disponibleHasta) return '';
    const fecha = new Date(disponibleHasta);
    return !isNaN(fecha.getTime()) ? fecha.toISOString().split('T')[0] : '';
  }

  private normalizeEstado(estado: string): string {
    if (estado === 'PUBLICO') return 'Publico';
    if (estado === 'PRIVADO') return 'Privado';
    return estado;
  }

  private populateForm(content: any, fechaFormateada: string, estadoNormalizado: string): void {
    const contentType = this.originalContentType;
    this.uploadForm.patchValue({
      title: content.titulo,
      description: content.descripcion,
      type: contentType,
      vip: content.contenidoVip ? 'si' : 'no',
      url: contentType === 'video' ? content.ficheroUrl : '',
      audioUrl: contentType === 'audio' ? content.ficheroUrl : '',
      duration: content.duracion?.toString() || '',
      estado: estadoNormalizado,
      ageRestriction: content.restriccionEdad !== null && content.restriccionEdad !== undefined ? `+${content.restriccionEdad}` : '',
      resolution: content.resolucion || '',
      fechaExpiracion: fechaFormateada,
      tags: this.selectedTags
    });

    this.uploadForm.get('fechaExpiracion')?.updateValueAndValidity();
  }

  private handleThumbnail(content: any): void {
    if (content.miniaturaUrl) {
      this.contentMiniaturaUrl = content.miniaturaUrl;
      if (content.miniaturaUrl.includes('/resources/thumbnails/')) {
        // Predefined thumbnail - find the full URL in available thumbnails
        const availableThumbnails = this.currentFormState?.imageState?.images || [];
        const matchingThumbnail = availableThumbnails.find((t: string) => t.includes(content.miniaturaUrl.split('/').pop()));
        if (matchingThumbnail) {
          this.imageSelectorService.selectImage(matchingThumbnail, 'thumbnail');
        }
      } else {
        // Custom uploaded thumbnail
        this.existingThumbnailUrl = this.api.getFullThumbnailUrl(content.miniaturaUrl);
        this.imageSelectorService.selectLocalImage(this.existingThumbnailUrl);
      }
    }
  }

  private disableFieldsForEdit(): void {
    // Disable restricted fields in edit mode
    this.uploadForm.get('type')?.disable();
    this.uploadForm.get('url')?.disable();
    this.uploadForm.get('audioUrl')?.disable();

    // Clear validators from disabled fields
    this.uploadForm.get('type')?.clearValidators();
    this.uploadForm.get('url')?.clearValidators();
    this.uploadForm.get('audioUrl')?.clearValidators();
    this.uploadForm.get('type')?.updateValueAndValidity();
    this.uploadForm.get('url')?.updateValueAndValidity();
    this.uploadForm.get('audioUrl')?.updateValueAndValidity();

    // If content type doesn't match creator type, disable ALL fields
    if (!this.canEditContent) {
      Object.keys(this.uploadForm.controls).forEach(key => {
        this.uploadForm.get(key)?.disable();
      });
      this.formBaseService.updateFormState(this.formId, {
        error: 'No puedes editar este contenido porque no coincide con tu tipo de creador.'
      });
    }
  }

  /**
   * Abre el modal de confirmación para eliminar contenido
   */
  openDeleteConfirmModal(): void {
    // Early return si el usuario cancela
    if (!confirm('¿Estás seguro de que deseas eliminar este contenido? Esta acción no se puede deshacer.')) {
      return;
    }
    this.deleteContent();
  }

  /**
   * Elimina el contenido actual
   */
  deleteContent(): void {
    if (!this.contentId) return;

    const delete$ = this.api.deleteContent(this.contentId);
    
    delete$.subscribe({
      next: () => {
        this.router.navigate(['/creator/catalog']);
      },
      error: (error) => {
        const message = error.status === 404 
          ? 'El contenido no existe' 
          : 'Error al eliminar el contenido';
        alert(message);
      }
    });
  }

  cancel() {
    // En modo edición, ir al catálogo del creador
    // En modo creación, ir a la página de inicio del creador
    const destinationRoute = this.isEditMode ? '/creator/catalog' : '/content-creator';
    this.router.navigate([destinationRoute]);
  }
}
