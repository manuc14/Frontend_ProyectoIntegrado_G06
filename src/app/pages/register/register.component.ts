import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { ApiService } from '../../core/services/api.service';
import { VipPromoModalComponent } from '../../shared/vip-promo-modal/vip-promo-modal.component';
import { HttpResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { matchPasswordsValidator, minAgeValidator, maxAgeValidator, passwordPolicyValidator, MIN_BIRTH_YEAR } from '../../core/validators/form.validators';
import { applyBackendDetails, clearBackendErrors } from '../../core/utils/error-mapper';
import { FORM_LIMITS } from '../../core/constants/form-limits';
import { buttonHover, buttonPress, fadeIn, inputFocus, shakeError } from '../../core/animations/animations';

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
  imports: [CommonModule, ReactiveFormsModule, RouterLink, HeaderComponent, FooterComponent, VipPromoModalComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  animations: [buttonHover, buttonPress, fadeIn, inputFocus, shakeError]
})
export class RegisterComponent {
  /* RegisterComponent: pantalla de registro de usuario. Gestiona formulario, avatar, promoción VIP y envío al backend; maneja 201/400/409 y navega a verificación de email tras éxito. */
  readonly maxAlias = FORM_LIMITS.aliasMax; // usado en template
  readonly maxNombre = FORM_LIMITS.nombreMax; // usado en template
  readonly maxApellidos = FORM_LIMITS.apellidosMax; // usado en template
  readonly maxEmail = FORM_LIMITS.emailMax; // usado en template
  readonly MIN_BIRTH_YEAR = MIN_BIRTH_YEAR; // usado en template
  
  // Avatares del backend
  avatars: string[] = [];
  defaultAvatar = '';
  selectedAvatar = '';
  loadingAvatars = false;
  avatarLoadError = false;

  form: FormGroup<RegisterForm>;

  loading = false;
  bannerKind: 'success' | 'error' | null = null;
  bannerText = '';
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

