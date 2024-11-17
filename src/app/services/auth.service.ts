import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, Auth } from 'firebase/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth: Auth;
  user = new BehaviorSubject<any>(null);

  constructor() {
    this.auth = getAuth(); // Obtenemos la instancia de Auth de Firebase una vez en el constructor

    // Escuchamos el estado de autenticación del usuario y actualizamos el observable 'user'
    onAuthStateChanged(this.auth, (user) => {
      this.user.next(user);
    });
  }

  // Método de login con correo y contraseña
  async login(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      return userCredential;
    } catch (error) {
      console.error("Error al iniciar sesión con correo y contraseña", error);
      throw error;
    }
  }

  // Método de login con Google
  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(this.auth, provider);
      return result;
    } catch (error) {
      console.error("Error al iniciar sesión con Google", error);
      throw error;
    }
  }

  // Método de logout
  async logout() {
    try {
      await signOut(this.auth);
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  }

  // Obtener el usuario actual
  getCurrentUser() {
    return this.auth.currentUser;
  }

  // Verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    return this.auth.currentUser !== null;
  }
}
