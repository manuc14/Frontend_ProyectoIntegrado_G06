import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { ApiService } from '../../core/services/api.service';
import { VipPromoModalComponent } from '../../shared/vip-promo-modal/vip-promo-modal.component';
import { HttpResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { matchPasswordsValidator, minAgeValidator, passwordPolicyValidator } from '../../core/validators/password.validators';
import { applyBackendDetails, clearBackendErrors } from '../../core/utils/error-mapper';
import { FORM_LIMITS } from '../../core/constants/form-limits';

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
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  /* RegisterComponent: pantalla de registro de usuario. Gestiona formulario, avatar, promoción VIP y envío al backend; maneja 201/400/409 y navega a verificación de email tras éxito. */
  readonly maxAlias = FORM_LIMITS.aliasMax; // usado en template
  readonly maxNombre = FORM_LIMITS.nombreMax; // usado en template
  readonly maxApellidos = FORM_LIMITS.apellidosMax; // usado en template
  readonly maxEmail = FORM_LIMITS.emailMax; // usado en template
  // Avatares únicamente desde backend
  predefinedPhotos: string[] = [];

  form: FormGroup<RegisterForm>;

  loading = false;
  bannerKind: 'success' | 'error' | null = null;
  bannerText = '';
  // VIP promo modal state
  showVipPromo = false;
  promptedVipOnce = false;

  constructor(private fb: FormBuilder, private api: ApiService, private router: Router) {
    this.form = this.fb.nonNullable.group({
      nombre: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(FORM_LIMITS.nombreMax)]),
      apellidos: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(FORM_LIMITS.apellidosMax)]),
      email: this.fb.nonNullable.control('', [Validators.required, Validators.email, Validators.maxLength(FORM_LIMITS.emailMax)]),
      alias: this.fb.nonNullable.control('', [Validators.maxLength(FORM_LIMITS.aliasMax)]),
      fechaNacimiento: this.fb.nonNullable.control('', [Validators.required, minAgeValidator(FORM_LIMITS.minAgeYears)]),
      password: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(FORM_LIMITS.passwordMin), Validators.maxLength(FORM_LIMITS.passwordMax), passwordPolicyValidator()]),
      repeatPassword: this.fb.nonNullable.control('', [Validators.required]),
      vip: this.fb.nonNullable.control<boolean>(false),
      fotoElegida: this.fb.control<string | null>(null),
    }, { validators: [matchPasswordsValidator('password', 'repeatPassword')] });
  }

  get f() { return this.form.controls; }

  /* Inicializa el componente cargando avatares del backend. */
  ngOnInit() {
    // Obtener avatares disponibles del servidor
    this.api.getAvatars().subscribe({
      next: (list) => {
        if (Array.isArray(list)) this.predefinedPhotos = list;
      },
      error: () => { /* Mantener lista vacía por defecto */ }
    });
  }

  /* Marca un avatar predefinido como seleccionado. */
  choosePredefinida(url: string) {
    this.form.patchValue({ fotoElegida: url });
  }

  /* Valida y decide si mostrar la promo VIP o continuar con el alta. */
  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    // Derive effective alias and photo
    const v = this.form.value;
    // Normalize vip to boolean (radio can yield 'true'/'false' strings)
    const isVip = (v.vip === true) || ((v.vip as unknown as string) === 'true');
    // If user selected Standard and hasn't been prompted yet, show VIP promo
    if (!isVip && !this.promptedVipOnce) {
      this.showVipPromo = true;
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

  /* Construye el payload final y envía la petición de registro al backend. */
  private doRegister() {
    const v = this.form.value;
    const isVip = (v.vip === true) || ((v.vip as unknown as string) === 'true');
    const alias = (v.alias && v.alias.trim().length > 0) ? v.alias.trim() : v.nombre?.trim() ?? '';
    const fotoUrl = v.fotoElegida || '';

    const payload = {
      nombre: v.nombre!,
      apellidos: v.apellidos!,
      email: v.email!,
      alias,
      fechaNacimiento: v.fechaNacimiento!,
      password: v.password!,
      repetirPassword: v.repeatPassword!,
      esVip: isVip,
      foto: fotoUrl,
      activo: false,
    };

    this.bannerKind = null;
    this.bannerText = '';
    this.loading = true;
    this.form.disable();
    this.api.registerUser(payload)
      .pipe(finalize(() => {
        this.loading = false;
        this.form.enable();
      }))
      .subscribe({
        next: (res: HttpResponse<any>) => {
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
              this.router.navigate(['/verify'], { queryParams: { token: verificationToken } });
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
        },
        error: (err) => {
          // Limpia errores previos de backend en controles relevantes
          clearBackendErrors(this.form, ['email','password','repeatPassword','nombre','apellidos','alias','fechaNacimiento']);

          const status = err?.status as number | undefined;
          const payload = err?.error || {};
          const message: string | undefined = payload?.message;
          const details: Array<{ field: string; message: string }>|undefined = payload?.details;

          if (status === 409) {
            // Email duplicado
            this.form.get('email')?.setErrors({ ...(this.form.get('email')?.errors||{}), emailTaken: true });
            this.bannerKind = 'error';
            this.bannerText = message || 'El email ya está registrado.';
            return;
          }

          if (status === 400 && Array.isArray(details) && details.length > 0) {
            const fieldMap: Record<string,string> = {
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
            this.bannerText = (message ? message + '\n' : '') + msgJoin;
            return;
          }

          // Otros errores
          this.bannerKind = 'error';
          this.bannerText = message || 'No se pudo crear la cuenta. Inténtalo de nuevo.';
          console.error('Error de registro', err);
        },
      });
  }
}