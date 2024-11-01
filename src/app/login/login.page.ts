import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';

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
    private afs: AngularFirestore
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.afAuth.authState.subscribe(user => {
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

  async login() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      try {
        await this.afAuth.signInWithEmailAndPassword(email, password);
        console.log('Inicio de sesión exitoso');
        this.router.navigate(['/home']);
      } catch (error) {
        console.error('Error al iniciar sesión:', error);
        alert('Error al iniciar sesión: ' + error);
      }
    } else {
      alert('Por favor completa todos los campos correctamente.');
    }
  }

  async register() {
    if (this.registerForm.valid) {
      const { email, password, username, confirmPassword } = this.registerForm.value;
      if (password !== confirmPassword) {
        alert('Las contraseñas no coinciden');
        return;
      }
      try {
        const userCredential = await this.afAuth.createUserWithEmailAndPassword(email, password);
        await this.afs.collection('users').doc(userCredential.user?.uid).set({
          username: username,
          email: email
        });
        console.log('Usuario registrado con éxito');
        this.router.navigate(['/home']);
      } catch (error) {
        console.error('Error al registrar usuario:', error);
      }
    } else {
      alert('Formulario de registro no válido');
    }
  }

  async logout() {
    try {
      await this.afAuth.signOut();
      this.router.navigate(['/login']);
      console.log('Cierre de sesión exitoso');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
}