  constructor(private fb: FormBuilder, private api: ApiService, private router: Router) {
    this.form = this.fb.nonNullable.group({
      nombre: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(FORM_LIMITS.nombreMax)]),
      apellidos: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(FORM_LIMITS.apellidosMax)]),
      email: this.fb.nonNullable.control('', [Validators.required, Validators.email, Validators.maxLength(FORM_LIMITS.emailMax)]),
      alias: this.fb.nonNullable.control('', [Validators.maxLength(FORM_LIMITS.aliasMax)]),
      fechaNacimiento: this.fb.nonNullable.control('', [Validators.required, minAgeValidator(FORM_LIMITS.minAgeYears), maxAgeValidator(MIN_BIRTH_YEAR)]),
      password: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(FORM_LIMITS.passwordMin), Validators.maxLength(FORM_LIMITS.passwordMax), passwordPolicyValidator()]),
      repeatPassword: this.fb.nonNullable.control('', [Validators.required]),
      vip: this.fb.nonNullable.control<boolean>(false),
      fotoElegida: this.fb.control<string | null>(null),
    }, { validators: [matchPasswordsValidator('password', 'repeatPassword')] });
  }

  get f() { return this.form.controls; }

  /* Inicializa el componente cargando avatares del backend. */
  ngOnInit() {
    this.loadAvatars();
  }

  /* Carga la lista de avatares disponibles del backend. */
  loadAvatars() {
    this.loadingAvatars = true;
    this.avatarLoadError = false;
    this.api.getAvatars().subscribe({
      next: (response) => {
        this.avatars = response.avatars || [];
        this.defaultAvatar = response.defaultAvatar || '';
        this.selectedAvatar = this.defaultAvatar;
        // Actualizar formulario con avatar por defecto
        this.form.patchValue({ fotoElegida: this.defaultAvatar });
      },
      error: (error) => {
        console.error('Error al cargar avatares:', error);
        // Mostrar mensaje de error y configurar avatar por defecto vacío
        this.loadingAvatars = false;
        this.avatarLoadError = true;
        this.avatars = [];
        this.defaultAvatar = '';
        this.selectedAvatar = '';
        // El formulario mantendrá fotoElegida como null para usar el avatar por defecto del backend
        this.form.patchValue({ fotoElegida: null });
      },
      complete: () => {
        this.loadingAvatars = false;
      }
    });
  }

  /* Marca un avatar como seleccionado y actualiza el formulario. */
  selectAvatar(avatarPath: string) {
    this.selectedAvatar = avatarPath;
    this.form.patchValue({ fotoElegida: avatarPath });
  }

  /* Obtiene la URL completa del avatar para mostrar la imagen. */
  getAvatarUrl(relativePath: string): string {
    return this.api.getFullAvatarUrl(relativePath);
  }

  /* Extrae el nombre del archivo de una ruta de avatar */
  private extractAvatarFileName(avatarPath: string): string {
    if (!avatarPath) return '';
    // Extraer el nombre del archivo de la ruta (ej: "/avatars/avatar1.png" -> "avatar1.png")
    return avatarPath.split('/').pop() ?? '';
  }

  /* Determina si se debe mostrar la promoción VIP basada en la selección del usuario. */
  private shouldShowVipPromo(v: any): boolean {
    const isVip = (v.vip === true) || ((v.vip as unknown as string) === 'true');
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
    if (this.shouldShowVipPromo(v)) {
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
    
    let fotoNombre = '';
    if (v.fotoElegida) {
      const extracted = v.fotoElegida.split('/').pop();
      if (extracted && extracted.trim().length > 0) {
        fotoNombre = extracted;
      }
    }

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
    const status = res.status;
    if (status === 201 || status === 200) {
      const body: any = res.body || {};
      const successMsg = (body?.message as string) || 'Usuario registrado correctamente';
      const verificationToken = body?.verificationToken;
      console.log('Registro OK', body);
      this.bannerKind = 'success';
      this.bannerText = successMsg;
      
      // Verificar que el backend envió el token
      if (verificationToken) {
        // Navega a verificación usando el token como query parameter estándar
        this.router.navigate(['/verify-email'], { queryParams: { token: verificationToken } });
      } else {
        console.error('No se recibió verificationToken del backend');
        this.bannerKind = 'error';
        this.bannerText = 'Error en el proceso de registro. Intenta nuevamente.';
      }
      return;
    }
    // Status inesperado, tratar como error
    this.bannerKind = 'error';
    this.bannerText = 'No se pudo crear la cuenta.';
  }

  /* Maneja errores de conflicto (409 - email duplicado). */
  private handleConflictError(message?: string): void {
    this.form.get('email')?.setErrors({ ...(this.form.get('email')?.errors || {}), emailTaken: true });
    this.bannerKind = 'error';
    this.bannerText = message ?? 'El email ya está registrado.';
    this.triggerShakeError();
  }

  /* Maneja errores de solicitud incorrecta (400 - validación backend). */
  private handleBadRequestError(details: Array<{ field: string; message: string }>): void {
    const fieldMap: Record<string, string> = {
      repetirPassword: 'repeatPassword',
      password: 'password',
      email: 'email',
      nombre: 'nombre',
      apellidos: 'apellidos',
      alias: 'alias',
      fechaNacimiento: 'fechaNacimiento',
    };
    const msgJoin = applyBackendDetails(this.form, details, fieldMap);
    this.bannerKind = 'error';
    this.bannerText = msgJoin;
    this.triggerShakeError();
  }

  /* Maneja errores generales del registro. */
  private handleGeneralError(message?: string): void {
    this.bannerKind = 'error';
    this.bannerText = message ?? 'Se ha producido un error. Inténtelo de nuevo más tarde.';
    this.triggerShakeError();
  }

  /* Maneja la respuesta de error del registro. */
  private handleErrorResponse(err: any): void {
    // Limpia errores previos de backend en controles relevantes
    clearBackendErrors(this.form, ['email', 'password', 'repeatPassword', 'nombre', 'apellidos', 'alias', 'fechaNacimiento']);

    const status = err?.originalError?.status || err?.status;
    const payload = err?.originalError?.error || err?.error || {};
    const backendMessage: string | undefined = payload?.message;
    const details: Array<{ field: string; message: string }>|undefined = payload?.details;

    if (status === 409) {
      this.handleConflictError(backendMessage);
      return;
    }

    if (status === 400 && Array.isArray(details) && details.length > 0) {
      this.handleBadRequestError(details);
      return;
    }

    // Para otros errores, usar mensaje del backend si existe, sino mensaje por defecto
    this.handleGeneralError(backendMessage);
    console.error('Error de registro', err);
  }

  /* Construye el payload final y envía la petición de registro al backend. */
  private doRegister() {
    const v = this.form.value;
    const payload = this.buildPayload(v);

    this.bannerKind = null;
    this.bannerText = '';
    this.loading = true;
    this.form.disable();
    this.api.registerUser(payload)
      .pipe(finalize(() => {
        this.loading = false;
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
   * Alterna la visibilidad de la contraseña
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Alterna la visibilidad de repetir contraseña
   */
  toggleRepeatPasswordVisibility(): void {
    this.showRepeatPassword = !this.showRepeatPassword;
  }

  /**
   * Cierra el tooltip de contraseña
   */
  closePasswordTooltip(): void {
    this.showPasswordTooltip = false;
  }

  /**
   * Cierra el tooltip cuando se hace click fuera de él
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const helpButton = target.closest('.help');
    
    // Si el click no fue en el botón de ayuda o en el tooltip, cerrar el tooltip
    if (!helpButton && this.showPasswordTooltip) {
      this.showPasswordTooltip = false;
    }
  }
}