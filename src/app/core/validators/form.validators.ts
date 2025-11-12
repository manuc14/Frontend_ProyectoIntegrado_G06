/**
 * @fileoverview Validadores personalizados para formularios de la aplicación.
 * 
 * Este módulo contiene validadores reutilizables para diferentes tipos de campos:
 * - Validación de contraseñas y políticas de seguridad
 * - Validación de edades y fechas
 * - Validación de URLs
 * - Validación de coincidencia de campos
 * 
 * @module FormValidators
 * @requires @angular/forms
 */

import { AbstractControl, ValidationErrors, ValidatorFn, FormGroup } from '@angular/forms';

/** 
 * Año mínimo permitido para fechas de nacimiento.
 * Protege contra errores de entrada y datos históricos irreales.
 */
export const MIN_BIRTH_YEAR = 1900;

/**
 * Valida que dos controles del mismo FormGroup tengan valores idénticos.
 * 
 * Comúnmente usado para confirmar contraseñas o emails repetidos.
 * 
 * @param {string} aKey - Clave del primer control
 * @param {string} bKey - Clave del segundo control
 * @returns {ValidatorFn} Función validadora
 * 
 * @example
 * ```typescript
 * const form = this.fb.group({
 *   password: [''],
 *   confirmPassword: ['']
 * }, {
 *   validators: matchPasswordsValidator('password', 'confirmPassword')
 * });
 * ```
 */
export function matchPasswordsValidator(aKey: string, bKey: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const group = control as FormGroup;
    const av = group.get(aKey)?.value;
    const bv = group.get(bKey)?.value;
    return av && bv && av !== bv ? { mismatch: true } : null;
  };
}

/**
 * Valida que una fecha de nacimiento corresponda a una edad mínima.
 * 
 * Calcula la edad exacta considerando mes y día, no solo el año.
 * Rechaza fechas futuras y fechas inválidas.
 * 
 * @param {number} minYears - Edad mínima requerida en años
 * @returns {ValidatorFn} Función validadora
 * 
 * @example
 * ```typescript
 * birthDate: ['', minAgeValidator(18)] // Usuario debe tener al menos 18 años
 * ```
 */
export function minAgeValidator(minYears: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = control.value as string | Date | null;
    if (!v) return null;
    
    const dob = new Date(v);
    const now = new Date();
    
    if (isNaN(dob.getTime())) return { invalidDate: true };
    if (dob > now) return { futureDate: true };
    
    // Calcular edad exacta considerando mes y día
    const age = now.getFullYear() - dob.getFullYear() - 
                (now < new Date(now.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
    
    return age < minYears ? { minAge: { required: minYears, actual: age } } : null;
  };
}

/**
 * Valida que una fecha no sea anterior al año mínimo permitido.
 * 
 * Protege contra errores de entrada históricos o datos incorrectos.
 * 
 * @param {number} [minYear=MIN_BIRTH_YEAR] - Año mínimo permitido (por defecto 1900)
 * @returns {ValidatorFn} Función validadora
 */
export function maxAgeValidator(minYear: number = MIN_BIRTH_YEAR): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = control.value as string | Date | null;
    if (!v) return null;
    
    const dob = new Date(v);
    if (isNaN(dob.getTime())) return { invalidDate: true };
    if (dob.getFullYear() < minYear) {
      return { maxAge: true };
    }
    return null;
  };
}

/**
 * Valida que una contraseña cumpla con la política de seguridad de la aplicación.
 * 
 * Requisitos de la política:
 * - Mínimo 8 caracteres
 * - Al menos una letra mayúscula
 * - Al menos un carácter especial
 * - Al menos un número
 * 
 * @returns {ValidatorFn} Función validadora que retorna errores detallados por requisito
 * 
 * @example
 * ```typescript
 * password: ['', [Validators.required, passwordPolicyValidator()]]
 * ```
 */
export function passwordPolicyValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value || '';
    if (!value) return null;
    
    const errors: Record<string, any> = {};
    
    // Validar longitud mínima
    if (value.length < 8) errors['minLengthPolicy'] = true;
    
    // Validar mayúscula
    if (!/[A-Z]/.test(value)) errors['uppercasePolicy'] = true;
    
    // Validar carácter especial
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)) errors['specialPolicy'] = true;
    
    // Validar número
    if (!/\d/.test(value)) errors['numberPolicy'] = true;
    
    return Object.keys(errors).length ? { passwordPolicy: errors } : null;
  };
}

