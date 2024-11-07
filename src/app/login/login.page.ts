import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { CitasService } from '../services/userService';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

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
    private citasService: CitasService
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
    this.afAuth.authState.subscribe((user) => {
      if (user) {
        this.router.navigate(['/home']);
      }
    });
  }

  toggleRegisterMode() {
    this.isRegisterMode = !this.isRegisterMode;
    if (this.isRegisterMode) {
      this.registerForm.reset();
    } else {
      this.loginForm.reset();
    }
  }

  async register() {
    if (this.registerForm.invalid) {
      alert('Formulario de registro no válido');
      return;
    }

    const { password, confirmPassword, ...userData } = this.registerForm.value;

    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    if (new Date(userData.fechaNacimiento) > new Date()) {
      alert('La fecha de nacimiento no es válida');
      return;
    }

    try {
      const userCredential = await this.afAuth.createUserWithEmailAndPassword(
        userData.email,
        password
      );

      const uid = userCredential.user?.uid;

      userData.contrasena = password;
      userData.estado = true;
      userData.perfil = 'paciente';
      this.citasService.registrarUsuario(userData).subscribe(
        async (response) => {
          if (response && response.idUsuario) {
            const postgresId = response.idUsuario;

            await this.afs.collection('users').doc(uid).set({
              nombre: userData.nombre,
              email: userData.email,
              idUsuario: postgresId,
            });

            this.router.navigate(['/home']);
          } else {
            alert('No se pudo agregar el usuario a PostgreSQL');
          }
        },
        (error) => {
          console.error('Error al agregar usuario a PostgreSQL:', error);
          alert('Hubo un error al registrarse');
        }
      );
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      alert('Error al registrar usuario');
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
      alert('Por favor completa todos los campos correctamente.');
    }
  }

  async loginWithGoogle() {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const userCredential = await this.afAuth.signInWithPopup(provider);

      const user = userCredential.user;
      if (user) {
        this.router.navigate(['/home']);
      } else {
        alert('No se pudo obtener el usuario de Google');
      }
    } catch (error) {
      console.error('Error al iniciar sesión con Google:', error);
      alert('Error al iniciar sesión con Google');
    }
  }

  async logout() {
    try {
      await this.afAuth.signOut();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      alert('Error al cerrar sesión');
    }
  }
}
