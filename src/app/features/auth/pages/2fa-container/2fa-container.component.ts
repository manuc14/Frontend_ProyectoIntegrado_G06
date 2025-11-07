import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { fadeIn } from '../../../../core/animations/animations';
import { TwoFactorSetupComponent } from '../2fa-setup/2fa-setup.component';
import { TwoFactorVerifyComponent } from '../2fa-verify/2fa-verify.component';

/**
 * 2FA Container Component
 * Orquestador inteligente del flujo de 2FA post-login
 * 
 * Detecta automáticamente si el usuario es:
 * - NUEVO: Sin 2FA configurado → Muestra QR y setup
 * - EXISTENTE: Con 2FA configurado → Muestra verificación TOTP
 * 
 * Flujo:
 * 1. Recibe sessionToken de login
 * 2. Intenta /setup-during-login
 * 3. Si success → Renderiza 2fa-setup
 * 4. Si error → Usuario es existente, renderiza 2fa-verify
 */
@Component({
  selector: 'app-2fa-container',
  standalone: true,
  imports: [CommonModule, TwoFactorSetupComponent, TwoFactorVerifyComponent],
  templateUrl: './2fa-container.component.html',
  styleUrl: './2fa-container.component.scss',
  animations: [fadeIn]
})
export class TwoFactorContainerComponent implements OnInit {
  // Estado del contenedor
  readonly isLoading = signal<boolean>(true);
  readonly isSetup = signal<boolean>(false);
  readonly isVerify = signal<boolean>(false);
  readonly setupResponse = signal<any>(null);
  readonly errorMessage = signal<string>('');

  // Datos necesarios para ambos flujos
  readonly sessionToken = signal<string>('');
  readonly email = signal<string>('');

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    console.log('🔐 [2FA Container] Inicializando...');

    // Recuperar sessionToken del login
    const sessionToken = sessionStorage.getItem('twoFactorSessionToken');
    const email = sessionStorage.getItem('loginEmail');

    if (!sessionToken) {
      console.error('❌ [2FA Container] No hay sessionToken disponible, redirigiendo a login');
      this.errorMessage.set('Sesión expirada. Por favor, inicia sesión nuevamente.');
      setTimeout(() => this.router.navigate(['/login']), 2000);
      return;
    }

    this.sessionToken.set(sessionToken);
    this.email.set(email || '');

    console.log('✅ [2FA Container] sessionToken recuperado');
    console.log('   - Email:', email || 'no disponible');

