import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { CitasService } from '../services/userService';

@Component({
  selector: 'app-login-register',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginRegisterComponent implements OnInit {
validateDateFormat() {
throw new Error('Method not implemented.');
}
  loginForm: FormGroup;
  registerForm: FormGroup;
  isRegisterMode: boolean = false;
dateError: any;

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
      console.log(this.registerForm.errors);
      alert('Formulario de registro no válido');
      return;
    }
  
    const { password, confirmPassword, ...userData } = this.registerForm.value;
  
    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
  
    try {
      const userCredential = await this.afAuth.createUserWithEmailAndPassword(
        userData.email,
        password
      );
  
      const uid = userCredential.user?.uid;
  
      // Llamar al backend para registrar al usuario en PostgreSQL
      userData.contrasena = password; // Añadir la contraseña al objeto userData
      userData.estado = true; // Estado predeterminado
      userData.perfil = 'paciente'; // Asignar 'paciente' como valor fijo
  
      this.citasService.registrarUsuario(userData).subscribe(
        async (response) => {
          console.log('Usuario agregado a PostgreSQL:', response);
          
          // Asegúrate de que la respuesta contiene el idUsuario
          if (response && response.idUsuario) {
            const postgresId = response.idUsuario;
  
            // Guardar en Firestore
            await this.afs.collection('users').doc(uid).set({ 
              nombre: userData.nombre,
              email: userData.email,
              idUsuario: postgresId, // Almacena el ID de PostgreSQL
            });
  
            console.log('ID de usuario guardado en Firestore:', postgresId); // Debug
            this.router.navigate(['/home']);
          } else {
            console.error('No se recibió idUsuario de la respuesta:', response);
          }
        },
        (error) => {
          console.error('Error al agregar usuario a PostgreSQL:', error);
        }
      );
    } catch (error) {
      console.error('Error al registrar usuario:', error);
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
