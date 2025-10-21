import { Injectable } from '@angular/core';
import { UploadFormHelperService } from './upload-form-helper.service';
import { FormErrorManagerService } from './form-error-manager.service';
import { UploadHandlerService } from './upload-handler.service';
import { UploadService } from './upload.service';
import { UploadOrchestratorService } from './upload-orchestrator.service';
import { ToastService } from './toast.service';

export const AUDIO_INVALID_MSG = 'Archivo de audio inválido';

export type UploadType = 'video' | 'audio' | '';

export interface UploadFormModel {
  title: string;
  description: string;
  type: UploadType;
  vip: string;
  url: string;
  audioUrl: string;
  file?: File | null;
  duration: string;
  estado: string;
  ageRestriction: string;
  resolution: string;
  tags: string[];
  fechaExpiracion: string;
}

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  fieldErrors?: Record<string, string | null>;
}

@Injectable({ providedIn: 'root' })
export class UploadValidatorService {
  constructor(
    private formHelper: UploadFormHelperService,
    private errorManager: FormErrorManagerService,
    private uploadHandler: UploadHandlerService,
    private uploadService: UploadService,
    private orchestrator: UploadOrchestratorService,
    private toast: ToastService
  ) {}

  validateAll(model: UploadFormModel): ValidationResult {
    // Validaciones básicas del formulario
    const fieldValidation = this.formHelper.validateBasicFields(model);
    if (!fieldValidation.isValid) return fieldValidation;

    // Validaciones dependientes del tipo (video/audio)
    const typeValidation = this.formHelper.validateTypeSpecific(model);
    if (!typeValidation.isValid) return typeValidation;

    // Validación de archivo según el tipo
    if (model.type === 'audio' && model.file) {
      const audioCheck = this.uploadService.validateAudioFile(model.file);
      if (!audioCheck.ok) return { isValid: false, message: audioCheck.error };
    }

    if (model.type === 'video' && !this.formHelper.validateUrl(model.url)) {
      return this.errorManager.urlErrorResult();
    }

    // Validación de fecha
    if (model.fechaExpiracion && !this.orchestrator.validarFecha(model.fechaExpiracion)) {
      return this.errorManager.fechaErrorResult();
    }

    return { isValid: true };
  }

  // Delegated methods
  collectFieldErrors(model: UploadFormModel): Record<string, string> {
    return this.errorManager.collectFieldErrors(model);
  }

  getMissingRequiredFields(model: UploadFormModel): string[] {
    return this.errorManager.getMissingRequiredFields(model);
  }

  validarFecha(val: string): boolean {
    return this.orchestrator.validarFecha(val);
  }

  getFechaError(val: string): string | null {
    return this.orchestrator.getFechaError(val);
  }

  validarUrl(url: string): boolean {
    return this.formHelper.validateUrl(url);
  }

  getUrlError(val: string): string | null {
    if (this.validarUrl(val)) return null;
    return 'La URL debe empezar por http:// o https://';
  }

  validateAudioFile(file: File): { ok: boolean; error?: string } {
    return this.uploadService.validateAudioFile(file);
  }

  isVideoFileType(file: File): boolean {
    const res = this.uploadHandler.validateFile(file, { typePrefix: 'video' });
    return res.ok;
  }

  validateThumbnail(file: File): { ok: boolean; error?: string } {
    return this.uploadHandler.validateThumbnail(file);
  }

  validateFile(file: File | null | undefined, opts: { typePrefix: 'audio' | 'video' | 'image'; validTypes?: string[]; maxSizeMB?: number; customMsg?: string }): { ok: boolean; error?: string } {
    return this.uploadHandler.validateFile(file, opts);
  }
}
