import { Injectable } from '@angular/core';
import { FieldClearService } from './field-clear.service';
import { AUDIO_INVALID_MSG, UploadFormModel, ValidationResult } from './upload-validator.service';
import { FormErrorManagerService } from './form-error-manager.service';
import { UploadOrchestratorService } from './upload-orchestrator.service';
import { UploadHandlerService } from './upload-handler.service';
import { UploadService } from './upload.service';
import { ApiService } from '../api.service';
import { lastValueFrom } from 'rxjs';
import type { UploadContentComponent } from '../../../pages/upload-content/upload-content.component';
import { UPLOAD_LIMITS } from '../../constants/form-limits';

@Injectable({ providedIn: 'root' })
export class UploadFormHelperService {
  constructor(
    private clearer: FieldClearService,
    private formErrorManager: FormErrorManagerService,
    private orchestrator: UploadOrchestratorService,
    private uploadService: UploadService,
    private uploadHandler: UploadHandlerService,
    private api: ApiService
  ) {}

  handleTitleInput(component: UploadContentComponent, ev: Event): void {
    const v = (ev.target as HTMLInputElement).value ?? '';
    component.title = v.slice(0, UPLOAD_LIMITS.titleLimit);
    this.clearer.clearField(component, 'titleError');
  }

  handleDescriptionInput(component: UploadContentComponent, ev: Event): void {
    const v = (ev.target as HTMLTextAreaElement).value ?? '';
    component.description = v.slice(0, UPLOAD_LIMITS.descLimit);
  }

  handleUrlInput(component: UploadContentComponent, ev: Event): void {
    const v = (ev.target as HTMLInputElement).value.trim();
    if (component.type === 'audio') {
      ev.preventDefault();
      return;
    }
    component.url = v;
    this.clearer.clearField(component, 'urlError');
  }

  handleAddTag(component: UploadContentComponent): void {
    const candidate = (component.newTag || '').trim();
    if (!candidate) {
      component.tagsError = 'El tag no puede estar vacío';
      return;
    }
    const exists = (component.tags || []).some(t => t.toLowerCase() === candidate.toLowerCase());
    if (exists) {
      component.tagsError = 'Ya existe ese tag';
      component.newTag = '';
      return;
    }
    component.tags = component.tags || [];
    component.tags.push(candidate);
    component.newTag = '';
    this.clearer.clearField(component, 'tagsError');
    try {
      const el = document.querySelector('input[name="newTag"]');
      (el as HTMLInputElement | null)?.focus();
    } catch {}
  }

  // File selection and thumbnail helpers moved from component to reduce size
  async handleFileSelected(component: UploadContentComponent, event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const selectedFile = input.files?.[0] ?? null;
    if (!selectedFile) {
      component.file = null;
      return;
    }
    const handlers: Record<string, () => unknown> = {
      video: () => this.handleVideoFileSelection(component, input),
      audio: () => this.handleAudioFileSelection(component, selectedFile, input)
    };
    const action = handlers[component.type] ?? (() => this.handleNoTypeSelected(component, input));
    await Promise.resolve(action());
  }

  private handleVideoFileSelection(component: UploadContentComponent, input: HTMLInputElement): void {
    // keep behavior: clear the file input when videos are selected
    this.clearer.clearFileInput(input, component, 'file');
  }

  private async handleAudioFileSelection(component: UploadContentComponent, selectedFile: File, input: HTMLInputElement): Promise<void> {
    this.clearer.clearField(component, 'audioFileValidationError');
    this.clearer.clearField(component, 'audioUploadError');
    const audioValidation = this.uploadService.validateAudioFile(selectedFile);
    if (!audioValidation.ok) {
      const { error = AUDIO_INVALID_MSG } = audioValidation as { error?: string };
      component.audioFileValidationError = error;
      this.clearer.clearFileInput(input, component, 'file');
      component.file = null;
      return;
    }
    component.file = selectedFile;
    if (component.fileError) {
      this.clearer.clearField(component, 'fileError');
    }
    component.audioUrl = '';
  }

