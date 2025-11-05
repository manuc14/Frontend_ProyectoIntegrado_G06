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

/*
 * Interfaz tipada para el formulario de registro
 * Define la estructura y tipos de todos los controles del formulario
 */
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

/*
 * RegisterComponent
 * Formulario completo de registro de usuario con validación en tiempo real,
 * selección de avatar, promoción VIP y manejo de errores del backend.
 * Incluye navegación automática a verificación de email tras registro exitoso.
 */

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent, FooterComponent, VipPromoModalComponent, FormInputComponent, FormPasswordComponent, FormDateComponent, FormToggleComponent, FormSubmitComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  animations: [buttonHover, buttonPress, fadeIn, inputFocus, shakeError]
})
export class RegisterComponent implements OnInit, OnDestroy {
  /* RegisterComponent: pantalla de registro de usuario. Gestiona formulario, avatar, promoción VIP y envío al backend; maneja 201/400/409 y navega a verificación de email tras éxito. */
  readonly maxAlias = FORM_LIMITS.aliasMax; // usado en template
  readonly maxNombre = FORM_LIMITS.nombreMax; // usado en template
  readonly maxApellidos = FORM_LIMITS.apellidosMax; // usado en template
  readonly maxEmail = FORM_LIMITS.emailMax; // usado en template
  readonly MIN_BIRTH_YEAR = MIN_BIRTH_YEAR; // usado en template

  // Estado del formulario gestionado por FormBaseService
  formState: FormState | null = null;
  formState$: Observable<FormState> | null = null;

  // Propiedades calculadas para compatibilidad con template
  get avatars(): string[] {
    return this.formState?.imageState.images ?? [];
  }

  get defaultAvatar(): string {
    return this.formState?.imageState.defaultImage ?? '';
  }

  get selectedAvatar(): string {
    return this.formState?.imageState.selectedImage ?? '';
  }

  get loadingAvatars(): boolean {
    return this.formState?.imageState.loading ?? false;
  }

  get avatarLoadError(): boolean {
    return this.formState?.imageState.error ?? false;
  }

  get loading(): boolean {
    return this.formState?.isSubmitting ?? false;
  }

  get bannerKind(): 'success' | 'error' | null {
    return this.formState?.error ? 'error' : null;
  }

  get bannerText(): string {
    return this.formState?.error ?? '';
  }

  form: FormGroup;

  get nombreControl(): FormControl {
    return this.form.get('nombre') as FormControl;
  }

  get apellidosControl(): FormControl {
    return this.form.get('apellidos') as FormControl;
  }

  get emailControl(): FormControl {
    return this.form.get('email') as FormControl;
  }

  get aliasControl(): FormControl {
    return this.form.get('alias') as FormControl;
  }

  get fechaNacimientoControl(): FormControl {
    return this.form.get('fechaNacimiento') as FormControl;
  }

  get passwordControl(): FormControl {
    return this.form.get('password') as FormControl;
  }

  get repeatPasswordControl(): FormControl {
    return this.form.get('repeatPassword') as FormControl;
  }

  get repeatPasswordErrors() {
    const errors = { ...this.f['repeatPassword'].errors };
    if (this.form.errors?.['mismatch']) {
      errors['mismatch'] = true;
    }
    return errors;
  }

  get vipControl(): FormControl {
    return this.form.get('vip') as FormControl;
  }

  // VIP promo modal estado
  showVipPromo = false;
  promptedVipOnce = false;
  // Animation estados
  shakeForm = false;
  buttonState = 'normal';
  focusedFields: {[key: string]: boolean} = {};
  // Tooltip estado
  showPasswordTooltip = false;
  // Password visibilidad estados
  showPassword = false;
  showRepeatPassword = false;

  private formStateSubscription?: Subscription;

  constructor(private fb: FormBuilder, private api: ApiService, private router: Router, private imageSelectorService: ImageSelectorService, private formBaseService: FormBaseService) {
    // Crear formulario usando FormBaseService
    this.form = this.formBaseService.createFormGroup({
      nombre: '',
      apellidos: '',
      email: '',
      alias: '',
      fechaNacimiento: '',
      password: '',
      repeatPassword: '',
      vip: false,
      fotoElegida: null
    }, [matchPasswordsValidator('password', 'repeatPassword')], 'register');

    // Estado del formulario gestionado por FormBaseService
    // Nota: formState$ se asignará en ngOnInit después de crear el estado
  }

  get f() { return this.form.controls; }

  /* Inicializa el componente cargando avatares del backend. */
  ngOnInit() {
    // Crear estado del formulario
    this.formBaseService.createFormState('register', {
      nombre: '',
      apellidos: '',
      email: '',
      alias: '',
      fechaNacimiento: '',
      password: '',
      repeatPassword: '',
      vip: false,
      fotoElegida: null
    });

    // Asignar el observable del estado después de crearlo
    this.formState$ = this.formBaseService.getFormState('register');

    // Suscribirse al estado del formulario
    this.formStateSubscription = this.formState$?.subscribe(state => {
      this.formState = state;
      // Actualizar formulario con avatar seleccionado
      this.form.patchValue({ fotoElegida: state.imageState.selectedImage || null });
    });

    // Cargar avatares
    this.formBaseService.loadImages('avatar');
  }

