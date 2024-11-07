import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  user = new BehaviorSubject<firebase.User | null>(null);

  constructor(private afAuth: AngularFireAuth) {
    this.afAuth.onAuthStateChanged(user => {
      this.user.next(user);
    });
  }

  async login(email: string, password: string) {
    return await this.afAuth.signInWithEmailAndPassword(email, password);
  }

  async loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      const result = await this.afAuth.signInWithPopup(provider);
      return result;
    } catch (error) {
      console.error("Error al iniciar sesión con Google", error);
      throw error;
    }
  }

  async logout() {
    return await this.afAuth.signOut();
  }

  getCurrentUser() {
    return this.afAuth.currentUser;
  }

  isAuthenticated() {
    return this.afAuth.authState;
  }
}
