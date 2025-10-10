/**
 * Página para verificar el código de verificación durante el proceso de recuperación de contraseña.
 * Segundo paso del flujo de restablecimiento de contraseña.
 */
import { Component, OnInit, OnDestroy, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { buttonHover, buttonPress, fadeIn, inputFocus, shakeError } from '../../core/animations/animations';

@Component({
  selector: 'app-reset-password-code',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './reset-password-code.page.html',
  styleUrls: ['./reset-password-code.page.scss'],
  animations: [buttonHover, buttonPress, fadeIn, inputFocus, shakeError]
})
export class ResetPasswordCodePage implements OnInit, OnDestroy {
  isLoading = false;
  errorMessage = '';
  token = '';
  codeDigits: string[] = ['', '', '', '', '', ''];
  // Animation states
  shakeForm = false;
  buttonState = 'normal';
  focusedInput = -1;
  // Reenvío de código
  resendDisabled = false;
  resendCountdown = 0;
  private resendTimer: any;
  // Estados separados para cada operación
  isVerifying = false;
  isResending = false;
  successMessage = '';
  hasError = false;

  @ViewChildren('codeInput') inputs!: QueryList<ElementRef<HTMLInputElement>>;

  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Verificar si hay token en los query params
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      if (!this.token) {
        // Si no hay token, redirigir al login
        this.router.navigate(['/login']);
        return;
      }
      
      // Validar que el token sea válido y la sesión exista
      this.api.validateResetToken(this.token).subscribe({
        next: (response) => {
          if (!response.exists) {
            // Token inválido o sesión no existe
            this.router.navigate(['/forgot-password']);
          }
          // Si exists=true, permitir continuar independientemente de verified
        },
        error: () => {
          // Token inválido o error de servidor
          this.router.navigate(['/forgot-password']);
        }
      });
    });
  }

  ngOnDestroy() {
    // Limpiar timer al destruir el componente
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
    }
  }

  /* Código completo concatenado. */
  get code(): string {
    return this.codeDigits.join('');
  }

  /* Habilita verificar cuando hay exactamente 6 dígitos. */
  get canVerify(): boolean {
    return /^\d{6}$/.test(this.code);
  }

  /* Maneja entrada en cada caja, avanzando automáticamente al siguiente campo cuando se completa. */
  onInput(i: number, ev: Event) {
    const input = ev.target as HTMLInputElement;
    let v = (input.value || '').replace(/\D/g, '');
    // Si el usuario pegó múltiples dígitos en un solo campo, distribuirlos
    if (v.length > 1) {
      this.applyPaste(i, v);
      return;
    }
    this.codeDigits[i] = v;
    input.value = v;
    // Avanzar al siguiente campo si hay contenido y no es el último
    if (v && i < 5) {
      this.focusIndex(i + 1);
    }
  }

  /* Maneja navegación con teclas especiales y borrado inteligente entre campos. */
  onKeyDown(i: number, ev: KeyboardEvent) {
    const input = ev.target as HTMLInputElement;
    if (ev.key === 'Backspace') {
      if (input.value) {
        // Limpiar valor actual sin moverse
        this.codeDigits[i] = '';
        input.value = '';
        ev.preventDefault();
        return;
      }
      // Si el campo está vacío, retroceder al anterior
      if (i > 0) {
        this.focusIndex(i - 1);
        const prev = this.inputs.get(i - 1)?.nativeElement;
        if (prev) prev.value = '';
        this.codeDigits[i - 1] = '';
        ev.preventDefault();
      }
    }
    // Navegación con flechas entre campos
    if (ev.key === 'ArrowLeft' && i > 0) {
      this.focusIndex(i - 1);
      ev.preventDefault();
    }
    if (ev.key === 'ArrowRight' && i < 5) {
      this.focusIndex(i + 1);
      ev.preventDefault();
    }
  }

  /* Reparte un texto pegado entre las cajas a partir de un índice. */
  onPaste(i: number, ev: ClipboardEvent) {
    const text = ev.clipboardData?.getData('text') ?? '';
    if (!text) return;
    ev.preventDefault();
    const digits = text.replace(/\D/g, '');
    if (!digits) return;
    this.applyPaste(i, digits);
  }

  /* Lógica de reparto de dígitos pegados. */
  private applyPaste(startIndex: number, digits: string) {
    const arr = digits.slice(0, 6 - startIndex).split('');
    for (let k = 0; k < arr.length; k++) {
      this.codeDigits[startIndex + k] = arr[k];
      const el = this.inputs.get(startIndex + k)?.nativeElement;
      if (el) el.value = arr[k];
    }
    const next = Math.min(startIndex + arr.length, 5);
    this.focusIndex(next);
  }

  /* Foco en el input i-ésimo. */
  private focusIndex(i: number) {
    const el = this.inputs.get(i)?.nativeElement;
    if (el) el.focus();
  }

  /**
   * Verifica el código de verificación introducido por el usuario
   */
  onSubmit() {
    if (!this.canVerify) {
      this.triggerShakeError();
      return;
    }
    
    this.isVerifying = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.hasError = false;
    this.buttonState = 'pressed';

    this.api.verifyResetToken(this.token, this.code).subscribe({
      next: (response) => {
        // Navegar al tercer paso con el token
        this.router.navigate(['/new-password'], {
          queryParams: { token: this.token }
        });
      },
      error: (error: any) => {
        this.errorMessage = error.message || 'Código de verificación incorrecto';
        this.hasError = true;
        this.isVerifying = false;
        this.buttonState = 'normal';
        this.triggerShakeError();
        // Limpiar inputs en caso de error
        this.codeDigits = ['', '', '', '', '', ''];
        this.inputs.forEach(input => {
          if (input.nativeElement) input.nativeElement.value = '';
        });
        this.focusIndex(0);
      },
      complete: () => {
        this.isVerifying = false;
        this.buttonState = 'normal';
      }
    });
  }

  /**
   * Reenvía el código de verificación usando el token actual
   */
  resendCode() {
    if (this.resendDisabled || this.isResending) {
      return;
    }

    this.isResending = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.hasError = false;

    this.api.resendResetCode(this.token).subscribe({
      next: (response) => {
        this.successMessage = response.message || 'Código reenviado correctamente';
        this.hasError = false;
        // Limpiar inputs después de reenviar
        this.codeDigits = ['', '', '', '', '', ''];
        this.inputs.forEach(input => {
          if (input.nativeElement) input.nativeElement.value = '';
        });
        this.focusIndex(0);
        
        // Iniciar countdown de 60 segundos
        this.startResendCountdown();
      },
      error: (error: any) => {
        this.errorMessage = error.message || 'Error al reenviar el código';
        this.hasError = true;
      },
      complete: () => {
        this.isResending = false;
      }
    });
  }

  /**
   * Inicia el countdown para deshabilitar el botón de reenvío
   */
  private startResendCountdown() {
    this.resendDisabled = true;
    this.resendCountdown = 60;
    
    this.resendTimer = setInterval(() => {
      this.resendCountdown--;
      if (this.resendCountdown <= 0) {
        this.resendDisabled = false;
        clearInterval(this.resendTimer);
        this.resendTimer = null;
      }
    }, 1000);
  }

  /**
   * Vuelve al paso anterior
   */
  goBack() {
    this.router.navigate(['/forgot-password']);
  }

  /**
   * Navega al login
   */
  goToLogin() {
    this.router.navigate(['/login']);
  }

  /**
   * Dispara la animación de shake para errores
   */
  triggerShakeError(): void {
    this.shakeForm = !this.shakeForm;
  }

  /**
   * Maneja el estado de focus de los inputs
   */
  onInputFocus(index: number): void {
    this.focusedInput = index;
  }

  onInputBlur(): void {
    this.focusedInput = -1;
  }

  /**
   * Estado de animación para cada input
   */
  getInputFocusState(index: number): string {
    return this.focusedInput === index ? 'focused' : 'normal';
  }
}