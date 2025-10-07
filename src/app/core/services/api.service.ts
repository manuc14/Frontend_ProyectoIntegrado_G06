import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SectionDto } from '../models/media.models';

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
  apellidos: string;
  tipo: string; // e.g., 'USUARIO_EV', 'ADMINISTRADOR', 'EDITOR_CONTENIDO'
  foto: string;
  fechaCreacion: string;
  id: string;
  nombreCompleto: string;
  nombre: string;
  email: string;
  activo: boolean;
}

/*
 * Interfaz para la respuesta de login exitoso
 * Incluye usuario autenticado y token de sesión
 */
export interface LoginResponse {
  success: boolean;
  message: string;
  user: BackendUser;
  token: string;
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
    return this.http.post<LoginResponse>(`${this.base}/auth/login`, body);
  }

  /** 
   * Obtiene la lista de avatares predefinidos disponibles.
   * Fallback vacío si el endpoint no está disponible.
   */
  getAvatars(): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/auth/avatars`).pipe(
      catchError((err) => {
        // Fallback vacío si el endpoint falla (componente puede usar imágenes locales)
        return of([]);
      })
    );
  }
}
