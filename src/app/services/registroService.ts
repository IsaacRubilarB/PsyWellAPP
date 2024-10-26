import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RegistroEmocionalDTO } from '../models/registro-emocional-dto';


@Injectable({
  providedIn: 'root'
})
export class RegistroService {
  private apiRegistro = 'http://localhost:8082/registrarEmocion'; 

  constructor(private http: HttpClient) {}

  addRegistro(registro: RegistroEmocionalDTO): Observable<any> {
    return this.http.post<any>(this.apiRegistro, registro);
  }
}
