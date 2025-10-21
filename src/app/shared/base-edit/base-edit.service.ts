import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BaseEditService {

  getPasswordRequirements(passwordStrength: {
    hasMinLength: boolean;
    hasUpperCase: boolean;
    hasLowerCase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  }): string[] {
    const requirements: string[] = [];
    if (!passwordStrength.hasMinLength) requirements.push('Mínimo 8 caracteres');
    if (!passwordStrength.hasUpperCase) requirements.push('Al menos una mayúscula');
    if (!passwordStrength.hasLowerCase) requirements.push('Al menos una minúscula');
    if (!passwordStrength.hasNumber) requirements.push('Al menos un dígito');
    if (!passwordStrength.hasSpecialChar) requirements.push('Al menos un carácter especial');
    return requirements;
  }

  handleError(err: any): string {
    let errorMessage = err.message || 'Error al guardar los cambios';
    if (err.errors && err.errors.length > 0) {
      errorMessage += '\nDetalles:\n' + err.errors.map((e: any) => `- ${e.message}`).join('\n');
    } else if (err.details) {
      errorMessage += '\nDetalles: ' + JSON.stringify(err.details);
    }
    return errorMessage;
  }
}

