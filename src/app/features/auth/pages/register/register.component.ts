import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { FooterComponent } from '../../../../shared/footer/footer.component';
import { FormInputComponent } from '../../../../shared/form-components/form-input/form-input.component';
import { FormPasswordComponent } from '../../../../shared/form-components/form-password/form-password.component';
import { FormDateComponent } from '../../../../shared/form-components/form-date/form-date.component';
import { FormToggleComponent } from '../../../../shared/form-components/form-toggle/form-toggle.component';
import { FormSubmitComponent } from '../../../../shared/form-components/form-submit/form-submit.component';
import { ApiService } from '../../../../core/services/api.service';
import { ImageSelectorService } from '../../../../core/services/image-selector.service';
import { FormBaseService, FormState } from '../../../../core/services/form-base.service';
import { VipPromoModalComponent } from '../../../../shared/vip-promo-modal/vip-promo-modal.component';
import { HttpResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { Subscription, Observable } from 'rxjs';
import { matchPasswordsValidator, MIN_BIRTH_YEAR } from '../../../../core/validators/form.validators';
import { FORM_LIMITS } from '../../../../core/constants/form-limits';
import { buttonHover, buttonPress, fadeIn, inputFocus, shakeError } from '../../../../core/animations/animations';
import { allConditionsTrue, isEmpty } from '../../../../core/utils/validation.helpers';

interface RegisterForm {
  nombre: FormControl<string>;
  apellidos: FormControl<string>;
  email: FormControl<string>;
  alias: FormControl<string>;
  fechaNacimiento: FormControl<string>;
  password: FormControl<string>;
  repeatPassword: FormControl<string>;
  vip: FormControl<boolean>;
  fotoElegida: FormControl<string | null>;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent, FooterComponent, VipPromoModalComponent, FormInputComponent, FormPasswordComponent, FormDateComponent, FormToggleComponent, FormSubmitComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  animations: [buttonHover, buttonPress, fadeIn, inputFocus, shakeError]
})
export class RegisterComponent implements OnInit, OnDestroy {
  readonly maxAlias = FORM_LIMITS.aliasMax;
  readonly maxNombre = FORM_LIMITS.nombreMax;
  readonly maxApellidos = FORM_LIMITS.apellidosMax;
  readonly maxEmail = FORM_LIMITS.emailMax;
  readonly MIN_BIRTH_YEAR = MIN_BIRTH_YEAR;

  formState: FormState | null = null;
  formState$: Observable<FormState> | null = null;

  get avatars(): string[] { return this.formState?.imageState.images ?? []; }
  get defaultAvatar(): string { return this.formState?.imageState.defaultImage ?? ''; }
  get selectedAvatar(): string { return this.formState?.imageState.selectedImage ?? ''; }
  get loadingAvatars(): boolean { return this.formState?.imageState.loading ?? false; }
  get avatarLoadError(): boolean { return this.formState?.imageState.error ?? false; }
  get loading(): boolean { return this.formState?.isSubmitting ?? false; }
  get bannerKind(): 'success' | 'error' | null { return this.formState?.error ? 'error' : null; }
  get bannerText(): string { return this.formState?.error ?? ''; }

  form: FormGroup;

  get f() { return this.form.controls; }
  get nombreControl() { return this.f['nombre'] as FormControl; }
  get apellidosControl() { return this.f['apellidos'] as FormControl; }
  get emailControl() { return this.f['email'] as FormControl; }
  get aliasControl() { return this.f['alias'] as FormControl; }
  get fechaNacimientoControl() { return this.f['fechaNacimiento'] as FormControl; }
  get passwordControl() { return this.f['password'] as FormControl; }
  get repeatPasswordControl() { return this.f['repeatPassword'] as FormControl; }
  get vipControl() { return this.f['vip'] as FormControl; }

  get repeatPasswordErrors() {
    return { ...this.f['repeatPassword'].errors, ...(this.form.errors?.['mismatch'] && { mismatch: true }) };
  }

  // VIP promo modal estado
  showVipPromo = false;
  promptedVipOnce = false;
  shakeForm = false;
  buttonState = 'normal';
  focusedFields: {[key: string]: boolean} = {};
  showPasswordTooltip = false;
  showPassword = false;
  showRepeatPassword = false;

  private formStateSubscription?: Subscription;

  constructor(private fb: FormBuilder, private api: ApiService, private router: Router, private imageSelectorService: ImageSelectorService, public formBaseService: FormBaseService) {
    this.form = this.formBaseService.createFormGroup({
      nombre: '', apellidos: '', email: '', alias: '', fechaNacimiento: '', password: '', repeatPassword: '', vip: false, fotoElegida: null
    }, [matchPasswordsValidator('password', 'repeatPassword')], 'register');
  }

