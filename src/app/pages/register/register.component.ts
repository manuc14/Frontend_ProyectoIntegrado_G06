import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { ApiService } from '../../core/services/api.service';
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
  imports: [CommonModule, ReactiveFormsModule, RouterLink, HeaderComponent, FooterComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  readonly maxAlias = 12;
  readonly predefinedPhotos = [
    'assets/placeholders/vid1.jpg',
    'assets/placeholders/vid2.jpg',
    'assets/placeholders/aud1.jpg',
    'assets/placeholders/hal1.jpg',
  ];

  form: FormGroup<RegisterForm>;

  loading = false;
  bannerKind: 'success' | 'error' | null = null;
  bannerText = '';

  constructor(private fb: FormBuilder, private api: ApiService) {
    this.form = this.fb.nonNullable.group({
      nombre: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(50)]),
      apellidos: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(80)]),
      email: this.fb.nonNullable.control('', [Validators.required, Validators.email, Validators.maxLength(120)]),
      alias: this.fb.nonNullable.control('', [maxLengthValidator(this.maxAlias)]),
      fechaNacimiento: this.fb.nonNullable.control('', [Validators.required, minAgeValidator(4)]),
      password: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(6), Validators.maxLength(128)]),
      repeatPassword: this.fb.nonNullable.control('', [Validators.required]),
  vip: this.fb.nonNullable.control<boolean>(false),
      fotoElegida: this.fb.control<string | null>(null),
    }, { validators: [matchValidator('password', 'repeatPassword')] });
  }

  get f() { return this.form.controls; }

  choosePredefinida(url: string) {
    this.form.patchValue({ fotoElegida: url });
  }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    // Derive effective alias and photo
    const v = this.form.value;
    const alias = (v.alias && v.alias.trim().length > 0) ? v.alias.trim() : v.nombre?.trim() ?? '';
    let fotoUrl = v.fotoElegida || 'assets/placeholders/featured.jpg';

    const payload = {
      nombre: v.nombre!,
      apellidos: v.apellidos!,
      email: v.email!,
      alias,
      fechaNacimiento: v.fechaNacimiento!,
      password: v.password!,
      vip: v.vip!,
      avatarUrl: fotoUrl,
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
        next: (res) => {
          console.log('Registro OK', res);
          this.bannerKind = 'success';
          this.bannerText = 'Cuenta creada correctamente.';
        },
        error: (err) => {
          const code = err?.status;
          const msg = err?.error?.message as string | undefined;
          if (code === 409 || (msg && /email/i.test(msg) && /(existe|alta|taken|registered)/i.test(msg))) {
            this.form.get('email')?.setErrors({ emailTaken: true });
          }
          this.bannerKind = 'error';
          this.bannerText = msg || 'No se pudo crear la cuenta. Inténtalo de nuevo.';
          console.error('Error de registro', err);
        },
      });
  }
}
