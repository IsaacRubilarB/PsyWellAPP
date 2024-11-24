import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  Auth,
  User,
  getIdToken,
} from 'firebase/auth';
import { environment } from '../../environments/environment'; // Archivo de configuración de Firebase

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth: Auth;
  user = new BehaviorSubject<User | null>(null);
  private token: string | null = null; // Para almacenar el token actual

  constructor() {
    const app = initializeApp(environment.firebaseConfig);
    this.auth = getAuth(app);

    // Verificar si existe un usuario almacenado en el localStorage al inicializar
    const savedUser = localStorage.getItem('authUser');
    const savedToken = localStorage.getItem('authToken');

    if (savedUser && savedToken) {
      this.user.next(JSON.parse(savedUser));
      this.token = savedToken;
    }

    // Escuchar cambios en el estado de autenticación
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        const token = await getIdToken(user);
        this.storeUserLocally(user, token);
        this.user.next(user);
        this.token = token;
      } else {
        this.clearUserLocally();
        this.user.next(null);
        this.token = null;
      }
    });
  }

  async login(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const token = await getIdToken(userCredential.user);
      this.storeUserLocally(userCredential.user, token);
      this.token = token;
      return { user: userCredential.user, token };
    } catch (error) {
      console.error('Error al iniciar sesión con correo y contraseña:', error);
      throw error;
    }
  }

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(this.auth, provider);
      const token = await getIdToken(result.user);
      this.storeUserLocally(result.user, token);
      this.token = token;
      return { user: result.user, token };
    } catch (error) {
      console.error('Error al iniciar sesión con Google:', error);
      throw error;
    }
  }

  async logout() {
    try {
      await signOut(this.auth);
      this.clearUserLocally();
      this.user.next(null);
      this.token = null;
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }

  // Guardar usuario y token en el almacenamiento local
  private storeUserLocally(user: User, token: string) {
    localStorage.setItem('authUser', JSON.stringify(user));
    localStorage.setItem('authToken', token);
  }

  // Eliminar usuario y token del almacenamiento local
  private clearUserLocally() {
    localStorage.removeItem('authUser');
    localStorage.removeItem('authToken');
  }

  // Obtener el usuario actual
  getCurrentUser(): User | null {
    return this.user.value;
  }

  // Verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    return this.user.value !== null;
  }

  // Obtener el token de acceso actual
  getAccessToken(): string | null {
    return this.token;
  }
}