    // Detectar tipo de flujo intentando setup
    this.detectTwoFactorFlow();
  }

  /**
   * Detecta el tipo de flujo 2FA basado en el campo twoFactorType del backend
   * 
   * Backend proporciona:
   * - twoFactorType: "SETUP" → Usuario sin 2FA, mostrar QR
   * - twoFactorType: "VERIFY" → Usuario con 2FA, mostrar verificación TOTP
   */
  private detectTwoFactorFlow(): void {
    console.log('🔍 [2FA Container] Detectando flujo de 2FA...');

    // Recuperar twoFactorType del sessionStorage (guardado en login.component)
    const twoFactorType = sessionStorage.getItem('twoFactorType');

    if (!twoFactorType) {
      console.error('❌ [2FA Container] No hay twoFactorType disponible');
      this.errorMessage.set('Error detectando tipo de 2FA. Por favor, intenta de nuevo.');
      setTimeout(() => this.router.navigate(['/login']), 2000);
      return;
    }

    console.log('✅ [2FA Container] twoFactorType recuperado:', twoFactorType);

    // Si es SETUP, obtener datos de QR del backend (siempre fresco)
    if (twoFactorType === 'SETUP') {
      console.log('✅ [2FA Container] Usuario NUEVO detectado - Setup requerido');
      
      // Siempre obtener datos frescos del backend para setup
      console.log('⏳ [2FA Container] Obteniendo datos de setup del backend...');
      this.fetchSetupDataFromBackend();
    } 
    // Si es VERIFY, mostrar verificación TOTP
    else if (twoFactorType === 'VERIFY') {
      console.log('✅ [2FA Container] Usuario EXISTENTE detectado - Verificación requerida');
      this.isSetup.set(false);
      this.isVerify.set(true);
      this.isLoading.set(false);
      
      console.log('✅ [2FA Container] Estados actualizados para VERIFY');
      console.log('   - isSetup():', this.isSetup());
      console.log('   - isVerify():', this.isVerify());
      console.log('   - isLoading():', this.isLoading());
    } 
    else {
      console.error('❌ [2FA Container] twoFactorType desconocido:', twoFactorType);
      this.errorMessage.set('Tipo de 2FA no reconocido.');
      setTimeout(() => this.router.navigate(['/login']), 2000);
    }
  }

  /**
   * Obtiene los datos de setup (QR, secret, códigos respaldo) del backend
   */
  private fetchSetupDataFromBackend(): void {
    const sessionToken = this.sessionToken();
    
    if (!sessionToken) {
      console.error('❌ [2FA Container] No hay sessionToken para obtener setup data');
      this.onError('Sesión expirada. Por favor, intenta de nuevo.');
      return;
    }

    console.log('🌐 [2FA Container] Llamando a /auth/2fa/setup-during-login...');

    this.authService.setupDuringLogin(sessionToken).subscribe({
      next: (response) => {
        console.log('✅ [2FA Container] Setup data obtenido del backend:');
        console.log('   - QR Code:', response?.qrCode ? '✅' : '❌');
        console.log('   - Secret:', response?.secret ? '✅' : '❌');
        console.log('   - Backup Codes:', response?.backupCodes?.length || 0);
        console.log('   - New sessionToken:', response?.sessionToken ? '✅' : '❌');
        
        // ⚠️ IMPORTANTE: Si el backend retorna un nuevo sessionToken, actualizar lo
        // (El sessionToken se puede refrescar/renovar en cada llamada)
        // if (response?.sessionToken) {
        //   console.log('🔄 [2FA Container] Actualizando sessionToken con el del backend');
        //   this.sessionToken.set(response.sessionToken);
        //   sessionStorage.setItem('twoFactorSessionToken', response.sessionToken);
        // }
        
        // Guardar en sessionStorage para usar en 2fa-setup
        sessionStorage.setItem('twoFASetupData', JSON.stringify(response));
        
        // Actualizar signal
        this.setupResponse.set(response);
        
        // Actualizar estados
        this.isSetup.set(true);
        this.isVerify.set(false);
        this.isLoading.set(false);
        
        console.log('✅ [2FA Container] Estados actualizados para SETUP desde backend');
      },
      error: (error) => {
        console.error('❌ [2FA Container] Error obteniendo setup data:', error);
        console.error('   - Status:', error?.status);
        console.error('   - Message:', error?.error?.message);
        
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
          console.log('⏰ [2FA Container] Sesión expirada detectada - emitiendo evento');
          console.log('   - Mensaje original:', errorMessage);
          this.authService.emitSessionExpired(
            'session-timeout',
            'Tu sesión de verificación ha expirado. Por favor, inicia sesión nuevamente.'
          );
        } else if (error?.status === 400) {
          // Si el backend retorna error 400, probablemente el usuario ya tiene 2FA configurado
          // Mostrar pantalla de verificación en lugar de setup
          console.log('ℹ️ [2FA Container] Usuario probablemente ya tiene 2FA, mostrando verificación');
          this.isSetup.set(false);
          this.isVerify.set(true);
          this.isLoading.set(false);
          
          // Actualizar sessionStorage para próxima vez
          sessionStorage.setItem('twoFactorType', 'VERIFY');
        } else {
          this.onError('Error al obtener configuración de 2FA. Por favor, intenta de nuevo.');
        }
      }
    });
  }

  /**
   * Callback cuando el setup se completa exitosamente
   */
  onSetupCompleted(tokens: any): void {
    console.log('✅ [2FA Container] setupCompleted event recibido');
    console.log('   - Tokens recibidos:', tokens);
    console.log('   - Tipo:', typeof tokens);
    console.log('   - Keys:', Object.keys(tokens || {}));
    console.log('   - Access Token:', tokens?.accessToken ? '✅ presente' : '❌ falta');
    console.log('   - Refresh Token:', tokens?.refreshToken ? '✅ presente' : '❌ falta');
    
    this.handleVerificationSuccess(tokens);
  }

  /**
   * Callback cuando la verificación se completa exitosamente
   */
  onVerifyCompleted(tokens: any): void {
    console.log('✅ [2FA Container] Verificación completada, procesando tokens...');
    this.handleVerificationSuccess(tokens);
  }

  /**
   * Maneja el éxito de tanto setup como verificación
   * Guarda tokens y redirige según rol del usuario
   */
  private handleVerificationSuccess(tokens: any): void {
    console.log('🎉 [2FA Container] Iniciando handleVerificationSuccess...');
    
    if (!tokens) {
      console.error('❌ [2FA Container] tokens es null/undefined');
      this.onError('Error: No se recibieron tokens del servidor');
      return;
    }

    console.log('📦 [2FA Container] Tokens recibidos:');
    console.log('   - accessToken:', tokens.accessToken?.substring(0, 20) + '...' || '❌');
    console.log('   - refreshToken:', tokens.refreshToken?.substring(0, 20) + '...' || '❌');
    console.log('   - idleTimeout:', tokens.idleTimeoutMillis || '❌');
    console.log('   - absoluteTimeout:', tokens.absoluteTimeoutMillis || '❌');

    // Guardar tokens
    if (!tokens.accessToken) {
      console.error('❌ [2FA Container] accessToken no disponible');
      this.onError('Error: Token de acceso no recibido');
      return;
    }

    this.authService.setAccessToken(tokens.accessToken);
    console.log('✅ [2FA Container] Access token guardado');

    if (tokens.refreshToken) {
      this.authService.setRefreshTokenPublic(tokens.refreshToken);
      console.log('✅ [2FA Container] Refresh token guardado');
    }

    // Guardar configuración de timeouts si viene en respuesta
    if (tokens.idleTimeoutMillis && tokens.absoluteTimeoutMillis) {
      this.authService.saveSessionConfig(
        tokens.idleTimeoutMillis,
        tokens.absoluteTimeoutMillis
      );
      console.log('✅ [2FA Container] Configuración de timeouts guardada');
    }

    // Iniciar temporizadores de sesión
    console.log('🚀 [2FA Container] Iniciando temporizadores de sesión...');
    this.authService.startSessionTimers();

    // Limpiar datos temporales de sessionStorage
    sessionStorage.removeItem('twoFactorSessionToken');
    sessionStorage.removeItem('loginEmail');
    sessionStorage.removeItem('twoFASetupData');
    sessionStorage.removeItem('twoFactorType');
    console.log('✅ [2FA Container] Datos temporales limpios');

    // Determinar redirección según rol
    console.log('🔄 [2FA Container] Determinando redirección según rol...');
    const userRole = this.authService.getCurrentRole();
    console.log('   - User role:', userRole || 'no disponible');
    
    let target = '/catalog'; // Default para usuario normal

    if (userRole === 'admin') {
      target = '/ad-users';
      console.log('   → Rol: ADMIN, destino: /ad-users');
    } else if (userRole === 'creator') {
      target = '/content-creator';
      console.log('   → Rol: CREATOR, destino: /content-creator');
    } else if (userRole) {
      console.log(`   → Rol: ${userRole}, destino: /catalog (default)`);
    } else {
      console.warn('   ⚠️ No se pudo determinar rol, usando /catalog');
    }

    console.log(`✅ [2FA Container] Redirigiendo a: ${target}`);
    console.log('   Esperando 500ms antes de navegar...');

    // Redirigir después de breve delay
    setTimeout(() => {
      console.log(`🚀 [2FA Container] Navegando a ${target}...`);
      this.router.navigate([target]).then(
        (success) => console.log(`   ✅ Navegación exitosa: ${success}`),
        (error) => console.error(`   ❌ Error en navegación: ${error}`)
      );
    }, 500);
  }

  /**
   * Callback si hay error en setup o verificación
   */
  onError(message: string): void {
    console.error('❌ [2FA Container] Error en flujo 2FA:', message);
    this.errorMessage.set(message);
    
    // Después de 5 segundos, redirigir a login para reintentar
    setTimeout(() => {
      sessionStorage.removeItem('twoFactorSessionToken');
      sessionStorage.removeItem('loginEmail');
      this.router.navigate(['/login']);
    }, 5000);
  }
}