  private handleNoTypeSelected(component: UploadContentComponent, input: HTMLInputElement): void {
    this.clearer.clearFileInput(input, component, 'file');
  }

  handleThumbnailSelected(component: UploadContentComponent, event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) {
      this.clearer.clearLocalThumbnail(component);
      return;
    }
    const file = files[0];
  const thumbValidation = this.uploadHandler.validateThumbnail(file);
    if (!thumbValidation.ok) {
      alert(thumbValidation.error);
      this.clearer.clearFileInput(input, component, 'file');
      return;
    }
    component.localThumbnailFile = file;
    // generate preview
    const reader = new FileReader();
    reader.onload = (e) => { component.localThumbnailPreview = e.target?.result as string; };
    reader.readAsDataURL(file);
    component.selectedThumbnail = '';
    component.selectedThumbnailUrl = null;
    component.localThumbnailUrl = null;
  }

  /** Validate the form before upload. Returns true when valid and ready to continue. */
  handlePreUploadValidation(component: UploadContentComponent): boolean {
    this.formErrorManager.clearFields(component, [
      'titleError', 'typeError', 'vipError', 'urlError', 'fileError', 'durationError', 'estadoError', 'ageRestrictionError', 'resolutionError'
    ]);
    const model: UploadFormModel = component.buildUploadFormModel();
    const missing = this.formErrorManager.collectFieldErrors(model);
    if (Object.keys(missing).length > 0) {
      this.formErrorManager.assignMissing(component, missing);
      component.formError = 'Faltan campos obligatorios';
      component.isUploading = false;
      return false;
    }
    // Run the same sequence as the central validator but without calling it
    if (!this.performValidation(component, model, this.validateBasicFields(model), 'Formulario inválido')) return false;
    if (!this.performValidation(component, model, this.validateTypeSpecific(model), 'Formulario inválido')) return false;
    if (!this.performValidation(component, model, this.validateRequired(model), 'Formulario inválido')) return false;

    // Final checks: fecha and URL
    if (model.fechaExpiracion && !this.orchestrator.validarFecha(model.fechaExpiracion)) {
      const fechaMsg = this.orchestrator.getFechaError(model.fechaExpiracion);
      if (fechaMsg) this.formErrorManager.setErrors(component, { fechaError: fechaMsg });
      component.formError = 'Fecha de disponibilidad inválida';
      component.isUploading = false;
      return false;
    }

    if (model.type === 'video' && !this.validateUrl(model.url)) {
      this.formErrorManager.setErrors(component, { urlError: 'La URL debe empezar por http:// o https://' });
      component.formError = 'URL del video inválida';
      component.isUploading = false;
      return false;
    }
    return true;
  }

  private performValidation(component: UploadContentComponent, model: UploadFormModel, result: ValidationResult, defaultMessage: string): boolean {
    if (!result.isValid) {
      const missingAgain = this.formErrorManager.collectFieldErrors(model);
      this.formErrorManager.assignMissing(component, missingAgain);
      if (result.fieldErrors) this.formErrorManager.setErrors(component, result.fieldErrors as Record<string, string>);
      component.formError = result.message ?? defaultMessage;
      component.isUploading = false;
      return false;
    }
    return true;
  }

  /** Perform the upload flow: upload files, create content and call success handler on component */
  async performUploadFlow(component: UploadContentComponent): Promise<void> {
    try {
      if (component.type === 'audio' && component.file && !component.audioUrl) {
        component.audioUploading = true;
        this.clearer.clearField(component, 'audioUploadError');
      }
      const res = await this.orchestrator.uploadFiles({
        type: component.type,
        file: component.file,
        existingAudioUrl: component.audioUrl,
        localThumbnailFile: component.localThumbnailFile,
        existingLocalThumbnailUrl: component.localThumbnailUrl
      });
      if (res.audioUrl) component.audioUrl = res.audioUrl;
      if (res.localThumbnailUrl) component.localThumbnailUrl = res.localThumbnailUrl;
    } finally {
      component.audioUploading = false;
    }
    const payload = component.buildPayload();
    await lastValueFrom(this.api.createContent(payload));
    component.handleUploadSuccess();
  }

  // Validation logic moved from UploadValidatorService
  private readonly VALIDATION_RULES = {
    basic: [
      {
        key: 'titleError',
        message: 'Título requerido',
        fieldMessage: 'El título es obligatorio',
        valid: (m: UploadFormModel) => !!m.title?.trim()
      },
      {
        key: 'typeError',
        message: 'Tipo de archivo requerido',
        fieldMessage: 'Debe seleccionar el tipo de archivo',
        valid: (m: UploadFormModel) => !!m.type
      },
      {
        key: 'tagsError',
        message: 'Debe añadir al menos un tag antes de enviar',
        fieldMessage: 'Debe añadir al menos un tag',
        valid: (m: UploadFormModel) => (m.tags || []).length > 0
      }
    ],
    typeSpecific: [
      {
        key: 'urlError',
        message: 'Para video: proporciona una URL',
        fieldMessage: 'La URL es obligatoria para videos',
        when: (m: UploadFormModel) => m.type === 'video',
        valid: (m: UploadFormModel) => !!m.url?.trim()
      },
      {
        key: 'resolutionError',
        message: 'Resolución requerida para video',
        fieldMessage: 'La resolución es obligatoria para videos',
        when: (m: UploadFormModel) => m.type === 'video',
        valid: (m: UploadFormModel) => !!m.resolution
      },
      {
        key: 'fileError',
        message: 'Para audio: sube un archivo desde tu dispositivo',
        fieldMessage: 'Debe subir un archivo de audio',
        when: (m: UploadFormModel) => m.type === 'audio',
        valid: (m: UploadFormModel) => !!m.file || !!m.audioUrl
      }
    ],
    required: [
      {
        key: 'durationError',
        message: 'Duración requerida',
        fieldMessage: 'La duración es obligatoria',
        valid: (m: UploadFormModel) => !!m.duration
      },
      {
        key: 'estadoError',
        message: 'Estado requerido',
        fieldMessage: 'Debe seleccionar un estado',
        valid: (m: UploadFormModel) => !!m.estado
      },
      {
        key: 'ageRestrictionError',
        message: 'Restricción de edad requerida',
        fieldMessage: 'Debe seleccionar una restricción de edad',
        valid: (m: UploadFormModel) => !!m.ageRestriction
      }
    ]
  } as const;

  private runValidationRules(model: UploadFormModel, rules: ReadonlyArray<{ key: string; message: string; fieldMessage: string; when?: (m: UploadFormModel) => boolean; valid: (m: UploadFormModel) => boolean }>): ValidationResult {
    for (const r of rules) {
      if (r.when && !r.when(model)) continue;
      const ok = !!r.valid(model);
      if (!ok) {
        const fe: Record<string, string> = {};
        fe[r.key] = r.fieldMessage;
        return { isValid: false, message: r.message, fieldErrors: fe };
      }
    }
    return { isValid: true };
  }

  validateBasicFields(model: UploadFormModel): ValidationResult {
    return this.runValidationRules(model, this.VALIDATION_RULES.basic);
  }

  validateTypeSpecific(model: UploadFormModel): ValidationResult {
    return this.runValidationRules(model, this.VALIDATION_RULES.typeSpecific);
  }

  validateRequired(model: UploadFormModel): ValidationResult {
    return this.runValidationRules(model, this.VALIDATION_RULES.required);
  }

  validateUrl(url: string): boolean {
    const v = (url || '').trim();
    if (!v) return true;
    const hasAllowedProtocol = (s: string) => s.startsWith('http://') || s.startsWith('https://');
    if (!hasAllowedProtocol(v)) return false;

    try {
      new URL(v);
      return true;
    } catch {
      return false;
    }
  }
}
