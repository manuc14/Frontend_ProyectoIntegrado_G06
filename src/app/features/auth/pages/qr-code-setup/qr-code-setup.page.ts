import { CommonModule } from '@angular/common';
import { Component, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { FooterComponent } from '../../../../shared/footer/footer.component';
import { buttonHover, buttonPress, fadeIn } from '../../../../core/animations/animations';

/**
 * QR Code Setup Page
 * Pantalla 2 del flujo de registro: Muestra el QR code para Google Authenticator
 * y los códigos de respaldo. El usuario debe escanear el QR antes de continuar
 * a la verificación de email.
 * 
 * SEGURIDAD: Los datos se pasan por sessionStorage (no en URL)
 */
@Component({
  selector: 'app-qr-code-setup',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './qr-code-setup.page.html',
  styleUrl: './qr-code-setup.page.scss',
  animations: [buttonHover, buttonPress, fadeIn]
})
export class QrCodeSetupPage implements OnInit {
  // Datos del 2FA recuperados de sessionStorage
  readonly qrCodeUrl = signal<string>('');
  readonly backupCodes = signal<string[]>([]);
  readonly email = signal<string>('');
  readonly token = signal<string>('');
  
  // Estado de UI
  showBackupCodes = false;
  buttonState = 'normal';
  copiedCode = -1;
  
  // Validaciones para flujo seguro
  qrScanned = false;
  codesAcknowledged = false;
  errorMessage = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Leer datos de sessionStorage (más seguro que queryParams)
    const qrCode = sessionStorage.getItem('qrCodeSetup_qrCode');
    const backupCodesStr = sessionStorage.getItem('qrCodeSetup_backupCodes');
    const email = sessionStorage.getItem('qrCodeSetup_email');
    const token = sessionStorage.getItem('qrCodeSetup_token');
    const qrScanned = sessionStorage.getItem('qrCodeSetup_qrScanned') === 'true';
    const codesAcknowledged = sessionStorage.getItem('qrCodeSetup_codesAcknowledged') === 'true';

    // Validar que existan todos los parámetros necesarios
    if (!qrCode || !backupCodesStr || !email || !token) {
      console.error('❌ [QR Setup] Faltan parámetros necesarios en sessionStorage, redirigiendo a signup');
      this.router.navigate(['/signup']);
      return;
    }

    // Asignar valores
    this.qrCodeUrl.set(qrCode);
    this.email.set(email);
    this.token.set(token);
    this.qrScanned = qrScanned;
    this.codesAcknowledged = codesAcknowledged;
    
    // Parsear códigos de respaldo
    try {
      const codes = JSON.parse(backupCodesStr);
      this.backupCodes.set(codes);
    } catch (error) {
      console.error('❌ [QR Setup] Error parseando backup codes:', error);
      this.router.navigate(['/signup']);
    }

    console.log('✅ [QR Setup] Página cargada correctamente');
  }

  /**
   * Marca que el usuario ha reconocido haber escaneado el QR
   */
  markQrAsScanned(): void {
    this.qrScanned = true;
    sessionStorage.setItem('qrCodeSetup_qrScanned', 'true');
    console.log('✅ [QR Setup] QR marcado como escaneado');
  }

  /**
   * Toggle para mostrar/ocultar códigos de respaldo
   */
  toggleBackupCodes(): void {
    this.showBackupCodes = !this.showBackupCodes;
    
    // Si se muestran y luego se interactúa con ellos, marcar como reconocidos
    if (this.showBackupCodes) {
      console.log('👁️ [QR Setup] Códigos de respaldo mostrados');
    }
  }

  /**
   * Marca que el usuario ha reconocido los códigos de respaldo
   * Se llama cuando descarga o copia los códigos
   */
  private markCodesAsAcknowledged(): void {
    this.codesAcknowledged = true;
    sessionStorage.setItem('qrCodeSetup_codesAcknowledged', 'true');
    console.log('✅ [QR Setup] Códigos de respaldo reconocidos');
  }

  /**
   * Copia un código de respaldo al portapapeles
   */
  async copyCode(code: string, index: number): Promise<void> {
    try {
      await navigator.clipboard.writeText(code);
      this.markCodesAsAcknowledged();
      this.copiedCode = index;
      setTimeout(() => {
        this.copiedCode = -1;
      }, 2000);
    } catch (error) {
      console.error('❌ [QR Setup] Error copiando código:', error);
    }
  }

  /**
   * Continúa al siguiente paso: verificación de email
   * SOLO si ha escaneado el QR y reconocido los códigos
   */
  onContinue(): void {
    this.errorMessage = '';

    // Validar que ha completado las acciones necesarias
    if (!this.qrScanned) {
      this.errorMessage = '⚠️ Por favor, confirma que has escaneado el QR con Google Authenticator';
      return;
    }

    if (!this.codesAcknowledged) {
      this.errorMessage = '⚠️ Por favor, guarda o copia los códigos de respaldo antes de continuar';
      return;
    }

    this.buttonState = 'pressed';
    
    // Navegar a verify-code con el token de verificación
    setTimeout(() => {
      // Limpiar datos de 2FA setup antes de ir a verify-email
      sessionStorage.removeItem('qrCodeSetup_qrCode');
      sessionStorage.removeItem('qrCodeSetup_backupCodes');
      sessionStorage.removeItem('qrCodeSetup_qrScanned');
      sessionStorage.removeItem('qrCodeSetup_codesAcknowledged');
      
      this.router.navigate(['/verify-code'], {
        queryParams: {
          token: this.token(),
          email: this.email()
        }
      });
    }, 200);
  }

  /**
   * Descarga los códigos de respaldo como archivo de texto
   */
  downloadBackupCodes(): void {
    this.markCodesAsAcknowledged();
    const codes = this.backupCodes().join('\n');
    const blob = new Blob([codes], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-codes-${this.email()}.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}