/**
 * Clase utilitaria con validadores específicos para contraseñas.
 * 
 * Proporciona validadores granulares que pueden componerse según necesidades.
 * Cada validador puede usarse independientemente o en combinación.
 * 
 * @class PasswordValidators
 */
export class PasswordValidators {
  /** Patrones regex para validación de requisitos de contraseña */
  private static readonly PATTERNS = {
    upper: /[A-Z]/,
    lower: /[a-z]/,
    number: /\d/,
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/
  };

  /**
   * Método helper privado para validar contra un patrón.
   * @private
   */
  private static validate(control: AbstractControl, pattern: RegExp, errorKey: string): ValidationErrors | null {
    return control.value && !pattern.test(control.value) ? { [errorKey]: true } : null;
  }

  /**
   * Valida que la contraseña contenga al menos una letra mayúscula.
   */
  static hasUpperCase(control: AbstractControl): ValidationErrors | null {
    return this.validate(control, this.PATTERNS.upper, 'missingUpperCase');
  }

  /**
   * Valida que la contraseña contenga al menos una letra minúscula.
   */
  static hasLowerCase(control: AbstractControl): ValidationErrors | null {
    return this.validate(control, this.PATTERNS.lower, 'missingLowerCase');
  }

  /**
   * Valida que la contraseña contenga al menos un número.
   */
  static hasNumber(control: AbstractControl): ValidationErrors | null {
    return this.validate(control, this.PATTERNS.number, 'missingNumber');
  }

  /**
   * Valida que la contraseña contenga al menos un carácter especial.
   */
  static hasSpecialChar(control: AbstractControl): ValidationErrors | null {
    return this.validate(control, this.PATTERNS.special, 'missingSpecialChar');
  }

  /**
   * Valida que dos campos de contraseña coincidan.
   * 
   * Debe aplicarse a nivel de FormGroup.
   * 
   * @param {AbstractControl} control - FormGroup que contiene los campos password y confirmPassword
   * @returns {ValidationErrors | null} Error si no coinciden, null si son iguales
   */
  static passwordsMatch(control: AbstractControl): ValidationErrors | null {
    const group = control as FormGroup;
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password && confirmPassword && password !== confirmPassword ? { passwordsMismatch: true } : null;
  }
}

/**
 * Valida que una fecha no sea anterior a hoy.
 * 
 * Útil para fechas de expiración o fechas de eventos futuros.
 * Compara solo la fecha (sin hora) para evitar problemas de zona horaria.
 * 
 * @returns {ValidatorFn} Función validadora
 * 
 * @example
 * ```typescript
 * expirationDate: ['', minDateValidator()] // Fecha debe ser hoy o posterior
 * ```
 */
export function minDateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalizar a medianoche para comparar solo fechas
    
    return selectedDate < today ? { minDate: { required: today.toISOString().split('T')[0], actual: control.value } } : null;
  };
}

/**
 * Valida que una URL tenga formato válido para videos.
 * 
 * Verifica:
 * - Que la URL no esté vacía (es requerida)
 * - Que comience con http:// o https://
 * - Que sea de una plataforma soportada (YouTube, Vimeo, Dailymotion)
 * 
 * @returns {ValidatorFn} Función validadora
 * 
 * @example
 * ```typescript
 * videoUrl: ['', videoUrlValidator()] // Debe ser una URL válida de plataforma soportada
 * ```
 */
export function videoUrlValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    // Si no hay valor, no validar
    if (!control.value) {
      return null;
    }
    
    // Asegurar que es string antes de hacer trim
    const url = typeof control.value === 'string' ? control.value.trim() : String(control.value).trim();
    
    if (!url) {
      return { required: true };
    }
    
    // Validar formato básico de URL
    if (!/^https?:\/\/.+/i.test(url)) {
      return { invalidUrl: true };
    }
    
    // Patrones para plataformas soportadas
    const supportedPatterns = {
      youtube: /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]{11})/i,
      vimeo: /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/\d+/i,
      dailymotion: /(?:https?:\/\/)?(?:www\.)?(?:dailymotion\.com\/video\/|dai\.ly\/)([\w-]+)/i
    };
    
    // Verificar que la URL corresponda a una plataforma soportada
    const isSupportedPlatform = Object.values(supportedPatterns).some(pattern => pattern.test(url));
    
    if (!isSupportedPlatform) {
      return { unsupportedVideoUrl: true };
    }
    
    return null;
  };
}