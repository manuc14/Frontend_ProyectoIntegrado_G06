/**
 * @fileoverview Servicio centralizado para la gestión de formularios en la aplicación.
 * Proporciona funcionalidades comunes como validación, manejo de estado y gestión de errores.
 * 
 * @module FormBaseService
 * @requires FormBuilder - Constructor de formularios reactivos de Angular
 * @requires ImageSelectorService - Servicio para gestión de imágenes
 */

import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Observable, BehaviorSubject } from 'rxjs';
import { ImageSelectorService, ImageSelectorState } from './image-selector.service';
import { applyBackendDetails, clearBackendErrors } from '../utils/error-mapper';
import { passwordPolicyValidator, minAgeValidator, maxAgeValidator, MIN_BIRTH_YEAR, minDateValidator, videoUrlValidator } from '../validators/form.validators';
import { FORM_LIMITS } from '../constants/form-limits';

/**
 * Estado unificado para todos los formularios de la aplicación.
 * Mantiene tanto los datos del formulario como su estado de carga y errores.
 * 
 * @interface FormState
 * @template T - Tipo de datos del formulario
 */
export interface FormState<T = any> {
  /** Datos actuales del formulario */
  data: T;
  /** Datos originales del formulario para detectar cambios */
  originalData: T;
  /** Indica si el formulario está cargando datos */
  isLoading: boolean;
  /** Indica si el formulario está en proceso de envío */
  isSubmitting: boolean;
  /** Mensaje de error general del formulario */
  error: string | null;
  /** Errores específicos de cada campo */
  fieldErrors: Record<string, string>;
  /** Estado de las imágenes asociadas al formulario */
  imageState: ImageSelectorState;
}

/**
 * Configuración base para la creación de formularios.
 * Permite definir validadores síncronos y asíncronos personalizados.
 * 
 * @interface FormConfig
 */
export interface FormConfig {
  /** Validadores síncronos por campo */
  validators?: Record<string, any[]>;
  /** Validadores asíncronos por campo */
  asyncValidators?: Record<string, any[]>;
  /** Validadores personalizados a nivel de formulario */
  customValidators?: ((control: AbstractControl) => ValidationErrors | null)[];
}

/**
 * Servicio centralizado para gestión de formularios.
 * 
 * Proporciona funcionalidades comunes para todos los formularios de la aplicación:
 * - Creación de formularios con validadores predefinidos
 * - Gestión de estado centralizada
 * - Manejo unificado de errores del backend
 * - Integración con el selector de imágenes
 * 
 * @class FormBaseService
 * @injectable
 */
@Injectable({
  providedIn: 'root'
})
export class FormBaseService {
  constructor(
    private fb: FormBuilder,
    private imageSelectorService: ImageSelectorService
  ) {}

  /** Mapa de estados de formularios activos en la aplicación */
  private formStates = new Map<string, BehaviorSubject<FormState>>();

  /**
   * Crea un nuevo estado de formulario con valores iniciales.
   * 
   * Este método inicializa un BehaviorSubject que mantendrá el estado del formulario
   * y se suscribe automáticamente al servicio de imágenes para mantener sincronizado
   * el estado de las imágenes asociadas.
   * 
   * @template T - Tipo de datos del formulario
   * @param {string} formId - Identificador único del formulario
   * @param {T} initialData - Datos iniciales del formulario
   * @returns {BehaviorSubject<FormState<T>>} Subject observable con el estado del formulario
   * 
   * @example
   * ```typescript
   * const formState = formBaseService.createFormState('login', { email: '', password: '' });
   * ```
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
   * Obtiene el observable del estado de un formulario específico.
   * 
   * @template T - Tipo de datos del formulario
   * @param {string} formId - Identificador único del formulario
   * @returns {Observable<FormState<T>> | null} Observable del estado o null si no existe
   * 
   * @example
   * ```typescript
   * const formState$ = formBaseService.getFormState('login');
   * formState$.subscribe(state => console.log(state.isSubmitting));
   * ```
   */
  getFormState<T>(formId: string): Observable<FormState<T>> | null {
    return this.formStates.get(formId) || null;
  }

