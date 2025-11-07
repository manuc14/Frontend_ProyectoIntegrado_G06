import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FooterComponent } from '../../../../shared/footer/footer.component';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { buttonHover, fadeIn } from '../../../../core/animations/animations';

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
  styleUrl: './verify-email.page.scss',
  animations: [buttonHover, fadeIn]
})
export class VerifyEmailPage {
  // Email del usuario para mostrar en la interfaz
  readonly email = signal<string>('');
  private timerId: any;

  constructor(private route: ActivatedRoute, private router: Router) {
    // Extraer email de sessionStorage
    const email = sessionStorage.getItem('pendingVerificationEmail');
    this.email.set(email ?? '');
  }

  /* Navega a la página de introducción de código (necesita token válido). */
  onEnterCode() {
    // Verificar si hay token en sessionStorage
    const token = sessionStorage.getItem('verificationToken');
    
    if (token) {
      // Con token: Ir a verify-code manteniendo el token en sessionStorage
      this.router.navigate(['/verify-code']);
    } else {
      // Sin token: Ir a signup para reiniciar el flujo
      this.router.navigate(['/signup']);
    }
  }
}
