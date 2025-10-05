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
          if (!res?.ok) { throw new Error('Auth failed'); }
          const role = res.role ?? 'USER';
          // Basic role-based redirects
          if (role === 'ADMIN') {
            this.router.navigateByUrl('/admin');
          } else if (role === 'CONTENT') {
            this.router.navigateByUrl('/content');
          } else {
            this.router.navigateByUrl('/catalog');
          }
        },
        error: (err) => {
          console.error('Login error', err);
          this.bannerKind = 'error';
          this.bannerText = 'Credenciales incorrectas';
        }
      });
  }
}
