import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { CitasService } from '../services/citasService'; // Asegúrate de que la ruta sea correcta
import { Cita, ListaCitasResponse } from '../home/cita.model'; // Cambia la ruta al nuevo archivo

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  currentSegment: string = 'home';
  userName: string = ''; // Variable para almacenar el nombre del usuario
  userEmail: string | null = ''; // Variable para el correo del usuario

  // Variables para los datos IoT
  heartRate: number = 0;
  bodyTemperature: number = 0;
  activityLevel: number = 0;
  hydration: number = 0;
  sleepQuality: number = 0;

  citas: ListaCitasResponse['data'] | undefined; 
  idUsuario: any;

  constructor(
    private router: Router,
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private citasService: CitasService
  ) {}

  ngOnInit() {
    this.loadUserName(); // Llama a la función para obtener el nombre del usuario
    this.loadCitas(); // Cargar las citas al iniciar el componente
  }

  async loadUserName() {
    const user = await this.afAuth.currentUser;
    if (user) {
      const uid = user.uid; // Obtiene el uid del usuario
      this.userEmail = user.email || ''; // Asigna el correo del usuario
  
      // Recupera el documento del usuario usando el uid
      const userDoc = await this.afs.collection('users').doc(uid).get().toPromise();
  
      // Verifica que userDoc no sea undefined y que exista
      if (userDoc && userDoc.exists) {
        const userData = userDoc.data() as { nombre?: string, idUsuario?: string }; // Asegúrate de tener 'idUsuario' en Firestore
        this.userName = userData?.nombre || 'Usuario'; // Asigna el nombre del usuario o un valor por defecto
        
        // Guarda el idUsuario en una variable para usarlo más adelante
        this.idUsuario = userData?.idUsuario || ''; // Asigna el ID de usuario de PostgreSQL
      } else {
        this.userName = 'Usuario'; // Valor por defecto si no se encuentra el documento
      }
    }
  }

  loadCitas() {
    this.citasService.listarCitas().subscribe(
      (response: ListaCitasResponse) => {
        if (response.status === 'success') {
          this.citas = response.data; // Asigna las citas a la variable
        } else {
          console.error('Error al cargar citas:', response.status);
        }
      },
      (error: any) => {
        console.error('Error al obtener citas:', error);
      }
    );
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
    this.currentSegment = path.substring(1);
  }

  async logout() {
    try {
      await this.afAuth.signOut();
      console.log('Cierre de sesión exitoso');
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
}
export { ListaCitasResponse };

