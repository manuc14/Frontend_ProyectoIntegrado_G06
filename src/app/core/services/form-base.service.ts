import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Observable, BehaviorSubject } from 'rxjs';
import { ImageSelectorService, ImageSelectorState } from './image-selector.service';
import { applyBackendDetails, clearBackendErrors } from '../utils/error-mapper';
import { passwordPolicyValidator, minAgeValidator, maxAgeValidator, MIN_BIRTH_YEAR, minDateValidator, videoUrlValidator } from '../validators/form.validators';
import { FORM_LIMITS } from '../constants/form-limits';

/**
 * Estado unificado para todos los formularios
 */
export interface FormState<T = any> {
  data: T;
  originalData: T;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  imageState: ImageSelectorState;
}

/**
 * Configuración base para formularios
 */
export interface FormConfig {
  validators?: Record<string, any[]>;
  asyncValidators?: Record<string, any[]>;
  customValidators?: ((control: AbstractControl) => ValidationErrors | null)[];
}

/**
 * FormBaseService - Servicio centralizado para gestión de formularios
 * Proporciona estado unificado, validadores comunes y manejo de errores
 */
@Injectable({
  providedIn: 'root'
})
export class FormBaseService {
  constructor(
    private fb: FormBuilder,
    private imageSelectorService: ImageSelectorService
  ) {}

  // Estado centralizado para formularios
  private formStates = new Map<string, BehaviorSubject<FormState>>();

  /**
   * Crea un nuevo estado de formulario
   */
  createFormState<T>(formId: string, initialData: T): BehaviorSubject<FormState<T>> {
    const state: FormState<T> = {
      data: { ...initialData },
      originalData: { ...initialData },
      isLoading: false,
      isSubmitting: false,
      error: null,
      fieldErrors: {},
      imageState: {
        images: [],
        defaultImage: '',
        selectedImage: '',
        loading: false,
        error: false,
        selectedImageUrl: null
      }
    };

    const subject = new BehaviorSubject<FormState<T>>(state);
    this.formStates.set(formId, subject);

    // Suscribir al estado de imágenes
    this.imageSelectorService.getState().subscribe(imageState => {
      const currentState = subject.value;
      subject.next({
        ...currentState,
        imageState
      });
    });

    return subject;
  }

  /**
   * Obtiene el estado de un formulario
   */
  getFormState<T>(formId: string): Observable<FormState<T>> | null {
    return this.formStates.get(formId) || null;
  }

  /**
   * Actualiza el estado de un formulario
   */
  updateFormState<T>(formId: string, updates: Partial<FormState<T>>): void {
    const subject = this.formStates.get(formId);
    if (subject) {
      const currentState = subject.value;
      subject.next({ ...currentState, ...updates });
    }
  }

  /**
   * Crea un FormGroup con configuración común
   */
  createFormGroup<T>(config: Record<keyof T, any>, customValidators?: ((control: AbstractControl) => ValidationErrors | null)[]): FormGroup {
    const formConfig: any = {};

    for (const [key, value] of Object.entries(config)) {
      formConfig[key] = [value, this.getValidatorsForField(key)];
    }

    const formGroup = this.fb.group(formConfig);

    if (customValidators) {
      formGroup.setValidators(customValidators);
    }

    return formGroup;
  }

  /**
   * Validadores comunes por campo
   */
  private getValidatorsForField(fieldName: string): any[] {
    const validators: Record<string, any[]> = {
      // Campos de texto comunes
      nombre: [Validators.required, Validators.maxLength(FORM_LIMITS.nombreMax)],
      apellidos: [Validators.required, Validators.maxLength(FORM_LIMITS.apellidosMax)],
      alias: [Validators.maxLength(FORM_LIMITS.aliasMax)],
      email: [Validators.required, Validators.email, Validators.maxLength(FORM_LIMITS.emailMax)],
      correo: [Validators.required, Validators.email, Validators.maxLength(FORM_LIMITS.emailMax)],

      // Contraseñas
      password: [Validators.required, Validators.minLength(FORM_LIMITS.passwordMin), Validators.maxLength(FORM_LIMITS.passwordMax), passwordPolicyValidator()],
      contrasena: [Validators.required, Validators.minLength(FORM_LIMITS.passwordMin), Validators.maxLength(FORM_LIMITS.passwordMax), passwordPolicyValidator()],
      repetirPassword: [Validators.required],
      confirmarContrasena: [Validators.required],

      // Fechas
      fechaNacimiento: [Validators.required, minAgeValidator(FORM_LIMITS.minAgeYears), maxAgeValidator(MIN_BIRTH_YEAR)],
      fechaExpiracion: [minDateValidator()],

      // Descripciones
      descripcion: [Validators.maxLength(500)],

      // Títulos y contenido
      title: [Validators.required, Validators.maxLength(50)],
      description: [Validators.maxLength(500)],

      // Campos específicos del upload de contenido
      duration: [Validators.required],
      estado: [Validators.required],
      ageRestriction: [Validators.required],
      vip: [Validators.required],
      url: [videoUrlValidator()],
      tags: [this.tagsValidator()]
    };

    return validators[fieldName] || [];
  }

