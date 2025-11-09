/**
 * @fileoverview Servicio centralizado para todas las comunicaciones HTTP con el backend.
 * 
 * Este servicio gestiona:
 * - Autenticación (registro, login, recuperación de contraseña)
 * - Verificación de email
 * - Gestión de avatares y miniaturas
 * - Creación y recuperación de contenido
 * - Manejo unificado de errores HTTP
 * 
 * @module ApiService
 * @requires HttpClient - Cliente HTTP de Angular
 * @requires environment - Configuración de entornos
 */

import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SectionDto, AvatarsResponseDto } from '../models/media.models';

/**
 * Interfaz para la petición de registro de usuario.
 * Define todos los campos necesarios para crear una cuenta nueva.
 * 
 * @interface RegisterRequest
 */
export interface RegisterRequest {
  /** Nombre del usuario */
  nombre: string;
  /** Apellidos del usuario */
  apellidos: string;
  /** Email único del usuario */
  email: string;
  /** Alias público del usuario */
  alias: string;
  /** Fecha de nacimiento en formato ISO (YYYY-MM-DD) */
  fechaNacimiento: string;
  /** Contraseña del usuario */
  password: string;
  /** Confirmación de la contraseña */
  repetirPassword: string;
  /** Indica si el usuario es VIP */
  esVip: boolean;
  /** Ruta del avatar seleccionado (opcional, usa el por defecto si no se especifica) */
  foto?: string;
  /** Estado de activación del usuario */
  activo: boolean;
}

/**
 * Interfaz para la respuesta del registro.
 * Estructura de datos devuelta tras crear un usuario exitosamente.
 * 
 * @interface RegisterResponse
 */
export interface RegisterResponse {
  /** Indica si el registro fue exitoso */
  ok: boolean;
  /** ID del usuario creado (opcional) */
  userId?: string;
}

/**
 * Interfaz para credenciales de login.
 * Datos mínimos necesarios para autenticación.
 * 
 * @interface LoginRequest
 */
export interface LoginRequest {
  /** Email del usuario */
  email: string;
  /** Contraseña del usuario */
  password: string;
}

/**
 * Interfaz del usuario devuelto por el backend.
 * Contiene toda la información de perfil y estado del usuario autenticado.
 * 
 * @interface BackendUser
 */
export interface BackendUser {
  /** ID único del usuario */
  id: string;
  /** Email del usuario */
  email: string;
  /** Nombre del usuario */
  nombre: string;
  /** Apellidos del usuario */
  apellidos: string;
  /** Nombre completo (concatenación de nombre y apellidos) */
  nombreCompleto: string;
  /** URL de la foto de perfil */
  foto: string;
  /** Tipo de usuario (USUARIO_EV, ADMINISTRADOR, EDITOR_CONTENIDO, CREADOR) */
  tipo: string;
  /** Estado de activación del usuario */
  activo: boolean;
  /** Fecha de creación de la cuenta */
  fechaCreacion: string;
  /** Alias público (opcional) */
  alias?: string;
  /** Descripción del usuario (opcional) */
  descripcion?: string;
  /** Especialidad del creador (opcional) */
  especialidad?: string;
  /** Tipo de contenido que crea (audio | video) (opcional) */
  tipoContenido?: string;
}

/**
 * Interfaz para la respuesta de login exitoso.
 * Incluye usuario autenticado, token de sesión y mensaje de confirmación.
 * Soporta autenticación en dos pasos (2FA) con twoFactorSessionToken y requiresTwoFactor.
 * 
 * @interface LoginResponse
 */
