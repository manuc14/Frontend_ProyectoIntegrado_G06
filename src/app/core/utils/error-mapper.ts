/**
 * @fileoverview Utilidades para mapear errores de validación del backend a controles de formularios Angular.
 * 
 * Este módulo proporciona:
 * - Limpieza de errores backend obsoletos
 * - Aplicación de errores del backend a controles específicos
 * - Mapeo de campos entre backend y frontend
 * - Propagación de errores a nivel de formulario
 * 
 * Estructura esperada del error del backend:
 * ```json
 * {
 *   "message": "Error de validación",
 *   "details": [
 *     { "field": "email", "message": "El email ya está registrado" },
 *     { "field": "alias", "message": "El alias no está disponible" }
 *   ]
 * }
 * ```
 * 
 * @module error-mapper
 * @requires FormGroup - Para manipular controles y errores de formularios
 */

import { FormGroup } from '@angular/forms';

/**
 * Detalle de error por campo específico devuelto por el backend.
 * 
 * @interface BackendErrorDetail
 */
export interface BackendErrorDetail {
  /** Nombre del campo en el backend que tiene el error */
  field: string;
  /** Mensaje descriptivo del error para mostrar al usuario */
  message: string;
}

/**
 * Estructura completa del payload de error del backend.
 * 
 * @interface BackendErrorPayload
 */
export interface BackendErrorPayload {
  /** Mensaje general del error (opcional) */
  message?: string;
  /** Array de errores específicos por campo (opcional) */
  details?: BackendErrorDetail[];
}

/**
 * Limpia errores 'backend' de controles específicos del formulario.
 * 
 * Elimina los errores de tipo 'backend' de los controles indicados,
 * manteniendo otros errores de validación (required, pattern, etc.).
 * Útil para limpiar errores antes de enviar un nuevo request.
 * 
 * @param {FormGroup} group - Formulario que contiene los controles
 * @param {string[]} controlNames - Nombres de los controles a limpiar
 * 
 * @example
 * ```typescript
 * // Limpiar errores backend antes de reenviar
 * clearBackendErrors(this.form, ['email', 'alias', 'password']);
 * 
 * // El control 'email' tenía: { required: true, backend: 'Email duplicado' }
 * // Después de limpiar: { required: true }
 * 
 * // El control 'alias' tenía: { backend: 'Alias no disponible' }
 * // Después de limpiar: null (sin errores)
 * ```
 */
export function clearBackendErrors(group: FormGroup, controlNames: string[]) {
  for (const c of controlNames) {
    const ctrl = group.get(c);
    const be = ctrl?.errors?.['backend'];
    if (ctrl && be) {
      const { backend, ...rest } = ctrl.errors as any;
      ctrl.setErrors(Object.keys(rest).length ? rest : null);
    }
  }
}

/**
 * Aplica errores del backend a controles del formulario usando un mapa de campos.
 * 
 * Procesa el array de detalles de error del backend y:
 * 1. Mapea nombres de campos backend → frontend usando fieldMap
 * 2. Aplica el error al control correspondiente (mantiene errores previos)
 * 3. Propaga errores especiales a nivel de formulario (ej: mismatch de passwords)
 * 4. Devuelve todos los mensajes concatenados con saltos de línea
 * 
 * @param {FormGroup} group - Formulario donde aplicar los errores
 * @param {BackendErrorDetail[] | undefined} details - Array de errores del backend
 * @param {Record<string, string>} fieldMap - Mapa de nombres de campo backend → frontend
 * @returns {string} Todos los mensajes de error concatenados con '\n'
 * 
 * @example
 * ```typescript
 * const fieldMap = {
 *   'correo': 'email',          // Backend usa 'correo', frontend usa 'email'
 *   'repetirPassword': 'confirmPassword'
 * };
 * 
 * const backendError = {
 *   message: 'Error de validación',
 *   details: [
 *     { field: 'correo', message: 'El email ya está registrado' },
 *     { field: 'alias', message: 'Alias no disponible' }
 *   ]
 * };
 * 
 * const errorMessage = applyBackendDetails(
 *   this.form,
 *   backendError.details,
 *   fieldMap
 * );
 * 
 * // errorMessage = "El email ya está registrado\nAlias no disponible"
 * // form.get('email').errors = { backend: 'El email ya está registrado' }
 * // form.get('alias').errors = { backend: 'Alias no disponible' }
 * ```
 */
export function applyBackendDetails(
  group: FormGroup,
  details: BackendErrorDetail[] | undefined,
  fieldMap: Record<string, string>
): string {
  if (!Array.isArray(details) || details.length === 0) return '';
  const msgs: string[] = [];
  for (const d of details) {
    msgs.push(d.message);
    const ctrlName = fieldMap[d.field] || d.field;
    const ctrl = group.get(ctrlName);
    if (ctrl) {
      const prev = ctrl.errors || {}; // conserva errores previos del control
      ctrl.setErrors({ ...prev, backend: d.message }); // guarda mensaje del backend
    }
    if (d.field === 'repetirPassword' && /no coinciden/i.test(d.message)) {
      const prevFormErr = group.errors || {}; // propaga error a nivel de formulario
      group.setErrors({ ...prevFormErr, mismatch: true });
    }
  }
  return msgs.join('\n');
}
