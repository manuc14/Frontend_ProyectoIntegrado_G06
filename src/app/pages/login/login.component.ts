import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { ApiService, LoginRequest, LoginResponse } from '../../core/services/api.service';
import { finalize } from 'rxjs/operators';

interface LoginForm {
  email: FormControl<string>;
  password: FormControl<string>;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, HeaderComponent, FooterComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  /* LoginComponent: formulario de acceso que autentica contra el backend y redirige según tipo de usuario. */
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private router = inject(Router);

  form: FormGroup<LoginForm> = this.fb.nonNullable.group({
    email: this.fb.nonNullable.control('', { validators: [Validators.required, Validators.email] }),
    password: this.fb.nonNullable.control('', { validators: [Validators.required] }),
  });

  loading = false;
  bannerKind: 'success' | 'error' | null = null;
  bannerText = '';

  get f() { return this.form.controls; }

  /* Envía credenciales y procesa la respuesta del backend. */
  submit() {
    if (this.form.invalid || this.loading) return;
    this.bannerKind = null; this.bannerText = '';
  const raw = this.form.getRawValue();
  const payload: LoginRequest = { email: raw.email, password: raw.password };
    this.loading = true; this.form.disable();
    this.api.login(payload)
      .pipe(finalize(() => { this.loading = false; this.form.enable(); }))
      .subscribe({
        next: (res: LoginResponse) => {
          if (!res?.success) {
            this.bannerKind = 'error';
            this.bannerText = res?.message || 'Credenciales incorrectas';
            return;
          }
          // Verificar activación de cuenta
          if (!res.user?.activo) {
            this.bannerKind = 'error';
            this.bannerText = 'Tu cuenta no está activada. Revisa tu correo para activarla.';
            return;
          }
          // Opcional: persistir token; para demo, solo navegación
          // sessionStorage.setItem('token', res.token);

          const tipo = res.user?.tipo || '';
          // Mapeo de tipos del backend a rutas de la app
          // Ajusta estos valores exactos a los que el backend usa realmente
          let target: string = '/catalog';
          if (/admin/i.test(tipo)) target = '/admin';
          else if (/content|editor|gest/i.test(tipo)) target = '/content';

          this.router.navigateByUrl(target);
        },
        error: (err: any) => {
          console.error('Login error', err);
          this.bannerKind = 'error';
          this.bannerText = 'Credenciales incorrectas';
        }
      });
  }
}
