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

@Component({
  selector: 'app-new-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent, FooterComponent],
  templateUrl: './new-password.page.html',
  styleUrls: ['./new-password.page.scss']
})
export class NewPasswordPage implements OnInit {
  passwordForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  email = '';
  code = '';

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
    // Obtener email y código de los query params
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      this.code = params['code'] || '';
      
      if (!this.email || !this.code) {
        // Si no hay email o código, redirigir al primer paso
        this.router.navigate(['/forgot-password']);
      }
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

      const { password } = this.passwordForm.value;

      this.api.resetPassword(this.email, this.code, password).subscribe({
        next: (response) => {
          this.successMessage = 'Contraseña actualizada correctamente';
          // Redirigir al login después de 2 segundos
          setTimeout(() => {
            this.router.navigate(['/login'], { 
              queryParams: { message: 'password-reset-success' } 
            });
          }, 2000);
        },
        error: (error: any) => {
          this.errorMessage = error.message || 'Error al actualizar la contraseña';
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        }
      });
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
      queryParams: { email: this.email }
    });
  }

  /**
   * Navega al login
   */
  goToLogin() {
    this.router.navigate(['/login']);
  }
}