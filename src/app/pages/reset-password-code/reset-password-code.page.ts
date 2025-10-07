/**
 * Página para verificar el código de verificación durante el proceso de recuperación de contraseña.
 * Segundo paso del flujo de restablecimiento de contraseña.
 */
import { Component, OnInit, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';

@Component({
  selector: 'app-reset-password-code',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './reset-password-code.page.html',
  styleUrls: ['./reset-password-code.page.scss']
})
export class ResetPasswordCodePage implements OnInit {
  isLoading = false;
  errorMessage = '';
  email = '';
  codeDigits: string[] = ['', '', '', '', '', ''];

  @ViewChildren('codeInput') inputs!: QueryList<ElementRef<HTMLInputElement>>;

  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Obtener email de los query params
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      if (!this.email) {
        // Si no hay email, redirigir al primer paso
        this.router.navigate(['/forgot-password']);
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

  /**
   * Verifica el código de verificación introducido por el usuario
   */
  onSubmit() {
    if (!this.canVerify) return;
    
    this.isLoading = true;
    this.errorMessage = '';

    this.api.verifyResetCode(this.email, this.code).subscribe({
      next: () => {
        // Navegar al tercer paso con email y código
        this.router.navigate(['/new-password'], {
          queryParams: { email: this.email, code: this.code }
        });
      },
      error: (error: any) => {
        this.errorMessage = error.message || 'Código de verificación incorrecto';
        this.isLoading = false;
        // Limpiar inputs en caso de error
        this.codeDigits = ['', '', '', '', '', ''];
        this.inputs.forEach(input => {
          if (input.nativeElement) input.nativeElement.value = '';
        });
        this.focusIndex(0);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  /**
   * Reenvía el código de verificación al email
   */
  resendCode() {
    this.isLoading = true;
    this.errorMessage = '';

    this.api.requestPasswordReset(this.email).subscribe({
      next: () => {
        this.errorMessage = 'Código reenviado correctamente';
        // Limpiar inputs después de reenviar
        this.codeDigits = ['', '', '', '', '', ''];
        this.inputs.forEach(input => {
          if (input.nativeElement) input.nativeElement.value = '';
        });
        this.focusIndex(0);
      },
      error: (error: any) => {
        this.errorMessage = error.message || 'Error al reenviar el código';
      },
      complete: () => {
        this.isLoading = false;
      }
    });
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
}