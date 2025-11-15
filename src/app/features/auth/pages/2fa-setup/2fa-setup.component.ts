import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, signal, Output, EventEmitter, ViewChildren, QueryList, ElementRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { MFAService } from '../../../../core/services/mfa.service';
import { CodeInputBase } from '../../../../core/base/code-input.base';
import { buttonHover, buttonPress, fadeIn } from '../../../../core/animations/animations';
import { ActionButtonComponent } from '../../../../shared/components/action-button/action-button.component';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';

@Component({
  selector: 'app-2fa-setup',
  standalone: true,
  imports: [CommonModule, ActionButtonComponent, BackButtonComponent],
  templateUrl: './2fa-setup.component.html',
  styleUrl: './2fa-setup.component.scss',
  animations: [buttonHover, buttonPress, fadeIn]
})
export class TwoFactorSetupComponent extends CodeInputBase implements OnInit {
  @Input() setupResponse: any = null;
  @Input() sessionToken: string = '';
  @Output() setupCompleted = new EventEmitter<any>();
  @Output() setupError = new EventEmitter<string>();

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly mfaService = inject(MFAService);

  @ViewChildren('backupInput') backupInputsElements!: QueryList<ElementRef<HTMLInputElement>>;

  currentStep = signal<number>(1);
  showBackupCodes = signal<boolean>(false);
  backupCodesCopied = signal<boolean>(false);
  qrScanned = signal<boolean>(false);
  codesAcknowledged = signal<boolean>(false);
  isVerifying = signal<boolean>(false);
  hasError = signal<boolean>(false);
  errorMessage = signal<string>('');
  useBackupCode = signal<boolean>(false);
  backupCodeInput = signal<string>('');

  ngOnInit(): void {
    if (!this.setupResponse) {
      this.setupError.emit('Error al obtener configuración de 2FA. Intenta nuevamente.');
      setTimeout(() => this.router.navigate(['/login']), 2000);
    }
  }

  markQrAsScanned(): void { this.qrScanned.set(true); }
  markCodesAsAcknowledged(): void { this.codesAcknowledged.set(true); }
  get canProceedToStep2(): boolean { return this.qrScanned() && this.codesAcknowledged(); }
  proceedToVerification(): void { if (this.canProceedToStep2) this.currentStep.set(2); }
  goBackToStep1(): void { this.currentStep.set(1); }
  toggleBackupCodes(): void { this.showBackupCodes.set(!this.showBackupCodes()); }
  formatBackupCodes(): string[] { return this.setupResponse?.backupCodes || []; }

  copyBackupCodes(): void {
    const codes = this.setupResponse?.backupCodes?.join('\n') || '';
    navigator.clipboard.writeText(codes).then(() => {
      this.backupCodesCopied.set(true);
      setTimeout(() => this.backupCodesCopied.set(false), 2000);
    });
  }

  verifyAndEnable(): void {
    const code = this.useBackupCode() ? this.backupCodeInput() : this.code;
    if (!this.useBackupCode() && this.code.length !== 6) return;
    if (this.useBackupCode() && !/^\d{8}$/.test(this.backupCodeInput())) return;
    const sessionTokenToUse = sessionStorage.getItem('twoFactorSessionToken');
    if (!sessionTokenToUse) {
      this.hasError.set(true);
      this.errorMessage.set('Sesión expirada. Inicia sesión nuevamente.');
      setTimeout(() => window.location.href = '/login', 2000);
      return;
    }
    this.isVerifying.set(true);
    this.hasError.set(false);
    this.errorMessage.set(''); // Limpiar mensaje anterior
    this.buttonState = 'pressed';
    this.mfaService.verifyFactor(sessionTokenToUse, 'TOTP', code, null).subscribe({
      next: (response) => {
        this.isVerifying.set(false);
        this.buttonState = 'normal';
        console.log('[2FA-SETUP] Respuesta recibida:', response.state, response.message);
        if (response.state === 'COMPLETED' || response.state === 'REQUIRES_FACTOR') {
          this.hasError.set(false);
          this.errorMessage.set('');
          this.setupCompleted.emit(response);
        } else {
          this.hasError.set(true);
          this.errorMessage.set('El código introducido es incorrecto. Por favor, intenta de nuevo.');
          this.clearCodeInputs();
          this.triggerShakeError();
        }
      },
      error: (error) => {
        this.isVerifying.set(false);
        this.buttonState = 'normal';
        const mfaError = this.mfaService.mapErrorToMFAError(error);
        if (mfaError.type === 'EXPIRED_SESSION') {
          this.authService.emitSessionExpired();
        } else {
          this.hasError.set(true);
          this.errorMessage.set(mfaError.message);
          this.clearCodeInputs();
          this.triggerShakeError();
        }
      }
    });
  }

  toggleUseBackupCode(): void {
    this.useBackupCode.set(!this.useBackupCode());
    this.hasError.set(false);
    this.clearCodeInputs();
    this.backupCodeInput.set('');
  }

  onBackupInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '');
    if (value) {
      input.value = value;
      const current = this.backupCodeInput();
      this.backupCodeInput.set(current.substring(0, index) + value + current.substring(index + 1));
      if (index < 7 && value.length === 1) {
        const inputs = this.backupInputsElements.toArray();
        inputs[index + 1]?.nativeElement.focus();
      }
    }
    if (this.hasError()) this.hasError.set(false);
  }

  onBackupKeyDown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && index > 0 && !(event.target as HTMLInputElement).value) {
      this.backupInputsElements.toArray()[index - 1]?.nativeElement.focus();
    }
  }

  onBackupPaste(index: number, event: ClipboardEvent): void {
    event.preventDefault();
    const paste = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 8);
    if (!paste) return;
    this.backupCodeInput.set(paste);
    const inputs = this.backupInputsElements.toArray();
    paste.split('').forEach((char, i) => { if (inputs[i]) inputs[i].nativeElement.value = char; });
  }

  onBackupInputFocus(index: number): void { this.focusedInput = index; }
  isValidBackupCode(): boolean { return /^\d{8}$/.test(this.backupCodeInput()); }
  override get canVerify(): boolean { return this.useBackupCode() ? this.isValidBackupCode() : this.code.length === 6; }
  override triggerShakeError(): void { this.shakeForm = true; setTimeout(() => this.shakeForm = false, 500); }
}
