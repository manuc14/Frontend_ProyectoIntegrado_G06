import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, signal, Output, EventEmitter, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { buttonHover, buttonPress, fadeIn } from '../../../../core/animations/animations';
import { ActionButtonComponent } from '../../../../shared/components/action-button/action-button.component';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';

/**
 * 2FA Setup Component
 * Pantalla de setup de 2FA para usuarios nuevos sin 2FA configurado
 * 
 * Muestra:
 * - Código QR para escanear
 * - Secreto para entrada manual
 * - Códigos de respaldo para guardar
 * - Input para verificar el código TOTP
 */
@Component({
  selector: 'app-2fa-setup',
  standalone: true,
  imports: [CommonModule, ActionButtonComponent, BackButtonComponent],
  templateUrl: './2fa-setup.component.html',
  styleUrl: './2fa-setup.component.scss',
  animations: [buttonHover, buttonPress, fadeIn]
})
export class TwoFactorSetupComponent implements OnInit {
  // Inputs desde el contenedor
  @Input() setupResponse: any = null;
  @Input() sessionToken: string = '';

  // Outputs hacia el contenedor
  @Output() setupCompleted = new EventEmitter<any>();
  @Output() setupError = new EventEmitter<string>();

  // Referencias a inputs individuales
  @ViewChildren('codeInput') codeInputs!: QueryList<ElementRef<HTMLInputElement>>;
  @ViewChildren('backupInput') backupInputs!: QueryList<ElementRef<HTMLInputElement>>;

  // Control de pasos (2 pasos principales)
  currentStep = signal<number>(1); // 1: QR + Respaldo, 2: Verificar OTP

  // Estado de UI - PASO 1: QR + Respaldo
  showBackupCodes = signal<boolean>(false);
  backupCodesCopied = signal<boolean>(false);
  qrScanned = signal<boolean>(false);
  codesAcknowledged = signal<boolean>(false);
  canProceedToStep2 = signal<boolean>(false);

  // Estado de UI - PASO 2: OTP Verify
  totpCode = signal<string>('');
  isVerifying = signal<boolean>(false);
  hasError = signal<boolean>(false);
  errorMessage = signal<string>('');
  useBackupCode = signal<boolean>(false); // Toggle entre TOTP y código de respaldo
  backupCodeInput = signal<string>(''); // Código de respaldo ingresado
  focusedInputIndex = signal<number | null>(null);

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    console.log('📋 [2FA Setup] Inicializando componente de setup');
    console.log('   - setupResponse recibido:', this.setupResponse);
    console.log('   - sessionToken recibido:', this.sessionToken ? '✅' : '❌');
    
    if (!this.setupResponse) {
      console.error('❌ [2FA Setup] No hay setupResponse, redirigiendo a login');
      this.setupError.emit('Error al obtener configuración de 2FA. Intenta nuevamente.');
      setTimeout(() => this.router.navigate(['/login']), 2000);
      return;
    }
    
