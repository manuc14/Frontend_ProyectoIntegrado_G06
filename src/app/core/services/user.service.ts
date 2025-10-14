// src/app/core/services/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserEV {
  id: string;
  nombre: string;
  apellidos: string;
  correo: string;
  alias: string;
  esVip: boolean;
  fechaNacimiento: string;
  activo: boolean;
  foto?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/ad-user`;

  constructor(private http: HttpClient) {}

  listarUsuarios(): Observable<UserEV[]> {
    return this.http.get<UserEV[]>(this.apiUrl);
  }
}
