import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular'; 
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { CitasService } from '../services/citasService';
import { PsicologoModalComponent } from '../psicologo-modal/psicologo-modal.component'; 
import { ListaCitasResponse } from './cita.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  
  navigateTo(route: string) {
    this.router.navigate([route]);
  }
  
  currentSegment: string = 'home';
  userName: string = '';
  userEmail: string | null = '';

  citas: any[] = [];
  idUsuario: any;

  psychologists = [];

  selectedPsychologist: any = null;
  availableTimes: string[] = [];

  constructor(
    private router: Router,
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private citasService: CitasService,
    private modalController: ModalController
  ) {}

  ngOnInit() {
    this.loadUserName();
    this.loadCitas();
    
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

  loadCitas() {
    this.citasService.listarCitas().subscribe(
      (response: any) => {
        if (response.status === 'success') {
          this.citas = response.data;
        } else {
          console.error('Error al cargar citas:', response.status);
        }
      },
      (error: any) => {
        console.error('Error al obtener citas:', error);
      }
    );
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

