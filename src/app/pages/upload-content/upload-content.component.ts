import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { ApiService } from '../../core/services/api.service';
import { UploadValidatorService, UploadFormModel } from '../../core/services/upload-services/upload-validator.service';
import { UploadFormHelperService } from '../../core/services/upload-services/upload-form-helper.service';
import { ToastService } from '../../core/services/upload-services/toast.service';
import { FieldClearService } from '../../core/services/upload-services/field-clear.service';
import { extractErrorMessage } from '../../core/utils/error-utils';
import { UPLOAD_LIMITS } from '../../core/constants/form-limits';
 

import { Router } from '@angular/router';

@Component({
  selector: 'app-upload-content',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent ],
  templateUrl: './upload-content.component.html',
  styleUrls: ['./upload-content.component.scss']
})
export class UploadContentComponent implements OnInit {
  constructor(
    private api: ApiService,
    @Inject(Router) private router: Router,
    private validator: UploadValidatorService,
    private formHelper: UploadFormHelperService,
    private toast: ToastService,
    private clearer: FieldClearService
  ) {}

  // Constants for template access
  readonly UPLOAD_LIMITS = UPLOAD_LIMITS;

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
  titleError: string | null = null;
  typeError: string | null = null;
  vipError: string | null = null;
  durationError: string | null = null;
  estadoError: string | null = null;
  ageRestrictionError: string | null = null;
  fileError: string | null = null;
  resolutionError: string | null = null;

  // form submission state
  submitted = false;

  // Local preview and upload state
  localThumbnailPreview: string | null = null;
  isUploading = false;

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
  audioFileValidationError: string | null = null;

  get titleCount() {
    return this.title.length;
  }

  get descCount() {
    return this.description.length;
  }

  onTitleInput(ev: Event) {
    this.formHelper.handleTitleInput(this, ev);
  }

  onDescriptionInput(ev: Event) {
    this.formHelper.handleDescriptionInput(this, ev);
  }

  onUrlInput(ev: Event) {
    this.formHelper.handleUrlInput(this, ev);
  }

  onVipChange(): void {
    this.clearer.clearVipError(this);
  }

  onDurationChange(): void {
    this.clearer.clearDurationError(this);
  }

  onEstadoChange(): void {
    this.clearer.clearEstadoError(this);
  }

  onAgeRestrictionChange(): void {
    this.clearer.clearAgeRestrictionError(this);
  }

  onResolutionChange(): void {
    this.clearer.clearResolutionError(this);
  }

  async onFileSelected(event: Event) {
    await this.formHelper.handleFileSelected(this, event);
  }

  // file handling delegated to UploadFormHelperService

  private isVideoFileType(file: File): boolean {
    return this.validator.isVideoFileType(file);
  }

  onThumbnailSelected(event: Event) {
    this.formHelper.handleThumbnailSelected(this, event);
    this.showThumbnailSuccessToast();
  }

  private generateThumbnailPreview(file: File): void {
    // moved to helper; kept for backwards compatibility if called manually
    const reader = new FileReader();
    reader.onload = (e) => { this.localThumbnailPreview = e.target?.result as string; };
    reader.readAsDataURL(file);
  }

  clearLocalThumbnail(): void {
    this.clearer.clearLocalThumbnail(this);
  }

  selectThumbnail(thumbnailPath: string) {
    this.selectedThumbnail = thumbnailPath;
    this.selectedThumbnailUrl = this.getThumbnailUrl(thumbnailPath);
    this.localThumbnailUrl = null;
    this.localThumbnailFile = null;
  }

  onLocalThumbnailUploaded(uploadedUrl: string): void {
    this.localThumbnailUrl = uploadedUrl;
    this.selectedThumbnail = '';
    this.selectedThumbnailUrl = null;
  }

  onLocalThumbnailCleared(): void {
    this.localThumbnailUrl = null;
    this.localThumbnailFile = null;
  }

  getThumbnailUrl(relativePath: string): string {
    return this.api.getFullThumbnailUrl(relativePath);
  }

