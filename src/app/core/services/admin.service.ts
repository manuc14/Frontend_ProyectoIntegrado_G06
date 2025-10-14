// src/app/core/services/admin.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdminEV {
  id: string;
  nombre: string;
  apellidos: string;
  correo: string;
  alias: string;
  departamento: string;
  activo: boolean;
  foto?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/ad-admin`;

  constructor(private http: HttpClient) {}

  listarAdministradores(): Observable<AdminEV[]> {
    return this.http.get<AdminEV[]>(this.apiUrl);
  }

  crearAdministrador(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/crear`, formData);
  }

  editarAdministrador(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/editar/${id}`, data);
  }

  eliminarAdministrador(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/eliminar/${id}`);
  }
}
