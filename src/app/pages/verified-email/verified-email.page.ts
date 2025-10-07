import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';

/*
 * VerifiedEmailPage
 * Página de confirmación que informa al usuario que su cuenta ha sido verificada exitosamente.
 * Proporciona opciones para continuar al home o iniciar sesión en la plataforma.
 * Diseño centrado con iconografía de éxito y navegación clara.
 */
@Component({
  selector: 'app-verified-email',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './verified-email.page.html',
  styleUrl: './verified-email.page.scss'
})
export class VerifiedEmailPage {
  constructor(private router: Router) {}

  /* Redirige al usuario a la página de login. */
  goToLogin() {
    this.router.navigate(['/login']);
  }
}
