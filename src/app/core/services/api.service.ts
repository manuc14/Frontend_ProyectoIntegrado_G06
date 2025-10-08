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

  /**
   * Maneja errores HTTP y devuelve mensajes amigables para el usuario.
   * Evita mostrar errores técnicos como "404 Not Found" al usuario.
   */
  private handleError(operation = 'operación', defaultMessage = 'Ha ocurrido un error inesperado') {
    return (error: HttpErrorResponse): Observable<never> => {
      let userMessage = defaultMessage;

      // Si el backend envía un mensaje de error personalizado, usarlo
      if (error.error && typeof error.error === 'object' && error.error.message) {
        userMessage = error.error.message;
      } else {
        // Mensajes amigables basados en códigos de estado HTTP
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

  /** 
   * Obtiene las secciones de contenido para la página principal.
   * Incluye fallback vacío cuando se usan mocks para desarrollo.
   */
  getHomeSections(): Observable<SectionDto[]> {
    return this.http.get<SectionDto[]>(`${this.base}/home/sections`).pipe(
      catchError((err: any) => {
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
    return this.http.get<AvatarsResponseDto>(`${this.base}/auth/avatars`).pipe(
      catchError(this.handleError('carga de avatares', 'No se pudieron cargar los avatares disponibles'))
    );
  }

  /** 
   * Construye la URL completa para un avatar dado su ruta relativa.
   * Combina la URL base del API con la ruta del avatar.
   */
  getFullAvatarUrl(relativePath: string): string {
    return `${this.base}${relativePath}`;
  }

  /** 
   * Solicita el restablecimiento de contraseña enviando un código al email.
   * Primer paso del flujo de recuperación de contraseña.
   */
  requestPasswordReset(email: string): Observable<{message: string}> {
    return this.http.post<{message: string}>(`${this.base}/auth/forgot-password`, { email })
      .pipe(
        catchError(this.handleError('solicitud de restablecimiento', 'No se pudo enviar el código de restablecimiento'))
      );
  }

  /** 
   * Verifica el código de restablecimiento de contraseña.
   * Segundo paso del flujo de recuperación de contraseña.
   */
  verifyResetCode(email: string, code: string): Observable<{message: string}> {
    return this.http.post<{message: string}>(`${this.base}/auth/verify-reset-code`, { email, code })
      .pipe(
        catchError(this.handleError('verificación de código', 'El código de verificación es incorrecto o ha expirado'))
      );
  }

  /** 
   * Establece nueva contraseña usando el código verificado.
   * Tercer paso del flujo de recuperación de contraseña.
   */
  resetPassword(email: string, code: string, newPassword: string): Observable<{message: string}> {
    return this.http.post<{message: string}>(`${this.base}/auth/reset-password`, { email, code, newPassword })
      .pipe(
        catchError(this.handleError('restablecimiento de contraseña', 'No se pudo actualizar la contraseña'))
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
}
