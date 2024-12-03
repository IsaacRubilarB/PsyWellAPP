import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RegistroEmocionalDTO } from '../models/registro-emocional-dto';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class RegistroService {
  private apiRegistro = environment.apiRegistroEmocional+'registrarEmocion'; 

  constructor(private http: HttpClient) {}

  addRegistro(registro: RegistroEmocionalDTO): Observable<any> {
    return this.http.post<any>(this.apiRegistro, registro);
  }
}
