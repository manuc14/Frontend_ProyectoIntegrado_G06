/*
 * Utilidades para mapear errores de validación del backend a controles de formularios Angular de forma consistente.
 * Estructura esperada del error: { message: string; details?: Array<{ field: string; message: string }> }
 */
import { FormGroup } from '@angular/forms';

// Detalle de error por campo devuelto por el backend
export interface BackendErrorDetail {
  field: string;
  message: string;
}

// Carga útil de error de backend con mensaje general y detalles opcionales
export interface BackendErrorPayload {
  message?: string;
  details?: BackendErrorDetail[];
}

/** Limpia errores 'backend' de los controles indicados para evitar acumular errores obsoletos. */
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

/** Aplica los detalles del backend a controles usando un mapa de campos y devuelve un string con los mensajes concatenados. */
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