  /**
   * Validador personalizado para tags - requiere al menos un tag
   */
  private tagsValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      const tags = control.value;
      if (!Array.isArray(tags) || tags.length === 0) {
        return { required: true };
      }
      return null;
    };
  }

  /**
   * Validadores personalizados comunes
   */
  static passwordMatchValidator(passwordField: string, confirmField: string) {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = control.get(passwordField);
      const confirm = control.get(confirmField);

      if (password && confirm && password.value !== confirm.value) {
        confirm.setErrors({ passwordMismatch: true });
        return { passwordMismatch: true };
      }
      return null;
    };
  }

  /**
   * Manejo unificado de errores del backend
   */
  handleBackendError(formId: string, form: FormGroup, error: any): void {
    const payload = error?.originalError?.error ?? error?.error ?? {};
    const backendMessage: string | undefined = payload?.message;
    const details: Array<{ field: string; message: string }>|undefined = payload?.details;

    // Limpiar errores previos
    clearBackendErrors(form, Object.keys(form.controls));

    let errorMessage = backendMessage ?? 'Ha ocurrido un error inesperado. Inténtelo de nuevo más tarde.';
    let fieldErrors: Record<string, string> = {};

    if (Array.isArray(details) && details.length > 0) {
      // Aplicar errores de validación del backend a campos específicos
      applyBackendDetails(form, details, this.getFieldMapping());
      errorMessage = details[0].message || errorMessage;
      fieldErrors = this.extractFieldErrors(details);
    }

    this.updateFormState(formId, {
      error: errorMessage,
      fieldErrors
    });
  }

  /**
   * Mapeo de campos del backend a nombres de formulario
   */
  private getFieldMapping(): Record<string, string> {
    return {
      repetirPassword: 'repetirPassword',
      confirmarContrasena: 'confirmarContrasena',
      password: 'password',
      contrasena: 'contrasena',
      email: 'email',
      correo: 'correo',
      nombre: 'nombre',
      apellidos: 'apellidos',
      alias: 'alias',
      fechaNacimiento: 'fechaNacimiento',
      descripcion: 'descripcion',
      title: 'title',
      description: 'description'
    };
  }

  /**
   * Extrae errores de campos de la respuesta del backend
   */
  private extractFieldErrors(details: Array<{ field: string; message: string }>): Record<string, string> {
    const fieldErrors: Record<string, string> = {};
    details.forEach(detail => {
      fieldErrors[detail.field] = detail.message;
    });
    return fieldErrors;
  }

  /**
   * Verifica si el formulario tiene cambios
   */
  hasChanges<T>(currentData: T, originalData: T): boolean {
    return JSON.stringify(currentData) !== JSON.stringify(originalData);
  }

  /**
   * Resetea el estado del formulario
   */
  resetFormState(formId: string): void {
    const subject = this.formStates.get(formId);
    if (subject) {
      const currentState = subject.value;
      subject.next({
        ...currentState,
        isSubmitting: false,
        error: null,
        fieldErrors: {}
      });
    }
  }

  /**
   * Destruye el estado de un formulario
   */
  destroyFormState(formId: string): void {
    this.formStates.delete(formId);
  }

  /**
   * Carga imágenes para un formulario
   */
  loadImages(imageType: 'avatar' | 'thumbnail' = 'avatar'): void {
    this.imageSelectorService.loadImages(imageType);
  }

  /**
   * Selecciona una imagen
   */
  selectImage(imagePath: string, imageType: 'avatar' | 'thumbnail' = 'avatar'): void {
    this.imageSelectorService.selectImage(imagePath, imageType);
  }

  /**
   * Obtiene URL completa de imagen
   */
  getFullImageUrl(relativePath: string, imageType: 'avatar' | 'thumbnail' = 'avatar'): string {
    return this.imageSelectorService.getFullImageUrl(relativePath, imageType);
  }

  /**
   * Extrae nombre del archivo de imagen
   */
  extractImageFileName(imagePath: string): string {
    return this.imageSelectorService.extractImageFileName(imagePath);
  }
}