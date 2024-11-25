import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { UsersService } from '../services/userService';
import Swal from 'sweetalert2';
import { AuthService } from '../services/auth.service';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

@Component({
  selector: 'app-login-register',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginRegisterComponent implements OnInit {
  loginForm: FormGroup;
  registerForm: FormGroup;
  isRegisterMode: boolean = false;

  constructor(
    private fb: FormBuilder,
    private afAuth: AngularFireAuth,
    private router: Router,
    private afs: AngularFirestore,
    private usersService: UsersService,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.registerForm = this.fb.group({
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      fechaNacimiento: ['', Validators.required],
      genero: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.authService.user.subscribe((user) => {
      if (user) {
        this.router.navigate(['/home']);
      }
    });
  }

  toggleRegisterMode() {
    this.isRegisterMode = !this.isRegisterMode;

    const flipContainer = document.querySelector('.flip-container') as HTMLElement;
    const ionContent = document.querySelector('ion-content') as HTMLElement;

    if (!this.isRegisterMode) {
      flipContainer?.classList.remove('register-mode');
      flipContainer?.classList.add('login-mode');
      flipContainer?.scrollTo({ top: 0, behavior: 'smooth' });

      ionContent?.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      flipContainer?.classList.remove('login-mode');
      flipContainer?.classList.add('register-mode');
    }
  }

  async register() {
    const { password, confirmPassword, ...userData } = this.registerForm.value;

    if (password !== confirmPassword) {
      return;
    }

    try {
      const userCredential = await this.afAuth.createUserWithEmailAndPassword(
        userData.email,
        password
      );

      const uid = userCredential.user?.uid;

      if (!uid) {
        return;
      }

      userData.contrasena = password;
      userData.estado = true;
      userData.perfil = 'paciente';

      this.usersService.registrarUsuario(userData).subscribe(async (res) => {
        if (res && res.data.idUsuario) {
          const postgresId = res.data.idUsuario;

          const firebaseConfig = {
            apiKey: "AIzaSyAFJUcrBDDLPM2SscMvi1x_jUv6Wlqnukg",
            authDomain: "psywell-ab0ee.firebaseapp.com",
            projectId: "psywell-ab0ee",
            storageBucket: "psywell-ab0ee.firebasestorage.app",
            messagingSenderId: "471287872717",
            appId: "1:471287872717:web:588c0acfcb84728c7657d84",
            measurementId: "G-TG8E6CBF8D",
          };

          initializeApp(firebaseConfig);
          const db = getFirestore();
          await setDoc(doc(collection(db, 'users'), uid), {
            nombre: userData.nombre,
            email: userData.email,
            idUsuario: postgresId,
          });

          this.usersService.setUserData({
            nombre: userData.nombre,
            email: userData.email,
            idUsuario: postgresId,
          });

          this.router.navigate(['/home']);
        } else {
        }
      });
    } catch (error) {
      console.error('Error al registrar usuario:', error);
    }
  }

  async login() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      try {
        await this.afAuth.signInWithEmailAndPassword(email, password);
        this.router.navigate(['/home']);
      } catch (error) {
        console.error('Error al iniciar sesión:', error);
      }
    } else {
    }
  }

  async loginWithGoogle() {
    try {
      const result = await this.authService.loginWithGoogle();
      if (result) {
        const user = result.user;
  
        if (!user) {
          throw new Error('No se pudo obtener el usuario de Google.');
        }
  
        // Verificar y crear documento del usuario en Firestore
        const userDocRef = this.afs.collection('users').doc(user.uid);
        const userDoc = await userDocRef.get().toPromise();
  
        if (!userDoc?.exists) {
          await userDocRef.set({
            nombre: user.displayName || 'Usuario de Google',
            email: user.email,
            idUsuario: user.uid,
          });
        }
  
        // Redirigir al home sin mostrar alertas
        this.router.navigate(['/home']);
      }
    } catch (error: any) {
      console.error('Error al iniciar sesión con Google:', error);
  
      // Manejo del error en consola o lógica adicional sin alertas
      const errorMessage = error?.message || 'No se pudo iniciar sesión con Google. Intenta nuevamente.';
      console.error('Mensaje de error:', errorMessage);
    }
  }
  
  

  async logout() {
    try {
      const auth = getAuth();
      await signOut(auth);
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
}
