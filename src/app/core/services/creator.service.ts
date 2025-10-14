import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CreatorEC {
  id: string;
  nombre: string;
  apellidos: string;
  correo: string;
  alias: string;
  especialidad: string;
  tipoContenido: string;
  activo: boolean;
  foto?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CreatorService {
  private apiUrl = `${environment.apiUrl}/ad-creator`;

  constructor(private http: HttpClient) {}

  listarCreadores(): Observable<CreatorEC[]> {
    return this.http.get<CreatorEC[]>(this.apiUrl);
  }

  crearCreador(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/crear`, formData);
  }

  editarCreador(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/editar/${id}`, data);
  }

  eliminarCreador(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/eliminar/${id}`);
  }
}
