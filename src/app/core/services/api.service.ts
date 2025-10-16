import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SectionDto, AvatarsResponseDto } from '../models/media.models';

/*
 * Interfaz para la petición de registro de usuario
 * Define todos los campos necesarios para crear una cuenta nueva
 */
export interface RegisterRequest {
  nombre: string;
  apellidos: string;
  email: string;
  alias: string;
  fechaNacimiento: string; // Fecha en formato ISO
  password: string;
  repetirPassword: string;
  esVip: boolean;
  foto: string; // Ruta del avatar seleccionado (ej: "/avatars/avatar1.png")
  activo: boolean;
}

/*
 * Interfaz para la respuesta del registro
 * Estructura de datos devuelta tras crear usuario
 */
export interface RegisterResponse {
  ok: boolean;
  userId?: string;
}

/*
 * Interfaz para credenciales de login
 * Datos mínimos necesarios para autenticación
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/*
 * Interfaz del usuario devuelto por el backend
 * Contiene toda la información de perfil y estado
 */
export interface BackendUser {
  id: string;
  email: string;
  nombre: string;
  apellidos: string;
  nombreCompleto: string;
  foto: string;
  tipo: string; // e.g., 'USUARIO_EV', 'ADMINISTRADOR', 'EDITOR_CONTENIDO'
  activo: boolean;
  fechaCreacion: string;
}

/*
 * Interfaz para la respuesta de login exitoso
 * Incluye usuario autenticado y token de sesión
 * Estructura actualizada para coincidir con el backend
 */
export interface LoginResponse {
  message: string;
  details: any;
  token: string;
  user: BackendUser;
  validationErrorCount: number;
}

/*
 * Interfaces para el flujo de restablecimiento de contraseña
 */
export interface ForgotPasswordResponse {
  message: string;
  details: any;
  resetToken: string;
  validationErrorCount: number;
}

export interface VerifyResetTokenResponse {
  message: string;
  details: any;
  validationErrorCount: number;
}

export interface ResetPasswordResponse {
  message: string;
  details: any;
  validationErrorCount: number;
}

