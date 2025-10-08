import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { buttonHover, fadeIn, slideInFromTop } from '../../core/animations/animations';

/*
 * VerifiedEmailPage
 * Página de confirmación que informa al usuario que su cuenta ha sido verificada exitosamente.
 * Proporciona opciones para continuar al home o iniciar sesión en la plataforma.
 * Requiere token válido para acceder - redirige a signup si no lo tiene.
 */
@Component({
  selector: 'app-verified-email',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './verified-email.page.html',
  styleUrl: './verified-email.page.scss',
  animations: [buttonHover, fadeIn, slideInFromTop]
})
export class VerifiedEmailPage {
  readonly token = signal<string>('');

  constructor(private route: ActivatedRoute, private router: Router) {
    // Obtener token desde el query parameter estándar ?token=valor
    const tokenParam = this.route.snapshot.queryParamMap.get('token');
    this.token.set(tokenParam ?? '');
    
    // Si no hay token, redirigir al registro
    if (!this.token()) {
      this.router.navigate(['/signup']);
    }
  }

  /* Redirige al usuario a la página de login. */
  goToLogin() {
    this.router.navigate(['/login']);
  }
}
