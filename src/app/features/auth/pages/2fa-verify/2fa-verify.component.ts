import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, Output, EventEmitter, Input, ViewChildren, QueryList, ElementRef, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { CodeInputBase } from '../../../../core/base/code-input.base';
import { AuthService } from '../../../../core/services/auth.service';
import { buttonHover, buttonPress, fadeIn, inputFocus, shakeError } from '../../../../core/animations/animations';
import { ActionButtonComponent } from '../../../../shared/components/action-button/action-button.component';

/**
 * 2FA Verify Component
 * Pantalla de verificación TOTP para usuarios que ya tienen 2FA configurado
 * 
 * Se muestra cuando:
 * - Usuario existente con 2FA habilitado intenta hacer login
 * - Requiere introducir código de 6 dígitos de Google Authenticator
 * - También soporta códigos de respaldo
 */
@Component({
  selector: 'app-2fa-verify',
  standalone: true,
  imports: [CommonModule, ActionButtonComponent],
  templateUrl: './2fa-verify.component.html',
  styleUrl: './2fa-verify.component.scss',
  animations: [buttonHover, buttonPress, fadeIn, inputFocus, shakeError]
})
export class TwoFactorVerifyComponent extends CodeInputBase implements OnInit, AfterViewInit {
  // Inputs desde el contenedor
  @Input() sessionToken: string = '';
  @Input() email: string = '';

  // Outputs hacia el contenedor
  @Output() verifyCompleted = new EventEmitter<any>();
  @Output() verifyError = new EventEmitter<string>();

  // Referencias a inputs individuales
  @ViewChildren('codeInput') codeInputsElements!: QueryList<ElementRef<HTMLInputElement>>;
  @ViewChildren('backupInput') backupInputsElements!: QueryList<ElementRef<HTMLInputElement>>;

