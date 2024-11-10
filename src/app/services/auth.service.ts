import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  user = new BehaviorSubject<any>(null);

  constructor() {
    const auth = getAuth();  // Obtenemos la instancia de Auth de Firebase
    onAuthStateChanged(auth, (user) => {
      this.user.next(user);  // Actualizamos el estado del usuario
    });
  }

  // Método de login con correo y contraseña
  async login(email: string, password: string) {
    const auth = getAuth();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential;
    } catch (error) {
      console.error("Error al iniciar sesión con correo y contraseña", error);
      throw error;
    }
  }

  // Método de login con Google
  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    const auth = getAuth();
    try {
      const result = await signInWithPopup(auth, provider);
      return result;
    } catch (error) {
      console.error("Error al iniciar sesión con Google", error);
      throw error;
    }
  }

  // Método de logout
  async logout() {
    const auth = getAuth();
    await signOut(auth);
  }

  // Obtener el usuario actual
  getCurrentUser() {
    const auth = getAuth();
    return auth.currentUser;
  }

  // Verificar si el usuario está autenticado
  isAuthenticated() {
    const auth = getAuth();
    return onAuthStateChanged(auth, (user) => user !== null);
  }
}
