import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { UsersService } from '../services/userService';
import { AuthService } from '../services/auth.service';
import { getAuth, signOut } from 'firebase/auth';
import { ToastController } from '@ionic/angular';

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
    private authService: AuthService,
    private toastController: ToastController
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
      this.showToast('Las contraseñas no coinciden.', 'danger');
      return;
    }

    try {
      const userCredential = await this.afAuth.createUserWithEmailAndPassword(
        userData.email,
        password
      );
      const uid = userCredential.user?.uid;

      if (!uid) {
        this.showToast('No se pudo obtener el UID del usuario en Firebase.', 'danger');
        return;
      }

      userData.contrasena = password;
      userData.estado = true;
      userData.perfil = 'paciente';

      this.usersService.registrarUsuario(userData).subscribe(async (res) => {
        if (res && res.data.idUsuario) {
          const postgresId = res.data.idUsuario;

          await this.afs.collection('users').doc(uid).set({
            nombre: userData.nombre,
            email: userData.email,
            idUsuario: postgresId,
          });

          this.showToast('Usuario registrado correctamente.', 'success');
          this.router.navigate(['/home']);
        } else {
          this.showToast('No se obtuvo un ID válido desde PostgreSQL.', 'danger');
        }
      });
    } catch (error) {
      this.showToast('Error al registrar usuario.', 'danger');
    }
  }

  async login() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      try {
        await this.afAuth.signInWithEmailAndPassword(email, password);
        this.showToast('Inicio de sesión exitoso.', 'success');
        this.router.navigate(['/home']);
      } catch (error) {
        this.showToast('Error al iniciar sesión. Verifica tus credenciales.', 'danger');
      }
    } else {
      this.showToast('Completa todos los campos correctamente.', 'danger');
    }
  }

  async loginWithGoogle() {
    try {
      const result = await this.authService.loginWithGoogle();

      if (result) {
        const user = result.user;

        if (!user || !user.email) {
          throw new Error('No se pudo obtener el usuario de Google o su correo electrónico.');
        }

        const postgresId = await this.authService.getBackendUserId(user.email);

        const userDocRef = this.afs.collection('users').doc(user.uid);
        const userDoc = await userDocRef.get().toPromise();

        if (!userDoc?.exists) {
          await userDocRef.set({
            nombre: user.displayName || 'Usuario de Google',
            email: user.email,
            idUsuario: postgresId,
          });
        }

        this.showToast('Inicio de sesión exitoso.', 'success');
        this.router.navigate(['/home']);
      }
    } catch (error: any) {
      this.showToast('Error al iniciar sesión con Google.', 'danger');
      console.error('Error al iniciar sesión con Google:', error);
    }
  }

  async logout() {
    try {
      const auth = getAuth();
      await signOut(auth);
      localStorage.removeItem('googleAccessToken');
      this.showToast('Cierre de sesión exitoso.', 'success');
      this.router.navigate(['/login']);
    } catch (error) {
      this.showToast('Error al cerrar sesión.', 'danger');
    }
  }

  private async showToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'top',
    });
    toast.present();
  }
}