  /**
   * Actualiza parcialmente el estado de un formulario.
   * 
   * Permite actualizar solo las propiedades necesarias del estado sin
   * afectar las demás. Útil para actualizar estados de carga o errores.
   * 
   * @template T - Tipo de datos del formulario
   * @param {string} formId - Identificador único del formulario
   * @param {Partial<FormState<T>>} updates - Propiedades a actualizar
   * 
   * @example
   * ```typescript
   * formBaseService.updateFormState('login', { isSubmitting: true, error: null });
   * ```
   */
  updateFormState<T>(formId: string, updates: Partial<FormState<T>>): void {
    const subject = this.formStates.get(formId);
    if (subject) {
      const currentState = subject.value;
      subject.next({ ...currentState, ...updates });
    }
  }

  /**
   * Crea un FormGroup con validadores predefinidos según los nombres de los campos.
   * 
   * Este método aplica automáticamente validadores comunes basándose en los nombres
   * de los campos (email, password, nombre, etc.). También permite añadir validadores
   * personalizados a nivel de formulario.
   * 
   * @template T - Tipo de datos del formulario
   * @param {Record<keyof T, any>} config - Configuración inicial de campos y valores
   * @param {((control: AbstractControl) => ValidationErrors | null)[]} [customValidators] - Validadores personalizados
   * @returns {FormGroup} FormGroup configurado con validadores
   * 
   * @example
   * ```typescript
   * const form = formBaseService.createFormGroup<LoginForm>({
   *   email: '',
   *   password: ''
   * }, [FormBaseService.passwordMatchValidator('password', 'confirmPassword')]);
   * ```
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
   * Obtiene los validadores predefinidos para un campo específico.
   * 
   * Mapea nombres de campos comunes a sus validadores correspondientes.
   * Los validadores incluyen restricciones de longitud, formato y requisitos específicos.
   * 
   * @private
   * @param {string} fieldName - Nombre del campo
   * @returns {any[]} Array de validadores para el campo
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
   * Validador personalizado para el campo de tags.
   * 
   * Verifica que el array de tags no esté vacío y contenga al menos un elemento.
   * 
   * @private
   * @returns {(control: AbstractControl) => ValidationErrors | null} Función validadora
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
   * Validador estático para verificar que dos contraseñas coincidan.
   * 
   * Este validador debe aplicarse a nivel de FormGroup, no de control individual.
   * Si las contraseñas no coinciden, añade un error al campo de confirmación.
   * 
   * @static
   * @param {string} passwordField - Nombre del campo de contraseña principal
   * @param {string} confirmField - Nombre del campo de confirmación
   * @returns {(control: AbstractControl) => ValidationErrors | null} Función validadora
   * 
   * @example
   * ```typescript
   * const form = this.fb.group({
   *   password: [''],
   *   confirmPassword: ['']
   * }, {
   *   validators: FormBaseService.passwordMatchValidator('password', 'confirmPassword')
   * });
   * ```
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
   * Maneja errores del backend de forma unificada.
   * 
   * Este método procesa errores HTTP del backend y actualiza el estado del formulario:
   * - Limpia errores previos de los controles del formulario
   * - Prioriza mensajes específicos de detalles sobre mensajes generales
   * - Aplica errores de validación a los campos correspondientes
   * - Actualiza el estado con el mensaje de error principal
   * 
   * Estructura esperada del error del backend:
   * ```json
   * {
   *   "error": {
   *     "message": "Error de validación",
   *     "details": [
   *       { "field": "email", "message": "El formato del email no es válido" }
   *     ]
   *   }
   * }
   * ```
   * 
   * @param {string} formId - Identificador del formulario
   * @param {FormGroup | null} form - Instancia del formulario (puede ser null para formularios sin controles)
   * @param {any} error - Error HTTP recibido del backend
   * 
   * @example
   * ```typescript
   * this.api.login(credentials).subscribe({
   *   error: (error) => this.formBaseService.handleBackendError('login', this.form, error)
   * });
   * ```
   */
  handleBackendError(formId: string, form: FormGroup | null, error: any): void {
    const payload = error?.error ?? {};
    const backendMessage: string | undefined = payload?.message;
    const details: Array<{ field: string; message: string }>|undefined = payload?.details;

    // Limpiar errores previos del backend solo si hay un formulario
    if (form) {
      clearBackendErrors(form, Object.keys(form.controls));
    }

    // Priorizar mensaje específico de detalles sobre mensaje general
    let errorMessage: string;
    const fieldErrors: Record<string, string> = {};

    if (Array.isArray(details) && details.length > 0) {
      // Usar el mensaje del primer detalle como mensaje principal a mostrar
      errorMessage = details[0].message;
      
      // Aplicar errores de validación del backend a campos específicos
      if (form) {
        applyBackendDetails(form, details, {});
      }
      
      // Extraer errores de campo para almacenarlos en el estado
      details.forEach(detail => {
        fieldErrors[detail.field] = detail.message;
      });
    } else {
      // Si no hay detalles, usar el mensaje general del backend
      errorMessage = backendMessage ?? 'Ha ocurrido un error inesperado. Inténtelo de nuevo más tarde.';
    }

    this.updateFormState(formId, { error: errorMessage, fieldErrors });
  }

