/*
 * Validadores compartidos para formularios (autenticación y perfil).
 * - matchPasswordsValidator: asegura que dos controles de un FormGroup coincidan (p. ej., password/repeatPassword)
 * - minAgeValidator: valida una edad mínima a partir de una fecha de nacimiento
 * - passwordPolicyValidator (opcional): política de ejemplo que exige longitud, mayúscula (no en primera posición), carácter especial y número
 */
import { AbstractControl, ValidationErrors, ValidatorFn, FormGroup } from '@angular/forms';

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
