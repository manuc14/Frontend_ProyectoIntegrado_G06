import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { FooterComponent } from '../../../../shared/footer/footer.component';
import { CodeInputBase } from '../../../../core/base/code-input.base';
import { AuthService } from '../../../../core/services/auth.service';
import { buttonHover, buttonPress, fadeIn, inputFocus, shakeError } from '../../../../core/animations/animations';
import { environment } from '../../../../../environments/environment';

/**
 * Verify OTP Page
 * Pantalla 6 del flujo de login: Solicita el código OTP de Google Authenticator
 * después de que el usuario haya ingresado sus credenciales correctamente.
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

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService
  ) {
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

    console.log('🔐 [Verify OTP] Verificando código OTP...');
    console.log('   - Email:', this.email());
    console.log('   - Session Token:', this.tempToken() ? '✅ presente' : '❌ falta');
    console.log('   - Código ingresado:', this.code.length, 'dígitos');

    // Llamar al endpoint de verificación OTP
    this.http.post<{
      accessToken: string;
      refreshToken: string;
      user: any;
      idleTimeoutMillis: number;
      absoluteTimeoutMillis: number;
    }>(`${environment.baseApiUrl}/auth/2fa/verify`, {
      sessionToken: this.tempToken(),
      code: this.code
    }).subscribe({
      next: (response) => {
        console.log('✅ [Verify OTP] Código verificado exitosamente');
        console.log('   - Response keys:', Object.keys(response));
        console.log('   - User data:', response.user ? '✅ presente' : '⚠️ ausente');
        
        // Limpiar datos temporales
        sessionStorage.removeItem('otpEmail');
        sessionStorage.removeItem('otpTempToken');

        // Guardar tokens y configuración de sesión usando AuthService
        this.authService.setAccessToken(response.accessToken);
        this.authService.setRefreshTokenPublic(response.refreshToken);
        this.authService.saveSessionConfig(
          response.idleTimeoutMillis,
          response.absoluteTimeoutMillis
        );

        // Guardar datos del usuario (solo si existen)
        if (response.user) {
          console.log('📝 [Verify OTP] Guardando usuario:', response.user);
          sessionStorage.setItem('currentUser', JSON.stringify(response.user));
          this.redirectToUserHome();
        } else {
          console.warn('⚠️ [Verify OTP] response.user está vacío - obteniendo datos del usuario del backend');
          // Obtener datos del usuario del backend usando el token recién obtenido
          this.authService.getCurrentUserFromBackend().subscribe({
            next: (userData: any) => {
              console.log('📝 [Verify OTP] Datos del usuario obtenidos:', userData);
              sessionStorage.setItem('currentUser', JSON.stringify(userData));
              this.redirectToUserHome();
            },
            error: (error: any) => {
              console.warn('⚠️ [Verify OTP] No se pudieron obtener datos del usuario del backend:', error);
              // Continuar mismo sin datos completos - se usará el JWT
              this.redirectToUserHome();
            }
          });
        }
      },
      error: (error) => {
        console.error('❌ [Verify OTP] Error verificando código:', error);
        console.error('   - Status:', error?.status);
        console.error('   - URL:', error?.url);
        console.error('   - Error response:', error?.error);
        
        // Extraer mensaje de error
        const errorData = error?.error || {};
        this.errorMessage = errorData?.message || error?.message || 'Código OTP incorrecto o expirado';
        
        // Loguear detalles específicos si existen
        if (errorData?.details) {
          console.error('   - Detalles de validación:', errorData.details);
          this.errorMessage = errorData.details.map((d: any) => d.message).join(', ');
        }
        
        this.hasError = true;
        this.isVerifying = false;
        this.buttonState = 'normal';
        this.triggerShakeError();
        this.clearCodeInputs();
      },
      complete: () => {
        this.isVerifying = false;
        this.buttonState = 'normal';
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

  /**
   * Solicita usar un código de respaldo (en caso de pérdida del dispositivo)
   */
  onUseBackupCode(): void {
    // Funcionalidad pendiente: Se implementará cuando sea necesario
    // En caso de que el usuario no tenga acceso a su dispositivo TOTP,
    // deberá usar un código de respaldo que se le proporcionó al configurar 2FA
    console.log('ℹ️ [Verify OTP] Usar código de respaldo - pendiente de implementar');
    alert('Funcionalidad de código de respaldo próximamente');
  }
}