  onTypeChange(t: 'video' | 'audio' | '') {
    this.type = t;
    this.clearer.clearField(this, 'typeError');
    if (t === 'video') {
      this.file = null;
      this.clearer.clearField(this, 'fileError');
      this.clearer.clearField(this, 'audioFileValidationError');
      this.clearer.clearField(this, 'urlError');
      return;
    }
    if (t === 'audio') {
      this.url = '';
      this.resolution = '';
      this.clearer.clearField(this, 'urlError');
      this.clearer.clearField(this, 'audioFileValidationError');
      if (this.file && this.isVideoFileType(this.file)) {
        this.file = null;
      }
      return;
    }
    this.file = null;
    this.clearer.clearField(this, 'audioFileValidationError');
  }

  addTag() {
    this.formHelper.handleAddTag(this);
  }

  validarFecha(): boolean {
    const err = this.validator.getFechaError(this.fechaExpiracion);
    this.clearer.clearField(this, 'fechaError');
    if (err) {
      this.fechaError = err;
      return false;
    }
    return true;
  }

  validarUrl(): boolean {
    const err = this.validator.getUrlError(this.url);
    this.clearer.clearField(this, 'urlError');
    if (err) {
      this.urlError = err;
      return false;
    }
    return true;
  }

  removeTag(index: number) {
    this.clearer.removeTag(this, index);
  }

  async upload() {
    this.formError = null;
    this.formSuccess = null;
    this.submitted = true;
    this.isUploading = true;
    try {
      const shouldContinue = this.formHelper.handlePreUploadValidation(this);
      if (!shouldContinue) return;
      await this.formHelper.performUploadFlow(this);
    } catch (err: any) {
      this.handleFormError(err);
    } finally {
      this.isUploading = false;
    }
  }


  private handleFormError(error: any): void {
    this.formError = extractErrorMessage(error);
  }

  private handleValidationError(message: string): void {
    if (message.includes('tag')) {
      this.tagsError = message;
    }
    this.formError = message || 'Formulario inválido';
  }

  public buildPayload(): any {
    const thumbnailUrl = this.localThumbnailUrl || this.selectedThumbnailUrl;
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

  public handleUploadSuccess(): void {
    this.formSuccess = 'Contenido guardado correctamente.';
    this.toast.showSuccess({
      onShow: () => {
        this.showSuccessMessage = true;
      },
      onHide: () => {
        this.hideSuccessMessage = true;
      },
      onComplete: () => {
        this.showSuccessMessage = false;
        this.hideSuccessMessage = false;
        this.router.navigate(['/content-creator']);
      }
    });
  }

  ngOnInit(): void {
    const t = new Date();
    const yyyy = t.getFullYear();
    const mm = String(t.getMonth() + 1).padStart(2, '0');
    const dd = String(t.getDate()).padStart(2, '0');
    this.minDate = `${yyyy}-${mm}-${dd}`;
    this.loadThumbnails();
  }

  private showThumbnailSuccessToast(): void {
    this.toast.showThumbnailSuccess({
      onShow: () => (this.showThumbnailSuccessMessage = true),
      onHide: () => (this.hideThumbnailSuccessMessage = true),
      onComplete: () => {
        this.showThumbnailSuccessMessage = false;
        this.hideThumbnailSuccessMessage = false;
      }
    });
  }

  loadThumbnails() {
    this.loadingThumbnails = true;
    this.thumbnailLoadError = false;
    this.api.getThumbnails().subscribe({
      next: (response) => {
        const resp: any = response;
        this.thumbnails = resp?.thumbnails ?? [];
        this.defaultThumbnail = resp?.defaultThumbnail ?? '';
        this.selectedThumbnail = this.defaultThumbnail;
        this.selectedThumbnailUrl = this.defaultThumbnail ? this.getThumbnailUrl(this.defaultThumbnail) : null;
      },
      error: (_error) => {
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

  cancel() {
    this.router.navigate(['/content-creator']);
  }

  getMissingRequiredFields(): string[] {
    return this.validator.getMissingRequiredFields(this.buildUploadFormModel());
  }

  public buildUploadFormModel(): UploadFormModel {
    return {
      title: this.title,
      description: this.description,
      type: this.type,
      vip: this.vip,
      url: this.url,
      audioUrl: this.audioUrl,
      file: this.file,
      duration: this.duration,
      estado: this.estado,
      ageRestriction: this.ageRestriction,
      resolution: this.resolution,
      tags: this.tags,
      fechaExpiracion: this.fechaExpiracion
    };
  }
}