  /**
   * Verifica si el formulario tiene cambios respecto a su estado original.
   * 
   * Compara el estado actual con el estado original mediante serialización JSON.
   * Útil para detectar si el usuario ha modificado el formulario.
   * 
   * @template T - Tipo de datos del formulario
   * @param {T} currentData - Datos actuales del formulario
   * @param {T} originalData - Datos originales del formulario
   * @returns {boolean} true si hay cambios, false en caso contrario
   */
  hasChanges<T>(currentData: T, originalData: T): boolean {
    return JSON.stringify(currentData) !== JSON.stringify(originalData);
  }

  /**
   * Resetea el estado de un formulario a su estado inicial.
   * 
   * Limpia el estado de envío, errores generales y errores de campo.
   * No modifica los datos del formulario.
   * 
   * @param {string} formId - Identificador del formulario
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
   * Destruye el estado de un formulario y libera recursos.
   * 
   * Elimina el BehaviorSubject del mapa de estados. Este método debe llamarse
   * en el ngOnDestroy del componente para evitar memory leaks.
   * 
   * @param {string} formId - Identificador del formulario
   */
  destroyFormState(formId: string): void {
    this.formStates.delete(formId);
  }

  /**
   * Carga imágenes disponibles para selección en el formulario.
   * 
   * Delega la carga al ImageSelectorService, que actualizará el estado
   * automáticamente cuando las imágenes estén disponibles.
   * 
   * @param {'avatar' | 'thumbnail'} [imageType='avatar'] - Tipo de imagen a cargar
   */
  loadImages(imageType: 'avatar' | 'thumbnail' = 'avatar'): void {
    this.imageSelectorService.loadImages(imageType);
  }

  /**
   * Selecciona una imagen para el formulario.
   * 
   * @param {string} imagePath - Ruta de la imagen a seleccionar
   * @param {'avatar' | 'thumbnail'} [imageType='avatar'] - Tipo de imagen
   */
  selectImage(imagePath: string, imageType: 'avatar' | 'thumbnail' = 'avatar'): void {
    this.imageSelectorService.selectImage(imagePath, imageType);
  }

  /**
   * Obtiene la URL completa de una imagen relativa.
   * 
   * Convierte rutas relativas del backend a URLs completas utilizables en el frontend.
   * 
   * @param {string} relativePath - Ruta relativa de la imagen
   * @param {'avatar' | 'thumbnail'} [imageType='avatar'] - Tipo de imagen
   * @returns {string} URL completa de la imagen
   */
  getFullImageUrl(relativePath: string, imageType: 'avatar' | 'thumbnail' = 'avatar'): string {
    return this.imageSelectorService.getFullImageUrl(relativePath, imageType);
  }

  /**
   * Extrae el nombre de archivo de una ruta de imagen.
   * 
   * @param {string} imagePath - Ruta completa de la imagen
   * @returns {string} Nombre del archivo de imagen
   */
  extractImageFileName(imagePath: string): string {
    return this.imageSelectorService.extractImageFileName(imagePath);
  }
}