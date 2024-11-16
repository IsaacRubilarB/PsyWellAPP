import { Component, ElementRef, OnInit, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular'; 
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { CitasService } from '../services/citasService';
import { PsicologoModalComponent } from '../psicologo-modal/psicologo-modal.component'; 
import { ListaCitasResponse } from './cita.model';
import { FormBuilder } from '@angular/forms';
import { UsersService } from '../services/userService';
import { DomSanitizer } from '@angular/platform-browser';
import interact from 'interactjs';



@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
email: any;
  
  navigateTo(route: string) {
    this.router.navigate([route]);
  }
  
  currentSegment: string = 'home';
  userName: string = '';
  userEmail: string | null = '';

  citas: any[] = [];
  idUsuario: any;
  errorMessage: string | null = null;

  psicologos: any[] = [];
  pacientes: any[] = [];
  psychologists = [];
  userId: string | null = null;
  selectedPsychologist: any = null;
  availableTimes: string[] = [];

  constructor(
    private router: Router,
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private citasService: CitasService,
    private modalController: ModalController,
    private fb: FormBuilder, 
    private usersService: UsersService,
    private el: ElementRef,
    private sanitizer: DomSanitizer,
    private renderer: Renderer2,
  ) {}

  ngOnInit() {
    this.loadUserName();
    this.obtenerUsuarios(); // Asegúrate de obtener los usuarios antes
    this.obtenerCitas(); // Luego obtener las citas
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.cargarPaciente(user.email || '');
      }
    });
    setTimeout(() => {
      this.initializeDrag();
    });
  }
  

  initializeDrag() {
    interact('.sticky-note-item')
      .draggable({
        listeners: {
          move: (event) => {
            const target = event.target;
            const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
            const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

            target.style.transform = `translate(${x}px, ${y}px)`;
            target.setAttribute('data-x', x);
            target.setAttribute('data-y', y);
          }
        }
      });
  }

  async loadUserName() {
    const user = await this.afAuth.currentUser;
    if (user) {
      const uid = user.uid;
      this.userEmail = user.email || '';

      const userDoc = await this.afs.collection('users').doc(uid).get().toPromise();

      if (userDoc && userDoc.exists) {
        const userData = userDoc.data() as { nombre?: string, idUsuario?: string };
        this.userName = userData?.nombre || 'Usuario';
        this.idUsuario = userData?.idUsuario || '';
      } else {
        this.userName = 'Usuario';
      }
    }
  }

  cargarPaciente(email: string) {
    this.usersService.listarUsuarios().subscribe(
      (response: any) => {
        const user = response.data.find((user: any) => user.email === email);
        if (user) {
          this.userId = user.idUsuario;
          this.userName = user.nombre;
          console.log('Usuario logueado:', user);
          this.obtenerCitas();
        } else {
          console.error('No se encontró el usuario con ese UID');
        }
      },
      (error) => {
        console.error('Error al listar los usuarios:', error);
      }
    );
  }

  obtenerCitas() {
    this.citasService.listarCitas().subscribe({
      next: (response) => {
        if (response && response.status === 'success' && Array.isArray(response.data)) {
          console.log('Citas obtenidas:', response.data);

          this.citas = response.data
            .filter((cita: any) => cita.idPaciente === this.userId || cita.idPsicologo === this.userId)
            .map((cita: any) => {
              return {
                idCita: cita.idCita,
                idPaciente: cita.idPaciente,
                idPsicologo: cita.idPsicologo || null,
                ubicacion: cita.ubicacion,
                estado: cita.estado,
                fecha: cita.fecha,
                horaInicio: cita.horaInicio,
                horaFin: cita.horaFin,
                comentarios: cita.comentarios,
                nombrePaciente: this.getNombreUsuario(cita.idPaciente),
                nombrePsicologo: this.getNombreUsuario(cita.idPsicologo)
              };
            });

          console.log('Citas filtradas:', this.citas);
        } else {
          console.error('La respuesta no es válida:', response);
        }
      },
      error: (error) => {
        console.error('Error al listar citas', error);
        this.errorMessage = 'No se pudo cargar las citas. Intenta de nuevo más tarde.';
      }
    });
  }

  obtenerUsuarios() {
    this.usersService.listarUsuarios().subscribe(
      (response: any) => {
        if (response && response.data) {
          console.log('Usuarios cargados:', response);
          this.psicologos = response.data.filter((user: { perfil: string }) => user.perfil === 'psicologo');
          this.pacientes = response.data.filter((user: { perfil: string }) => user.perfil === 'paciente');
        } else {
          console.error('No se encontraron usuarios');
        }
      },
      (error) => {
        console.error('Error al obtener usuarios', error);
      }
    );
  }
  

  getNombreUsuario(id: number): string {
    // Verificar que el id sea válido
    if (!id) {
      return 'Desconocido';
    }
    
    const usuario = this.pacientes.find(p => p.idUsuario === id) || this.psicologos.find(p => p.idUsuario === id);
    return usuario ? usuario.nombre : 'Desconocido';
  }
  
  

  async openPsychologistModal() {
    const modal = await this.modalController.create({
      component: PsicologoModalComponent, 
      componentProps: {
        psychologists: this.psychologists 
      }
    });

    modal.onDidDismiss().then((result) => {
      if (result.data?.psychologist) {
        this.selectedPsychologist = result.data.psychologist;
        this.generateAvailableTimes();
      }
    });

    return await modal.present();
  }

  generateAvailableTimes() {
    if (this.selectedPsychologist) {
      const times = [];
      for (let hour = 9; hour <= 18; hour++) {
        times.push(`${hour}:00 - ${hour + 1}:00`);
      }
      this.availableTimes = times;
    }
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

