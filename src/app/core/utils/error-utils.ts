/**
 * Small utilities for extracting user-friendly messages from various
 * error shapes returned by APIs or thrown by runtime code.
 */
export function extractErrorMessage(error: any): string {
  const defaultMsg = 'Error al guardar el contenido. Inténtalo de nuevo.';
  if (!error) return defaultMsg;
  if (typeof error.message === 'string' && error.message.trim()) return error.message;
  if (error.error && typeof error.error.message === 'string' && error.error.message.trim()) return error.error.message;
  return defaultMsg;
}
