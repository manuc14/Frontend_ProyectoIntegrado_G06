/**
 * Página para establecer nueva contraseña durante el proceso de recuperación.
 * Tercer y último paso del flujo de restablecimiento de contraseña.
 */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../core/services/api.service';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { FooterComponent } from '../../../../shared/footer/footer.component';
import { PasswordValidators } from '../../../../core/validators/form.validators';
import { FormBaseService, FormState } from '../../../../core/services/form-base.service';
import { Observable } from 'rxjs';
import { FormPasswordComponent } from '../../../../shared/form-components/form-password/form-password.component';
import { FormSubmitComponent } from '../../../../shared/form-components/form-submit/form-submit.component';
import { buttonHover, buttonPress, fadeIn, inputFocus, shakeError } from '../../../../core/animations/animations';

/*
 * ID único para el formulario
 */
const FORM_ID = 'new-password';

@Component({
  selector: 'app-new-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent, FooterComponent, FormPasswordComponent, FormSubmitComponent],
  templateUrl: './new-password.page.html',
  styleUrls: ['./new-password.page.scss'],
  animations: [buttonHover, buttonPress, fadeIn, inputFocus, shakeError]
})
export class NewPasswordPage implements OnInit, OnDestroy {
  formState$: Observable<FormState> | null = null;
  passwordForm: FormGroup;
  token = '';
  shakeForm = false;
  buttonState = 'normal';
  focusedFields: {[key: string]: boolean} = {};
  showPasswordTooltip = false;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private formBaseService: FormBaseService
  ) {
    this.passwordForm = this.formBaseService.createFormGroup({
      password: '',
      confirmPassword: ''
    }, [PasswordValidators.passwordsMatch]);
  }

  ngOnInit() {
    this.formBaseService.createFormState(FORM_ID, { password: '', confirmPassword: '' });
    this.formState$ = this.formBaseService.getFormState(FORM_ID);

    // Obtener token de los query params
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      
      if (!this.token) {
        this.router.navigate(['/forgot-password']);
        return;
      }
      
      // Validar que el token sea válido y el código haya sido verificado
      this.api.validateResetToken(this.token).subscribe({
        next: (response) => {
          if (!response.exists) {
            this.router.navigate(['/forgot-password']);
          } else if (!response.verified) {
            this.router.navigate(['/reset-password-code'], { queryParams: { token: this.token } });
          }
        },
        error: () => {
          this.router.navigate(['/forgot-password']);
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.formBaseService.destroyFormState(FORM_ID);
  }

  /* Establece la nueva contraseña */
  submit() {
    this.passwordForm.markAllAsTouched();
    if (this.passwordForm.invalid) {
      this.triggerShakeError();
      return;
    }

    this.buttonState = 'pressed';
    const { password, confirmPassword } = this.passwordForm.value;

    this.formBaseService.updateFormState(FORM_ID, { error: null, fieldErrors: {}, isSubmitting: true });
    this.passwordForm.disable();

    this.api.resetPasswordWithToken(this.token, password, confirmPassword).subscribe({
      next: () => {
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (error: any) => {
        this.formBaseService.handleBackendError(FORM_ID, this.passwordForm, error);
        this.triggerShakeError();
      },
      complete: () => {
        this.formBaseService.updateFormState(FORM_ID, { isSubmitting: false });
        this.passwordForm.enable();
        this.buttonState = 'normal';
      }
    });
  }

  goBack() {
    this.router.navigate(['/reset-password-code'], { queryParams: { token: this.token } });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  triggerShakeError(): void {
    this.shakeForm = !this.shakeForm;
  }

  onFieldFocus(field: string, focused: boolean): void {
    this.focusedFields[field] = focused;
  }

  togglePasswordTooltip(): void {
    this.showPasswordTooltip = !this.showPasswordTooltip;
  }

  getConfirmPasswordErrors() {
    const errors = { ...this.passwordForm.get('confirmPassword')?.errors };
    if (this.passwordForm.errors?.['passwordsMismatch']) {
      errors['mismatch'] = true;
    }
    return errors;
  }
}
