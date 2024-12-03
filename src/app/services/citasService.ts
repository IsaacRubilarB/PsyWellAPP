import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable } from 'rxjs';
import { ListaCitasResponse } from '../home/cita.model';
import { environment } from 'src/environments/environment';

export interface DisponibilidadInput {
  disponible: any;
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

  private listarCitaUrl = environment.apiCalendario+'listarCitas';
  private registrarCitaUrl = environment.apiCalendario+'registrarCita';
  private disponibilidadUrl = environment.apiCalendario+'disponibilidad';

  constructor(private http: HttpClient) {}

  listarCitas(): Observable<ListaCitasResponse> {
    return this.http.get<ListaCitasResponse>(this.listarCitaUrl);
  }
  
  registrarCita(appointmentData: any) {
    return this.http.post(this.registrarCitaUrl, appointmentData).pipe(
      catchError(error => {
        console.error('Error al registrar la cita', error);
        throw error;  // Lanzar el error para manejarlo en el frontend
      })
    );
  }
  

  obtenerDisponibilidad(idPsicologo: number, fecha: string): Observable<DisponibilidadInput[]> {
    const url = `${this.disponibilidadUrl}/${idPsicologo}/${fecha}`;
    return this.http.get<DisponibilidadInput[]>(url).pipe(
      map((disponibilidad: any) => {
        // Filtra las horas disponibles
        return disponibilidad.filter((cita: DisponibilidadInput) => cita.disponible && cita.horaInicio).map((cita: DisponibilidadInput) => cita.horaInicio);
      })
    );
}

  
}
