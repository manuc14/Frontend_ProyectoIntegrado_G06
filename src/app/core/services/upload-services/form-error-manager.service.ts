import { Injectable } from '@angular/core';
import { UploadFormModel, ValidationResult } from './upload-validator.service';

/**
 * Small helper service to set/clear form error properties on components or plain objects.
 * Intentionally minimal and idempotent.
 */
@Injectable({ providedIn: 'root' })
export class FormErrorManagerService {
  /** Set the provided errors on the target object. Keys are property names. */
  setErrors(target: any, errors: Record<string, string> | null | undefined): void {
    if (!target || !errors) return;
    for (const k of Object.keys(errors)) {
      try {
        target[k] = (errors as any)[k];
      } catch {}
    }
  }

  /** Clear the listed fields on the target by setting them to null (idempotent). */
  clearFields(target: any, fields: string[] | null | undefined): void {
    if (!target || !fields) return;
    for (const f of fields) {
      try {
        if (f in target) (target as any)[f] = null;
      } catch {}
    }
  }

  /** Alias for setErrors to match the requested API name. */
  assignMissing(target: any, missingMap: Record<string, string> | null | undefined): void {
    this.setErrors(target, missingMap as any);
  }

  // Error management methods moved from UploadValidatorService
  private isBlank = (s?: string | null) => !s || (typeof s === 'string' && s.trim() === '');

  private getFieldRules(): ReadonlyArray<{
    condition: (m: UploadFormModel) => boolean;
    errorKey?: string;
    errorMsg?: string;
    label?: string;
    when?: (m: UploadFormModel) => boolean;
    includeInCollect?: boolean;
    includeInMissing?: boolean;
  }> {
    const rules: Array<{
      condition: (m: UploadFormModel) => boolean;
      errorKey?: string;
      errorMsg?: string;
      label?: string;
      when?: (m: UploadFormModel) => boolean;
      includeInCollect?: boolean;
      includeInMissing?: boolean;
    }> = [];

    // Simple blank-field rules (kept in the same order as the original list)
    rules.push({ condition: m => this.isBlank(m.title), errorKey: 'titleError', errorMsg: 'El título es obligatorio', includeInCollect: true, includeInMissing: false });
    rules.push({ condition: m => !m.type, errorKey: 'typeError', errorMsg: 'Debe seleccionar el tipo de archivo', label: 'Tipo de archivo', includeInCollect: true, includeInMissing: true });
    rules.push({ condition: m => !m.vip, errorKey: 'vipError', errorMsg: 'Debe indicar si es contenido VIP', label: 'Contenido VIP', includeInCollect: true, includeInMissing: true });
    // When no type specified, report a combined missing label 'URL o Archivo' (only for missing labels)
    rules.push({ condition: m => !m.type, label: 'URL o Archivo', includeInCollect: false, includeInMissing: true });

    // Video-specific rules
    rules.push({ when: m => m.type === 'video', condition: m => this.isBlank(m.url), errorKey: 'urlError', errorMsg: 'La URL es obligatoria para videos', label: 'URL', includeInCollect: true, includeInMissing: true });
    rules.push({ when: m => m.type === 'video', condition: m => !m.resolution, errorKey: 'resolutionError', errorMsg: 'La resolución es obligatoria para videos', includeInCollect: true, includeInMissing: false });

    // Audio-specific rules
    rules.push({ when: m => m.type === 'audio', condition: m => !m.file && !m.audioUrl, errorKey: 'fileError', errorMsg: 'Debe subir un archivo de audio', label: 'Archivo (audio)', includeInCollect: true, includeInMissing: true });

    // Remaining required fields
    rules.push({ condition: m => !m.duration, errorKey: 'durationError', errorMsg: 'La duración es obligatoria', includeInCollect: true, includeInMissing: false });
    rules.push({ condition: m => !m.estado, errorKey: 'estadoError', errorMsg: 'Debe seleccionar un estado', includeInCollect: true, includeInMissing: false });
    rules.push({ condition: m => !m.ageRestriction, errorKey: 'ageRestrictionError', errorMsg: 'Debe seleccionar una restricción de edad', includeInCollect: true, includeInMissing: false });
    rules.push({ condition: m => (m.tags || []).length === 0, errorKey: 'tagsError', errorMsg: 'Debe añadir al menos un tag', includeInCollect: true, includeInMissing: false });

    return rules as ReadonlyArray<any>;
  }

  collectFieldErrors(model: UploadFormModel): Record<string, string> {
    const errors: Record<string, string> = {};
    for (const r of this.getFieldRules()) {
      if (r.includeInCollect !== true) continue;
      if (r.when && !r.when(model)) continue;
      try {
        if (r.condition(model) && r.errorKey && r.errorMsg) {
          errors[r.errorKey] = r.errorMsg;
        }
      } catch {}
    }
    return errors;
  }

  getMissingRequiredFields(model: UploadFormModel): string[] {
    const labels: string[] = [];
    for (const r of this.getFieldRules()) {
      if (r.includeInMissing !== true) continue;
      if (r.when && !r.when(model)) continue;
      try {
        if (r.condition(model) && r.label) labels.push(r.label);
      } catch {}
    }
    return labels;
  }

  urlErrorResult(): ValidationResult {
    return { isValid: false, message: 'URL del video inválida', fieldErrors: { urlError: 'La URL debe empezar por http:// o https://' } };
  }

  fechaErrorResult(): ValidationResult {
    return { isValid: false, message: 'Fecha de disponibilidad inválida', fieldErrors: { fechaError: '⚠️ Por favor, introduce una fecha válida en formato AAAA-MM-DD.' } };
  }
}
