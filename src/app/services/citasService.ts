import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ListaCitasResponse } from '../home/home.page';

@Injectable({
  providedIn: 'root'
})
export class CitasService {

  private listarCitaUrl = 'http://localhost:8084/listarCitas';

  constructor(private http: HttpClient) {}

  listarCitas(): Observable<ListaCitasResponse> {
    return this.http.get<ListaCitasResponse>(this.listarCitaUrl);
  }
  
  
}
