import { CommonModule } from '@angular/common';
import { Component, ElementRef, QueryList, ViewChildren, signal } from '@angular/core';
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
export class VerifyCodePage {
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

  @ViewChildren('codeInput') inputs!: QueryList<ElementRef<HTMLInputElement>>;

  constructor(private route: ActivatedRoute, private router: Router, private api: ApiService) {
    // Obtener token desde el query parameter estándar ?token=valor
    const tokenParam = this.route.snapshot.queryParamMap.get('token');
    this.token.set(tokenParam ?? '');
    
    // Si no hay token, redirigir al registro
    if (!this.token()) {
      this.router.navigate(['/signup']);
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

  /* Envía el código para verificación usando el token y navega a la página de confirmación. */
  onVerify() {
    if (!this.canVerify || this.isLoading) {
      if (!this.canVerify) {
        this.triggerShakeError();
      }
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    this.buttonState = 'pressed';
    
    // Llamada al nuevo endpoint con token
    this.api.verifyUserWithToken(this.token(), this.code).subscribe({
      next: (response: any) => {
        console.log('Verificación exitosa:', response);
        // Redirigir a la página de confirmación tras verificación exitosa
        this.router.navigate(['/verified-email'], { queryParams: { token: response.token } });
      },
      error: (error: any) => {
        console.error('Error en verificación:', error);
        this.errorMessage = error.message || 'Código de verificación incorrecto';
        this.isLoading = false;
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
        this.isLoading = false;
        this.buttonState = 'normal';
      }
    });
  }

  /* Reenvía un nuevo código de verificación usando el token actual. */
  onResendCode() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    
    this.api.resendVerificationCode(this.token()).subscribe({
      next: (response: any) => {
        console.log('Código reenviado:', response);
        this.errorMessage = 'Nuevo código enviado a tu email';
        // Limpiar inputs para el nuevo código
        this.codeDigits = ['', '', '', '', '', ''];
        this.inputs.forEach(input => {
          if (input.nativeElement) input.nativeElement.value = '';
        });
        this.focusIndex(0);
      },
      error: (error: any) => {
        console.error('Error al reenviar código:', error);
        this.errorMessage = error.message || 'Error al reenviar el código';
      },
      complete: () => {
        this.isLoading = false;
      }
    });
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
