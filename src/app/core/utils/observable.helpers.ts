/**
 * @fileoverview Helpers para simplificar operaciones comunes con Observables
 * 
 * Reduce la complejidad ciclomática centralizando patrones repetitivos de:
 * - Manejo de errores en subscripciones
 * - Navegación post-operación
 * - Actualización de estado de formularios
 * 
 * @module observable.helpers
 */

import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { FormBaseService } from '../services/form-base.service';

/**
 * Configuración para operaciones con Observable que actualizan estado de formulario
 */
export interface ObservableOperationConfig {
  /** ID del formulario para actualizar estado */
  formId: string;
  /** Servicio de gestión de formularios */
  formService: FormBaseService;
  /** Ruta a la que navegar en caso de éxito */
  successRoute: string;
  /** Router para navegación */
  router: Router;
  /** Mensaje de error por defecto */
  defaultErrorMessage?: string;
}

/**
 * Ejecuta una operación Observable con manejo estándar de estado y navegación
 * 
 * Reduce complejidad al centralizar:
 * - Activación de estado "isSubmitting"
 * - Manejo de errores
 * - Navegación en éxito
 * - Limpieza de estado
 * 
 * @param operation Observable a ejecutar
 * @param config Configuración de la operación
 * 
 * @example
 * ```typescript
 * executeObservableOperation(
 *   this.publicListService.createPublicList(request),
 *   {
 *     formId: this.formId,
 *     formService: this.formBaseService,
 *     successRoute: '/creator/catalog',
 *     router: this.router,
 *     defaultErrorMessage: 'Error al crear la lista'
 *   }
 * );
 * ```
 */
export function executeObservableOperation<T>(
  operation: Observable<T>,
  config: ObservableOperationConfig
): void {
  const { formId, formService, successRoute, router, defaultErrorMessage = 'Error en la operación' } = config;

  formService.updateFormState(formId, { isSubmitting: true });

  operation.subscribe({
    next: () => {
      formService.updateFormState(formId, { isSubmitting: false });
      router.navigate([successRoute]);
    },
    error: (error) => {
      formService.updateFormState(formId, {
        error: error.message || defaultErrorMessage,
        isSubmitting: false
      });
    }
  });
}

/**
 * Configuración para confirmación de navegación con cambios sin guardar
 */
export interface UnsavedChangesConfig {
  /** Ruta a la que navegar si se confirma */
  targetRoute: string;
  /** Router para navegación */
  router: Router;
  /** Mensaje de confirmación personalizado */
  confirmMessage?: string;
}

/**
 * Maneja la navegación con confirmación si hay cambios sin guardar
 * 
 * Reduce duplicación de código en componentes que necesitan confirmar
 * antes de salir con cambios pendientes.
 * 
 * @param hasChanges Función o booleano que indica si hay cambios
 * @param config Configuración de navegación
 * 
 * @example
 * ```typescript
 * navigateWithUnsavedCheck(
 *   this.listForm.dirty || this.addedContent.length > 0,
 *   {
 *     targetRoute: '/creator/catalog',
 *     router: this.router
 *   }
 * );
 * ```
 */
export function navigateWithUnsavedCheck(
  hasChanges: boolean | (() => boolean),
  config: UnsavedChangesConfig
): void {
  const { targetRoute, router, confirmMessage = '¿Estás seguro de que deseas salir? Los cambios no guardados se perderán.' } = config;

  const changes = typeof hasChanges === 'function' ? hasChanges() : hasChanges;

  if (changes) {
    if (confirm(confirmMessage)) {
      router.navigate([targetRoute]);
    }
  } else {
    router.navigate([targetRoute]);
  }
}

/**
 * Verifica autenticación y redirige al login si es necesario
 * 
 * Simplifica la validación de sesión al inicio de componentes
 * 
 * @param router Router para redirección
 * @returns true si está autenticado, false si se redirigió al login
 * 
 * @example
 * ```typescript
 * ngOnInit(): void {
 *   if (!checkAuthenticationOrRedirect(this.router)) return;
 *   // Continuar con inicialización
 * }
 * ```
 */
export function checkAuthenticationOrRedirect(router: Router): boolean {
  const storedToken = sessionStorage.getItem('authToken');
  
  if (!storedToken) {
    router.navigate(['/login']);
    return false;
  }
  
  return true;
}

/**
 * Configuración para operaciones asíncronas con manejo de estado
 */
export interface AsyncOperationConfig {
  /** ID del formulario */
  formId: string;
  /** Servicio de formularios */
  formService: FormBaseService;
  /** Formulario para manejo de errores backend */
  form?: any;
  /** Router para navegación */
  router?: Router;
  /** Ruta de éxito */
  successRoute?: string;
}

/**
 * Ejecuta una operación asíncrona con manejo automático de estado y errores
 * 
 * Centraliza el patrón try/catch/finally con actualización de estado de formulario
 * 
 * @param operation Función asíncrona a ejecutar
 * @param config Configuración de la operación
 * 
 * @example
 * ```typescript
 * await executeAsyncOperation(
 *   async () => {
 *     const uploadResult = await this.uploadFiles();
 *     const payload = this.buildPayload(uploadResult);
 *     await firstValueFrom(this.api.createContent(payload));
 *   },
 *   {
 *     formId: this.formId,
 *     formService: this.formBaseService,
 *     form: this.uploadForm,
 *     router: this.router,
 *     successRoute: '/content-creator'
 *   }
 * );
 * ```
 */
export async function executeAsyncOperation(
  operation: () => Promise<void>,
  config: AsyncOperationConfig
): Promise<void> {
  const { formId, formService, form, router, successRoute } = config;

  formService.updateFormState(formId, { isSubmitting: true });

  try {
    await operation();
    
    if (router && successRoute) {
      router.navigate([successRoute]);
    }
  } catch (error: unknown) {
    const isNetworkError = error instanceof Error && 
                          !error.message.includes('HTTP') && 
                          !error.message.includes('status');
    
    if (isNetworkError && error instanceof Error) {
      formService.updateFormState(formId, { error: error.message });
    } else if (form) {
      formService.handleBackendError(formId, form, error);
    } else {
      formService.updateFormState(formId, { 
        error: 'Error al procesar la operación. Inténtalo de nuevo.' 
      });
    }
  } finally {
    formService.updateFormState(formId, { isSubmitting: false });
  }
}
