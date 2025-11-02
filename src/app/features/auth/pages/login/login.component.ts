import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { FooterComponent } from '../../../../shared/footer/footer.component';
import { ApiService, LoginRequest, LoginResponse } from '../../../../core/services/api.service';
import { FormBaseService, FormState } from '../../../../core/services/form-base.service';
import { HttpResponse, HttpEvent } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { Observable, Subscription } from 'rxjs';
import { buttonHover, buttonPress, fadeIn, inputFocus, shakeError } from '../../../../core/animations/animations';
import { FormSubmitComponent } from '../../../../shared/form-components/form-submit/form-submit.component';

interface LoginForm {
  email: FormControl<string>;
  password: FormControl<string>;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, HeaderComponent, FooterComponent, FormSubmitComponent],
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
    return this.formState?.error ?? '';
  }

  constructor() {
    // Crear formulario usando FormBaseService
    this.form = this.formBaseService.createFormGroup({
      email: '',
      password: ''
    });

    // Quitar validaciones adicionales, dejar solo required
    this.form.get('email')!.clearValidators();
    this.form.get('email')!.setValidators([Validators.required]);
    this.form.get('password')!.clearValidators();
    this.form.get('password')!.setValidators([Validators.required]);
    this.form.updateValueAndValidity();

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
        this.form.markAllAsTouched();
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

    this.api.login(payload, { observe: 'response' })
      .pipe(finalize(() => {
        this.formBaseService.updateFormState('login', { isSubmitting: false });
        this.form.enable();
        this.buttonState = 'normal';
      }))
      .subscribe({
        next: (res: HttpEvent<LoginResponse>) => {
          this.handleSuccessResponse(res as HttpResponse<LoginResponse>);
        },
        error: (err) => {
          this.handleErrorResponse(err);
        }
      });
  }

  /* Maneja la respuesta exitosa del login con lógica específica de navegación. */
  private handleSuccessResponse(res: HttpResponse<LoginResponse>): void {
    const body = res.body;
    if (!body || body?.validationErrorCount > 0) {
      this.formBaseService.updateFormState('login', {
        error: body?.message ?? 'Respuesta inválida del servidor',
      });
      this.triggerShakeError();
      return;
    }

    // Login exitoso - limpiar errores
    this.formBaseService.resetFormState('login');

    // Guardar token y usuario en sessionStorage
    if (body.token) sessionStorage.setItem('authToken', body.token);
    if (body.user) sessionStorage.setItem('currentUser', JSON.stringify(body.user));

    const tipo = body.user?.tipo || '';
    let target = '/catalog';
    if (/admin/i.test(tipo)) {
      target = '/ad-users';
    } else if (/creador/i.test(tipo)) {
      target = '/content-creator';
    }

    // Redirigir después de un breve delay
    setTimeout(() => this.router.navigate([target]), 1000);
  }

  /* Maneja errores del login usando el servicio genérico. */
  private handleErrorResponse(err: any): void {
    this.formBaseService.handleBackendError('login', this.form, err);
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
    const isFocused = field === 'email' ? this.emailFocused : this.passwordFocused;
    return isFocused ? 'focused' : 'normal';
  }
}
