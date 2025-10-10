import { CommonModule } from '@angular/common';
import { Component, ElementRef, QueryList, ViewChildren, signal, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { ApiService } from '../../core/services/api.service';
import { buttonHover, buttonPress, fadeIn, inputFocus, shakeError } from '../../core/animations/animations';

@Component({
  selector: 'app-verify-code',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent],
  templateUrl: './verify-code.page.html',
  styleUrl: './verify-code.page.scss',
  animations: [buttonHover, buttonPress, fadeIn, inputFocus, shakeError]
})
export class VerifyCodePage implements OnInit, OnDestroy {
  /*
 * VerifyCodePage
 * Formulario interactivo para introducción de código de verificación de 6 dígitos.
 * Incluye navegación automática entre campos, soporte para pegado y validación.
 * Maneja el flujo completo de verificación de cuenta de usuario usando token de verificación.
 */
  readonly token = signal<string>('');
  codeDigits: string[] = ['', '', '', '', '', ''];
  isLoading = false;
  errorMessage = '';
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
        this.router.navigate(['/verified-email'], { queryParams: { token: this.token() } });
      },
      error: (error: any) => {
        console.error('Error en verificación:', error);
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
        this.successMessage = 'Nuevo código enviado a tu email';
        this.hasError = false;
        // Limpiar inputs para el nuevo código
        this.codeDigits = ['', '', '', '', '', ''];
        this.inputs.forEach(input => {
          if (input.nativeElement) input.nativeElement.value = '';
        });
        this.focusIndex(0);
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
