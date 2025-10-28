/**
 * Small utilities for extracting user-friendly messages from various
 * error shapes returned by APIs or thrown by runtime code.
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
