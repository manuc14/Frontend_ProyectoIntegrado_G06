import { ElementRef, QueryList, ViewChildren, Directive } from '@angular/core';

/**
 * Clase base abstracta para componentes que manejan input de código de verificación.
 * Proporciona toda la lógica común para:
 * - Navegación automática entre campos
 * - Soporte para pegado de códigos
 * - Manejo de teclas especiales (Backspace, flechas)
 * - Estados de focus y animaciones
 * - Validación de código completo
 */
@Directive()
export abstract class CodeInputBase {
  // Propiedades del input de código
  codeDigits: string[] = ['', '', '', '', '', ''];
  focusedInput = -1;
  
  // Animation states comunes
  shakeForm = false;
  buttonState = 'normal';

  @ViewChildren('codeInput') inputs!: QueryList<ElementRef<HTMLInputElement>>;

  /**
   * Métodos abstractos que cada página debe implementar
   */
  abstract triggerShakeError(): void;

  /**
   * Código completo concatenado
   */
  get code(): string {
    return this.codeDigits.join('');
  }

  /**
   * Habilita verificar cuando hay exactamente 6 dígitos
   */
  get canVerify(): boolean {
    return /^\d{6}$/.test(this.code);
  }

  /**
   * Limpia todos los inputs de código
   */
  protected clearCodeInputs(): void {
    this.codeDigits = ['', '', '', '', '', ''];
    this.inputs.forEach(input => {
      if (input.nativeElement) input.nativeElement.value = '';
    });
    this.focusIndex(0);
  }

  /**
   * Maneja entrada en cada caja, avanzando automáticamente al siguiente campo cuando se completa
   */
  onInput(i: number, ev: Event): void {
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

  /**
   * Maneja navegación con teclas especiales y borrado inteligente entre campos
   */
  onKeyDown(i: number, ev: KeyboardEvent): void {
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

  /**
   * Reparte un texto pegado entre las cajas a partir de un índice
   */
  onPaste(i: number, ev: ClipboardEvent): void {
    const text = ev.clipboardData?.getData('text') ?? '';
    if (!text) return;
    ev.preventDefault();
    const digits = text.replace(/\D/g, '');
    if (!digits) return;
    this.applyPaste(i, digits);
  }

  /**
   * Lógica de reparto de dígitos pegados
   */
  private applyPaste(startIndex: number, digits: string): void {
    const arr = digits.slice(0, 6 - startIndex).split('');
    for (let k = 0; k < arr.length; k++) {
      this.codeDigits[startIndex + k] = arr[k];
      const el = this.inputs.get(startIndex + k)?.nativeElement;
      if (el) el.value = arr[k];
    }
    const next = Math.min(startIndex + arr.length, 5);
    this.focusIndex(next);
  }

  /**
   * Foco en el input i-ésimo
   */
  protected focusIndex(i: number): void {
    const el = this.inputs.get(i)?.nativeElement;
    if (el) el.focus();
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