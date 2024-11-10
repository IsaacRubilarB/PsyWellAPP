import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  private RegistrarUSerUrl = 'http://localhost:8081/agregarUsuario';
  private ListarUserUrl = 'http://localhost:8081/ListarUsuarios';


  constructor(private http: HttpClient) {}
  
  registrarUsuario(userData: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<any>(this.RegistrarUSerUrl, userData, { headers });
    
  }

  obtenerUsuarios(): Observable<any> {
    return this.http.get<any>(this.ListarUserUrl).pipe(
      tap((response) => console.log('Respuesta del servidor:', response))
    );
  }
  
}
