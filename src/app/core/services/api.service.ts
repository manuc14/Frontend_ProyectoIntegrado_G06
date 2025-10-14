// src/app/core/services/api.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SectionDto } from '../models/media.models';

/*
 * Interfaz para la respuesta de avatares predefinidos
 * IMPORTANTE: Esta interfaz debe estar ANTES de la clase ApiService
 */
export interface AvatarsResponseDto {
  success: boolean;
  message: string;
  avatars: string[];
  defaultAvatar: string;
}

/*
 * Interfaz para la petición de registro de usuario
 * Define todos los campos necesarios para crear una cuenta nueva
 */
export interface RegisterRequest {
  nombre: string;
  apellidos: string;
  email: string;
  alias: string;
  fechaNacimiento: string;
  password: string;
  repetirPassword: string;
  esVip: boolean;
  foto: string;
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
  tipo: string;
  activo: boolean;
  fechaCreacion: string;
}

/*
 * Interfaz para la respuesta de login exitoso
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

export interface ResetTokenValidationResponse {
  exists: boolean;
  verified: boolean;
}

export interface VerificationTokenValidationResponse {
  exists: boolean;
  verified: boolean;
}

/*
 * ApiService
 * Servicio centralizado para todas las comunicaciones HTTP con el backend.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.baseApiUrl;
  private resourceBase = environment.baseResourceUrl;

  /**
   * Maneja errores HTTP y devuelve mensajes amigables
   */
  private handleError(operation = 'operación', defaultMessage = 'Ha ocurrido un error inesperado') {
    return (error: HttpErrorResponse): Observable<never> => {
      let userMessage = defaultMessage;

      if (error.error && typeof error.error === 'object' && error.error.message) {
        userMessage = error.error.message;
      } else {
        switch (error.status) {
          case 400:
            userMessage = 'Los datos enviados no son válidos. Por favor, verifica la información.';
            break;
          case 401:
            userMessage = 'No tienes autorización para realizar esta acción.';
            break;
          case 403:
            userMessage = 'No tienes permisos para acceder a este recurso.';
            break;
          case 404:
            userMessage = 'El servicio solicitado no está disponible en este momento.';
            break;
          case 409:
            userMessage = 'Ya existe un registro con esta información.';
            break;
          case 500:
            userMessage = 'Error interno del servidor. Por favor, intenta más tarde.';
            break;
          case 503:
            userMessage = 'El servicio no está disponible temporalmente.';
            break;
          default:
            if (error.status === 0) {
              userMessage = 'No se puede conectar con el servidor. Verifica tu conexión a internet.';
            } else {
              userMessage = defaultMessage;
            }
        }
      }

      console.error(`Error en ${operation}:`, error);
      return throwError(() => new Error(userMessage));
    };
  }

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

  registerUser(body: RegisterRequest) {
    return this.http.post<RegisterResponse>(`${this.base}/auth/register`, body, { observe: 'response' });
  }

  login(body: LoginRequest) {
    return this.http.post<LoginResponse>(`${this.base}/auth/login`, body)
      .pipe(
        catchError(this.handleError('inicio de sesión', 'Email o contraseña incorrectos'))
      );
  }

  /**
   * Obtiene la lista de avatares predefinidos disponibles
   */
  getAvatars(): Observable<AvatarsResponseDto> {
    return this.http.get<AvatarsResponseDto>(`${this.resourceBase}/avatars`).pipe(
      catchError(this.handleError('carga de avatares', 'No se pudieron cargar los avatares disponibles'))
    );
  }

  /**
   * Construye la URL completa para un avatar
   */
  getFullAvatarUrl(relativePath: string): string {
    return relativePath;
  }

  requestPasswordReset(email: string): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(`${this.base}/auth/forgot-password`, { email });
  }

  verifyResetToken(token: string, code: string): Observable<VerifyResetTokenResponse> {
    return this.http.post<VerifyResetTokenResponse>(`${this.base}/auth/verify-reset-code?token=${token}`, { code })
      .pipe(
        catchError(this.handleError('verificación de código', 'El código de verificación es incorrecto o ha expirado'))
      );
  }

  resetPasswordWithToken(token: string, newPassword: string, repetirPassword: string): Observable<ResetPasswordResponse> {
    return this.http.post<ResetPasswordResponse>(`${this.base}/auth/reset-password?token=${token}`, { newPassword, repetirPassword })
  }

  resendResetCode(token: string): Observable<{message: string, details: any, validationErrorCount: number}> {
    return this.http.post<{message: string, details: any, validationErrorCount: number}>(`${this.base}/auth/resend-reset-code?token=${token}`, {})
      .pipe(
        catchError(this.handleError('reenvío de código', 'No se pudo reenviar el código de verificación'))
      );
  }

  verifyUserWithToken(token: string, code: string): Observable<{message: string, details?: any, validationErrorCount?: number}> {
    return this.http.post<{message: string, details?: any, validationErrorCount?: number}>(`${this.base}/auth/verify?token=${token}`, { code })
      .pipe(
        catchError(this.handleError('verificación de código', 'El código de verificación es incorrecto o ha expirado'))
      );
  }

  resendVerificationCode(token: string): Observable<{message: string, details?: any}> {
    return this.http.post<{message: string, details?: any}>(`${this.base}/auth/resend-code?token=${token}`, {})
      .pipe(
        catchError(this.handleError('reenvío de código', 'No se pudo reenviar el código. Intenta más tarde'))
      );
  }

  validateResetToken(token: string): Observable<ResetTokenValidationResponse> {
    return this.http.get<ResetTokenValidationResponse>(`${this.base}/auth/validate-reset-token?token=${token}`);
  }

  validateVerificationToken(token: string): Observable<VerificationTokenValidationResponse> {
    return this.http.get<VerificationTokenValidationResponse>(`${this.base}/auth/validate-verification-token?token=${token}`);
  }
}
