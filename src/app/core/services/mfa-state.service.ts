import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { 
  MFAFlowState, 
  MFAState, 
  FactorType,
  MFAError,
  MFASetupResponse,
  MFAVerifyFactorResponse 
} from '../models/mfa.models';

/**
 * MFA State Service
 * 
 * Servicio centralizado de gestión de estado para flujos MFA (2FA + 3FA).
 * Reemplaza múltiples signals dispersos en componentes por un único estado centralizado.
 * 
 * **Patrón reutilizado:** BehaviorSubject pattern de `AuthService.sessionExpired$`
 * 
 * **Responsabilidades:**
 * - Inicializar flujos de setup y verify
 * - Actualizar estado después de verificaciones
 * - Gestionar errores de manera centralizada
 * - Proporcionar estado reactivo vía observables
 * 
 * **Beneficios:**
 * - Reduce complejidad ciclomática eliminando lógica de estado en componentes
 * - Fuente centralizada de verdad para el flujo MFA
 * - Estado inmutable con updates controlados
 * - Fácil debugging y testing
 * 
 * @example
 * ```typescript
 * // En 2fa-container.component.ts
 * constructor(private mfaStateService: MFAStateService) {}
 * 
 * ngOnInit(): void {
 *   const sessionToken = sessionStorage.getItem('twoFactorSessionToken');
 *   this.mfaStateService.initializeSetupFlow(sessionToken, email);
 *   
 *   // Suscribirse a cambios de estado
 *   this.mfaStateService.state$.subscribe(state => {
 *     if (state.mfaState === 'COMPLETED') {
 *       this.router.navigate(['/dashboard']);
 *     }
 *   });
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class MFAStateService {
  /**
   * Estado inicial del flujo MFA
   */
  private readonly initialState: MFAFlowState = {
    state: 'PENDING',
    currentFactor: 'TOTP',
    sessionToken: '',
    verificationToken: null,
    setupData: null,
    isLoading: false,
    isVerifying: false,
    error: null,
    attemptCount: 0
  };

  /**
   * BehaviorSubject con estado centralizado del flujo MFA
   * 
   * **Patrón reutilizado:** Similar a `AuthService.sessionExpired$`
   * - BehaviorSubject permite emitir y suscribirse al último valor
   * - Inicializado con estado inicial
   * - Actualizado vía métodos públicos controlados
   */
  private readonly mfaState$ = new BehaviorSubject<MFAFlowState>(this.initialState);

  /**
   * Observable público de solo lectura del estado MFA
   * 
   * Componentes se suscriben a este observable para reaccionar a cambios de estado.
   * No pueden modificar el estado directamente (patrón inmutable).
   */
  public readonly state$: Observable<MFAFlowState> = this.mfaState$.asObservable();

  /**
   * ✅ FIXADO: Signal reactivo que sincroniza con el BehaviorSubject
   * 
   * Los computed signals NO pueden rastrear cambios de getters o .value de RxJS.
   * Este signal actúa como puente reactivo entre Observable y Signals.
   * Se actualiza automáticamente cuando el BehaviorSubject emite.
   */
  private readonly mfaStateSignal = signal<MFAFlowState>(this.initialState);

  /**
   * Signals computados para acceso reactivo a propiedades específicas
   * 
   * ✅ FIXADO: Ahora derivan del signal reactivo, no del getter no reactivo.
   * Esto permite que Angular rastree cambios y actualice automáticamente el template.
   */
  public readonly isLoading = computed(() => this.mfaStateSignal().isLoading);
  public readonly hasError = computed(() => this.mfaStateSignal().error !== null);
  public readonly mfaState = computed(() => this.mfaStateSignal().state);
  public readonly currentFactor = computed(() => this.mfaStateSignal().currentFactor);
  public readonly isSetupFlow = computed(() => this.mfaStateSignal().setupData !== null);
  public readonly isVerifyFlow = computed(() => this.mfaStateSignal().setupData === null && this.mfaStateSignal().sessionToken !== '');

  /**
   * Getter del estado actual (snapshot)
   */
  private get currentState(): MFAFlowState {
    return this.mfaState$.value;
  }

  constructor() {
    console.log('🔐 [MFAStateService] Servicio inicializado con estado:', this.initialState);
  }

  /**
   * Inicializa flujo de SETUP para usuarios sin 2FA configurado
   * 
   * @param sessionToken - Token temporal de sesión 2FA (válido 5 min)
   * @param userEmail - Email del usuario para contexto
   * 
   * @example
   * ```typescript
   * this.mfaStateService.initializeSetupFlow(sessionToken, 'user@example.com');
   * ```
   */
  public initializeSetupFlow(sessionToken: string, userEmail: string | null = null): void {
    console.log('🔐 [MFAStateService] Inicializando flujo SETUP');
    console.log('   - sessionToken:', sessionToken ? '✅ presente' : '❌ falta');
    console.log('   - userEmail:', userEmail || 'no disponible');

    this.updateState({
      sessionToken,
      state: 'PENDING',
      currentFactor: 'TOTP',
      isLoading: false,
      isVerifying: false,
      error: null,
      setupData: null, // Se llenará con updateAfterSetup()
      verificationToken: null,
      attemptCount: 0
    });
  }

  /**
   * Inicializa flujo de VERIFY para usuarios con 2FA ya configurado
   * 
   * @param sessionToken - Token temporal de sesión 2FA
   * @param userEmail - Email del usuario
   * 
   * @example
   * ```typescript
   * this.mfaStateService.initializeVerifyFlow(sessionToken, 'user@example.com');
   * ```
   */
  public initializeVerifyFlow(sessionToken: string, userEmail: string | null = null): void {
    console.log('🔐 [MFAStateService] Inicializando flujo VERIFY');
    console.log('   - sessionToken:', sessionToken ? '✅ presente' : '❌ falta');
    console.log('   - userEmail:', userEmail || 'no disponible');

    this.updateState({
      sessionToken,
      state: 'PENDING',
      currentFactor: 'TOTP',
      isLoading: false,
      isVerifying: false,
      error: null,
      setupData: null,
      verificationToken: null,
      attemptCount: 0
    });
  }

  /**
   * Actualiza estado después de recibir datos de setup (QR, secret, códigos)
   * 
   * Llamado después de `MFAService.setupDuringLogin()`
   * 
   * @param setupResponse - Respuesta del endpoint /setup-during-login
   * 
   * @example
   * ```typescript
   * this.mfaService.setupDuringLogin(sessionToken).subscribe({
   *   next: (response) => this.mfaStateService.updateAfterSetup(response)
   * });
   * ```
   */
  public updateAfterSetup(setupResponse: MFASetupResponse): void {
    console.log('🔐 [MFAStateService] Actualizando estado después de setup');
    console.log('   - QR Code:', setupResponse.qrCode ? '✅' : '❌');
    console.log('   - Secret:', setupResponse.secret ? '✅' : '❌');
    console.log('   - Backup Codes:', setupResponse.backupCodes?.length || 0);
    console.log('   - SessionToken:', setupResponse.sessionToken ? '✅' : '❌');

    this.updateState({
      ...this.currentState,
      setupData: {
        sessionToken: setupResponse.sessionToken,  // ✅ NUEVO: Guardar token del setup
        qrCode: setupResponse.qrCode,
        secret: setupResponse.secret,
        backupCodes: setupResponse.backupCodes
      },
      isLoading: false,
      error: null
    });
  }

  /**
   * Actualiza estado después de verificar un factor (TOTP o EMAIL_CODE)
   * 
   * Maneja transiciones de estado según respuesta del backend:
   * - PENDING → Error, código incorrecto
   * - REQUIRES_FACTOR → Avanzar a 3FA (EMAIL_CODE)
   * - COMPLETED → Autenticación exitosa
   * 
   * @param verifyResponse - Respuesta del endpoint /verify-factor
   * 
   * @example
   * ```typescript
   * this.mfaService.verifyFactor(sessionToken, 'TOTP', code).subscribe({
   *   next: (response) => this.mfaStateService.updateAfterVerify(response)
   * });
   * ```
   */
  public updateAfterVerify(verifyResponse: MFAVerifyFactorResponse): void {
    console.log('🔐 [MFAStateService] Actualizando estado después de verify');
    console.log('   - Estado backend:', verifyResponse.state);
    console.log('   - Siguiente factor:', verifyResponse.nextFactor || 'ninguno');

    const newState: MFAState = verifyResponse.state;
    const nextFactor: FactorType | null = verifyResponse.nextFactor || null;

    // Caso 1: Verificación falló (código incorrecto)
    if (newState === 'PENDING') {
      console.warn('⚠️ [MFAStateService] Verificación falló, estado sigue PENDING');
      this.updateState({
        ...this.currentState,
        isLoading: false
        // currentFactor permanece igual para reintentar
      });
      return;
    }

    // Caso 2: Requiere factor adicional (3FA - EMAIL_CODE)
    if (newState === 'REQUIRES_FACTOR' && nextFactor === 'EMAIL_CODE') {
      console.log('✅ [MFAStateService] 2FA completado, requiere 3FA (EMAIL_CODE)');
      this.updateState({
        ...this.currentState,
        state: 'REQUIRES_FACTOR',
        currentFactor: 'EMAIL_CODE',
        verificationToken: verifyResponse.verificationToken || null,
        isLoading: false,
        error: null
      });
      return;
    }

    // Caso 3: Autenticación completada
    if (newState === 'COMPLETED') {
      console.log('✅ [MFAStateService] Autenticación MFA completada exitosamente');
      this.updateState({
        ...this.currentState,
        state: 'COMPLETED',
        isLoading: false,
        error: null
      });
      return;
    }

    // Caso 4: Estado inesperado
    console.warn('⚠️ [MFAStateService] Estado inesperado recibido:', newState);
  }

  /**
   * Completa la autenticación MFA
   * 
   * Llamado cuando todos los factores han sido verificados exitosamente.
   * Guarda tokens JWT y limpia estado.
   * 
   * @param accessToken - JWT access token
   * @param refreshToken - JWT refresh token
   * 
   * @example
   * ```typescript
   * this.mfaStateService.completeAuth(response.accessToken, response.refreshToken);
   * ```
   */
  public completeAuth(accessToken: string, refreshToken: string): void {
    console.log('🔐 [MFAStateService] Completando autenticación MFA');
    console.log('   - Access Token:', accessToken ? '✅' : '❌');
    console.log('   - Refresh Token:', refreshToken ? '✅' : '❌');

    // Guardar tokens en localStorage (responsabilidad de AuthService)
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    // Limpiar datos temporales de sessionStorage
    sessionStorage.removeItem('twoFactorSessionToken');
    sessionStorage.removeItem('twoFactorType');
    sessionStorage.removeItem('loginEmail');

    console.log('✅ [MFAStateService] Tokens guardados y estado limpiado');
  }

  /**
   * Establece un error en el estado MFA
   * 
   * @param error - Error MFA con información detallada
   * 
   * @example
   * ```typescript
   * const mfaError: MFAError = {
   *   type: 'INVALID_CODE',
   *   message: 'Código incorrecto',
   *   retryable: true
   * };
   * this.mfaStateService.setError(mfaError);
   * ```
   */
  public setError(error: MFAError): void {
    console.error('❌ [MFAStateService] Error establecido:', error.type);
    console.error('   - Mensaje:', error.message);
    console.error('   - Retryable:', error.retryable);

    this.updateState({
      ...this.currentState,
      error: error.message,
      isLoading: false
    });
  }

  /**
   * Limpia el error actual del estado
   */
  public clearError(): void {
    console.log('🧹 [MFAStateService] Limpiando error');
    this.updateState({
      ...this.currentState,
      error: null
    });
  }

  /**
   * Establece estado de loading
   * 
   * @param isLoading - true durante operaciones asíncronas
   */
  public setLoading(isLoading: boolean): void {
    this.updateState({
      ...this.currentState,
      isLoading
    });
  }

  /**
   * Resetea el estado MFA al estado inicial
   * 
   * Útil cuando el usuario cierra sesión o vuelve a login.
   */
  public resetState(): void {
    console.log('🔄 [MFAStateService] Reseteando estado a inicial');
    this.updateState(this.initialState);
  }

  /**
   * Actualiza el estado MFA (método privado)
   * 
   * ✅ FIXADO: Sincroniza AMBOS:
   * - BehaviorSubject: para suscriptores RxJS (componentes legacy)
   * - Signal: para derived signals y template (Angular 17+ reactivo)
   * 
   * @param newState - Nuevo estado completo
   */
  private updateState(newState: MFAFlowState): void {
    console.log('🔄 [MFAStateService] Estado actualizado:', {
      state: newState.state,
      currentFactor: newState.currentFactor,
      hasError: newState.error !== null,
      isLoading: newState.isLoading,
      setupData: newState.setupData ? '✅' : '❌',
      isSetupFlow: newState.setupData !== null
    });

    // ✅ FIXADO: Sincronizar AMBOS para reactividad completa
    this.mfaState$.next(newState);         // Para RxJS subscribers
    this.mfaStateSignal.set(newState);     // Para Angular signals (template reactivity)
  }

  /**
   * Obtiene snapshot del estado actual (sin suscribirse)
   * 
   * Útil para validaciones síncronas.
   * 
   * @returns Estado MFA actual
   */
  public getSnapshot(): MFAFlowState {
    return this.currentState;
  }
}
