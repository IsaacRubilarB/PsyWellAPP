import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private RegistrarUserUrl = 'http://localhost:8081/agregarUsuario';
  private ListarUserUrl = 'http://localhost:8081/ListarUsuarios';

  // BehaviorSubject para almacenar los datos del usuario actual
  private userData = new BehaviorSubject<any>(null);
  currentUserData = this.userData.asObservable();

  constructor(private http: HttpClient) {}

  registrarUsuario(userData: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<any>(this.RegistrarUserUrl, userData, { headers }).pipe(
      tap((response) => {
        if (response && response.idUsuario) {
          // Establecer los datos del usuario después de un registro exitoso
          this.setUserData(userData);
        }
      })
    );
  }

  // Método para listar todos los usuarios
  listarUsuarios(): Observable<any> {
    return this.http.get(this.ListarUserUrl);
  }

  // Método para establecer los datos del usuario actual
  setUserData(data: any): void {
    this.userData.next(data);
  }

  // Método para limpiar los datos del usuario actual
  clearUserData(): void {
    this.userData.next(null);
  }
}
