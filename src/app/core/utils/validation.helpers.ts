/**
 * @fileoverview Helpers para simplificar validaciones y condiciones complejas
 * 
 * Reduce la complejidad ciclomática extrayendo lógica de validación
 * en funciones pequeñas y composables.
 * 
 * @module validation.helpers
 */

/**
 * Verifica si una cadena es una URL absoluta (http/https)
 * 
 * @param url Cadena a verificar
 * @returns true si es una URL absoluta
 * 
 * @example
 * ```typescript
 * isAbsoluteUrl('https://example.com/image.jpg') // true
 * isAbsoluteUrl('/relative/path.jpg') // false
 * ```
 */
export function isAbsoluteUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

/**
 * Verifica si una cadena es una ruta que comienza con un prefijo específico
 * 
 * @param path Ruta a verificar
 * @param prefix Prefijo a buscar
 * @returns true si la ruta comienza con el prefijo
 * 
 * @example
 * ```typescript
 * startsWithPrefix('/resources/avatars/1.png', '/resources/') // true
 * startsWithPrefix('avatars/1.png', '/resources/') // false
 * ```
 */
export function startsWithPrefix(path: string, prefix: string): boolean {
  return path.startsWith(prefix);
}

/**
 * Verifica si un valor es nulo, indefinido o cadena vacía
 * 
 * @param value Valor a verificar
 * @returns true si el valor está vacío
 * 
 * @example
 * ```typescript
 * isEmpty(null) // true
 * isEmpty('') // true
 * isEmpty('  ') // true (después de trim)
 * isEmpty('hello') // false
 * ```
 */
export function isEmpty(value: any): boolean {
  return value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
}

/**
 * Verifica si un array tiene elementos
 * 
 * @param arr Array a verificar
 * @returns true si el array tiene al menos un elemento
 * 
 * @example
 * ```typescript
 * hasElements([1, 2, 3]) // true
 * hasElements([]) // false
 * hasElements(null) // false
 * ```
 */
export function hasElements<T>(arr: T[] | null | undefined): arr is T[] {
  return Array.isArray(arr) && arr.length > 0;
}

/**
 * Obtiene un valor con fallback si el original es nulo/indefinido
 * 
 * @param value Valor original
 * @param fallback Valor por defecto
 * @returns El valor original o el fallback
 * 
 * @example
 * ```typescript
 * getValueOrDefault(null, 'default') // 'default'
 * getValueOrDefault('value', 'default') // 'value'
 * ```
 */
export function getValueOrDefault<T>(value: T | null | undefined, fallback: T): T {
  return value ?? fallback;
}

/**
 * Verifica múltiples condiciones con operador AND
 * 
 * Reduce complejidad al hacer explícitas las validaciones múltiples
 * 
 * @param conditions Array de condiciones a verificar
 * @returns true si todas las condiciones son verdaderas
 * 
 * @example
 * ```typescript
 * // En lugar de: if (a && b && c && d)
 * if (allConditionsTrue([a, b, c, d])) {
 *   // ...
 * }
 * ```
 */
export function allConditionsTrue(conditions: boolean[]): boolean {
  return conditions.every(condition => condition === true);
}

/**
 * Verifica si al menos una condición es verdadera (OR)
 * 
 * @param conditions Array de condiciones a verificar
 * @returns true si al menos una condición es verdadera
 * 
 * @example
 * ```typescript
 * // En lugar de: if (a || b || c || d)
 * if (anyConditionTrue([a, b, c, d])) {
 *   // ...
 * }
 * ```
 */
export function anyConditionTrue(conditions: boolean[]): boolean {
  return conditions.some(condition => condition === true);
}

/**
 * Ejecuta una función solo si la condición es verdadera
 * 
 * Útil para reducir anidación de if
 * 
 * @param condition Condición a evaluar
 * @param action Función a ejecutar si la condición es verdadera
 * 
 * @example
 * ```typescript
 * // En lugar de:
 * if (shouldUpdate) {
 *   updateState();
 * }
 * 
 * // Usar:
 * executeIf(shouldUpdate, () => updateState());
 * ```
 */
export function executeIf(condition: boolean, action: () => void): void {
  if (condition) {
    action();
  }
}

/**
 * Ejecuta una de dos funciones según la condición
 * 
 * @param condition Condición a evaluar
 * @param onTrue Función si la condición es verdadera
 * @param onFalse Función si la condición es falsa
 * 
 * @example
 * ```typescript
 * executeConditional(
 *   user.isVip,
 *   () => showPremiumContent(),
 *   () => showRegularContent()
 * );
 * ```
 */
export function executeConditional(
  condition: boolean,
  onTrue: () => void,
  onFalse: () => void
): void {
  condition ? onTrue() : onFalse();
}
