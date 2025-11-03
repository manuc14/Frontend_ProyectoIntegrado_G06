import { CommonModule } from '@angular/common';
import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { FooterComponent } from '../../../../shared/footer/footer.component';
import { ApiService } from '../../../../core/services/api.service';
import { CodeInputBase } from '../../../../core/base/code-input.base';
import { buttonHover, buttonPress, fadeIn, inputFocus, shakeError } from '../../../../core/animations/animations';

@Component({
  selector: 'app-verify-code',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent],
  templateUrl: './verify-code.page.html',
  styleUrl: './verify-code.page.scss',
  animations: [buttonHover, buttonPress, fadeIn, inputFocus, shakeError]
})
export class VerifyCodePage extends CodeInputBase implements OnInit, OnDestroy {
  readonly token = signal<string>('');
  isLoading = false;
  errorMessage = '';
  resendDisabled = false;
  resendCountdown = 0;
  private resendTimer: any;
  isVerifying = false;
  isResending = false;
  successMessage = '';
  hasError = false;

  constructor(private route: ActivatedRoute, private router: Router, private api: ApiService) {
    super();
  }

  ngOnInit() {
    const tokenParam = this.route.snapshot.queryParamMap.get('token');
    this.token.set(tokenParam ?? '');
    
    if (!this.token()) {
      this.router.navigate(['/signup']);
      return;
    }
    
    // Validar que el token sea válido y la sesión exista
    this.api.validateVerificationToken(this.token()).subscribe({
      next: (response) => {
        if (!response.exists) {
          this.router.navigate(['/signup']);
        }
      },
      error: () => {
        this.router.navigate(['/signup']);
      }
    });
  }

  /* Envía el código para verificación usando el token */
  onVerify() {
    if (!this.canVerify || this.isVerifying) {
      if (!this.canVerify) this.triggerShakeError();
      return;
    }
    
    this.isVerifying = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.hasError = false;
    this.buttonState = 'pressed';
    
    this.api.verifyUserWithToken(this.token(), this.code).subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error: any) => {
        // Extraer mensaje del error procesado por el interceptor
        this.errorMessage = error?.error?.message || error?.message || 'Código de verificación incorrecto';
        this.hasError = true;
        this.isVerifying = false;
        this.buttonState = 'normal';
        this.triggerShakeError();
        this.clearCodeInputs();
      },
      complete: () => {
        this.isVerifying = false;
        this.buttonState = 'normal';
      }
    });
  }

  /* Reenvía un nuevo código de verificación usando el token actual */
  onResendCode() {
    if (this.isResending || this.resendDisabled) return;
    
    this.isResending = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.hasError = false;
    
    this.api.resendVerificationCode(this.token()).subscribe({
      next: (response: any) => {
        this.successMessage = response.message || 'Nuevo código enviado a tu email';
        this.hasError = false;
        this.clearCodeInputs();
        this.startResendCountdown();
      },
      error: (error: any) => {
        // Extraer mensaje del error procesado por el interceptor
        this.errorMessage = error?.error?.message || error?.message || 'Error al reenviar el código';
        this.hasError = true;
        this.isResending = false; // Restablecer estado en caso de error
      },
      complete: () => {
        this.isResending = false;
      }
    });
  }

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

  triggerShakeError(): void {
    this.shakeForm = !this.shakeForm;
  }

  ngOnDestroy(): void {
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
      this.resendTimer = null;
    }
  }
}
