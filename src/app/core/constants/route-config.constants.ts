/**
 * @fileoverview Configuración centralizada de rutas de autenticación
 * 
 * Este archivo define todas las rutas relacionadas con autenticación,
 * verificación y MFA para mantener consistencia en guards e interceptors.
 * 
 * @module RouteConfig
 */

/**
 * Configuración de rutas de autenticación
 * Source of truth única para todas las rutas de auth
 */
export const ROUTE_CONFIG = {
  /**
   * Rutas que permiten acceso tanto a usuarios autenticados como no autenticados.
   * Estas son rutas de "transición" en flujos de verificación (email, 2FA, OTP).
   * 
   * El publicGuard permite que usuarios YA autenticados accedan a estas rutas
   * sin ser redirigidos a su página principal.
   * 
   * Casos de uso:
   * - Usuario completa registro pero necesita verificar email
   * - Usuario hace login pero necesita completar 2FA
   * - Usuario está configurando 2FA por primera vez
   */
  FLEXIBLE_AUTH_ROUTES: [
    // ===== Verificación de Email (1FA) =====
    '/auth/verify-email',      // Página informativa tras registro
    '/auth/verify-code',        // Input del código de verificación de email
    
    // ===== Segundo Factor (2FA - Login) =====
    '/auth/2fa',                // Contenedor inteligente (setup o verify)
    
    // ===== Tercer Factor (3FA - Setup inicial en registro) =====
    '/auth/2fa/setup',          // Setup inicial de 2FA con QR code
    '/auth/2fa/verify-otp',     // Verificación del primer código OTP tras setup
    
    // ===== Recuperación de Contraseña =====
    '/auth/forgot-password',    // Solicitud de recuperación
    '/auth/reset-password-code', // Input del código de recuperación
    '/auth/new-password',       // Input de nueva contraseña
    
    // ===== Rutas Legacy (compatibilidad temporal) =====
    '/verify-email',            // Redirect a /auth/verify-email
    '/verify-code',             // Redirect a /auth/verify-code
    '/qr-code-setup',           // Redirect a /auth/2fa/setup
    '/verify-otp',              // Redirect a /auth/2fa/verify-otp
  ] as const,
  
  /**
   * Rutas públicas de autenticación que NO deben intentar renovar token.
   * 
   * Cuando estas rutas reciben un error 401, el token-refresh.interceptor
   * NO debe intentar renovar el token automáticamente, sino propagar el error
   * para que el componente lo maneje apropiadamente.
   * 
   * Razón: Estas rutas están diseñadas para usuarios NO autenticados o
   * en proceso de autenticación temporal (session tokens).
   * 
   * IMPORTANTE: NO incluir '/auth/refresh' aquí porque requiere refresh token
   */
  PUBLIC_AUTH_ROUTES: [
    // ===== Endpoints de autenticación básica =====
    '/auth/login',
    '/auth/register',
    
    // ===== Endpoints de verificación de email =====
    '/auth/verify-email',
    '/auth/verify-code',
    '/auth/resend-verification',
    
    // ===== Endpoints de recuperación de contraseña =====
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/validate-reset-token',
    
    // ===== Endpoints de MFA =====
    '/auth/mfa/setup-during-login',
    '/auth/mfa/verify-factor',
    '/auth/2fa/setup-during-login',      // Legacy
    '/auth/2fa/verify-and-enable',       // Legacy
    '/api/auth/2fa/verify',               // Legacy
    
    // ===== Rutas legacy (compatibilidad) =====
    '/verify-email',
    '/verify-code',
    '/qr-code-setup',
    '/verify-otp',
  ] as const,
  
  /**
   * Mapeo de rutas legacy a rutas nuevas
   * Usado para redirects automáticos
   */
  LEGACY_ROUTE_MAPPING: {
    '/verify-email': '/auth/verify-email',
    '/verify-code': '/auth/verify-code',
    '/qr-code-setup': '/auth/2fa/setup',
    '/verify-otp': '/auth/2fa/verify-otp',
    '/forgot-password': '/auth/forgot-password',
    '/reset-password-code': '/auth/reset-password-code',
    '/new-password': '/auth/new-password',
  } as const,
} as const;

/**
 * Helper para verificar si una ruta es flexible (permite autenticados)
 */
export function isFlexibleAuthRoute(url: string): boolean {
  return ROUTE_CONFIG.FLEXIBLE_AUTH_ROUTES.some(route => url.startsWith(route));
}

/**
 * Helper para verificar si una ruta es pública (no renovar token)
 */
export function isPublicAuthRoute(url: string): boolean {
  return ROUTE_CONFIG.PUBLIC_AUTH_ROUTES.some(route => url.includes(route));
}

/**
 * Helper para obtener la ruta nueva desde una ruta legacy
 */
export function getNewRouteFromLegacy(legacyRoute: string): string | null {
  return ROUTE_CONFIG.LEGACY_ROUTE_MAPPING[legacyRoute as keyof typeof ROUTE_CONFIG.LEGACY_ROUTE_MAPPING] || null;
}
