/**
 * Página para establecer nueva contraseña durante el proceso de recuperación.
 * Tercer y último paso del flujo de restablecimiento de contraseña.
 */
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { PasswordValidators } from '../../core/validators/password.validators';
import { buttonHover, buttonPress, fadeIn, inputFocus, shakeError } from '../../core/animations/animations';

@Component({
  selector: 'app-new-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent, FooterComponent],
  templateUrl: './new-password.page.html',
  styleUrls: ['./new-password.page.scss'],
  animations: [buttonHover, buttonPress, fadeIn, inputFocus, shakeError]
})
export class NewPasswordPage implements OnInit {
  passwordForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  token = '';
  // Animation states
  shakeForm = false;
  buttonState = 'normal';
  focusedFields: {[key: string]: boolean} = {};

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.passwordForm = this.fb.group({
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        PasswordValidators.hasUpperCase,
        PasswordValidators.hasLowerCase,
        PasswordValidators.hasNumber,
        PasswordValidators.hasSpecialChar
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { 
      validators: PasswordValidators.passwordsMatch 
    });
  }

  ngOnInit() {
    // Obtener token de los query params
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      
      if (!this.token) {
        // Si no hay token, redirigir al primer paso
        this.router.navigate(['/forgot-password']);
        return;
      }
      
      // Validar que el token sea válido y el código haya sido verificado
      this.api.validateResetToken(this.token).subscribe({
        next: (response) => {
          if (!response.exists) {
            // Token inválido o sesión no existe
            this.router.navigate(['/forgot-password']);
          } else if (!response.verified) {
            // Token válido pero código no verificado, redirigir a verificación
            this.router.navigate(['/reset-password-code'], { 
              queryParams: { token: this.token } 
            });
          }
          // Si exists=true y verified=true, permitir continuar
        },
        error: () => {
          // Token inválido o error de servidor
          this.router.navigate(['/forgot-password']);
        }
      });
    });
  }

  /**
   * Establece la nueva contraseña
   */
  onSubmit() {
    if (this.passwordForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';
      this.buttonState = 'pressed';

      const { password, confirmPassword } = this.passwordForm.value;

      this.api.resetPasswordWithToken(this.token, password, confirmPassword).subscribe({
        next: (response: any) => {
          this.successMessage = response.message || 'Contraseña actualizada correctamente';
          // Redirigir al login después de 2 segundos
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (error: any) => {
          this.errorMessage = error.message || 'Error al actualizar la contraseña';
          this.isLoading = false;
          this.buttonState = 'normal';
          this.triggerShakeError();
        },
        complete: () => {
          this.isLoading = false;
          this.buttonState = 'normal';
        }
      });
    } else {
      this.triggerShakeError();
    }
  }

  /**
   * Obtiene los errores de validación del campo contraseña
   */
  getPasswordErrors(): string[] {
    const control = this.passwordForm.get('password');
    const errors: string[] = [];

    if (control?.hasError('required')) {
      errors.push('La contraseña es obligatoria');
    }
    if (control?.hasError('minlength')) {
      errors.push('Mínimo 8 caracteres');
    }
    if (control?.hasError('missingUpperCase')) {
      errors.push('Al menos una mayúscula');
    }
    if (control?.hasError('missingLowerCase')) {
      errors.push('Al menos una minúscula');
    }
    if (control?.hasError('missingNumber')) {
      errors.push('Al menos un número');
    }
    if (control?.hasError('missingSpecialChar')) {
      errors.push('Al menos un carácter especial');
    }

    return errors;
  }

  /**
   * Verifica si las contraseñas coinciden
   */
  get passwordsMatch(): boolean {
    return !this.passwordForm.hasError('passwordsMismatch');
  }

  /**
   * Vuelve al paso anterior
   */
  goBack() {
    this.router.navigate(['/reset-password-code'], {
      queryParams: { token: this.token }
    });
  }

  /**
   * Navega al login
   */
  goToLogin() {
    this.router.navigate(['/login']);
  }

  /**
   * Dispara la animación de shake para errores
   */
  triggerShakeError(): void {
    this.shakeForm = !this.shakeForm;
  }

  /**
   * Maneja el estado de focus de los inputs
   */
  onFieldFocus(field: string, focused: boolean): void {
    this.focusedFields[field] = focused;
  }

  /**
   * Estado de animación para inputs
   */
  getInputFocusState(field: string): string {
    return this.focusedFields[field] ? 'focused' : 'normal';
  }
}