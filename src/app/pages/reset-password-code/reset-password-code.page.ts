import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { CodeInputBase } from '../../core/base/code-input.base';
import { FormBaseService, FormState } from '../../core/services/form-base.service';
import { Observable, Subscription } from 'rxjs';
import { buttonHover, buttonPress, fadeIn, inputFocus, shakeError } from '../../core/animations/animations';

/*
 * ID único para el formulario
 */
const FORM_ID = 'reset-password-code';

@Component({
  selector: 'app-reset-password-code',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './reset-password-code.page.html',
  styleUrls: ['./reset-password-code.page.scss'],
  animations: [buttonHover, buttonPress, fadeIn, inputFocus, shakeError]
})
export class ResetPasswordCodePage extends CodeInputBase implements OnInit, OnDestroy {
  // Estado del formulario gestionado por FormBaseService
  formState: FormState | null = null;
  formState$: Observable<FormState> | null = null;

  token = '';
  // Reenvío de código
  resendDisabled = false;
  resendCountdown = 0;
  private resendTimer: any;
  // Estados separados para cada operación
  successMessage = '';
  hasError = false;

  private formStateSubscription?: Subscription;

  // Propiedades calculadas para compatibilidad con template
  get loading(): boolean {
    return this.formState?.isSubmitting || false;
  }

  get errorMessage(): string {
    return this.formState?.error || '';
  }

  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private formBaseService: FormBaseService
  ) {
    super();

    // Estado del formulario gestionado por FormBaseService
    // Nota: formState$ se asignará en ngOnInit después de crear el estado
  }

  ngOnInit() {
    // Crear estado del formulario
    this.formBaseService.createFormState(FORM_ID, {});

    // Asignar el observable del estado después de crearlo
    this.formState$ = this.formBaseService.getFormState(FORM_ID);

    // Suscribirse al estado del formulario
    this.formStateSubscription = this.formState$?.subscribe(state => {
      this.formState = state;
    });

    // Verificar si hay token en los query params
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      if (!this.token) {
        // Si no hay token, redirigir al login
        this.router.navigate(['/login']);
      }
      
      // No validar existencia de sesión para tokens dummy
    });
  }

  ngOnDestroy() {
    if (this.formStateSubscription) {
      this.formStateSubscription.unsubscribe();
    }
    this.formBaseService.destroyFormState(FORM_ID);

    // Limpiar timer al destruir el componente
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
    }
  }

  /**
   * Verifica el código de verificación introducido por el usuario
   */
  onSubmit() {
    if (!this.canVerify) {
      this.triggerShakeError();
      return;
    }
    
    this.formBaseService.updateFormState(FORM_ID, { isSubmitting: true, error: null, fieldErrors: {} });
    this.successMessage = '';
    this.hasError = false;
    this.buttonState = 'pressed';

    // Si es un dummy token, simular error inmediatamente sin llamar al backend
    if (this.isDummyToken(this.token)) {
      this.formBaseService.updateFormState(FORM_ID, { 
        isSubmitting: false, 
        error: 'Código incorrecto.' 
      });
      this.hasError = true;
      this.buttonState = 'normal';
      this.triggerShakeError();
      // Limpiar inputs en caso de error
      this.clearCodeInputs();
      return;
    }

    this.api.verifyResetToken(this.token, this.code).subscribe({
      next: (response) => {
        // Navegar al tercer paso con el token
        this.router.navigate(['/new-password'], {
          queryParams: { token: this.token }
        });
      },
      error: (error: any) => {
        this.formBaseService.handleBackendError(FORM_ID, null as any, error);
        this.hasError = true;
        this.buttonState = 'normal';
        this.triggerShakeError();
        // Limpiar inputs en caso de error
        this.clearCodeInputs();
      },
      complete: () => {
        this.formBaseService.updateFormState(FORM_ID, { isSubmitting: false });
        this.buttonState = 'normal';
      }
    });
  }

  /**
   * Reenvía el código de verificación usando el token actual
   */
  resendCode() {
    if (this.resendDisabled || this.loading) {
      return;
    }

    this.formBaseService.updateFormState(FORM_ID, { isSubmitting: true, error: null, fieldErrors: {} });
    this.successMessage = '';
    this.hasError = false;

    // Si es un dummy token (generado para emails no registrados), simular éxito sin llamar al backend
    if (this.isDummyToken(this.token)) {
      this.successMessage = 'Código reenviado correctamente';
      this.hasError = false;
      // Limpiar inputs después de reenviar
      this.clearCodeInputs();
      
      // Iniciar countdown de 60 segundos
      this.startResendCountdown();
      this.formBaseService.updateFormState(FORM_ID, { isSubmitting: false });
      return;
    }

    this.api.resendResetCode(this.token).subscribe({
      next: (response) => {
        this.successMessage = response.message || 'Código reenviado correctamente';
        this.hasError = false;
        // Limpiar inputs después de reenviar
        this.clearCodeInputs();
        
        // Iniciar countdown de 60 segundos
        this.startResendCountdown();
      },
      error: (error: any) => {
        this.formBaseService.handleBackendError(FORM_ID, null as any, error);
        this.hasError = true;
      },
      complete: () => {
        this.formBaseService.updateFormState(FORM_ID, { isSubmitting: false });
      }
    });
  }

  /**
   * Inicia el countdown para deshabilitar el botón de reenvío
   */
  private startResendCountdown() {
    this.resendDisabled = true;
    this.resendCountdown = 60;
    
    this.resendTimer = setInterval(() => {
      this.resendCountdown--;
      if (this.resendCountdown <= 0) {
        this.resendDisabled = false;
        clearInterval(this.resendTimer);
        this.resendTimer = null;
      }
    }, 1000);
  }

  /**
   * Vuelve al paso anterior
   */
  goBack() {
    this.router.navigate(['/forgot-password']);
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
   * Verifica si el token es un dummy token generado para emails no registrados
   */
  private isDummyToken(token: string): boolean {
    // Los dummy tokens tienen el formato exacto: 32chars-50chars
    const parts = token.split('-');
    return parts.length === 2 && parts[0].length === 32 && parts[1].length === 50;
  }
}