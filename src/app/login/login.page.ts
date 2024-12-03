import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { UsersService } from '../services/userService';
import Swal from 'sweetalert2';
import { AuthService } from '../services/auth.service';
import { getAuth, signOut } from 'firebase/auth';

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
      Swal.fire('Error', 'Las contraseñas no coinciden.', 'error');
      return;
    }

    try {
      // Registro en Firebase Authentication
      const userCredential = await this.afAuth.createUserWithEmailAndPassword(
        userData.email,
        password
      );
      const uid = userCredential.user?.uid;

      if (!uid) {
        Swal.fire('Error', 'No se pudo obtener el UID del usuario en Firebase.', 'error');
        return;
      }

      // Preparar datos para PostgreSQL
      userData.contrasena = password;
      userData.estado = true;
      userData.perfil = 'paciente';

      // Registro en PostgreSQL
      this.usersService.registrarUsuario(userData).subscribe(async (res) => {
        if (res && res.data.idUsuario) {
          const postgresId = res.data.idUsuario;

          // Sincronizar con Firestore
          await this.afs.collection('users').doc(uid).set({
            nombre: userData.nombre,
            email: userData.email,
            idUsuario: postgresId, // ID de PostgreSQL
          });

          Swal.fire('Registro exitoso', 'Usuario registrado y sincronizado con Firestore.', 'success');
          this.router.navigate(['/home']);
        } else {
          Swal.fire('Error', 'No se obtuvo un ID válido desde PostgreSQL.', 'error');
        }
      });
    } catch (error) {
    }
  }

  async login() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      try {
        await this.afAuth.signInWithEmailAndPassword(email, password);
        Swal.fire('Inicio de sesión exitoso', 'Bienvenido de nuevo.', 'success');
        this.router.navigate(['/home']);
      } catch (error) {
      }
    } else {
      Swal.fire('Error', 'Por favor, completa todos los campos correctamente.', 'error');
    }
  }

  async loginWithGoogle() {
    try {
      const result = await this.authService.loginWithGoogle();

      if (result) {
        const user = result.user;
        const token = result.token;

        if (!user || !user.email) {
          throw new Error('No se pudo obtener el usuario de Google o su correo electrónico.');
        }

        // Obtener ID del usuario desde PostgreSQL
        const postgresId = await this.authService.getBackendUserId(user.email);

        // Sincronizar datos en Firestore
        const userDocRef = this.afs.collection('users').doc(user.uid);
        const userDoc = await userDocRef.get().toPromise();

        if (!userDoc?.exists) {
          await userDocRef.set({
            nombre: user.displayName || 'Usuario de Google',
            email: user.email,
            idUsuario: postgresId, // ID de PostgreSQL
          });
        }

        // Guardar el token en localStorage para usar con APIs de Google
        if (token) {
          localStorage.setItem('googleAccessToken', token);
        }

        Swal.fire('Inicio de sesión exitoso', 'Bienvenido de nuevo.', 'success');
        this.router.navigate(['/home']);
      }
    } catch (error: any) {
      if (error.code === 'auth/network-request-failed') {
        Swal.fire('Error', 'Error de red: Verifica tu conexión a Internet e intenta nuevamente.', 'error');
      } else {
        Swal.fire('Error', 'Error al iniciar sesión con Google: ' + (error.message || error), 'error');
      }
      console.error('Error al iniciar sesión con Google:', error);
    }
  }

  async logout() {
    try {
      const auth = getAuth();
      await signOut(auth);
      localStorage.removeItem('googleAccessToken');
      Swal.fire('Cierre de sesión', 'Has cerrado sesión exitosamente.', 'success');
      this.router.navigate(['/login']);
    } catch (error) {
    }
  }
}
