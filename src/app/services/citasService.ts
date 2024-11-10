import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ListaCitasResponse } from '../home/home.page';

export interface DisponibilidadInput {
  disponible: unknown;
  idCita: number;
  idPsicologo: number;
  fecha: string; // Fecha en formato 'YYYY-MM-DD'
  horaInicio?: string; // Hora en formato 'HH:mm'
  horaFin?: string; // Hora en formato 'HH:mm'
}

@Injectable({
  providedIn: 'root'
})
export class CitasService {

  private listarCitaUrl = 'http://localhost:8084/listarCitas';
  private registrarCitaUrl = 'http://localhost:8084/registrarCita';
  private disponibilidadUrl = 'http://localhost:8084/disponibilidad';

  constructor(private http: HttpClient) {}

  listarCitas(): Observable<ListaCitasResponse> {
    return this.http.get<ListaCitasResponse>(this.listarCitaUrl);
  }
  
  registrarCita(appointmentData: any) {
    return this.http.post(this.registrarCitaUrl, appointmentData);
  }

obtenerDisponibilidad(idPsicologo: number, fecha: string): Observable<DisponibilidadInput[]> {
  const url = `http://localhost:8084/disponibilidad/${idPsicologo}/${fecha}`;
  return this.http.get<DisponibilidadInput[]>(url);
}

}
