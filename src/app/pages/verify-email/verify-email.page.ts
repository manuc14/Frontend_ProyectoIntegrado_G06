import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FooterComponent } from '../../shared/footer/footer.component';
import { HeaderComponent } from '../../shared/header/header.component';

/*
 * VerifyEmailPage
 * Página informativa que confirma el envío del email de verificación.
 * Proporciona instrucciones al usuario y enlace para introducir el código.
 * Recibe el email desde parámetros de consulta para personalización.
 */
@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './verify-email.page.html',
  styleUrl: './verify-email.page.scss'
})
export class VerifyEmailPage {
  // Email del usuario para mostrar en la interfaz
  readonly email = signal<string>('');
  private timerId: any;

  constructor(private route: ActivatedRoute, private router: Router) {
    // Extraer email de los parámetros de consulta
    const emailParam = this.route.snapshot.queryParamMap.get('email');
    this.email.set(emailParam ?? '');
  }

  /* Navega a la página de introducción de código. */
  onEnterCode() {
    this.router.navigate(['/verify-code'], { queryParams: { email: this.email() } });
  }
}
