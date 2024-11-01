// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private afAuth: AngularFireAuth) {}

  async login(email: string, password: string) {
    return await this.afAuth.signInWithEmailAndPassword(email, password);
  }

  async logout() {
    return await this.afAuth.signOut();
  }

  getCurrentUser() {
    return this.afAuth.currentUser; // Método para obtener el usuario actual
  }

  isAuthenticated() {
    return this.afAuth.authState; // Retorna un observable del estado de autenticación
  }
}
