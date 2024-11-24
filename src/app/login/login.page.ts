import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { UsersService } from '../services/userService';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { AuthService } from '../services/auth.service';


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
      fechaNacimiento: ['', Validators.required], // Añadir este control
      genero: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    });
  }

  ngOnInit() {
    // Redirigir si el usuario ya está autenticado
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
      // Cambiar a modo login
      if (flipContainer) {
        flipContainer.classList.remove('register-mode');
        flipContainer.classList.add('login-mode');
        flipContainer.scrollTo({ top: 0, behavior: 'smooth' }); // Asegura que el scroll del registro vuelva al inicio
      }

      if (ionContent) {
        ionContent.scrollTo({ top: 0, behavior: 'smooth' }); // Resetear scroll del contenedor principal
      }
    } else {
      // Cambiar a modo registro
      if (flipContainer) {
        flipContainer.classList.remove('login-mode');
        flipContainer.classList.add('register-mode');
      }
    }
  }








  async register() {
    /*if (this.registerForm.invalid) {
      alert('Formulario de registro no válido');
      return;
    }*/

    const { password, confirmPassword, ...userData } = this.registerForm.value;

    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

   /* if (new Date(userData.fechaNacimiento) > new Date()) {
      alert('La fecha de nacimiento no es válida');
      return;
    }*/

    try {
      const userCredential = await this.afAuth.createUserWithEmailAndPassword(
        userData.email,
        password
      );

      const uid = userCredential.user?.uid;

      userData.contrasena = password;
      userData.estado = true;
      userData.perfil = 'paciente';


      // Guardar los datos del usuario en PostgreSQL y establecer el estado del usuario
      this.usersService.registrarUsuario(userData).subscribe(async res=>{

      if (res && res.data.idUsuario) {
        const postgresId = res.data.idUsuario;

        const firebaseConfig = {
          apiKey: "AIzaSyAFJUcrBDDLPM2SscMvi1x_jUv6Wlqnukg",
          authDomain: "psywell-ab0ee.firebaseapp.com",
          projectId: "psywell-ab0ee",
          storageBucket: "psywell-ab0ee.appspot.com",
          messagingSenderId: "471287872717",
          appId: "1:471287872717:web:588c0acfcb84728c7657d84",
          measurementId: "G-TG8E6CBF8D",
        };

        initializeApp(firebaseConfig);
        // Uso de la nueva API de Firestore
        const db = getFirestore();
        await setDoc(doc(collection(db, 'users'), uid), {
          nombre: userData.nombre,
          email: userData.email,
          idUsuario: postgresId,
        });

        // Establecer los datos del usuario en el servicio
        this.usersService.setUserData({
          nombre: userData.nombre,
          email: userData.email,
          idUsuario: postgresId,
        });

        //this.router.navigate(['/home']);
      } else {
        alert('No se pudo agregar el usuario a PostgreSQL');
      }
  })




        /*
        (error) => {
          console.error('Error al agregar usuario a PostgreSQL:', error);
          alert('Hubo un error al registrarse');
        }
      );*/
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
      const result = await this.authService.loginWithGoogle();
      if (result) {
        this.router.navigate(['/home']);
      }
    } catch (error) {
      console.error('Error al iniciar sesión con Google:', error);
      alert('Error al iniciar sesión con Google. Inténtalo de nuevo.');
    }
  }

  async logout() {
    try {
      const auth = getAuth();
      await signOut(auth);
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      alert('Error al cerrar sesión');
    }
  }
}
