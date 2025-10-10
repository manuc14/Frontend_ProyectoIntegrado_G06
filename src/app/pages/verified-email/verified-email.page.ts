import { CommonModule } from '@angular/common';
import { Component, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { ApiService } from '../../core/services/api.service';
import { buttonHover, fadeIn, slideInFromTop } from '../../core/animations/animations';

/*
 * VerifiedEmailPage
 * Página de confirmación que informa al usuario que su cuenta ha sido verificada exitosamente.
 * Proporciona opciones para continuar al home o iniciar sesión en la plataforma.
 * Requiere token válido y verificado para acceder.
 */
@Component({
  selector: 'app-verified-email',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './verified-email.page.html',
  styleUrl: './verified-email.page.scss',
  animations: [buttonHover, fadeIn, slideInFromTop]
})
export class VerifiedEmailPage implements OnInit {
  readonly token = signal<string>('');

  constructor(private route: ActivatedRoute, private router: Router, private api: ApiService) {
    // Obtener token desde el query parameter estándar ?token=valor
    const tokenParam = this.route.snapshot.queryParamMap.get('token');
    this.token.set(tokenParam ?? '');
  }

  ngOnInit() {
    // Si no hay token, redirigir al registro
    if (!this.token()) {
      this.router.navigate(['/signup']);
      return;
    }
    
    // Validar que el token sea válido y el email haya sido verificado
    this.api.validateVerificationToken(this.token()).subscribe({
      next: (response) => {
        if (!response.exists) {
          // Token inválido o sesión no existe
          this.router.navigate(['/signup']);
        } else if (!response.verified) {
          // Token válido pero email no verificado, redirigir a verificación
          this.router.navigate(['/verify-code'], { 
            queryParams: { token: this.token() } 
          });
        }
        // Si exists=true y verified=true, permitir continuar
      },
      error: () => {
        // Token inválido o error de servidor
        this.router.navigate(['/signup']);
      }
    });
  }

  /* Redirige al usuario a la página de login. */
  goToLogin() {
    this.router.navigate(['/login']);
  }
}