  ngOnDestroy(): void {
    if (this.formStateSubscription) {
      this.formStateSubscription.unsubscribe();
    }
    this.formBaseService.destroyFormState('register');
  }

  /* Marca un avatar como seleccionado y actualiza el formulario. */
  selectAvatar(avatarPath: string) {
    this.formBaseService.selectImage(avatarPath, 'avatar');
  }

  /* Obtiene la URL completa del avatar para mostrar la imagen. */
  getAvatarUrl(relativePath: string): string {
    return this.formBaseService.getFullImageUrl(relativePath, 'avatar');
  }

  /* Determina si se debe mostrar la promoción VIP basada en la selección del usuario. */
  private shouldShowVipPromo(vip: any): boolean {
    const isVip = (vip === true) || ((vip as unknown as string) === 'true');
    return !isVip && !this.promptedVipOnce;
  }

  /* Valida y decide si mostrar la promo VIP o continuar con el alta. */
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
      return;
    }
    this.doRegister();
  }

  // VIP promo actions
  /* Continúa con plan estándar tras mostrar la promo. */
  continueAsStandard() {
    this.promptedVipOnce = true;
    this.showVipPromo = false;
    this.doRegister();
  }

  /* Acepta plan VIP y prosigue con el alta. */
  upgradeToVip() {
    this.form.patchValue({ vip: true });
    this.promptedVipOnce = true;
    this.showVipPromo = false;
    this.doRegister();
  }

  /* Construye el payload final para el registro basado en los valores del formulario. */
  private buildPayload(v: any): any {
    const isVip = (v.vip === true) || ((v.vip as unknown as string) === 'true');
    const alias = (v.alias && v.alias.trim().length > 0) ? v.alias.trim() : v.nombre?.trim() ?? '';

    const fotoNombre = this.formBaseService.extractImageFileName(v.fotoElegida);

    const payload: any = {
      nombre: v.nombre!,
      apellidos: v.apellidos!,
      email: v.email!,
      alias,
      fechaNacimiento: v.fechaNacimiento!,
      password: v.password!,
      repetirPassword: v.repeatPassword!,
      esVip: isVip,
      activo: false,
    };

    // Solo incluir foto si se ha seleccionado un avatar y no es el por defecto
    if (fotoNombre && fotoNombre !== 'default-avatar.png') {
      payload.foto = fotoNombre;
    }

    return payload;
  }

  /* Maneja la respuesta exitosa del registro (201/200). */
  private handleSuccessResponse(res: HttpResponse<any>): void {
    const body: any = res.body || {};
    const verificationToken = body?.verificationToken;

    if (res.status === 201 || res.status === 200) {
      console.log('Registro OK', body);
      this.formBaseService.resetFormState('register');

      if (verificationToken) {
        this.router.navigate(['/verify-email'], { queryParams: { token: verificationToken } });
      } else {
        console.error('No se recibió verificationToken del backend');
        this.formBaseService.updateFormState('register', {
          error: 'Error en el proceso de registro. Intenta nuevamente.'
        });
      }
      return;
    }
    
    // Status inesperado, tratar como error
    this.formBaseService.updateFormState('register', {
      error: 'No se pudo crear la cuenta.'
    });
  }

  /* Maneja la respuesta de error del registro usando el servicio genérico. */
  private handleErrorResponse(err: any): void {
    this.formBaseService.handleBackendError('register', this.form, err);
    this.triggerShakeError();
    console.error('Error de registro', err);
  }

  /* Construye el payload final y envía la petición de registro al backend. */
  private doRegister() {
    const v = this.form.value;
    const payload = this.buildPayload(v);

    // Limpiar errores previos y marcar como submitting
    this.formBaseService.updateFormState('register', {
      error: null,
      fieldErrors: {},
      isSubmitting: true
    });
    this.form.disable();

    this.api.registerUser(payload)
      .pipe(finalize(() => {
        this.formBaseService.updateFormState('register', { isSubmitting: false });
        this.form.enable();
        this.buttonState = 'normal';
      }))
      .subscribe({
        next: (res: HttpResponse<any>) => {
          this.handleSuccessResponse(res);
        },
        error: (err) => {
          this.handleErrorResponse(err);
        },
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
  onFieldFocus(field: string, focused: boolean): void {
    this.focusedFields[field] = focused;
  }

  /**
   * Estado de animación para inputs
   */
  getInputFocusState(field: string): string {
    return this.focusedFields[field] ? 'focused' : 'normal';
  }

  /**
   * Alterna la visibilidad del tooltip de contraseña
   */
  togglePasswordTooltip(): void {
    this.showPasswordTooltip = !this.showPasswordTooltip;
  }

  /**
   * Alterna la visibilidad de las contraseñas
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleRepeatPasswordVisibility(): void {
    this.showRepeatPassword = !this.showRepeatPassword;
  }

  /**
   * Cierra el tooltip cuando se hace click fuera de él
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.help') && this.showPasswordTooltip) {
      this.showPasswordTooltip = false;
    }
  }
}
