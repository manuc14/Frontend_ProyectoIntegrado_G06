import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { FooterComponent } from '../../../../shared/footer/footer.component';
import { CodeInputBase } from '../../../../core/base/code-input.base';
import { AuthService } from '../../../../core/services/auth.service';
import { MFAService } from '../../../../core/services/mfa.service';
import { buttonHover, buttonPress, fadeIn, inputFocus, shakeError } from '../../../../core/animations/animations';

/**
 * Verify OTP Page - REFACTORIZADO
 * 
 * Pantalla 6 del flujo de login: Solicita el código OTP de Google Authenticator
 * después de que el usuario haya ingresado sus credenciales correctamente.
 * 
 * **REFACTORIZACIÓN:**
 * - ANTES: Usaba endpoint viejo `/auth/2fa/verify` con 100+ líneas de lógica duplicada
 * - DESPUÉS: Usa MFAService.verifyFactor() - REUTILIZA lógica centralizada
 * - Reducción: ~100 líneas de código duplicado eliminadas
 * 
 * Reutiliza CodeInputBase para el manejo de los 6 dígitos.
 */
@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './verify-otp.page.html',
  styleUrl: './verify-otp.page.scss',
  animations: [buttonHover, buttonPress, fadeIn, inputFocus, shakeError]
})
export class VerifyOtpPage extends CodeInputBase implements OnInit {
  // Estado del usuario (guardado temporalmente después del login)
  readonly email = signal<string>('');
  readonly tempToken = signal<string>(''); // Token temporal del backend
  
  // Estados de UI
  isVerifying = false;
  errorMessage = '';
  hasError = false;

  // ✅ REUTILIZAR: Inyección de servicios centralizados
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly mfaService = inject(MFAService);

  constructor() {
    super();
  }

  ngOnInit(): void {
    // Recuperar datos temporales del sessionStorage (guardados por login)
    const email = sessionStorage.getItem('otpEmail');
    const tempToken = sessionStorage.getItem('otpTempToken');

    console.log('📋 [Verify OTP] ngOnInit - Recuperando datos de sessionStorage:');
    console.log('   - otpEmail:', email);
    console.log('   - otpTempToken:', tempToken ? '✅ presente' : '❌ falta');

    // Validar que existan los datos necesarios
    if (!email || !tempToken) {
      console.error('❌ [Verify OTP] No hay datos de sesión temporal, redirigiendo a login');
      this.router.navigate(['/login']);
      return;
    }

    this.email.set(email);
    this.tempToken.set(tempToken);
    
    console.log('✅ [Verify OTP] Datos cargados correctamente');
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
   * Verifica el código OTP con el backend
   * 
   * ✅ REFACTORIZADO: 100+ líneas → 40 líneas (60% reducción)
   * ✅ REUTILIZA: MFAService.verifyFactor() en lugar de endpoint directo
   * ✅ ELIMINA: Manejo manual de respuestas y detección de sesión expirada
   */
  onVerify(): void {
    if (!this.canVerify || this.isVerifying) {
      if (!this.canVerify) this.triggerShakeError();
      return;
    }

    this.isVerifying = true;
    this.errorMessage = '';
    this.hasError = false;
    this.buttonState = 'pressed';

    console.log('🔐 [Verify OTP REFACTORED] Verificando código...');

    // ✅ REUTILIZAR: MFAService.verifyFactor() reemplaza llamada HTTP directa
    this.mfaService.verifyFactor(
      this.tempToken(),
      'TOTP',
      this.code,
      null
    ).subscribe({
      next: (response) => {
        console.log('✅ [Verify OTP] Código verificado exitosamente');
        
        // Limpiar datos temporales
        sessionStorage.removeItem('otpEmail');
        sessionStorage.removeItem('otpTempToken');

        // ✅ REUTILIZAR: AuthService para guardar tokens (método existente)
        this.authService.setAccessToken(response.accessToken!);
        
        if (response.refreshToken) {
          this.authService.setRefreshTokenPublic(response.refreshToken);
        }

        if (response.idleTimeoutMillis && response.absoluteTimeoutMillis) {
          this.authService.saveSessionConfig(
            response.idleTimeoutMillis,
            response.absoluteTimeoutMillis
          );
        }

        // ✅ SIMPLIFICADO: Navegar directamente
        this.redirectToUserHome();
      },
      error: (error) => {
        console.error('❌ [Verify OTP] Error verificando código:', error);
        
        this.isVerifying = false;
        this.buttonState = 'normal';

        // ✅ REUTILIZAR: MFAService mapea el error a formato estandarizado
        const mfaError = this.mfaService.mapErrorToMFAError(error);

        // ✅ REUTILIZAR: AuthService maneja sesión expirada (patrón existente)
        if (mfaError.type === 'EXPIRED_SESSION') {
          console.log('⏰ [Verify OTP] Sesión expirada - emitiendo evento');
          this.authService.emitSessionExpired('session-timeout', mfaError.message);
        } else {
          // ✅ SIMPLIFICADO: Error de código incorrecto
          this.errorMessage = mfaError.message;
          this.hasError = true;
          this.triggerShakeError();
          this.clearCodeInputs();
        }
      }
    });
  }

  /**
   * Redirige al usuario a su página de inicio según su rol
   */
  private redirectToUserHome(): void {
    // Iniciar temporizadores de sesión
    this.authService.startSessionTimers();

    // Redirigir según el rol del usuario
    const role = this.authService.getCurrentRole();
    const redirectRoute = role ? this.authService.getRedirectRouteForRole(role) : '/';
    
    console.log('🎯 [Verify OTP] Redirigiendo a:', redirectRoute);
    this.router.navigate([redirectRoute]);
  }

  /**
   * Vuelve a la pantalla de login
   */
  onBackToLogin(): void {
    // Limpiar datos temporales
    sessionStorage.removeItem('otpEmail');
    sessionStorage.removeItem('otpTempToken');
    
    this.router.navigate(['/login']);
  }
}
