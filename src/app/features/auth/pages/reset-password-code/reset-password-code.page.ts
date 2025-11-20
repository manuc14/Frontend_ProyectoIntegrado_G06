import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../core/services/api.service';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { FooterComponent } from '../../../../shared/footer/footer.component';
import { CodeInputBase } from '../../../../core/base/code-input.base';
import { FormBaseService, FormState } from '../../../../core/services/form-base.service';
import { Observable, Subscription } from 'rxjs';
import { buttonHover, buttonPress, fadeIn, inputFocus, shakeError } from '../../../../core/animations/animations';

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
  formState$: Observable<FormState> | null = null;
  token = '';
  resendDisabled = false;
  resendCountdown = 0;
  private resendTimer: any;
  successMessage = '';
  hasError = false;
  isVerifying = false;
  isResending = false;
  private formStateSubscription?: Subscription;

  get loading(): boolean {
    return this.isVerifying || this.isResending;
  }

  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private formBaseService: FormBaseService
  ) {
    super();
  }

  ngOnInit() {
    // Crear estado del formulario
    this.formBaseService.createFormState(FORM_ID, {});
    this.formState$ = this.formBaseService.getFormState(FORM_ID);

    // Verificar si hay token en los query params
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      if (!this.token) {
        this.router.navigate(['/login']);
      }
    });
  }

  ngOnDestroy() {
    this.formBaseService.destroyFormState(FORM_ID);
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
    }
  }

  /* Verifica el código de verificación introducido por el usuario */
  onSubmit() {
    if (!this.canVerify) {
      this.triggerShakeError();
      return;
    }
    
    this.isVerifying = true;
    this.formBaseService.updateFormState(FORM_ID, { isSubmitting: true, error: null, fieldErrors: {} });
    this.successMessage = '';
    this.hasError = false;
    this.buttonState = 'pressed';

    this.api.verifyResetToken(this.token, this.code).subscribe({
      next: () => {
        this.router.navigate(['/new-password'], { queryParams: { token: this.token } });
      },
      error: (error: any) => {
        this.formBaseService.handleBackendError(FORM_ID, null, error);
        this.handleVerificationError(null);
      },
      complete: () => {
        this.formBaseService.updateFormState(FORM_ID, { isSubmitting: false });
        this.buttonState = 'normal';
        this.isVerifying = false;
      }
    });
  }

  private handleVerificationError(message: string | null) {
    if (message) {
      this.formBaseService.updateFormState(FORM_ID, { isSubmitting: false, error: message });
    }
    this.hasError = true;
    this.buttonState = 'normal';
    this.isVerifying = false;
    this.triggerShakeError();
    this.clearCodeInputs();
  }

  /* Reenvía el código de verificación usando el token actual */
  resendCode() {
    if (this.resendDisabled || this.loading) return;

    this.isResending = true;
    this.formBaseService.updateFormState(FORM_ID, { isSubmitting: true, error: null, fieldErrors: {} });
    this.successMessage = '';
    this.hasError = false;

    this.api.resendResetCode(this.token).subscribe({
      next: (response) => {
        this.handleResendSuccess(response.message || 'Código reenviado correctamente');
      },
      error: (error: any) => {
        this.formBaseService.handleBackendError(FORM_ID, null, error);
        this.hasError = true;
        this.isResending = false;
      },
      complete: () => {
        this.formBaseService.updateFormState(FORM_ID, { isSubmitting: false });
        this.isResending = false;
      }
    });
  }

  private handleResendSuccess(message: string) {
    this.successMessage = message;
    this.hasError = false;
    this.clearCodeInputs();
    this.startResendCountdown();
    this.formBaseService.updateFormState(FORM_ID, { isSubmitting: false });
    this.isResending = false;
  }

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

  goBack() {
    this.router.navigate(['/forgot-password']);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  triggerShakeError(): void {
    this.shakeForm = !this.shakeForm;
  }
}
