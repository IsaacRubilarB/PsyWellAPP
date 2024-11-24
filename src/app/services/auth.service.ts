import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, Auth, User } from 'firebase/auth';
import { environment } from '../../environments/environment'; // Asegúrate de que este archivo contenga tu configuración de Firebase

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth: Auth;
  user = new BehaviorSubject<User | null>(null);

  constructor() {
    // Inicializar Firebase
    const app = initializeApp(environment.firebaseConfig);
    this.auth = getAuth(app); // Obtenemos la instancia de Auth vinculada a la app inicializada

    // Escuchamos el estado de autenticación del usuario y actualizamos el observable 'user'
    onAuthStateChanged(this.auth, (user) => {
      this.user.next(user);
    });
  }

  // Método de login con correo y contraseña
  async login(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      this.user.next(userCredential.user); // Actualizamos el usuario en el BehaviorSubject
      return userCredential;
    } catch (error) {
      console.error('Error al iniciar sesión con correo y contraseña', error);
      throw error;
    }
  }

  // Método de login con Google
  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(this.auth, provider);
      this.user.next(result.user); // Actualizamos el usuario en el BehaviorSubject
      return result;
    } catch (error) {
      console.error('Error al iniciar sesión con Google', error);
      throw error;
    }
  }

  // Método de logout
  async logout() {
    try {
      await signOut(this.auth);
      this.user.next(null); // Limpiamos el usuario en el BehaviorSubject al cerrar sesión
    } catch (error) {
      console.error('Error al cerrar sesión', error);
    }
  }

  // Obtener el usuario actual
  getCurrentUser() {
    return this.user.value;
  }

  // Verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    return this.user.value !== null;
  }
}