  ngOnInit() {
    this.formBaseService.createFormState('register', {
      nombre: '', apellidos: '', email: '', alias: '', fechaNacimiento: '', password: '', repeatPassword: '', vip: false, fotoElegida: null
    });
    this.formState$ = this.formBaseService.getFormState('register');

    // Suscribirse al estado del formulario
    this.formStateSubscription = this.formState$?.subscribe((state: FormState) => {
      this.formState = state;
      this.form.patchValue({ fotoElegida: state.imageState.selectedImage || null });
    });
    this.formBaseService.loadImages('avatar');
  }

  ngOnDestroy(): void {
    if (this.formStateSubscription) this.formStateSubscription.unsubscribe();
    this.formBaseService.destroyFormState('register');
  }

  /* Marca un avatar como seleccionado y actualiza el formulario. */
  selectAvatar(avatarPath: string) {
    this.formBaseService.selectImage(avatarPath, 'avatar');
  }

  /* Determina si se debe mostrar la promoción VIP basada en la selección del usuario. */
  private shouldShowVipPromo(vip: unknown): boolean {
    return !vip && !this.promptedVipOnce;
  }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.triggerShakeError();
      return;
    }

    this.buttonState = 'pressed';
    const v = this.form.value;
    if (this.shouldShowVipPromo(v.vip)) {
      this.showVipPromo = true;
      this.buttonState = 'normal';
    } else {
      this.doRegister();
    }
  }

  continueAsStandard() {
    this.promptedVipOnce = true;
    this.showVipPromo = false;
    this.doRegister();
  }

  upgradeToVip() {
    this.form.patchValue({ vip: true });
    this.promptedVipOnce = true;
    this.showVipPromo = false;
    this.doRegister();
  }

  private buildPayload(v: any): any {
    const isVip = Boolean(v.vip);
    const alias = v.alias?.trim() || v.nombre?.trim() || '';
    const fotoNombre = this.formBaseService.extractImageFileName(v.fotoElegida);

    return {
      nombre: v.nombre!,
      apellidos: v.apellidos!,
      email: v.email!,
      alias,
      fechaNacimiento: v.fechaNacimiento!,
      password: v.password!,
      repetirPassword: v.repeatPassword!,
      esVip: isVip,
      activo: false,
      ...(fotoNombre && fotoNombre !== 'default-avatar.png' && { foto: fotoNombre })
    };
  }

  /* Maneja la respuesta exitosa del registro (201/200). */
  private handleSuccessResponse(res: HttpResponse<unknown>): void {
    const body: unknown = res.body || {};
    const verificationToken = (body as any)?.verificationToken;

    // Early return si el status no es exitoso (201 para creado, 200 para OK)
    if (res.status !== 201 && res.status !== 200) {
      this.formBaseService.updateFormState('register', { error: 'No se pudo crear la cuenta.' });
      return;
    }

    // Early return si no hay verification token
    if (isEmpty(verificationToken)) {
      console.error('No se recibió verificationToken del backend');
      this.formBaseService.updateFormState('register', { error: 'Error en el proceso de registro. Intenta nuevamente.' });
      return;
    }

    // Registro exitoso
    console.log('Registro OK', body);
    this.formBaseService.resetFormState('register');
    
    // Guardar email en sessionStorage para mostrar en verify-email
    const emailValue = this.form.get('email')?.value;
    if (emailValue) {
      sessionStorage.setItem('pendingVerificationEmail', emailValue);
    }
    
    this.router.navigate(['/verify-email'], { queryParams: { token: verificationToken } });
  }

  /* Maneja la respuesta de error del registro usando el servicio genérico. */
  private handleErrorResponse(err: unknown): void {
    this.formBaseService.handleBackendError('register', this.form, err);
    this.triggerShakeError();
  }

  private doRegister() {
    const v = this.form.value;
    const payload = this.buildPayload(v);

    this.formBaseService.updateFormState('register', { error: null, fieldErrors: {}, isSubmitting: true });
    this.form.disable();

    this.api.registerUser(payload)
      .pipe(finalize(() => {
        this.formBaseService.updateFormState('register', { isSubmitting: false });
        this.form.enable();
        this.buttonState = 'normal';
      }))
      .subscribe({
        next: (res: HttpResponse<unknown>) => {
          this.handleSuccessResponse(res);
        },
        error: (err: unknown) => {
          this.handleErrorResponse(err);
        },
      });
  }

  triggerShakeError(): void { this.shakeForm = !this.shakeForm; }
  onFieldFocus(field: string, focused: boolean): void { this.focusedFields[field] = focused; }
  getInputFocusState(field: string): string { return this.focusedFields[field] ? 'focused' : 'normal'; }
  togglePasswordTooltip(): void { this.showPasswordTooltip = !this.showPasswordTooltip; }
  togglePasswordVisibility(): void { this.showPassword = !this.showPassword; }
  toggleRepeatPasswordVisibility(): void { this.showRepeatPassword = !this.showRepeatPassword; }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    !target.closest('.help') && this.showPasswordTooltip && (this.showPasswordTooltip = false);
  }
}