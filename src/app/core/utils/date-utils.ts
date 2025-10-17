/**
 * Utilities para manejo de fechas en el frontend.
 * - formatDateIsoToDDMMYYYY: recibe ISO string o timestamp y devuelve DD/MM/YYYY o '-' si inválido.
 * - toTimestampFromString: parsea una fecha (ISO u otros formatos válidos por Date) y devuelve timestamp o null.
 */
export function formatDateIsoToDDMMYYYY(dateInput: string | number | null | undefined): string {
  if (dateInput === null || dateInput === undefined || dateInput === '') return '-';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '-';
  // Usar toLocaleDateString asegura formato con separadores locales (DD/MM/YYYY en es-ES)
  return date.toLocaleDateString('es-ES');
}

export function toTimestampFromString(dateString: string | null | undefined): number | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  const t = date.getTime();
  return isNaN(t) ? null : t;
}
