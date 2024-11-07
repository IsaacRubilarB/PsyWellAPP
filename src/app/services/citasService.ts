import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ListaCitasResponse } from '../home/home.page';

@Injectable({
  providedIn: 'root'
})
export class CitasService {

  private listarCitaUrl = 'http://localhost:8084/listarCitas';
  private registrarCitaUrl = 'http://localhost:8084/registrarCita';


  constructor(private http: HttpClient) {}

  listarCitas(): Observable<ListaCitasResponse> {
    return this.http.get<ListaCitasResponse>(this.listarCitaUrl);
  }
  
  registrarUsuario(userData: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<any>(this.registrarCitaUrl, userData, { headers });
  }
  
}