export interface LoginResponse {
  /** Mensaje de confirmación del login */
  message: string;
  /** Detalles adicionales del login */
  details: any;
  /** Access Token JWT para autenticación (15 minutos) - solo si 2FA completado */
  token?: string;
  /** Refresh Token para renovar el Access Token (7 días) - solo si 2FA completado */
  refreshToken?: string;
  /** Información del usuario autenticado */
  user: BackendUser;
  /** Número de errores de validación (0 si es exitoso) */
  validationErrorCount: number;
  /** Tiempo de inactividad permitido (en milisegundos) desde el backend */
  idleTimeoutMillis?: number;
  /** Tiempo máximo de sesión (en milisegundos) desde el backend */
  absoluteTimeoutMillis?: number;
  /** Indica si requiere verificación de dos factores (2FA) */
  requiresTwoFactor?: boolean;
  /** Token temporal para verificación de 2FA (válido solo para /auth/verify-otp) */
  twoFactorSessionToken?: string;
  /** Tipo de 2FA: "SETUP" para nuevo usuario sin 2FA, "VERIFY" para usuario con 2FA existente */
  twoFactorType?: 'SETUP' | 'VERIFY';
  /** Datos de setup de 2FA (QR, secret, códigos respaldo) - solo cuando twoFactorType es "SETUP" */
  setupData?: {
    qrCode: string;
    secret: string;
    backupCodes: string[];
    message?: string;
  };
}

/**
 * Interfaz para la respuesta de solicitud de restablecimiento de contraseña.
 * @interface ForgotPasswordResponse
 */
export interface ForgotPasswordResponse {
  /** Mensaje de confirmación */
  message: string;
  /** Detalles adicionales */
  details: any;
  /** Token para el proceso de restablecimiento */
  resetToken: string;
  /** Número de errores de validación */
  validationErrorCount: number;
}

/**
 * Interfaz para la respuesta de verificación de token de restablecimiento.
 * @interface VerifyResetTokenResponse
 */
export interface VerifyResetTokenResponse {
  /** Mensaje de confirmación */
  message: string;
  /** Detalles adicionales */
  details: any;
  /** Número de errores de validación */
  validationErrorCount: number;
}

/**
 * Interfaz para la respuesta de restablecimiento de contraseña.
 * @interface ResetPasswordResponse
 */
export interface ResetPasswordResponse {
  /** Mensaje de confirmación */
  message: string;
  /** Detalles adicionales */
  details: any;
  /** Número de errores de validación */
  validationErrorCount: number;
}