  // Estado de UI
  isVerifying = signal<boolean>(false);
  hasError = signal<boolean>(false);
  errorMessage = signal<string>('');
  useBackupCode = signal<boolean>(false);
  backupCodeInput = signal<string>('');
  focusedInputIndex = signal<number | null>(null);
  focusedBackupIndex = signal<number | null>(null);

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    super();
  }

  ngOnInit(): void {
    console.log('📋 [2FA Verify] Inicializando componente de verificación');
    console.log('   - Session Token:', this.sessionToken ? '✅ presente' : '❌ falta');
    console.log('   - Email:', this.email || '❌ no disponible');

    if (!this.sessionToken) {
      console.error('❌ [2FA Verify] No hay sessionToken, redirigiendo a login');
      this.verifyError.emit('Sesión expirada. Por favor, inicia sesión nuevamente.');
      setTimeout(() => this.router.navigate(['/login']), 2000);
    }
  }

  /**
   * Implementación requerida por CodeInputBase
   */
  triggerShakeError(): void {
    this.shakeForm = true;
    setTimeout(() => {
      this.shakeForm = false;
    }, 500);
  }

  /**
   * Verifica el código TOTP con el backend
   */
  onVerify(): void {
    // Validar dependiendo del tipo de código
    const isValid = this.useBackupCode() ? this.isValidBackupCode() : this.canVerify;
    
    if (!isValid || this.isVerifying()) {
      if (!isValid) this.triggerShakeError();
      return;
    }

    this.isVerifying.set(true);
    this.errorMessage.set('');
    this.hasError.set(false);
    this.buttonState = 'pressed';

    console.log('🔐 [2FA Verify] Verificando código ' + (this.useBackupCode() ? 'de respaldo' : 'TOTP') + '...');
    const codeToSend = this.getCodeToVerify();
    console.log('   - Código a enviar:', this.useBackupCode() ? codeToSend : `${this.code.length} dígitos`);
    console.log('   - Es código de respaldo:', this.useBackupCode());
    console.log('   - sessionToken que se usará:', this.sessionToken);
    console.log('   - sessionToken length:', this.sessionToken?.length);
    console.log('   - sessionToken primeros 20 chars:', this.sessionToken?.substring(0, 20));
    console.log('   - sessionToken tipo:', typeof this.sessionToken);

    // Preparar request
    const codeToVerify = this.getCodeToVerify();
    const request = {
      sessionToken: this.sessionToken,
      code: codeToVerify,
      isBackupCode: this.useBackupCode()
    };

    // Log del request completo antes de enviarlo
    console.log('📤 [2FA Verify] Request completo:', {
      sessionToken: '***' + this.sessionToken.slice(-8),
      code: codeToVerify,
      isBackupCode: this.useBackupCode(),
      codeLength: codeToVerify.length
    });

    // Llamar al endpoint de verificación
    this.authService.verify(request).subscribe({
      next: (response) => {
        console.log('✅ [2FA Verify] Código verificado exitosamente');
        console.log('   - Response keys:', Object.keys(response));
        console.log('   - Access Token:', response.accessToken ? '✅' : '❌');
        console.log('   - Refresh Token:', response.refreshToken ? '✅' : '❌');

        // Guardar usuario si viene en respuesta
        if (response.user) {
          console.log('📝 [2FA Verify] Guardando datos del usuario');
          sessionStorage.setItem('currentUser', JSON.stringify(response.user));
        } else {
          console.warn('⚠️ [2FA Verify] response.user no disponible - usuario será construido desde JWT');
          // El usuario será construido desde el JWT en AuthService.getCurrentUser()
          // No hacer llamadas adicionales al backend
        }

        this.verifyCompleted.emit(response);
      },
      error: (error) => {
        console.error('❌ [2FA Verify] Error verificando código:', error);
        console.error('   - Status:', error?.status);
        console.error('   - Message:', error?.error?.message);

        this.isVerifying.set(false);
        this.buttonState = 'normal';

        // Verificar si es una sesión expirada por timeout
        const errorMessage = error?.error?.message || error?.message || '';
        const lowerMessage = errorMessage.toLowerCase();
        
        // Detectar diferentes mensajes de sesión expirada
        const isSessionExpired = 
          (lowerMessage.includes('sesión') && lowerMessage.includes('expirado')) ||
          lowerMessage.includes('sesión de login no encontrada') ||
          lowerMessage.includes('login no encontrada') ||
          lowerMessage.includes('sessiontoken') ||
          lowerMessage.includes('session expired') ||
          lowerMessage.includes('unauthorized');

        if (error?.status === 401) {
          if (isSessionExpired) {
            // Sesión expirada - emitir evento para mostrar el modal de sesión expirada
            console.log('⏰ [2FA Verify] Sesión expirada detectada - emitiendo evento');
            console.log('   - Mensaje original:', errorMessage);
            this.authService.emitSessionExpired(
              'session-timeout',
              'Tu sesión de verificación ha expirado. Por favor, inicia sesión nuevamente.'
            );
          } else {
            // Código incorrecto - mostrar mensaje según el tipo
            console.log('❌ [2FA Verify] Código incorrecto - manejando localmente');
            const message = this.useBackupCode() 
              ? 'Código de respaldo incorrecto. Verifica que esté correctamente ingresado.'
              : 'Código TOTP incorrecto. Verifica tu autenticador.';
            this.errorMessage.set(message);
            this.hasError.set(true);
            this.triggerShakeError();
            // Limpiar inputs
            this.clearCodeInputs();
            this.backupCodeInput.set('');
          }
        } else if (error?.status === 400) {
          // Error 400 - código incorrecto o formato inválido
          const message = this.useBackupCode() 
            ? 'Código de respaldo inválido o incorrecto.'
            : 'Código TOTP incorrecto. Verifica tu autenticador.';
          this.errorMessage.set(message);
          this.hasError.set(true);
          this.triggerShakeError();
          // Limpiar inputs
          this.clearCodeInputs();
          this.backupCodeInput.set('');
        } else {
          // Otros errores
          this.errorMessage.set('Error al verificar el código. Intenta de nuevo.');
          this.verifyError.emit(this.errorMessage());
        }
      }
    });
  }

  /**
   * Toggle entre código TOTP y código de respaldo
   */
  toggleBackupCode(): void {
    this.useBackupCode.set(!this.useBackupCode());
    this.clearCodeInputsNew();
    this.clearBackupInputs();
    this.errorMessage.set('');
    this.hasError.set(false);
    
    // Auto-focus en los inputs correspondientes
    setTimeout(() => {
      if (this.useBackupCode()) {
        this.backupInputsElements.first?.nativeElement.focus();
      } else {
        this.codeInputsElements.first?.nativeElement.focus();
      }
    }, 0);
  }

  /**
   * Retorna el código a verificar (TOTP o respaldo)
   * Importante: Los códigos de respaldo se limpian removiendo espacios y guiones
   */
  getCodeToVerify(): string {
    if (this.useBackupCode()) {
      const inputValue = this.backupCodeInput();
      console.log('📝 [getCodeToVerify] Backup code - valor inicial: "' + inputValue + '"');
      console.log('   - length inicial: ' + inputValue.length);
      
      const code = inputValue.trim().toUpperCase();
      console.log('   - después trim + uppercase: "' + code + '" (length: ' + code.length + ')');
      
      const cleaned = code.replace(/[\s-]/g, '');
      console.log('   - después limpiar espacios/guiones: "' + cleaned + '" (length: ' + cleaned.length + ')');
      console.log('   - Código final a enviar: "' + cleaned + '"');
      
      return cleaned;
    }
    // Actualizar desde inputs antes de retornar
    this.updateCodeFromInputs();
    return this.code;
  }

  /**
   * === AfterViewInit ===
   */
  ngAfterViewInit(): void {
    // Auto-focus en el primer input después de que la vista se inicialice
    setTimeout(() => {
      if (!this.useBackupCode()) {
        this.codeInputsElements.first?.nativeElement.focus();
      } else {
        this.backupInputsElements.first?.nativeElement.focus();
      }
    }, 100);
  }

  /**
   * === MÉTODOS NUEVOS PARA INPUTS INDIVIDUALES - TOTP ===
   */

  onCodeKeyDown(index: number, event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    
    if (event.key === 'Backspace' && !input.value && index > 0) {
      const inputs = this.codeInputsElements.toArray();
      inputs[index - 1]?.nativeElement.focus();
    }
  }

  onCodeInputFocus(index: number): void {
    this.focusedInputIndex.set(index);
    this.onInputFocus(index);
  }

  /**
   * Override del onCodeInput para usar inputs individuales
   */
  onCodeInput(i: number, ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '');
    
    if (value) {
      input.value = value;
      
      // Actualizar el código en la clase base
      this.updateCodeFromInputs();
      
      // Auto-avanzar al siguiente input si no es el último
      if (i < 5 && value.length === 1) {
        const inputs = this.codeInputsElements.toArray();
        inputs[i + 1]?.nativeElement.focus();
      }
    }
    
    if (this.hasError()) {
      this.hasError.set(false);
    }
  }

  /**
   * Override del onCodePaste para inputs individuales
   */
  onCodePaste(i: number, ev: ClipboardEvent): void {
    ev.preventDefault();
    const pastedData = ev.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6);
    
    if (pastedData) {
      const inputs = this.codeInputsElements.toArray();
      const digits = pastedData.split('');
      
      digits.forEach((digit, idx) => {
        if (i + idx < inputs.length) {
          inputs[i + idx].nativeElement.value = digit;
        }
      });
      
      this.updateCodeFromInputs();
      
      const nextIndex = Math.min(i + digits.length, 5);
      inputs[nextIndex]?.nativeElement.focus();
    }
  }

  /**
   * Actualiza this.codeDigits desde los inputs individuales
   */
  private updateCodeFromInputs(): void {
    const inputs = this.codeInputsElements.toArray();
    inputs.forEach((input, i) => {
      this.codeDigits[i] = input.nativeElement.value;
    });
  }

  /**
   * === MÉTODOS NUEVOS PARA INPUTS INDIVIDUALES - BACKUP ===
   */

  onBackupInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '');
    
    if (value) {
      input.value = value;
      this.updateBackupCodeFromInputs();
      
      if (index < 7 && value.length === 1) {
        const inputs = this.backupInputsElements.toArray();
        inputs[index + 1]?.nativeElement.focus();
      }
    }
    
    if (this.hasError()) {
      this.hasError.set(false);
    }
  }

  onBackupKeyDown(index: number, event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    
    if (event.key === 'Backspace' && !input.value && index > 0) {
      const inputs = this.backupInputsElements.toArray();
      inputs[index - 1]?.nativeElement.focus();
    }
  }

  onBackupPaste(index: number, event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 8);
    
    if (pastedData) {
      const inputs = this.backupInputsElements.toArray();
      const digits = pastedData.split('');
      
      digits.forEach((digit, i) => {
        if (index + i < inputs.length) {
          inputs[index + i].nativeElement.value = digit;
        }
      });
      
      this.updateBackupCodeFromInputs();
      
      const nextIndex = Math.min(index + digits.length, 7);
      inputs[nextIndex]?.nativeElement.focus();
    }
  }

  onBackupInputFocus(index: number): void {
    this.focusedBackupIndex.set(index);
  }

  getBackupInputFocusState(index: number): string {
    return this.focusedBackupIndex() === index ? 'focused' : 'blurred';
  }

  /**
   * Actualiza backupCodeInput desde los inputs individuales
   */
  private updateBackupCodeFromInputs(): void {
    const inputs = this.backupInputsElements.toArray();
    const code = inputs.map(input => input.nativeElement.value).join('');
    this.backupCodeInput.set(code);
  }

  /**
   * Limpia todos los inputs de código TOTP
   */
  private clearCodeInputsNew(): void {
    if (this.codeInputsElements) {
      this.codeInputsElements.toArray().forEach((input, i) => {
        input.nativeElement.value = '';
        this.codeDigits[i] = '';
      });
    }
  }

  /**
   * Limpia todos los inputs de código de respaldo
   */
  private clearBackupInputs(): void {
    if (this.backupInputsElements) {
      this.backupInputsElements.toArray().forEach(input => {
        input.nativeElement.value = '';
      });
      this.backupCodeInput.set('');
    }
  }

  /**
   * Valida si el código de respaldo es válido (8 dígitos)
   */
  isValidBackupCode(): boolean {
    const code = this.backupCodeInput();
    return code.length === 8 && !isNaN(Number(code));
  }

  /**
   * Verifica el estado del botón de verificación
   */
  get isVerifyButtonDisabled(): boolean {
    if (this.isVerifying()) {
      return true;
    }
    return this.useBackupCode() ? !this.isValidBackupCode() : !this.canVerify;
  }
}

