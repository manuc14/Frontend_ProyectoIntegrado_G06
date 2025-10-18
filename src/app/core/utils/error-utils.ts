export function extractApiErrorMessage(error: any): { message: string; status?: number; details?: any } {
  if (!error) return { message: 'Error desconocido' };

  // Prefer backend structured message
  if (error.error && typeof error.error === 'object') {
    const payload = error.error;
    const message = payload.message || error.message || 'Error desconocido';
    const status = error.status || error.originalError?.status;
    const details = payload.details || payload.errors || null;
    return { message, status, details };
  }

  if (error.message) return { message: error.message, status: error.status };

  return { message: 'Error desconocido' };
}
