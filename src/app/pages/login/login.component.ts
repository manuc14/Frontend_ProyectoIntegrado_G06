import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { ApiService, LoginRequest, LoginResponse } from '../../core/services/api.service';
import { finalize } from 'rxjs/operators';
import { buttonHover, buttonPress, fadeIn, inputFocus, shakeError } from '../../core/animations/animations';

interface LoginForm {
  email: FormControl<string>;
  password: FormControl<string>;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, HeaderComponent, FooterComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  animations: [buttonHover, buttonPress, fadeIn, inputFocus, shakeError]
})
export class LoginComponent {
  /* LoginComponent: formulario de acceso que autentica contra el backend y redirige según tipo de usuario. */
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private router = inject(Router);

  form: FormGroup<LoginForm> = this.fb.nonNullable.group({
    email: this.fb.nonNullable.control('', { validators: [Validators.required, Validators.email] }),
    password: this.fb.nonNullable.control('', { validators: [Validators.required] }),
  });

  loading = false;
  bannerKind: 'success' | 'error' | null = null;
  bannerText = '';
  shakeForm = false;
  buttonState = 'normal';
  emailFocused = false;
  passwordFocused = false;

  get f() { return this.form.controls; }

  /* Envía credenciales y procesa la respuesta del backend. */
  submit() {
    if (this.form.invalid || this.loading) {
      if (this.form.invalid) {
        this.triggerShakeError();
      }
      return;
    }
    
    this.bannerKind = null; 
    this.bannerText = '';
    this.buttonState = 'pressed';
    
    const raw = this.form.getRawValue();
    const payload: LoginRequest = { email: raw.email, password: raw.password };
    this.loading = true; 
    this.form.disable();
    
    this.api.login(payload)
      .pipe(finalize(() => { 
        this.loading = false; 
        this.form.enable(); 
        this.buttonState = 'normal';
      }))
      .subscribe({
        next: (res: LoginResponse) => {
          // El backend devuelve 200 OK cuando el login es exitoso
          // Verificar si hay errores de validación
          if (res?.validationErrorCount > 0) {
            this.bannerKind = 'error';
            this.bannerText = res?.message || 'Error de validación en los datos';
            this.triggerShakeError();
            return;
          }
          
          // Verificar activación de cuenta
          if (!res.user?.activo) {
            this.bannerKind = 'error';
            this.bannerText = 'Tu cuenta no está activada. Revisa tu correo para activarla.';
            this.triggerShakeError();
            return;
          }

          // Login exitoso - mostrar mensaje de éxito brevemente
          this.bannerKind = 'success';
          this.bannerText = res.message || 'Login exitoso';

          // Guardar token en sessionStorage para mantener la sesión
          if (res.token) {
            sessionStorage.setItem('authToken', res.token);
          }

          const tipo = res.user?.tipo || '';
          // Mapeo de tipos del backend a rutas de la app
          let target: string = '/catalog';
          if (/admin/i.test(tipo)) target = '/ad-users';
          else if (/creador/i.test(tipo)) target = '/content';

          // Redirigir después de un breve delay para mostrar el mensaje de éxito
          setTimeout(() => {
            this.router.navigate([target]);
          }, 1000);
        },
        error: (err) => {
          console.error('Login error', err);
          this.bannerKind = 'error';
          // Extraer solo el mensaje sin el prefijo "Error: "
          this.bannerText = err?.message || 'No se pudo completar el inicio de sesión';
          this.triggerShakeError();
        }
      });
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
  onEmailFocus(focused: boolean): void {
    this.emailFocused = focused;
  }

  onPasswordFocus(focused: boolean): void {
    this.passwordFocused = focused;
  }

  /**
   * Estado de animación para inputs
   */
  getInputFocusState(field: 'email' | 'password'): string {
    let state: string;
    if (field === 'email') {
      state = this.emailFocused ? 'focused' : 'normal';
    } else {
      state = this.passwordFocused ? 'focused' : 'normal';
    }
    return state;
  }
}
