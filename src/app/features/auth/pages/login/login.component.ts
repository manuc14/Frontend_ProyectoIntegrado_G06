import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { FooterComponent } from '../../../../shared/footer/footer.component';
import { ApiService, LoginRequest, LoginResponse } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
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
  private authService = inject(AuthService);
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

    // **NUEVO: Verificar si requiere 2FA (Two Factor Authentication)**
    if (body.requiresTwoFactor && body.twoFactorSessionToken) {
      console.log('🔐 [LoginComponent] Requiere verificación de 2FA (nuevo flujo unificado)');
      console.log('   - twoFactorType:', body.twoFactorType);
      
      // Guardar datos temporales en sessionStorage para 2fa-container
      sessionStorage.setItem('twoFactorSessionToken', body.twoFactorSessionToken);
      sessionStorage.setItem('loginEmail', body.user?.email || this.form.get('email')?.value);
      sessionStorage.setItem('twoFactorType', body.twoFactorType || 'VERIFY');
      
      // Si es SETUP, guardar también los datos de setup (QR, secret, códigos respaldo)
      if (body.twoFactorType === 'SETUP' && body.setupData) {
        sessionStorage.setItem('twoFASetupData', JSON.stringify(body.setupData));
        console.log('   - Datos de setup guardados');
      }
      
      // Redirigir a contenedor inteligente de 2FA que detecta setup vs verify
      this.router.navigate(['/auth/2fa']);
      return;
    }

    // **FLUJO NORMAL: Login completo sin OTP (caso legacy o usuarios sin 2FA)**
    // LIMPIAR ESTADO ANTERIOR ANTES DE GUARDAR NUEVOS TOKENS
    console.log('🧹 [LoginComponent] Limpiando estado anterior...');
    this.authService.logout(false, true); // Limpiar estado sin redirigir ni invalidar backend

    // Guardar Access Token usando el método del AuthService (inicia timer de expiración)
    if (body.token) {
      this.authService.setAccessToken(body.token);
      console.log('✅ [LoginComponent] Access Token guardado');
    }

    // Guardar Refresh Token usando el método del AuthService
    if (body.refreshToken) {
      this.authService.setRefreshTokenPublic(body.refreshToken);
      console.log('✅ [LoginComponent] Refresh Token guardado');
    }

    // Guardar usuario en sessionStorage
    if (body.user) {
      sessionStorage.setItem('currentUser', JSON.stringify(body.user));
      console.log('✅ [LoginComponent] Usuario guardado:', body.user);
    }

    // GUARDAR CONFIGURACIÓN DE TIMEOUTS DEL BACKEND
    if (body.idleTimeoutMillis && body.absoluteTimeoutMillis) {
      this.authService.saveSessionConfig(body.idleTimeoutMillis, body.absoluteTimeoutMillis);
      console.log('✅ [LoginComponent] Configuración de timeouts guardada:', {
        idle: body.idleTimeoutMillis / 1000 + 's',
        absolute: body.absoluteTimeoutMillis / 3600000 + 'h'
      });
    } else {
      console.warn('⚠️ [LoginComponent] Backend no retornó configuración de timeouts, usando valores por defecto');
    }

    // INICIAR TEMPORIZADORES DE SESIÓN
    console.log('🚀 [LoginComponent] Iniciando temporizadores de sesión...');
    this.authService.startSessionTimers();

    // Determinar ruta de redirección según tipo de usuario
    const tipo = body.user?.tipo || '';
    let target = '/catalog';
    if (/admin/i.test(tipo)) {
      target = '/ad-users';
    } else if (/creador/i.test(tipo)) {
      target = '/content-creator';
    }

    console.log(`🔄 [LoginComponent] Redirigiendo a: ${target}`);

    // Redirigir después de un breve delay
    setTimeout(() => this.router.navigate([target]), 1000);
  }

  /* Maneja errores del login usando el servicio genérico. */
  private handleErrorResponse(err: any): void {
    // Detectar si es error por sesión de 2FA expirada
    const errorMessage = err?.error?.message || err?.message || '';
    const isTwoFactorSessionExpired =
      errorMessage.includes('Esta sesión ha expirado') ||
      errorMessage.includes('sesión de login no encontrada') ||
      errorMessage.includes('sessionToken') ||
      (err?.status === 401 && errorMessage.toLowerCase().includes('expirado'));

    if (isTwoFactorSessionExpired) {
      console.log('⏰ [LoginComponent] Sesión de 2FA expirada detectada - mostrando modal');

      // Limpiar cualquier estado de 2FA temporal que pueda estar interfiriendo
      sessionStorage.removeItem('twoFactorSessionToken');
      sessionStorage.removeItem('twoFactorType');
      sessionStorage.removeItem('loginEmail');
      sessionStorage.removeItem('twoFASetupData');

      // Mostrar modal de sesión expirada
      this.authService.emitSessionExpired(
        'session-timeout',
        'Tu sesión de verificación ha expirado. Por favor, inicia sesión nuevamente.'
      );
      return;
    }

    // Error normal - usar manejo genérico
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
