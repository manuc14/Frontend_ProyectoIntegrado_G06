import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { ApiService, LoginRequest, LoginResponse } from '../../core/services/api.service';
import { FormBaseService, FormState } from '../../core/services/form-base.service';
import { finalize } from 'rxjs/operators';
import { Observable, Subscription } from 'rxjs';
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
export class LoginComponent implements OnInit, OnDestroy {
  /* LoginComponent: formulario de acceso que autentica contra el backend y redirige según tipo de usuario. */
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private router = inject(Router);
  private formBaseService = inject(FormBaseService);

  // Estado del formulario gestionado por FormBaseService
  formState: FormState | null = null;
  formState$: Observable<FormState> | null = null;

  form: FormGroup;

  shakeForm = false;
  buttonState = 'normal';
  emailFocused = false;
  passwordFocused = false;

  private formStateSubscription?: Subscription;

  // Propiedades calculadas para compatibilidad con template
  get loading(): boolean {
    return this.formState?.isSubmitting || false;
  }

  get bannerKind(): 'success' | 'error' | null {
    return this.formState?.error ? 'error' : null;
  }

  get bannerText(): string {
    return this.formState?.error || '';
  }

  constructor() {
    // Crear formulario usando FormBaseService
    this.form = this.formBaseService.createFormGroup({
      email: '',
      password: ''
    });

    // Estado del formulario gestionado por FormBaseService
    // Nota: formState$ se asignará en ngOnInit después de crear el estado
  }

  ngOnInit() {
    // Crear estado del formulario
    this.formBaseService.createFormState('login', {
      email: '',
      password: ''
    });

    // Asignar el observable del estado después de crearlo
    this.formState$ = this.formBaseService.getFormState('login');

    // Suscribirse al estado del formulario
    this.formStateSubscription = this.formState$?.subscribe(state => {
      this.formState = state;
    });
  }

  ngOnDestroy(): void {
    if (this.formStateSubscription) {
      this.formStateSubscription.unsubscribe();
    }
    this.formBaseService.destroyFormState('login');
  }

  get f() { return this.form.controls; }

  /* Envía credenciales y procesa la respuesta del backend. */
  submit() {
    if (this.form.invalid || this.loading) {
      if (this.form.invalid) {
        this.triggerShakeError();
      }
      return;
    }

    this.buttonState = 'pressed';

    const raw = this.form.getRawValue();
    const payload: LoginRequest = { email: raw.email, password: raw.password };

    // Limpiar errores previos y marcar como submitting
    this.formBaseService.updateFormState('login', {
      error: null,
      fieldErrors: {},
      isSubmitting: true
    });
    this.form.disable();

    this.api.login(payload)
      .pipe(finalize(() => {
        this.formBaseService.updateFormState('login', { isSubmitting: false });
        this.form.enable();
        this.buttonState = 'normal';
      }))
      .subscribe({
        next: (res: LoginResponse) => {
          this.handleSuccessResponse(res);
        },
        error: (err) => {
          this.handleErrorResponse(err);
        }
      });
  }

  /* Maneja la respuesta exitosa del login con lógica específica de navegación. */
  private handleSuccessResponse(res: LoginResponse): void {
    // El backend devuelve 200 OK cuando el login es exitoso
    // Verificar si hay errores de validación
    if (res?.validationErrorCount > 0) {
      this.formBaseService.updateFormState('login', {
        error: res?.message || 'Error de validación en los datos'
      });
      this.triggerShakeError();
      return;
    }

    // Verificar activación de cuenta
    if (!res.user?.activo) {
      this.formBaseService.updateFormState('login', {
        error: 'Tu cuenta no está activada. Revisa tu correo para activarla.'
      });
      this.triggerShakeError();
      return;
    }

    // Login exitoso - limpiar errores y mostrar mensaje de éxito
    this.formBaseService.resetFormState('login');

    // Guardar token en sessionStorage para mantener la sesión
    if (res.token) {
      sessionStorage.setItem('authToken', res.token);
    }

    // Guardar información del usuario en sessionStorage
    if (res.user) {
      sessionStorage.setItem('currentUser', JSON.stringify(res.user));
    }

    const tipo = res.user?.tipo || '';
    // Mapeo de tipos del backend a rutas de la app
    let target: string = '/catalog';
    if (/admin/i.test(tipo)) target = '/ad-users';
    else if (/creador/i.test(tipo)) target = '/content-creator';

    // Redirigir después de un breve delay para mostrar el mensaje de éxito
    setTimeout(() => {
      this.router.navigate([target]);
    }, 1000);
  }

  /* Maneja errores del login usando el servicio genérico. */
  private handleErrorResponse(err: any): void {
    console.error('Login error', err);
    this.formBaseService.updateFormState('login', {
      error: err?.message || 'No se pudo completar el inicio de sesión'
    });
    this.triggerShakeError();
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
