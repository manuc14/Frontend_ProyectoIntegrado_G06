/**
 * @fileoverview Utilidades para extraer mensajes amigables de diferentes estructuras de error.
 * 
 * Este módulo proporciona funciones helper para:
 * - Extraer mensajes de error de APIs con diferentes estructuras
 * - Proporcionar mensajes de fallback cuando no hay mensaje específico
 * - Priorizar mensajes detallados sobre mensajes generales
 * 
 * Soporta múltiples formatos de error:
 * - Error directo: `{ message: "Error message" }`
 * - Error HTTP con details: `{ error: { details: [{message: "..."]}] } }`
 * - Error HTTP simple: `{ error: { message: "Error message" } }`
 * 
 * @module error-utils
 */

/**
 * Extrae un mensaje de error amigable para el usuario de diferentes estructuras de error.
 * 
 * Prueba múltiples ubicaciones donde puede estar el mensaje de error,
 * en orden de prioridad:
 * 1. error.message (error directo)
 * 2. error.error.details[0].message (error HTTP con detalles)
 * 3. error.error.message (error HTTP simple)
 * 4. Mensaje por defecto si ninguno está disponible
 * 
 * @param {any} error - Objeto de error de cualquier estructura
 * @returns {string} Mensaje de error amigable para mostrar al usuario
 * 
 * @example
 * ```typescript
 * // Error directo
 * const error1 = { message: 'Token expirado' };
 * console.log(extractErrorMessage(error1));
 * // => "Token expirado"
 * 
 * // Error HTTP con detalles
 * const error2 = {
 *   error: {
 *     details: [
 *       { field: 'email', message: 'Email ya registrado' }
 *     ]
 *   }
 * };
 * console.log(extractErrorMessage(error2));
 * // => "Email ya registrado"
 * 
 * // Error HTTP simple
 * const error3 = {
 *   error: { message: 'Servicio no disponible' }
 * };
 * console.log(extractErrorMessage(error3));
 * // => "Servicio no disponible"
 * 
 * // Sin mensaje
 * const error4 = { status: 500 };
 * console.log(extractErrorMessage(error4));
 * // => "Error al guardar el contenido. Inténtalo de nuevo."
 * 
 * // Uso en componente
 * this.apiService.saveContent(data).subscribe({
 *   error: (error) => {
 *     this.errorMessage = extractErrorMessage(error);
 *     this.showError(this.errorMessage);
 *   }
 * });
 * ```
 */
export function extractErrorMessage(error: any): string {
  let message = 'Error al guardar el contenido. Inténtalo de nuevo.';
  if (error?.message?.trim()) {
    message = error.message;
  } else if (error?.error?.details?.length > 0) {
    message = error.error.details[0].message;
  } else if (error?.error?.message?.trim()) {
    message = error.error.message;
  }
  return message;
}
