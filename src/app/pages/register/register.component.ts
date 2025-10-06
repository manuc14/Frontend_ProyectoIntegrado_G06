import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { ApiService } from '../../core/services/api.service';
import { VipPromoModalComponent } from '../../shared/vip-promo-modal/vip-promo-modal.component';
import { HttpResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';

function maxLengthValidator(len: number) {
  return Validators.maxLength(len);
}

function minAgeValidator(minYears: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = control.value as string | Date | null;
    if (!v) return null;
    const dob = new Date(v);
    const now = new Date();
    if (dob > now) return { futureDate: true };
    const age = now.getFullYear() - dob.getFullYear() - (now < new Date(now.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
    return age < minYears ? { minAge: { required: minYears, actual: age } } : null;
  };
}

function matchValidator(a: string, b: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const group = control as FormGroup;
    const av = group.get(a)?.value;
    const bv = group.get(b)?.value;
    return av && bv && av !== bv ? { mismatch: true } : null;
  };
}

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
  imports: [CommonModule, ReactiveFormsModule, RouterLink, HeaderComponent, FooterComponent, VipPromoModalComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  readonly maxAlias = 12;
  // Avatares únicamente desde backend
  predefinedPhotos: string[] = [];

  form: FormGroup<RegisterForm>;

  loading = false;
  bannerKind: 'success' | 'error' | null = null;
  bannerText = '';
  // VIP promo modal state
  showVipPromo = false;
  promptedVipOnce = false;

  constructor(private fb: FormBuilder, private api: ApiService) {
    this.form = this.fb.nonNullable.group({
      nombre: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(50)]),
      apellidos: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(80)]),
      email: this.fb.nonNullable.control('', [Validators.required, Validators.email, Validators.maxLength(120)]),
      alias: this.fb.nonNullable.control('', [maxLengthValidator(this.maxAlias)]),
      fechaNacimiento: this.fb.nonNullable.control('', [Validators.required, minAgeValidator(4)]),
      password: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]),
      repeatPassword: this.fb.nonNullable.control('', [Validators.required]),
  vip: this.fb.nonNullable.control<boolean>(false),
      fotoElegida: this.fb.control<string | null>(null),
    }, { validators: [matchValidator('password', 'repeatPassword')] });
  }

  get f() { return this.form.controls; }

  ngOnInit() {
    // Fetch avatars from backend (sin fallback local)
    this.api.getAvatars().subscribe({
      next: (list) => {
        if (Array.isArray(list)) this.predefinedPhotos = list;
      },
      error: () => { /* ignore, keep defaults */ }
    });
  }

  choosePredefinida(url: string) {
    this.form.patchValue({ fotoElegida: url });
  }

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

  private doRegister() {
    const v = this.form.value;
    const isVip = (v.vip === true) || ((v.vip as unknown as string) === 'true');
    const alias = (v.alias && v.alias.trim().length > 0) ? v.alias.trim() : v.nombre?.trim() ?? '';
  let fotoUrl = v.fotoElegida || '';

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
            if (body && body.success === false) {
              // Parse error messages separated by ';'
              const raw = (body.error ?? '') as string;
              const parts = raw.split(';').map(s => s.trim()).filter(Boolean);
              const msgText = parts.length > 0 ? parts.join('\n') : 'No se pudo crear la cuenta.';
              // Map known email duplicate to field error for UX
              if (raw && /email/i.test(raw) && /(existe|registrad|taken|registered|alta)/i.test(raw)) {
                this.form.get('email')?.setErrors({ emailTaken: true });
              }
              this.bannerKind = 'error';
              this.bannerText = msgText;
              return; // do not mark success
            }
            console.log('Registro OK', res.body);
            this.bannerKind = 'success';
            this.bannerText = 'Cuenta creada correctamente.';
            return;
          }
          // Status inesperado, tratar como error
          this.bannerKind = 'error';
          this.bannerText = 'No se pudo crear la cuenta.';
        },
        error: (err) => {
          const code = err?.status;
          const rawMsg = (err?.error?.error ?? err?.error?.message) as string | undefined;
          if (code === 409 || (rawMsg && /email/i.test(rawMsg) && /(existe|alta|taken|registered)/i.test(rawMsg))) {
            this.form.get('email')?.setErrors({ emailTaken: true });
          }
          const parts = rawMsg ? rawMsg.split(';').map(s => s.trim()).filter(Boolean) : [];
          this.bannerKind = 'error';
          this.bannerText = parts.length ? parts.join('\n') : (rawMsg || 'No se pudo crear la cuenta. Inténtalo de nuevo.');
          console.error('Error de registro', err);
        },
      });
  }
}
