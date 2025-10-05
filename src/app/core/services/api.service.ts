import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SectionDto } from '../models/media.models';

export interface RegisterRequest {
  nombre: string;
  apellidos: string;
  email: string;
  alias: string;
  fechaNacimiento: string; // ISO date
  password: string;
  vip: boolean;
  avatarUrl: string;
}

export interface RegisterResponse {
  ok: boolean;
  userId?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  ok: boolean;
  token?: string;
  role?: 'ADMIN' | 'CONTENT' | 'USER';
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.baseApiUrl;

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
    return this.http.post<RegisterResponse>(`${this.base}/auth/register`, body);
  }

  login(body: LoginRequest) {
    return this.http.post<LoginResponse>(`${this.base}/auth/login`, body);
  }
}