/**
 * Servicio centralizado para todas las comunicaciones HTTP con el backend.
 * 
 * Proporciona métodos para:
 * - Autenticación y gestión de sesiones
 * - Registro y verificación de usuarios
 * - Recuperación de contraseñas
 * - Gestión de avatares y contenido multimedia
 * - Manejo unificado de errores HTTP
 * 
 * Todos los métodos incluyen manejo de errores y transformación de mensajes
 * para proporcionar feedback amigable al usuario.
 * 
 * @class ApiService
 * @injectable
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  /** Cliente HTTP para realizar peticiones */
  private http = inject(HttpClient);
  /** URL base del backend para las APIs (configurada según entorno) */
  private base = environment.baseApiUrl;
  /** URL base para recursos estáticos (configurada según entorno) */
  private resourceBase = environment.baseResourceUrl;

  /**
   * Extrae el mensaje de error más relevante del backend.
   * 
   * Prioriza mensajes detallados sobre mensajes generales para proporcionar
   * feedback más específico al usuario. El backend envía errores en formato JSON
   * con estructura: { message: string, details: Array<{field, message}> }
   * 
   * @param {any} error - Error HTTP recibido del backend
   * @returns {string} Mensaje de error extraído (detallado o general)
   * @private
   */
  private extractUserMessageFromError(error: any): string {
    const errorObj = error.error;
    if (errorObj.details?.length > 0) {
      return errorObj.details[0].message;
    }
    return errorObj.message || '';
  }

  /**
   * Obtiene un mensaje genérico de error como fallback.
   * 
   * Devuelve siempre el mensaje por defecto proporcionado. Este método se usa
   * cuando no hay mensajes específicos del backend disponibles.
   * 
   * @param {number} status - Código de estado HTTP
   * @param {string} operation - Nombre de la operación que falló
   * @param {string} defaultMessage - Mensaje por defecto a devolver
   * @returns {string} Mensaje por defecto
   * @private
   */
  private getStatusMessage(status: number, operation: string, defaultMessage: string): string {
    return defaultMessage;
  }

  /**
   * Maneja errores HTTP de forma centralizada y uniforme.
   * 
   * Procesa errores del backend y devuelve mensajes amigables para el usuario,
   * evitando mostrar errores técnicos como "404 Not Found" directamente.
   * 
   * Prioridad de mensajes:
   * 1. Mensaje detallado del backend (error.error.details[0].message)
   * 2. Mensaje general del backend (error.error.message)
   * 3. Mensaje por defecto proporcionado
   * 
   * @param {string} operation - Nombre de la operación que falló (para logging)
   * @param {string} defaultMessage - Mensaje por defecto si no hay mensaje del backend
   * @returns {Function} Operador RxJS para catchError que procesa HttpErrorResponse
   * @private
   * 
   * @example
   * ```typescript
   * return this.http.post('/api/register', data).pipe(
   *   catchError(this.handleError('registro', 'Error al registrar usuario'))
   * );
   * ```
   */
  private handleError(operation = 'operación', defaultMessage = 'Ha ocurrido un error inesperado') {
    return (error: HttpErrorResponse): Observable<never> => {
      let userMessage = this.extractUserMessageFromError(error);
      if (!userMessage) {
        userMessage = this.getStatusMessage(error.status, operation, defaultMessage);
      }

      console.error(`Error en ${operation}:`, error);
      
      // Preservar la estructura original del error pero asegurar que el mensaje esté disponible
      const enhancedError = {
        ...error,
        error: {
          ...(error.error || {}),
          message: userMessage
        }
      };
      
      return throwError(() => enhancedError);
    };
  }

  // ==================== CONTENIDO Y RECURSOS ====================

  /**
   * Obtiene las secciones de contenido para la página principal.
   * 
   * Recupera todas las secciones disponibles con su contenido multimedia
   * (audios, videos, álbumes). Se usa principalmente en la página de inicio
   * para mostrar el contenido destacado.
   * 
   * @returns {Observable<SectionDto[]>} Observable con array de secciones
   * 
   * @example
   * ```typescript
   * this.apiService.getSections().subscribe({
   *   next: (sections) => {
   *     sections.forEach(section => {
   *       console.log(section.titulo, section.contenidos.length);
   *     });
   *   },
   *   error: (error) => console.error('Error al cargar secciones:', error)
   * });
   * ```
   */
  getHomeSections(): Observable<SectionDto[]> {
    return this.http.get<SectionDto[]>(`${this.base}/home/sections`).pipe(
      catchError((err) => {
        if (environment.useMocks) {
          const fallback: SectionDto[] = [];
          return of(fallback);
        }
        throw err;
      })
    );
  }

  // ==================== AUTENTICACIÓN ====================

  /**
   * Registra un nuevo usuario en el sistema.
   * 
   * Envía los datos del formulario de registro al endpoint correspondiente.
   * Devuelve la respuesta HTTP completa para permitir leer códigos de estado
   * y headers adicionales.
   * 
   * @param {RegisterRequest} body - Datos del nuevo usuario
   * @returns {Observable<HttpResponse<RegisterResponse>>} Observable con respuesta HTTP completa
   * 
   * @example
   * ```typescript
   * const userData: RegisterRequest = {
   *   nombre: 'María',
   *   apellidos: 'García',
   *   email: 'maria@example.com',
   *   alias: 'mariag',
   *   fechaNacimiento: '1995-05-20',
   *   password: 'SecurePass123!',
   *   repetirPassword: 'SecurePass123!',
   *   esVip: false,
   *   activo: true
   * };
   * 
   * this.apiService.registerUser(userData).subscribe({
   *   next: (response) => {
   *     console.log('Status:', response.status);
   *     console.log('Usuario ID:', response.body?.userId);
   *   },
   *   error: (error) => console.error('Error:', error)
   * });
   * ```
   */
  registerUser(body: RegisterRequest) {
    return this.http.post<RegisterResponse>(`${this.base}/auth/register`, body, { observe: 'response' });
  }

  /**
   * Inicia sesión de un usuario existente.
   * 
   * Autentica al usuario con email y contraseña. Si es exitoso, devuelve
   * el token JWT y los datos del usuario para almacenar en sesión.
   * 
   * @param {LoginRequest} credentials - Email y contraseña del usuario
   * @returns {Observable<LoginResponse>} Observable con token y datos del usuario
   * 
   * @example
   * ```typescript
   * const credentials: LoginRequest = {
   *   email: 'maria@example.com',
   *   password: 'SecurePass123!'
   * };
   * 
   * this.apiService.login(credentials).subscribe({
   *   next: (response) => {
   *     localStorage.setItem('token', response.token);
   *     localStorage.setItem('user', JSON.stringify(response.user));
   *     console.log('Bienvenido:', response.user.nombreCompleto);
   *   },
   *   error: (error) => console.error('Credenciales inválidas')
   * });
   * ```
   */
  login(body: LoginRequest, options?: any) {
    return this.http.post<LoginResponse>(`${this.base}/auth/login`, body, options);
  }

  // ==================== AVATARES Y RECURSOS ====================

  /**
   * Obtiene la lista de avatares predefinidos disponibles.
   * 
   * Recupera todos los avatares que los usuarios pueden seleccionar para
   * su perfil, incluyendo el avatar por defecto del sistema.
   * 
   * @returns {Observable<AvatarsResponseDto>} Observable con lista de avatares y default
   * 
   * @example
   * ```typescript
   * this.apiService.getAvatars().subscribe({
   *   next: (response) => {
   *     console.log('Avatares disponibles:', response.avatares.length);
   *     console.log('Avatar por defecto:', response.avatarPorDefecto);
   *     this.avatarList = response.avatares;
   *   },
   *   error: (error) => console.error('Error al cargar avatares:', error)
   * });
   * ```
   */
  getAvatars(): Observable<AvatarsResponseDto> {
    return this.http.get<AvatarsResponseDto>(`${this.resourceBase}/avatars`).pipe(
      catchError(this.handleError('carga de avatares', 'No se pudieron cargar los avatares disponibles'))
    );
  }

  /**
   * Construye la URL completa para un avatar dado su ruta relativa.
   * 
   * Maneja diferentes formatos de rutas:
   * - Rutas absolutas con /resources/: Se devuelven sin modificar
   * - Rutas relativas con /: Se añade el prefijo resourceBase
   * - Solo nombre de archivo: Se construye la ruta completa con /avatars/
   * 
   * El proxy de desarrollo redirige /resources/* al backend automáticamente.
   * 
   * @param {string} relativePath - Ruta relativa del avatar
   * @returns {string} URL completa del avatar
   * 
   * @example
   * ```typescript
   * // Ruta absoluta
   * this.apiService.getFullAvatarUrl('/resources/avatars/avatar1.png');
   * // => '/resources/avatars/avatar1.png'
   * 
   * // Ruta relativa
   * this.apiService.getFullAvatarUrl('/avatars/avatar1.png');
   * // => '/resources/avatars/avatar1.png'
   * 
   * // Solo nombre
   * this.apiService.getFullAvatarUrl('avatar1.png');
   * // => '/resources/avatars/avatar1.png'
   * ```
   */
  getFullAvatarUrl(relativePath: string): string {
    // Si la ruta ya incluye /resources/, devolver tal cual
    if (relativePath.startsWith('/resources/')) {
      return relativePath;
    }
    // Si la ruta es relativa (ej: /avatars/avatar1.png), agregar /resources/
    if (relativePath.startsWith('/')) {
      return `${this.resourceBase}${relativePath}`;
    }
    // Si es solo el nombre del archivo, construir la ruta completa
    return `${this.resourceBase}/avatars/${relativePath}`;
  }

  /**
   * Obtiene la URL del avatar para una entidad con fallback.
   * 
   * Devuelve la URL completa del avatar si existe, o la imagen por defecto
   * del sistema si no se proporcionó foto.
   * 
   * @param {string} [foto] - Ruta opcional del avatar
   * @returns {string} URL del avatar o imagen por defecto
   * 
   * @example
   * ```typescript
   * // Con foto
   * const url = this.apiService.getAvatarUrl('/avatars/user1.png');
   * // => '/resources/avatars/user1.png'
   * 
   * // Sin foto
   * const defaultUrl = this.apiService.getAvatarUrl();
   * // => 'assets/admin/admin_default.png'
   * ```
   */
  getAvatarUrl(foto?: string): string {
    return foto ? this.getFullAvatarUrl(foto) : 'assets/admin/admin_default.png';
  }

  // ==================== RECUPERACIÓN DE CONTRASEÑA ====================

  /**
   * Solicita el restablecimiento de contraseña.
   * 
   * Primer paso del flujo de recuperación de contraseña. Envía un código
   * de verificación al email del usuario si existe en el sistema.
   * 
   * @param {string} email - Email del usuario que solicita recuperar contraseña
   * @returns {Observable<ForgotPasswordResponse>} Observable con token de reset
   * 
   * @example
   * ```typescript
   * this.apiService.requestPasswordReset('usuario@example.com').subscribe({
   *   next: (response) => {
   *     console.log('Código enviado:', response.message);
   *     this.router.navigate(['/reset-password']);
   *   },
   *   error: (error) => console.error('Email no encontrado')
   * });
   * ```
   */
  requestPasswordReset(email: string): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(`${this.base}/auth/forgot-password`, { email });
  }

  /**
   * Verifica el código de restablecimiento de contraseña.
   * 
   * Segundo paso del flujo de recuperación. Valida que el código ingresado
   * por el usuario coincida con el enviado al email y que no haya expirado.
   * 
   * @param {string} token - Token de reset obtenido en el paso anterior
   * @param {string} code - Código de 6 dígitos ingresado por el usuario
   * @returns {Observable<VerifyResetTokenResponse>} Observable con confirmación de verificación
   * 
   * @example
   * ```typescript
   * this.apiService.verifyResetToken(resetToken, '123456').subscribe({
   *   next: (response) => {
   *     console.log('Código verificado:', response.message);
   *     this.router.navigate(['/new-password']);
   *   },
   *   error: (error) => console.error('Código incorrecto o expirado')
   * });
   * ```
   */
  verifyResetToken(token: string, code: string): Observable<VerifyResetTokenResponse> {
    return this.http.post<VerifyResetTokenResponse>(`${this.base}/auth/verify-reset-code?token=${token}`, { code })
      .pipe(
        catchError(this.handleError('verificación de código', 'El código de verificación es incorrecto o ha expirado'))
      );
  }

  /**
   * Establece la nueva contraseña después de verificar el código.
   * 
   * Tercer y último paso del flujo de recuperación. Permite al usuario
   * establecer una nueva contraseña usando el token verificado.
   * 
   * @param {string} token - Token de reset verificado
   * @param {string} newPassword - Nueva contraseña del usuario
   * @param {string} repetirPassword - Confirmación de la nueva contraseña
   * @returns {Observable<ResetPasswordResponse>} Observable con confirmación del cambio
   * 
   * @example
   * ```typescript
   * const newPass = 'NewSecure123!';
   * this.apiService.resetPasswordWithToken(token, newPass, newPass).subscribe({
   *   next: (response) => {
   *     console.log('Contraseña actualizada');
   *     this.router.navigate(['/login']);
   *   },
   *   error: (error) => console.error('Error al cambiar contraseña')
   * });
   * ```
   */
  resetPasswordWithToken(token: string, newPassword: string, repetirPassword: string): Observable<ResetPasswordResponse> {
    return this.http.post<ResetPasswordResponse>(`${this.base}/auth/reset-password?token=${token}`, { newPassword, repetirPassword })
  }

  // ==================== VERIFICACIÓN DE EMAIL ====================

  /**
   * Reenvía el código de restablecimiento usando el token actual.
   * Permite reenviar el código sin generar un nuevo token.
   */
  resendResetCode(token: string): Observable<{message: string, details: any, validationErrorCount: number}> {
    return this.http.post<{message: string, details: any, validationErrorCount: number}>(`${this.base}/auth/resend-reset-code?token=${token}`, {})
      .pipe(
        catchError(this.handleError('reenvío de código', 'No se pudo reenviar el código de verificación'))
      );
  }

  /**
   * Verifica el código de verificación de email del usuario.
   * 
   * Valida el código de 6 dígitos enviado al email del usuario durante
   * el proceso de registro. Si es correcto, activa la cuenta del usuario.
   * 
   * @param {string} token - Token de verificación de email
   * @param {string} code - Código de 6 dígitos ingresado por el usuario
   * @returns {Observable<{message: string, details?: any, validationErrorCount?: number}>} Observable con confirmación
   * 
   * @example
   * ```typescript
   * this.apiService.verifyUserWithToken(verifyToken, '654321').subscribe({
   *   next: (response) => {
   *     console.log('Email verificado:', response.message);
   *     this.router.navigate(['/login']);
   *   },
   *   error: (error) => console.error('Código incorrecto')
   * });
   * ```
   */
  verifyUserWithToken(token: string, code: string): Observable<{message: string, details?: any, validationErrorCount?: number}> {
    return this.http.post<{message: string, details?: any, validationErrorCount?: number}>(`${this.base}/auth/verify?token=${token}`, { code })
      .pipe(
        catchError(this.handleError('verificación de código', 'El código de verificación es incorrecto o ha expirado'))
      );
  }

  // ==================== SUBIDA DE CONTENIDO ====================

  /**
   * Reenvía un nuevo código de verificación de email.
   * 
   * Genera y envía un nuevo código de 6 dígitos al email del usuario.
   * Útil cuando el código anterior ha expirado o no llegó.
   * 
   * @param {string} token - Token de verificación actual
   * @returns {Observable<{message: string, details?: any}>} Observable con confirmación del reenvío
   * 
   * @example
   * ```typescript
   * this.apiService.resendVerificationCode(verifyToken).subscribe({
   *   next: (response) => {
   *     console.log('Código reenviado:', response.message);
   *     this.showSuccessMessage('Revisa tu email');
   *   },
   *   error: (error) => console.error('Error al reenviar:', error)
   * });
   * ```
   */
  resendVerificationCode(token: string): Observable<{message: string, details?: any}> {
    return this.http.post<{message: string, details?: any}>(`${this.base}/auth/resend-code?token=${token}`, {})
      .pipe(
        catchError(this.handleError('reenvío de código', 'No se pudo reenviar el código. Intenta más tarde'))
      );
  }

  // ==================== VALIDACIÓN DE TOKENS ====================

  /**
   * Valida un token de reset de contraseña antes de mostrar el formulario.
   * 
   * Verifica si el token existe, no ha expirado y el código fue validado
   * correctamente. Previene acceso directo a URLs sin haber completado
   * los pasos previos.
   * 
   * @param {string} token - Token de reset a validar
   * @returns {Observable<ResetTokenValidationResponse>} Observable con estado de validación
   * 
   * @example
   * ```typescript
   * this.apiService.validateResetToken(token).subscribe({
   *   next: (response) => {
   *     if (response.valid) {
   *       this.showPasswordForm();
   *     } else {
   *       this.router.navigate(['/forgot-password']);
   *     }
   *   }
   * });
   * ```
   */
  validateResetToken(token: string): Observable<ResetTokenValidationResponse> {
    return this.http.get<ResetTokenValidationResponse>(`${this.base}/auth/validate-reset-token?token=${token}`);
  }

  /**
   * Valida un token de verificación de email antes de mostrar el formulario.
   * 
   * Verifica si el token existe y no ha expirado. Previene acceso directo
   * a la página de verificación sin haberse registrado correctamente.
   * 
   * @param {string} token - Token de verificación a validar
   * @returns {Observable<VerifyTokenValidationResponse>} Observable con estado de validación
   * 
   * @example
   * ```typescript
   * this.apiService.validateVerificationToken(token).subscribe({
   *   next: (response) => {
   *     if (response.valid) {
   *       this.showCodeInput();
   *     } else {
   *       this.router.navigate(['/register']);
   *     }
   *   }
   * });
   * ```
   */
  validateVerificationToken(token: string): Observable<VerificationTokenValidationResponse> {
    return this.http.get<VerificationTokenValidationResponse>(`${this.base}/auth/validate-verification-token?token=${token}`);
  }

  // ==================== MINIATURAS ====================

  /**
   * Obtiene la lista de miniaturas disponibles del backend.
   * 
   * Recupera todas las miniaturas predefinidas que los creadores pueden
   * seleccionar para sus contenidos, incluyendo la miniatura por defecto.
   * 
   * @returns {Observable<{thumbnails: string[], defaultThumbnail: string}>} Observable con miniaturas y default
   * 
   * @example
   * ```typescript
   * this.apiService.getThumbnails().subscribe({
   *   next: (response) => {
   *     this.thumbnailList = response.thumbnails;
   *     this.defaultThumb = response.defaultThumbnail;
   *   },
   *   error: (error) => console.error('Error al cargar miniaturas')
   * });
   * ```
   */
  getThumbnails(): Observable<{thumbnails: string[], defaultThumbnail: string}> {
    return this.http.get<{thumbnails: string[], defaultThumbnail: string}>(`${this.resourceBase}/thumbnails`)
      .pipe(
        catchError(this.handleError('obtener miniaturas', 'No se pudieron cargar las miniaturas'))
      );
  }

  /**
   * Crea nuevo contenido multimedia en el backend.
   * 
   * Envía el contenido (audio o video) junto con sus metadatos al servidor.
   * Requiere autenticación mediante token JWT.
   * 
   * @param {any} payload - Datos del contenido a crear (FormData con archivo y metadatos)
   * @returns {Observable<any>} Observable con la respuesta del servidor
   * 
   * @example
   * ```typescript
   * const formData = new FormData();
   * formData.append('titulo', 'Mi canción');
   * formData.append('descripcion', 'Una gran canción');
   * formData.append('archivo', audioFile);
   * 
   * this.apiService.createContent(formData).subscribe({
   *   next: (response) => console.log('Contenido creado:', response.id),
   *   error: (error) => console.error('Error al crear contenido')
   * });
   * ```
   */
  createContent(payload: any): Observable<any> {
    const headers = { 'Authorization': `Bearer ${sessionStorage.getItem('authToken')}` };
    return this.http.post(`${this.base}/contenidos`, payload, { headers })
      .pipe(
        catchError(this.handleError('crear contenido', 'No se pudo crear el contenido'))
      );
  }

  /**
   * Obtiene la URL completa para una miniatura.
   * 
   * Maneja diferentes formatos de rutas para miniaturas:
   * - URLs absolutas (http/https): Se devuelven sin modificar
   * - Rutas relativas: Se construye la URL completa con resourceBase
   * 
   * @param {string} relativePath - Ruta relativa o absoluta de la miniatura
   * @returns {string} URL completa de la miniatura
   * 
   * @example
   * ```typescript
   * // URL absoluta
   * const url1 = this.apiService.getFullThumbnailUrl('https://cdn.example.com/thumb.jpg');
   * // => 'https://cdn.example.com/thumb.jpg'
   * 
   * // Ruta relativa
   * const url2 = this.apiService.getFullThumbnailUrl('/thumbnails/thumb1.jpg');
   * // => '/resources/thumbnails/thumb1.jpg'
   * 
   * // Sin barra inicial
   * const url3 = this.apiService.getFullThumbnailUrl('thumbnails/thumb2.jpg');
   * // => '/resources/thumbnails/thumb2.jpg'
   * ```
   */
  getFullThumbnailUrl(relativePath: string): string {
    if (relativePath.startsWith('http')) {
      return relativePath;
    }
    const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    return `${this.base.replace('/api', '')}${cleanPath}`;
  }
}

// ==================== INTERFACES DE VALIDACIÓN ====================

/**
 * Interfaz para la respuesta de validación de token de reset de contraseña.
 * Indica si el token existe en el sistema y si fue verificado con código.
 * 
 * @interface ResetTokenValidationResponse
 */
export interface ResetTokenValidationResponse {
  /** Indica si el token existe en el sistema */
  exists: boolean;
  /** Indica si el código fue verificado correctamente */
  verified: boolean;
}

/**
 * Interfaz para la respuesta de validación de token de verificación de email.
 * Indica si el token existe en el sistema y su estado de verificación.
 * 
 * @interface VerificationTokenValidationResponse
 */
export interface VerificationTokenValidationResponse {
  /** Indica si el token existe en el sistema */
  exists: boolean;
  /** Indica si el email fue verificado correctamente */
  verified: boolean;
}
