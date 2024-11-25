import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  getIdTokenResult,
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

    const savedUser = localStorage.getItem('authUser');
    const savedToken = localStorage.getItem('authToken');

    if (savedUser && savedToken) {
      this.user.next(JSON.parse(savedUser));
      this.token = savedToken;

      this.refreshToken().catch(() => {
        this.clearUserLocally();
        this.user.next(null);
        this.token = null;
      });
    }

    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        const token = await getIdToken(user, true);
        this.storeUserLocally(user, token);
        this.user.next(user);
        this.token = token;

        this.scheduleTokenRenewal();
      } else {
        this.clearUserLocally();
        this.user.next(null);
        this.token = null;
      }
    });
  }

  // Login con correo y contraseña
  async login(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      const token = await getIdToken(userCredential.user);
      this.storeUserLocally(userCredential.user, token);
      this.token = token;
      return { user: userCredential.user, token };
    } catch (error) {
      console.error('Error al iniciar sesión con correo y contraseña:', error);
      throw error;
    }
  }

  // Login con Google y permisos de Google Fit
  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();

    // Agrega los scopes necesarios para Google Fit
    provider.addScope('https://www.googleapis.com/auth/fitness.activity.read');
    provider.addScope('https://www.googleapis.com/auth/fitness.heart_rate.read');
    provider.addScope('https://www.googleapis.com/auth/fitness.sleep.read');
    provider.addScope(
      'https://www.googleapis.com/auth/fitness.oxygen_saturation.read'
    );

    try {
      const result = await signInWithPopup(this.auth, provider);

      // Obtén el OAuth Access Token
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;

      if (accessToken) {
        this.storeUserLocally(result.user, accessToken);
        this.token = accessToken;
        return { user: result.user, token: accessToken };
      } else {
        throw new Error('No se pudo obtener el token de acceso.');
      }
    } catch (error) {
      console.error('Error al iniciar sesión con Google:', error);
      throw error;
    }
  }

  // Renovación del token
  async refreshToken() {
    if (!this.auth.currentUser) {
      throw new Error('No hay un usuario autenticado.');
    }

    try {
      const user = this.auth.currentUser;
      const token = await getIdToken(user, true); // Fuerza la renovación del token
      this.storeUserLocally(user, token);
      this.token = token;
      return token;
    } catch (error) {
      console.error('Error al renovar el token:', error);
      throw error;
    }
  }

  // Cerrar sesión
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

  // Obtener el Access Token actual
  getAccessToken(): string | null {
    return this.token;
  }

  // Obtener datos de Google Fit
  async fetchGoogleFitData(endpoint: string, body: any): Promise<any> {
    if (!this.token) {
      throw new Error('No se puede obtener datos, token no disponible.');
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error(`Error en la solicitud (${response.status}):`, error);
        throw new Error(`Error al obtener datos de Google Fit: ${error.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error al obtener datos de Google Fit:', error);
      throw error;
    }
  }


  // Métodos auxiliares para almacenamiento local
  private storeUserLocally(user: User, token: string) {
    localStorage.setItem('authUser', JSON.stringify(user));
    localStorage.setItem('authToken', token);
  }

  private clearUserLocally() {
    localStorage.removeItem('authUser');
    localStorage.removeItem('authToken');
  }

  // Verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    return this.user.value !== null;
  }

  // Programar la renovación automática del token
  private scheduleTokenRenewal() {
    if (!this.auth.currentUser) return;

    getIdTokenResult(this.auth.currentUser).then((idTokenResult) => {
      const expirationTime = new Date(idTokenResult.expirationTime).getTime();
      const currentTime = Date.now();
      const delay = expirationTime - currentTime - 60000; // Renueva 1 minuto antes de que expire

      if (delay > 0) {
        setTimeout(() => this.refreshToken(), delay);
      }
    });
  }
}
