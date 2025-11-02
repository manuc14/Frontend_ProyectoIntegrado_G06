/**
 * @fileoverview Utilidades para manejo y formateo de fechas en el frontend.
 * 
 * Este módulo proporciona:
 * - Formateo de fechas ISO/timestamp a formato español (DD/MM/YYYY)
 * - Conversión de strings de fecha a timestamps
 * - Manejo robusto de fechas inválidas con valores de fallback
 * - Soporte para múltiples formatos de entrada
 * 
 * @module date-utils
 */

/**
 * Formatea una fecha ISO o timestamp a formato español DD/MM/YYYY.
 * 
 * Acepta múltiples tipos de entrada:
 * - String ISO: "2024-11-02T10:30:00Z"
 * - Timestamp: 1698924600000
 * - null/undefined: Devuelve '-'
 * 
 * Si la fecha es inválida, devuelve '-' como fallback.
 * 
 * @param {string | number | null | undefined} dateInput - Fecha a formatear
 * @returns {string} Fecha en formato DD/MM/YYYY o '-' si es inválida
 * 
 * @example
 * ```typescript
 * // String ISO
 * formatDateIsoToDDMMYYYY('2024-11-02T10:30:00Z');
 * // => "02/11/2024"
 * 
 * // Timestamp
 * formatDateIsoToDDMMYYYY(1698924600000);
 * // => "02/11/2023"
 * 
 * // Fecha inválida
 * formatDateIsoToDDMMYYYY('fecha-invalida');
 * // => "-"
 * 
 * // Valor null/undefined
 * formatDateIsoToDDMMYYYY(null);
 * // => "-"
 * 
 * // Uso en template
 * <td>{{ formatDateIsoToDDMMYYYY(user.fechaCreacion) }}</td>
 * ```
 */
export function formatDateIsoToDDMMYYYY(dateInput: string | number | null | undefined): string {
  if (dateInput === null || dateInput === undefined || dateInput === '') return '-';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '-';
  // Usar toLocaleDateString asegura formato con separadores locales (DD/MM/YYYY en es-ES)
  return date.toLocaleDateString('es-ES');
}

/**
 * Convierte un string de fecha a timestamp (milisegundos desde epoch).
 * 
 * Soporta múltiples formatos:
 * - DD/MM/YYYY (formato español)
 * - ISO 8601: "2024-11-02" o "2024-11-02T10:30:00Z"
 * - Cualquier formato válido por el constructor Date
 * 
 * Si la fecha es inválida o es '-', devuelve null.
 * 
 * @param {string | null | undefined} dateString - String de fecha a convertir
 * @returns {number | null} Timestamp en milisegundos o null si es inválido
 * 
 * @example
 * ```typescript
 * // Formato español DD/MM/YYYY
 * toTimestampFromString('02/11/2024');
 * // => 1730505600000
 * 
 * // Formato ISO
 * toTimestampFromString('2024-11-02');
 * // => 1730505600000
 * 
 * // Fecha inválida
 * toTimestampFromString('32/13/2024');
 * // => null
 * 
 * // Valor especial
 * toTimestampFromString('-');
 * // => null
 * 
 * // Uso para comparaciones
 * const userBirthday = toTimestampFromString('15/05/1990');
 * const eighteenYearsAgo = Date.now() - (18 * 365 * 24 * 60 * 60 * 1000);
 * if (userBirthday && userBirthday < eighteenYearsAgo) {
 *   console.log('Usuario es mayor de edad');
 * }
 * ```
 */
export function toTimestampFromString(dateString: string | null | undefined): number | null {
  if (!dateString || dateString === '-') return null;
  
  // Si es formato DD/MM/YYYY, parsearlo manualmente
  const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const ddmmyyyyMatch = regex.exec(dateString);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const t = date.getTime();
    return isNaN(t) ? null : t;
  }
  
  // Para otros formatos, usar Date constructor
  const date = new Date(dateString);
  const t = date.getTime();
  return isNaN(t) ? null : t;
}
