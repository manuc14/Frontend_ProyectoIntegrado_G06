/**
 * MFA Models - Interfaces TypeScript para el sistema MFA unificado
 * Basado en FRONTEND_MFA_IMPLEMENTATION_GUIDE.md
 * 
 * Soporta:
 * - 2FA (TOTP) - Obligatorio para todos los roles
 * - 3FA (EMAIL_CODE) - Obligatorio para ADMIN/CREADOR, opcional para USUARIO_EV
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Tipo de factor de autenticación
 */
export type FactorType = 'TOTP' | 'EMAIL_CODE' | 'BACKUP_CODE';

/**
 * Estado de la máquina de estados MFA
 */
export type MFAState = 
  | 'PENDING'           // Esperando verificación
  | 'REQUIRES_FACTOR'   // Requiere factor adicional
  | 'COMPLETED';        // Autenticación completada

/**
 * Tipo de 2FA desde el login inicial
 */
export type TwoFactorType = 
  | 'SETUP'   // Usuario sin 2FA, necesita configurar
  | 'VERIFY'; // Usuario con 2FA, solo verificar

/**
 * Roles de usuario
 */
export type UserRole = 'ADMIN' | 'CREADOR' | 'USUARIO_EV';

// ============================================================================
// REQUEST INTERFACES
// ============================================================================

/**
 * Request para obtener QR y configurar 2FA (primer login)
 * POST /api/auth/mfa/setup-during-login
 */
export interface MFASetupRequest {
  sessionToken: string;
}

/**
 * Request unificado para verificar cualquier factor (TOTP o EMAIL_CODE)
 * POST /api/auth/mfa/verify-factor
 */
export interface MFAVerifyFactorRequest {
  sessionToken: string;
  factorType: FactorType;
  code: string;
  verificationToken?: string | null; // Requerido solo para EMAIL_CODE
}

// ============================================================================
// RESPONSE INTERFACES
// ============================================================================

/**
 * Response del setup inicial de 2FA
 * POST /api/auth/mfa/setup-during-login
 */
export interface MFASetupResponse {
  success: boolean;
  message: string;
  sessionToken: string;
  verificationToken?: string | null;  // ✅ NUEVO: Token para verificar el código
  qrCode: string;           // Base64 image data
  secret: string;           // Secreto para entrada manual
  backupCodes: string[];    // 10 códigos de respaldo
  expiresAt: number;        // Timestamp de expiración
}

/**
 * Response unificado de verificación de factor
 * POST /api/auth/mfa/verify-factor
 */
export interface MFAVerifyFactorResponse {
  success: boolean;
  message: string;
  state: MFAState;
  
  // Si state === 'REQUIRES_FACTOR'
  nextFactor?: FactorType | null;
  verificationToken?: string | null;
  
  // Si state === 'COMPLETED'
  accessToken?: string | null;
  refreshToken?: string | null;
  idleTimeoutMillis?: number | null;
  absoluteTimeoutMillis?: number | null;
  
  // ✅ NUEVO: Reintentos y sesión (cuando falla la verificación)
  remainingAttempts?: number;      // Intentos restantes antes de cerrar sesión
  sessionExpiresInSeconds?: number; // Segundos hasta que expire la sesión
}

/**
 * Response del estado de 3FA
 * GET /api/auth/mfa/third-factor-status
 */
export interface ThirdFactorStatusResponse {
  success: boolean;
  thirdFactorEnabled: boolean;  // ¿Está habilitado 3FA?
  isRequired: boolean;          // ¿Es obligatorio? (true si ADMIN/CREADOR)
  role: UserRole;               // Rol del usuario
}

/**
 * Response al habilitar/deshabilitar 3FA
 * POST /api/auth/mfa/enable-third-factor
 * DELETE /api/auth/mfa/disable-third-factor
 */
export interface ThirdFactorToggleResponse {
  success: boolean;
  message: string;
  thirdFactorEnabled: boolean;
}

// ============================================================================
// STATE MANAGEMENT INTERFACES
// ============================================================================

/**
 * Estado central de MFA para gestión en el frontend
 * Implementa la máquina de estados del documento
 */
export interface MFAFlowState {
  // Estado actual del flujo
  state: MFAState;
  
  // Factor actual que se está verificando
  currentFactor: FactorType;
  
  // Factor siguiente (si state === 'REQUIRES_FACTOR')
  nextFactor?: FactorType | null;
  
  // Tokens
  sessionToken: string;
  verificationToken?: string | null;
  
  // Datos de setup (solo si twoFactorType === 'SETUP')
  setupData?: {
    sessionToken: string;     // Token del setup
    verificationToken?: string | null;  // ✅ NUEVO: Token para verificar código
    qrCode: string;
    secret: string;
    backupCodes: string[];
  } | null;
  
  // Loading states
  isLoading: boolean;
  isVerifying: boolean;
  
  // Error handling
  error?: string | null;
  attemptCount: number;
}

/**
 * Configuración de 3FA para el usuario
 */
export interface ThirdFactorConfig {
  enabled: boolean;
  required: boolean;
  role: UserRole;
}

// ============================================================================
// ERROR INTERFACES
// ============================================================================

/**
 * Error estandarizado de MFA
 */
export interface MFAError {
  code: number;                      // HTTP status code
  message: string;                   // Mensaje de error
  type: MFAErrorType;                // Tipo de error
  retryable: boolean;                // ¿Se puede reintentar?
  
  // ✅ NUEVO: Información de reintentos y sesión (desde backend)
  remainingAttempts?: number;        // Intentos restantes antes de bloqueo
  sessionExpiresInSeconds?: number;  // Segundos hasta que expire la sesión
}

/**
 * Tipos de error MFA
 */
export type MFAErrorType =
  | 'INVALID_CODE'        // Código incorrecto (401)
  | 'EXPIRED_SESSION'     // Sesión expirada (400)
  | 'CODE_EXPIRED'        // Código TOTP expirado (401)
  | 'TOO_MANY_ATTEMPTS'   // Demasiados intentos (429)
  | 'FORBIDDEN'           // No permitido (403)
  | 'NETWORK_ERROR'       // Error de red
  | 'UNKNOWN';            // Error desconocido

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Configuración de timeout para sesión MFA
 */
export interface MFASessionConfig {
  sessionTokenExpiryMinutes: number;  // Duración del sessionToken (5 min)
  maxRetryAttempts: number;           // Máx intentos antes de bloqueo (5)
  totpWindowSeconds: number;          // Ventana TOTP válida (30s)
}

/**
 * Configuración por defecto
 */
export const DEFAULT_MFA_CONFIG: MFASessionConfig = {
  sessionTokenExpiryMinutes: 5,
  maxRetryAttempts: 5,
  totpWindowSeconds: 30
};