    console.log('✅ [2FA Setup] setupResponse disponible:');
    console.log('   - QR Code:', this.setupResponse.qrCode ? '✅' : '❌');
    console.log('   - Secret:', this.setupResponse.secret ? '✅' : '❌');
    console.log('   - Backup Codes:', this.setupResponse.backupCodes?.length || 0);
  }

  /**
   * Marca QR como escaneado y verifica si puede continuar
   */
  markQrAsScanned(): void {
    this.qrScanned.set(true);
    this.checkCanProceed();
    console.log('✅ [2FA Setup] QR marcado como escaneado');
  }

  /**
   * Marca códigos de respaldo como reconocidos y verifica si puede continuar
   */
  markCodesAsAcknowledged(): void {
    this.codesAcknowledged.set(true);
    this.checkCanProceed();
    console.log('✅ [2FA Setup] Códigos de respaldo reconocidos');
  }

  /**
   * Verifica si ambos requisitos del Paso 1 están completados
   */
  checkCanProceed(): void {
    const canProceed = this.qrScanned() && this.codesAcknowledged();
    this.canProceedToStep2.set(canProceed);
  }

  /**
   * Avanza al Paso 2 (Verificación OTP)
   */
  proceedToVerification(): void {
    if (this.canProceedToStep2()) {
      this.currentStep.set(2);
      console.log('📍 [2FA Setup] Avanzando al Paso 2: Verificación OTP');
    }
  }

  /**
   * Retrocede al Paso 1
   */
  goBackToStep1(): void {
    this.currentStep.set(1);
    console.log('📍 [2FA Setup] Retrocediendo al Paso 1: QR + Respaldo');
  }

  /**
   * Copia los códigos de respaldo al portapapeles
   */
  copyBackupCodes(): void {
    const codes = this.setupResponse?.backupCodes?.join('\n') || '';
    navigator.clipboard.writeText(codes).then(() => {
      this.backupCodesCopied.set(true);
      setTimeout(() => this.backupCodesCopied.set(false), 2000);
      console.log('✅ [2FA Setup] Códigos de respaldo copiados al portapapeles');
    });
  }

  /**
   * Toggle para mostrar/ocultar códigos de respaldo
   */
  toggleBackupCodes(): void {
    this.showBackupCodes.set(!this.showBackupCodes());
  }

  /**
   * Verifica e habilita 2FA después de que el usuario introduce el código
   * Solo valida el código TOTP o código de respaldo (Paso 1 ya fue validado)
   */
  verifyAndEnable(): void {
    // Validar según el tipo de código
    if (this.useBackupCode()) {
      // Validar código de respaldo (8 dígitos)
      if (!this.isValidBackupCode()) {
        this.hasError.set(true);
        this.errorMessage.set('El código de respaldo debe tener exactamente 8 caracteres');
        return;
      }
    } else if (this.totpCode().length !== 6 || isNaN(Number(this.totpCode()))) {
      // Validar código TOTP (6 dígitos)
      this.hasError.set(true);
      this.errorMessage.set('Ingresa un código de 6 dígitos válido');
      return;
    }

    this.isVerifying.set(true);
    this.hasError.set(false);

    console.log('🔐 [2FA Setup] Verificando y habilitando 2FA...');

    const request = {
      sessionToken: this.setupResponse.sessionToken,
      code: this.useBackupCode() ? this.backupCodeInput() : this.totpCode(),
      isBackupCode: this.useBackupCode()
    };

    console.log('📤 [2FA Setup] Request:', {
      ...request,
      code: '***' + request.code.slice(-2)
    });

    this.authService.verifyAndEnable(request).subscribe({
      next: (response) => {
        console.log('✅ [2FA Setup] 2FA habilitado exitosamente');
        console.log('   - Response completo:', response);
        console.log('   - Access Token:', response.accessToken ? '✅' : '❌');
        console.log('   - Refresh Token:', response.refreshToken ? '✅' : '❌');
        console.log('   - User:', response.user ? '✅' : '❌');

        // Guardar usuario si viene en respuesta
        if (response.user) {
          sessionStorage.setItem('currentUser', JSON.stringify(response.user));
          console.log('✅ [2FA Setup] Usuario guardado en sessionStorage');
        }

        console.log('📤 [2FA Setup] Emitiendo setupCompleted event...');
        this.setupCompleted.emit(response);
      },
      error: (error) => {
        console.error('❌ [2FA Setup] Error verificando 2FA:', error);
        
        this.isVerifying.set(false);

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

        if (error?.status === 401 && isSessionExpired) {
          // Sesión expirada - emitir evento para mostrar el modal de sesión expirada
          console.log('⏰ [2FA Setup] Sesión expirada detectada - emitiendo evento');
          console.log('   - Mensaje original:', errorMessage);
          this.authService.emitSessionExpired(
            'session-timeout',
            'Tu sesión de verificación ha expirado. Por favor, inicia sesión nuevamente.'
          );
        } else {
          // Para errores de verificación (código incorrecto), mostrar mensaje específico
          this.hasError.set(true);
          if (error?.status === 401 || error?.status === 400) {
            const codeType = this.useBackupCode() ? 'código de respaldo' : 'código TOTP';
            this.errorMessage.set(`${codeType} incorrecto. Verifica e intenta de nuevo.`);
          } else {
            this.errorMessage.set('Error al verificar el código. Intenta de nuevo.');
          }

          // Limpiar el código
          if (this.useBackupCode()) {
            this.backupCodeInput.set('');
          } else {
            this.totpCode.set('');
          }
        }
      }
    });
  }

  /**
   * Toggle para cambiar entre código TOTP y código de respaldo
   */
  toggleBackupCode(): void {
    this.useBackupCode.set(!this.useBackupCode());
    this.hasError.set(false);
    this.totpCode.set('');
    this.backupCodeInput.set('');
    
    // Limpiar todos los inputs
    setTimeout(() => {
      if (this.useBackupCode()) {
        this.backupInputs.toArray().forEach(input => input.nativeElement.value = '');
      } else {
        this.codeInputs.toArray().forEach(input => input.nativeElement.value = '');
      }
    }, 0);
    
    console.log('🔄 [2FA Setup] Cambiando a:', this.useBackupCode() ? 'código de respaldo' : 'código TOTP');
  }

  /**
   * === MANEJO DE INPUTS INDIVIDUALES - CÓDIGO TOTP (6 dígitos) ===
   */

  /**
   * Maneja el input de un dígito del código TOTP
   */
  onCodeInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, ''); // Solo dígitos
    
    if (value) {
      input.value = value; // Asegurar que solo tenga un dígito
      
      // Actualizar el código completo
      this.updateTotpCode();
      
      // Auto-avanzar al siguiente input si no es el último
      if (index < 5 && value.length === 1) {
        const inputs = this.codeInputs.toArray();
        inputs[index + 1]?.nativeElement.focus();
      }
    }
    
    // Limpiar error cuando el usuario empieza a escribir
    if (this.hasError()) {
      this.hasError.set(false);
    }
  }

  /**
   * Maneja keydown en inputs de código TOTP (principalmente para backspace)
   */
  onCodeKeyDown(index: number, event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    
    if (event.key === 'Backspace' && !input.value && index > 0) {
      // Si está vacío y presiona backspace, ir al anterior
      const inputs = this.codeInputs.toArray();
      inputs[index - 1]?.nativeElement.focus();
    }
  }

  /**
   * Maneja el paste en inputs de código TOTP
   */
  onCodePaste(index: number, event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6);
    
    if (pastedData) {
      const inputs = this.codeInputs.toArray();
      const digits = pastedData.split('');
      
      // Distribuir los dígitos en los inputs
      digits.forEach((digit, i) => {
        if (index + i < inputs.length) {
          inputs[index + i].nativeElement.value = digit;
        }
      });
      
      // Actualizar el código completo
      this.updateTotpCode();
      
      // Mover el foco al último input llenado o al siguiente vacío
      const nextIndex = Math.min(index + digits.length, 5);
      inputs[nextIndex]?.nativeElement.focus();
    }
  }

  /**
   * Actualiza el signal totpCode con el valor de todos los inputs
   */
  private updateTotpCode(): void {
    const inputs = this.codeInputs.toArray();
    const code = inputs.map(input => input.nativeElement.value).join('');
    this.totpCode.set(code);
  }

  /**
   * Maneja el focus en un input de código TOTP
   */
  onCodeInputFocus(index: number): void {
    this.focusedInputIndex.set(index);
  }

  /**
   * === MANEJO DE INPUTS INDIVIDUALES - CÓDIGO DE RESPALDO (8 dígitos) ===
   */

  /**
   * Maneja el input de un dígito del código de respaldo
   */
  onBackupInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, ''); // Solo dígitos
    
    if (value) {
      input.value = value; // Asegurar que solo tenga un dígito
      
      // Actualizar el código completo
      this.updateBackupCode();
      
      // Auto-avanzar al siguiente input si no es el último
      if (index < 7 && value.length === 1) {
        const inputs = this.backupInputs.toArray();
        inputs[index + 1]?.nativeElement.focus();
      }
    }
    
    // Limpiar error cuando el usuario empieza a escribir
    if (this.hasError()) {
      this.hasError.set(false);
    }
  }

  /**
   * Maneja keydown en inputs de código de respaldo (principalmente para backspace)
   */
  onBackupKeyDown(index: number, event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    
    if (event.key === 'Backspace' && !input.value && index > 0) {
      // Si está vacío y presiona backspace, ir al anterior
      const inputs = this.backupInputs.toArray();
      inputs[index - 1]?.nativeElement.focus();
    }
  }

  /**
   * Maneja el paste en inputs de código de respaldo
   */
  onBackupPaste(index: number, event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 8);
    
    if (pastedData) {
      const inputs = this.backupInputs.toArray();
      const digits = pastedData.split('');
      
      // Distribuir los dígitos en los inputs
      digits.forEach((digit, i) => {
        if (index + i < inputs.length) {
          inputs[index + i].nativeElement.value = digit;
        }
      });
      
      // Actualizar el código completo
      this.updateBackupCode();
      
      // Mover el foco al último input llenado o al siguiente vacío
      const nextIndex = Math.min(index + digits.length, 7);
      inputs[nextIndex]?.nativeElement.focus();
    }
  }

  /**
   * Actualiza el signal backupCodeInput con el valor de todos los inputs
   */
  private updateBackupCode(): void {
    const inputs = this.backupInputs.toArray();
    const code = inputs.map(input => input.nativeElement.value).join('');
    this.backupCodeInput.set(code);
  }

  /**
   * Maneja el focus en un input de código de respaldo
   */
  onBackupInputFocus(index: number): void {
    this.focusedInputIndex.set(index);
  }

  /**
   * Verifica si el código de respaldo es válido (8 dígitos)
   */
  isValidBackupCode(): boolean {
    const code = this.backupCodeInput();
    return code.length === 8 && !isNaN(Number(code));
  }

  /**
   * Formatea los códigos de respaldo para mostrar
   */
  formatBackupCodes(): string[] {
    return this.setupResponse?.backupCodes || [];
  }

  /**
   * Obtiene el estado del botón de verificación - Válido si código TOTP es 6 dígitos o backup es 8
   */
  get canVerify(): boolean {
    if (this.useBackupCode()) {
      return this.isValidBackupCode();
    }
    return this.totpCode().length === 6;
  }
}
