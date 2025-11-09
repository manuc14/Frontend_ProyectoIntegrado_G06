import { CommonModule } from '@angular/common';
import { Component, signal, Output, EventEmitter, Input, ViewChildren, QueryList, ElementRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CodeInputBase } from '../../../../core/base/code-input.base';
import { AuthService } from '../../../../core/services/auth.service';
import { MFAService } from '../../../../core/services/mfa.service';
import { buttonHover, buttonPress, fadeIn, inputFocus, shakeError } from '../../../../core/animations/animations';
import { ActionButtonComponent } from '../../../../shared/components/action-button/action-button.component';

@Component({
  selector: 'app-2fa-verify',
  standalone: true,
  imports: [CommonModule, ActionButtonComponent],
  templateUrl: './2fa-verify.component.html',
  styleUrl: './2fa-verify.component.scss',
  animations: [buttonHover, buttonPress, fadeIn, inputFocus, shakeError]
})
export class TwoFactorVerifyComponent extends CodeInputBase {
  @Input() sessionToken = '';
  @Input() email = '';
  @Input() verificationToken = '';
  @Input() nextFactor: string | null = null;
  @Output() verifyCompleted = new EventEmitter<any>();
  @Output() verifyError = new EventEmitter<string>();

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly mfaService = inject(MFAService);

  isVerifying = signal(false);
  hasError = signal(false);
  errorMessage = signal('');
  useBackupCode = signal(false);
  backupCodeInput = signal('');

  @ViewChildren('codeInput') declare inputs: QueryList<ElementRef<HTMLInputElement>>;
  @ViewChildren('backupInput') backupInputsElements!: QueryList<ElementRef<HTMLInputElement>>;

  override triggerShakeError(): void {
    this.shakeForm = true;
    setTimeout(() => this.shakeForm = false, 500);
  }

  onVerify(): void {
    const code = this.useBackupCode() ? this.backupCodeInput() : this.code;
    const isValid = this.useBackupCode() ? /^[A-Za-z0-9]{8}$/.test(code.trim()) : this.canVerify;
    
    if (this.isVerifying() || !isValid) {
      if (!isValid) this.triggerShakeError();
      return;
    }

    this.isVerifying.set(true);
    this.hasError.set(false);
    this.buttonState = 'pressed';

    const factorType = this.nextFactor === 'EMAIL_CODE' ? 'EMAIL_CODE' : this.useBackupCode() ? 'BACKUP_CODE' : 'TOTP';

    this.mfaService.verifyFactor(this.sessionToken, factorType, code, this.nextFactor === 'EMAIL_CODE' ? this.verificationToken : null).subscribe({
      next: (res) => {
        this.isVerifying.set(false);
        this.buttonState = 'normal';
        if (res.state === 'COMPLETED' || res.state === 'REQUIRES_FACTOR') {
          this.verifyCompleted.emit(res);
        } else {
          this.hasError.set(true);
          this.errorMessage.set(res.message || 'Código incorrecto');
          this.triggerShakeError();
          this.clearCodeInputs();
        }
      },
      error: (err) => {
        this.isVerifying.set(false);
        this.buttonState = 'normal';
        const mfaError = this.mfaService.mapErrorToMFAError(err);
        if (mfaError.type === 'EXPIRED_SESSION') {
          this.authService.emitSessionExpired();
        } else {
          this.hasError.set(true);
          this.errorMessage.set(mfaError.message);
          this.triggerShakeError();
        }
      }
    });
  }

  onResendCode(): void {
    if (this.nextFactor !== 'EMAIL_CODE' || !this.verificationToken || this.isVerifying()) return;

    this.isVerifying.set(true);
    this.mfaService.resendEmailCode(this.verificationToken, this.sessionToken).subscribe({
      next: () => {
        this.isVerifying.set(false);
        this.errorMessage.set('✅ Código reenviado. Revisa tu email.');
        this.clearCodeInputs();
        setTimeout(() => this.inputs.first?.nativeElement.focus(), 200);
      },
      error: (err) => {
        this.isVerifying.set(false);
        this.hasError.set(true);
        this.errorMessage.set(this.mfaService.mapErrorToMFAError(err).message);
        this.triggerShakeError();
      }
    });
  }

  toggleBackupCode(): void {
    this.useBackupCode.update(v => !v);
    this.clearCodeInputs();
    this.backupCodeInput.set('');
    this.hasError.set(false);
    setTimeout(() => (this.useBackupCode() ? this.backupInputsElements : this.inputs).first?.nativeElement.focus(), 100);
  }

  get isVerifyButtonDisabled(): boolean {
    const code = this.useBackupCode() ? this.backupCodeInput() : this.code;
    const isValid = this.useBackupCode() ? /^[A-Za-z0-9]{8}$/.test(code.trim()) : this.canVerify;
    return this.isVerifying() || !isValid;
  }

  onBackupInput(index: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value.replace(/\s/g, '').toUpperCase();
    const current = this.backupCodeInput();
    this.backupCodeInput.set(current.substring(0, index) + value + current.substring(index + 1));
    if (value && index < 7) this.backupInputsElements.toArray()[index + 1]?.nativeElement.focus();
    if (this.hasError()) this.hasError.set(false);
  }

  onBackupKeyDown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && index > 0 && !(event.target as HTMLInputElement).value) {
      this.backupInputsElements.toArray()[index - 1]?.nativeElement.focus();
    }
  }

  onBackupPaste(index: number, event: ClipboardEvent): void {
    event.preventDefault();
    const paste = event.clipboardData?.getData('text').replace(/\s/g, '').toUpperCase().slice(0, 8);
    if (paste) {
      this.backupCodeInput.set(paste);
      this.backupInputsElements.toArray().forEach((el, i) => el.nativeElement.value = paste[i] || '');
    }
  }

  onBackupInputFocus(index: number): void { this.focusedInput = index; }
  getBackupInputFocusState(index: number): string { return this.focusedInput === index ? 'focused' : ''; }
  isValidBackupCode(): boolean { return /^\d{8}$/.test(this.backupCodeInput().trim()); }
}
