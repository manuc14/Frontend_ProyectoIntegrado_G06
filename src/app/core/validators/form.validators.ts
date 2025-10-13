/*
 * Validadores compartidos para formularios (autenticación y perfil).
 * - matchPasswordsValidator: asegura que dos controles de un FormGroup coincidan (p. ej., password/repeatPassword)
 * - minAgeValidator: valida una edad mínima a partir de una fecha de nacimiento
 * - maxAgeValidator: valida que una fecha no sea anterior al año mínimo permitido
 * - passwordPolicyValidator (opcional): política de ejemplo que exige longitud, mayúscula (no en primera posición), carácter especial y número
 * - PasswordValidators: clase con validadores específicos para contraseñas
 */
import { AbstractControl, ValidationErrors, ValidatorFn, FormGroup } from '@angular/forms';

/** Año mínimo permitido para fechas de nacimiento */
export const MIN_BIRTH_YEAR = 1900;

/** Asegura que dos controles del mismo grupo tengan valores idénticos. */
export function matchPasswordsValidator(aKey: string, bKey: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const group = control as FormGroup;
    const av = group.get(aKey)?.value;
    const bv = group.get(bKey)?.value;
    return av && bv && av !== bv ? { mismatch: true } : null;
  };
}

/** Valida que una fecha corresponda al menos a `minYears` años de edad. */
export function minAgeValidator(minYears: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = control.value as string | Date | null;
    if (!v) return null;
    const dob = new Date(v);
    const now = new Date();
    if (isNaN(dob.getTime())) return { invalidDate: true };
    if (dob > now) return { futureDate: true };
    const age = now.getFullYear() - dob.getFullYear() - (now < new Date(now.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
    return age < minYears ? { minAge: { required: minYears, actual: age } } : null;
  };
}

/** Valida que una fecha no sea anterior al año mínimo permitido (ej: 1900). */
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
 * Política de contraseña opcional: 8+ caracteres, una mayúscula que no esté en primera posición,
 * un carácter especial y un número.
 * No se aplica por defecto para no cambiar el comportamiento; impórtala y úsala en los componentes si la necesitas.
 */
export function passwordPolicyValidator(): ValidatorFn {
  const specialRe = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;
  const numberRe = /\d/;
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value || '') as string;
    if (!value) return null; // let required handle empties
    const errors: Record<string, any> = {};
    if (value.length < 8) {
      errors['minLengthPolicy'] = true;
    }
    const upperIdx = value.search(/[A-Z]/);
    if (upperIdx === -1 || upperIdx === 0) {
      errors['uppercasePolicy'] = true; // must exist and not be first
    }
    if (!specialRe.test(value)) {
      errors['specialPolicy'] = true;
    }
    if (!numberRe.test(value)) {
      errors['numberPolicy'] = true;
    }
    return Object.keys(errors).length ? { passwordPolicy: errors } : null;
  };
}

/**
 * Clase con validadores específicos para contraseñas en el sistema de restablecimiento
 */
export class PasswordValidators {
  /** Valida que tenga al menos una mayúscula */
  static hasUpperCase(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    return /[A-Z]/.test(value) ? null : { missingUpperCase: true };
  }

  /** Valida que tenga al menos una minúscula */
  static hasLowerCase(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    return /[a-z]/.test(value) ? null : { missingLowerCase: true };
  }

  /** Valida que tenga al menos un número */
  static hasNumber(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    return /\d/.test(value) ? null : { missingNumber: true };
  }

  /** Valida que tenga al menos un carácter especial */
  static hasSpecialChar(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    return /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value) ? null : { missingSpecialChar: true };
  }

  /** Valida que las contraseñas coincidan */
  static passwordsMatch(control: AbstractControl): ValidationErrors | null {
    const group = control as FormGroup;
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    if (!password || !confirmPassword) return null;
    return password === confirmPassword ? null : { passwordsMismatch: true };
  }
}