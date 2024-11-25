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
import { environment } from '../../environments/environment';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth: Auth;
  user = new BehaviorSubject<User | null>(null);
  private token: string | null = null;

  constructor(private firestore: AngularFirestore) {
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

  async login(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;

      if (!user) {
        throw new Error('No se pudo obtener información del usuario.');
      }

      const token = await getIdToken(user);
      this.storeUserLocally(user, token);
      this.token = token;

      const userEmail = user.email;
      if (!userEmail) {
        throw new Error('El correo del usuario no está disponible.');
      }

      const userDocRef = this.firestore.collection('users').doc(user.uid);
      const userDoc = await userDocRef.get().toPromise();

      if (!userDoc?.exists) {
        await userDocRef.set({
          nombre: user.displayName || 'Usuario',
          email: user.email,
          idUsuario: await this.getBackendUserId(userEmail),
        });
      }

      return { user, token };
    } catch (error) {
      console.error('Error al iniciar sesión con correo y contraseña:', error);
      throw error;
    }
  }

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();

    provider.addScope('https://www.googleapis.com/auth/fitness.activity.read');
    provider.addScope('https://www.googleapis.com/auth/fitness.heart_rate.read');
    provider.addScope('https://www.googleapis.com/auth/fitness.sleep.read');
    provider.addScope('https://www.googleapis.com/auth/fitness.oxygen_saturation.read');

    try {
      const result = await signInWithPopup(this.auth, provider);
      const user = result.user;

      if (!user) {
        throw new Error('No se pudo obtener información del usuario.');
      }

      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken ?? null;

      const userEmail = user.email;
      if (!userEmail) {
        throw new Error('El correo del usuario no está disponible.');
      }

      const userDocRef = this.firestore.collection('users').doc(user.uid);
      const userDoc = await userDocRef.get().toPromise();

      if (!userDoc?.exists) {
        await userDocRef.set({
          nombre: user.displayName || 'Usuario de Google',
          email: user.email,
          idUsuario: await this.getBackendUserId(userEmail),
        });
      }

      this.storeUserLocally(user, accessToken || '');
      this.token = accessToken;

      return { user, token: accessToken };
    } catch (error: any) {
      console.error('Error al iniciar sesión con Google:', error.message || error);
      throw new Error('Error al iniciar sesión con Google. Intenta nuevamente.');
    }
  }

  private async getBackendUserId(email: string): Promise<number> {
    try {
      const response = await fetch('http://localhost:8084/obtenerIdUsuario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Error al obtener el ID de usuario del backend.');
      }

      const data = await response.json();
      return data.idUsuario || 0;
    } catch (error) {
      console.error('Error al obtener ID de usuario del backend:', error);
      throw error;
    }
  }

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

  private storeUserLocally(user: User, token: string) {
    localStorage.setItem('authUser', JSON.stringify(user));
    localStorage.setItem('authToken', token);
  }

  private clearUserLocally() {
    localStorage.removeItem('authUser');
    localStorage.removeItem('authToken');
  }

  isAuthenticated(): boolean {
    return this.user.value !== null;
  }

  private scheduleTokenRenewal() {
    if (!this.auth.currentUser) return;

    getIdTokenResult(this.auth.currentUser).then((idTokenResult) => {
      const expirationTime = new Date(idTokenResult.expirationTime).getTime();
      const currentTime = Date.now();
      const delay = expirationTime - currentTime - 60000;

      if (delay > 0) {
        setTimeout(() => this.refreshToken(), delay);
      }
    });
  }

  // Método para renovar el token
async refreshToken(): Promise<void> {
  if (!this.auth.currentUser) {
    throw new Error('No hay un usuario autenticado.');
  }

  try {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('Usuario actual no encontrado.');
    }

    // Forzar la renovación del token
    const token = await getIdToken(user, true);
    this.storeUserLocally(user, token); // Guarda el token renovado localmente
    this.token = token;
    console.log('Token renovado con éxito.');
  } catch (error) {
    console.error('Error al renovar el token:', error);
    throw error;
  }
}

// Método para obtener el Access Token actual
getAccessToken(): string | null {
  return this.token; // Devuelve el token almacenado o null si no está disponible
}


}
