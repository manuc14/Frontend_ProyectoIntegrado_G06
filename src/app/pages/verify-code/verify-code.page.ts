import { CommonModule } from '@angular/common';
import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { ApiService } from '../../core/services/api.service';
import { CodeInputBase } from '../../core/base/code-input.base';
import { buttonHover, buttonPress, fadeIn, inputFocus, shakeError } from '../../core/animations/animations';

@Component({
  selector: 'app-verify-code',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent],
  templateUrl: './verify-code.page.html',
  styleUrl: './verify-code.page.scss',
  animations: [buttonHover, buttonPress, fadeIn, inputFocus, shakeError]
})
export class VerifyCodePage extends CodeInputBase implements OnInit, OnDestroy {
  /*
 * VerifyCodePage
 * Formulario interactivo para introducción de código de verificación de 6 dígitos.
 * Incluye navegación automática entre campos, soporte para pegado y validación.
 * Maneja el flujo completo de verificación de cuenta de usuario usando token de verificación.
 */
  readonly token = signal<string>('');
  isLoading = false;
  errorMessage = '';
  // Reenvío de código
  resendDisabled = false;
  resendCountdown = 0;
  private resendTimer: any;
  // Estados separados para cada operación
  isVerifying = false;
  isResending = false;
  successMessage = '';
  hasError = false;

  constructor(private route: ActivatedRoute, private router: Router, private api: ApiService) {
    super();
  }

  ngOnInit() {
    // Obtener token desde el query parameter estándar ?token=valor
    const tokenParam = this.route.snapshot.queryParamMap.get('token');
    this.token.set(tokenParam ?? '');
    
    this.initializeTokenValidation();
  }

  private initializeTokenValidation() {
    // Si no hay token, redirigir al registro
    if (!this.token()) {
      this.router.navigate(['/signup']);
      return;
    }
    
    // Validar que el token sea válido y la sesión exista
    this.api.validateVerificationToken(this.token()).subscribe({
      next: (response) => {
        if (!response.exists) {
          // Token inválido o sesión no existe
          this.router.navigate(['/signup']);
        }
        // Si exists=true, permitir continuar independientemente de verified
      },
      error: () => {
        // Token inválido o error de servidor
        this.router.navigate(['/signup']);
      }
    });
  }

  /* Envía el código para verificación usando el token y navega a la página de confirmación. */
  onVerify() {
    if (!this.canVerify || this.isVerifying) {
      if (!this.canVerify) {
        this.triggerShakeError();
      }
      return;
    }
    
    this.isVerifying = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.hasError = false;
    this.buttonState = 'pressed';
    
    // Llamada al nuevo endpoint con token
    this.api.verifyUserWithToken(this.token(), this.code).subscribe({
      next: (response: any) => {
        console.log('Verificación exitosa:', response);
        // Redirigir a la página de confirmación tras verificación exitosa
        // Usamos el token original que sigue siendo válido
        this.router.navigate(['/login']);
      },
      error: (error: any) => {
        console.error('Error en verificación:', error);
        this.errorMessage = error.message || 'Código de verificación incorrecto';
        this.hasError = true;
        this.isVerifying = false;
        this.buttonState = 'normal';
        this.triggerShakeError();
        // Limpiar inputs en caso de error
        this.clearCodeInputs();
      },
      complete: () => {
        this.isVerifying = false;
        this.buttonState = 'normal';
      }
    });
  }

  /* Reenvía un nuevo código de verificación usando el token actual. */
  onResendCode() {
    if (this.isResending || this.resendDisabled) return;
    
    this.isResending = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.hasError = false;
    
    this.api.resendVerificationCode(this.token()).subscribe({
      next: (response: any) => {
        console.log('Código reenviado:', response);
        this.successMessage = response.message || 'Nuevo código enviado a tu email';
        this.hasError = false;
        // Limpiar inputs para el nuevo código
        this.clearCodeInputs();
        // Iniciar countdown para reenvío
        this.startResendCountdown();
      },
      error: (error: any) => {
        console.error('Error al reenviar código:', error);
        this.errorMessage = error.message || 'Error al reenviar el código';
        this.hasError = true;
      },
      complete: () => {
        this.isResending = false;
      }
    });
  }

  /**
   * Inicia el countdown para reenvío de código
   */
  private startResendCountdown(): void {
    this.resendDisabled = true;
    this.resendCountdown = 60;
    
    this.resendTimer = setInterval(() => {
      this.resendCountdown--;
      if (this.resendCountdown <= 0) {
        this.resendDisabled = false;
        if (this.resendTimer) {
          clearInterval(this.resendTimer);
          this.resendTimer = null;
        }
      }
    }, 1000);
  }

  /**
   * Dispara la animación de shake para errores
   */
  triggerShakeError(): void {
    this.shakeForm = !this.shakeForm;
  }

  /**
   * Limpia recursos al destruir el componente
   */
  ngOnDestroy(): void {
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
      this.resendTimer = null;
    }
  }
}
