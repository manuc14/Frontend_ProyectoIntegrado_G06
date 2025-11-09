import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MFAVerifyFactorResponse } from '../models/mfa.models';
import { MFAStateService } from './mfa-state.service';

/**
 * MFA Response Handler Service
 * 
 * Servicio centralizado para manejar respuestas de verificación MFA.
 * Elimina lógica duplicada de componentes reduciendo complejidad ciclomática.
 * 
 * **Problema que resuelve:**
 * Antes: Cada componente (2fa-setup, 2fa-verify) manejaba respuestas con lógica duplicada:
 * - 8+ condiciones if/else dispersas
 * - Múltiples navegaciones duplicadas
 * - Manejo de tokens repetido
 * - Error handling inconsistente
 * 
 * **Solución:**
 * - Un único método `handleMFAResponse()` para todas las respuestas
 * - Lógica centralizada de transiciones de estado
 * - Navegación consistente
 * - Manejo de tokens unificado
 * 
 * **Reducción de complejidad:**
 * - Antes: ~40 líneas por componente × 2 componentes = 80 líneas
 * - Después: ~60 líneas en 1 servicio
 * - Reducción: 25% menos código + 100% reutilizable
 * 
 * @example
 * ```typescript
 * // En 2fa-setup.component.ts
 * this.mfaService.verifyFactor(sessionToken, 'TOTP', code).subscribe({
 *   next: (response) => {
 *     this.mfaResponseHandler.handleMFAResponse(response);
 *     this.setupCompleted.emit(response);
 *   }
 * });
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class MFAResponseHandlerService {
  private readonly router = inject(Router);
  private readonly mfaStateService = inject(MFAStateService);

  constructor() {
    console.log('🔐 [MFAResponseHandler] Servicio inicializado');
  }

  /**
   * Maneja la respuesta de verificación de factor MFA
   * 
   * Responsabilidades:
   * 1. Actualizar MFAStateService con nuevo estado
   * 2. Guardar tokens si autenticación completada
   * 3. Navegar a siguiente paso del flujo
   * 
   * **Máquina de estados:**
   * - PENDING → Error, código incorrecto (no navega)
   * - REQUIRES_FACTOR → Guardar verificationToken, navegar a EMAIL verify
   * - COMPLETED → Guardar accessToken/refreshToken, navegar a dashboard
   * 
   * @param response - Respuesta del endpoint /verify-factor
   * 
   * @example
   * ```typescript
   * this.mfaResponseHandler.handleMFAResponse({
   *   success: true,
   *   message: "TOTP verificado",
   *   state: "REQUIRES_FACTOR",
   *   nextFactor: "EMAIL_CODE",
   *   verificationToken: "abc123"
   * });
   * // → Actualiza estado y navega a /auth/email-verify
   * ```
   */
  public handleMFAResponse(response: MFAVerifyFactorResponse): void {
    console.log('🔐 [MFAResponseHandler] Manejando respuesta MFA');
    console.log('   - Estado:', response.state);
    console.log('   - Success:', response.success);
    console.log('   - Message:', response.message);

    // Actualizar estado centralizado con la respuesta
    this.mfaStateService.updateAfterVerify(response);

    // Manejar según el estado de la respuesta
    switch (response.state) {
      case 'PENDING':
        this.handlePending(response);
        break;

      case 'REQUIRES_FACTOR':
        this.handleRequiresFactor(response);
        break;

      case 'COMPLETED':
        this.handleCompleted(response);
        break;

      default:
        console.warn('⚠️ [MFAResponseHandler] Estado no reconocido:', response.state);
    }
  }

  /**
   * Maneja estado PENDING (código incorrecto)
   * 
   * No realiza navegación, solo permite que el componente muestre error.
   * 
   * @param response - Respuesta con state === 'PENDING'
   */
  private handlePending(response: MFAVerifyFactorResponse): void {
    console.warn('⚠️ [MFAResponseHandler] Verificación falló - PENDING');
    console.warn('   - Mensaje:', response.message);
    
    // El error ya fue establecido por MFAStateService.updateAfterVerify()
    // No navegar, permitir reintento en componente actual
  }

  /**
   * Maneja estado REQUIRES_FACTOR (requiere 3FA - EMAIL_CODE)
   * 
   * Guarda verificationToken y navega a pantalla de verificación EMAIL.
   * 
   * @param response - Respuesta con state === 'REQUIRES_FACTOR'
   */
  private handleRequiresFactor(response: MFAVerifyFactorResponse): void {
    console.log('✅ [MFAResponseHandler] 2FA completado - requiere 3FA');
    console.log('   - Siguiente factor:', response.nextFactor);
    console.log('   - verificationToken:', response.verificationToken ? '✅' : '❌');

    if (response.nextFactor !== 'EMAIL_CODE') {
      console.warn('⚠️ [MFAResponseHandler] Factor inesperado:', response.nextFactor);
      return;
    }

    if (!response.verificationToken) {
      console.error('❌ [MFAResponseHandler] No se recibió verificationToken para EMAIL_CODE');
      this.mfaStateService.setError({
        code: 500,
        message: 'Error del servidor: falta verificationToken',
        type: 'UNKNOWN',
        retryable: false
      });
      return;
    }

    // Guardar verificationToken en sessionStorage para pantalla EMAIL
    sessionStorage.setItem('verificationToken', response.verificationToken);
    console.log('✅ [MFAResponseHandler] verificationToken guardado en sessionStorage');

    // Navegar a pantalla de verificación EMAIL
    console.log('🔀 [MFAResponseHandler] Navegando a /auth/email-verify');
    this.router.navigate(['/auth/email-verify']);
  }

  /**
   * Maneja estado COMPLETED (autenticación exitosa)
   * 
   * Guarda accessToken y refreshToken, limpia datos temporales, navega a dashboard.
   * 
   * @param response - Respuesta con state === 'COMPLETED'
   */
  private handleCompleted(response: MFAVerifyFactorResponse): void {
    console.log('✅ [MFAResponseHandler] Autenticación MFA completada');
    console.log('   - Access Token:', response.accessToken ? '✅' : '❌');
    console.log('   - Refresh Token:', response.refreshToken ? '✅' : '❌');

    if (!response.accessToken || !response.refreshToken) {
      console.error('❌ [MFAResponseHandler] Faltan tokens en respuesta COMPLETED');
      this.mfaStateService.setError({
        code: 500,
        message: 'Error del servidor: faltan tokens de autenticación',
        type: 'UNKNOWN',
        retryable: false
      });
      return;
    }

    // Completar autenticación y guardar tokens (delegado a MFAStateService)
    this.mfaStateService.completeAuth(response.accessToken, response.refreshToken);

    console.log('✅ [MFAResponseHandler] Tokens guardados y estado limpiado');

    // Navegar al dashboard
    console.log('🔀 [MFAResponseHandler] Navegando a /dashboard');
    this.router.navigate(['/dashboard']);
  }

  /**
   * Maneja error general de navegación (fallback)
   * 
   * Si algo falla durante el proceso, redirige a login.
   * 
   * @param error - Error recibido
   */
  public handleNavigationError(error: Error): void {
    console.error('❌ [MFAResponseHandler] Error durante navegación:', error);
    
    this.mfaStateService.setError({
      code: 0,
      message: 'Error inesperado durante el flujo MFA',
      type: 'UNKNOWN',
      retryable: false
    });

    setTimeout(() => {
      console.log('🔀 [MFAResponseHandler] Redirigiendo a login por error');
      this.router.navigate(['/login']);
    }, 2000);
  }
}