/*
 * ApiService
 * Servicio centralizado para todas las comunicaciones HTTP con el backend.
 * Gestiona autenticación, registro, contenido multimedia y avatares.
 * Incluye manejo de errores y fallbacks para desarrollo.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  // URL base configurada según el entorno (development/production)
  private base = environment.baseApiUrl;
  private resourceBase = environment.baseResourceUrl;

  /**
   * Maneja errores HTTP y devuelve mensajes amigables para el usuario.
   * Evita mostrar errores técnicos como "404 Not Found" al usuario.
   */
  private handleError(operation = 'operación', defaultMessage = 'Ha ocurrido un error inesperado') {
    return (error: HttpErrorResponse): Observable<never> => {
      let userMessage = 'Se ha producido un error inesperado. Inténtelo de nuevo más tarde.';

      // Si el backend envía un mensaje de error personalizado, usarlo
      if (error.error && typeof error.error === 'object' && error.error.message) {
        userMessage = error.error.message;
      }

      console.error(`Error en ${operation}:`, error);
      return throwError(() => new Error(userMessage));
    };
  }

  /** 
   * Obtiene las secciones de contenido para la página principal.
   * Incluye fallback vacío cuando se usan mocks para desarrollo.
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

  /** 
   * Registra un nuevo usuario en el sistema.
   * Devuelve la respuesta HTTP completa para leer códigos de estado.
   */
  registerUser(body: RegisterRequest) {
    return this.http.post<RegisterResponse>(`${this.base}/auth/register`, body, { observe: 'response' });
  }

  /** 
   * Autentica usuario y devuelve datos de sesión.
   * Incluye información de perfil y token para requests posteriores.
   */
  login(body: LoginRequest) {
    return this.http.post<LoginResponse>(`${this.base}/auth/login`, body)
      .pipe(
        catchError(this.handleError('inicio de sesión', 'Email o contraseña incorrectos'))
      );
  }

  /** 
   * Obtiene la lista de avatares predefinidos disponibles.
   * Devuelve la respuesta completa con avatares y avatar por defecto.
   * Si falla, propaga el error para que el componente pueda manejarlo.
   */
  getAvatars(): Observable<AvatarsResponseDto> {
    return this.http.get<AvatarsResponseDto>(`${this.resourceBase}/avatars`).pipe(
      catchError(this.handleError('carga de avatares', 'No se pudieron cargar los avatares disponibles'))
    );
  }

  /** 
   * Construye la URL completa para un avatar dado su ruta relativa.
   * El proxy redirige /resources/* al backend automáticamente.
   */
  getFullAvatarUrl(relativePath: string): string {
    return relativePath;
  }

  /** 
   * Solicita el restablecimiento de contraseña enviando un código al email.
   * Primer paso del flujo de recuperación de contraseña.
   */
  requestPasswordReset(email: string): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(`${this.base}/auth/forgot-password`, { email });
  }

  /** 
   * Verifica el código de restablecimiento usando el token.
   * Segundo paso del flujo de recuperación de contraseña.
   */
  verifyResetToken(token: string, code: string): Observable<VerifyResetTokenResponse> {
    return this.http.post<VerifyResetTokenResponse>(`${this.base}/auth/verify-reset-code?token=${token}`, { code })
      .pipe(
        catchError(this.handleError('verificación de código', 'El código de verificación es incorrecto o ha expirado'))
      );
  }

  /** 
   * Establece nueva contraseña usando el token verificado.
   * Tercer paso del flujo de recuperación de contraseña.
   */
  resetPasswordWithToken(token: string, newPassword: string, repetirPassword: string): Observable<ResetPasswordResponse> {
    return this.http.post<ResetPasswordResponse>(`${this.base}/auth/reset-password?token=${token}`, { newPassword, repetirPassword })
  }

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
   * Verifica el código de verificación de usuario usando el token de verificación.
   * Utiliza el endpoint POST /api/auth/verify?token={token} con el código en el body.
   */
  verifyUserWithToken(token: string, code: string): Observable<{message: string, details?: any, validationErrorCount?: number}> {
    return this.http.post<{message: string, details?: any, validationErrorCount?: number}>(`${this.base}/auth/verify?token=${token}`, { code })
      .pipe(
        catchError(this.handleError('verificación de código', 'El código de verificación es incorrecto o ha expirado'))
      );
  }

  /** 
   * Reenvía un nuevo código de verificación usando el token actual.
   * Utiliza el endpoint POST /api/auth/resend-code?token={token}.
   */
  resendVerificationCode(token: string): Observable<{message: string, details?: any}> {
    return this.http.post<{message: string, details?: any}>(`${this.base}/auth/resend-code?token=${token}`, {})
      .pipe(
        catchError(this.handleError('reenvío de código', 'No se pudo reenviar el código. Intenta más tarde'))
      );
  }

  /** 
   * Valida un token de reset de contraseña antes de mostrar la pantalla.
   * Verifica si la sesión existe y si el código fue validado.
   */
  validateResetToken(token: string): Observable<ResetTokenValidationResponse> {
    return this.http.get<ResetTokenValidationResponse>(`${this.base}/auth/validate-reset-token?token=${token}`);
  }

  /** 
   * Valida un token de verificación de email antes de mostrar la pantalla.
   * Verifica si la sesión existe y si el código fue validado.
   */
  validateVerificationToken(token: string): Observable<VerificationTokenValidationResponse> {
    return this.http.get<VerificationTokenValidationResponse>(`${this.base}/auth/validate-verification-token?token=${token}`);
  }
}

/*
 * Interfaz para la respuesta de validación de token de reset
 */
export interface ResetTokenValidationResponse {
  exists: boolean;
  verified: boolean;
}

/*
 * Interfaz para la respuesta de validación de token de verificación de email
 */
export interface VerificationTokenValidationResponse {
  exists: boolean;
  verified: boolean;
}
