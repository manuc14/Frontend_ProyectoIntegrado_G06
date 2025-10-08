import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { ApiService } from '../../core/services/api.service';
import { buttonHover, buttonPress, fadeIn, inputFocus, shakeError } from '../../core/animations/animations';

/*
 * Interfaz para el formulario de solicitud de restablecimiento
 */
interface ForgotPasswordForm {
  email: FormControl<string>;
}

/*
 * ForgotPasswordPage
 * Primera etapa del proceso de restablecimiento de contraseña.
 * Permite al usuario ingresar su email para recibir un código de verificación.
 * Incluye navegación por pasos y validación de email en tiempo real.
 */
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent, FooterComponent],
  templateUrl: './forgot-password.page.html',
  styleUrl: './forgot-password.page.scss',
  animations: [buttonHover, buttonPress, fadeIn, inputFocus, shakeError]
})
export class ForgotPasswordPage {
  form: FormGroup<ForgotPasswordForm>;
  loading = false;
  bannerKind: 'success' | 'error' | null = null;
  bannerText = '';
  // Animation states
  shakeForm = false;
  buttonState = 'normal';
  emailFocused = false;

  constructor(private fb: FormBuilder, private api: ApiService, private router: Router) {
    this.form = this.fb.nonNullable.group({
      email: this.fb.nonNullable.control('', [Validators.required, Validators.email])
    });
  }

  get f() { return this.form.controls; }

  /* Envía solicitud de código de restablecimiento al backend */
  onSendCode() {
    if (this.form.invalid || this.loading) {
      if (this.form.invalid) {
        this.triggerShakeError();
      }
      return;
    }
    
    this.bannerKind = null;
    this.bannerText = '';
    this.buttonState = 'pressed';
    this.loading = true;
    this.form.disable();

    const email = this.form.value.email!;
    
    // Aquí iría la llamada al backend para enviar el código
    // Por ahora simulamos el envío y navegamos al siguiente paso
    setTimeout(() => {
      this.loading = false;
      this.form.enable();
      this.buttonState = 'normal';
      
      // Navegar a la página de verificación del código
      this.router.navigate(['/reset-password-code'], { queryParams: { email } });
    }, 1500);
  }

  /* Navega de vuelta al login */
  goBackToLogin() {
    this.router.navigate(['/login']);
  }

  /**
   * Dispara la animación de shake para errores
   */
  triggerShakeError(): void {
    this.shakeForm = !this.shakeForm;
  }

  /**
   * Maneja el estado de focus del input de email
   */
  onEmailFocus(focused: boolean): void {
    this.emailFocused = focused;
  }

  /**
   * Estado de animación para el input de email
   */
  getEmailFocusState(): string {
    return this.emailFocused ? 'focused' : 'normal';
  }
}