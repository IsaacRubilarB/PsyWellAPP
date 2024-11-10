import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Router } from '@angular/router';
import { UsersService } from '../services/userService';
import { AlertController } from '@ionic/angular';
import { CitasService } from '../services/citasService';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';


@Component({
  selector: 'app-psicologo-modal',
  templateUrl: './psicologo-modal.component.html',
  styleUrls: ['./psicologo-modal.component.scss'],
})
export class PsicologoModalComponent implements OnInit {
  psychologists: any[] = [];
  selectedPsychologist: any = null;
  selectedTime: string = '';
  selectedDate: string = '';
  successMessage: string = '';
  showTimes: boolean = false;
  selectedPsychologistId: number | null = null;
  comentarios: any;
  ubicacion: any;
  userId: any;
  estado: any;

  constructor(
    private citasService: CitasService,
    private modalController: ModalController,
    private router: Router,
    private usersService: UsersService,
    private alertController: AlertController,
    private afAuth: AngularFireAuth, // Inyectamos Firebase Auth
    private afs: AngularFirestore // Inyectamos Firestore
  ) {}

  ngOnInit() {
    this.loadUserId(); // Cargar el ID de usuario autenticado
    this.usersService.obtenerUsuarios().subscribe((usuarios: any) => {
      if (Array.isArray(usuarios.data)) {
        // Filtrar solo psicólogos
        this.psychologists = usuarios.data.filter((usuario: { perfil: string }) => usuario.perfil === 'psicologo');
        this.psychologists.forEach(psychologist => {
          psychologist.availableTimes = ['09:00 - 9:59', '10:00 - 10:59', '11:00 - 11:59',  '14:00 - 14:59'];
        });
      } else {
        console.error('La propiedad "data" no es un array:', usuarios.data);
      }
    });
  }

  async loadUserId() {
    const user = await this.afAuth.currentUser;
    if (user) {
      const userDocRef = this.afs.collection('users').doc(user.uid);
      const userDoc = await userDocRef.get().toPromise();
  
      if (userDoc && userDoc.exists) {
        const userData = userDoc.data() as { idUsuario?: string, perfil?: string };
        this.userId = userData?.idUsuario || '';
        console.log('ID de usuario obtenido:', this.userId);
      } else {
        console.error('No se encontró el documento del usuario en Firestore');
      }
    } else {
      console.error('No se encontró un usuario autenticado');
    }
  }
  

  selectPsychologist(psychologist: any) {
    if (this.selectedPsychologist === psychologist) {
      this.selectedPsychologist = null;
      this.selectedPsychologistId = null;
    } else {
      this.selectedPsychologist = psychologist;
      this.selectedPsychologistId = psychologist.idUsuario;
    }
    this.selectedTime = '';
    this.selectedDate = '';
    this.showTimes = false;
  }

  showAvailableTimes() {
    if (this.selectedPsychologist) {
      this.showTimes = true;
    }
  }

  selectTime(time: string) {
    this.selectedTime = time;
  }

  async acceptAppointment() {
    if (!this.selectedPsychologist || !this.selectedTime || !this.selectedDate || !this.userId) {
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Por favor selecciona un psicólogo, fecha y hora para continuar.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }
  
    // Verifica que el ID del paciente y psicólogo estén bien
    console.log('ID del paciente:', this.userId);  // Verifica que el userId esté bien
    console.log('ID del psicólogo:', this.selectedPsychologist.idUsuario);  // Verifica que el psicólogo seleccionado tenga el ID correcto
    
    const [horaInicio, horaFin] = this.selectedTime.split(' - ');
  
    const appointmentData = {
      idPaciente: this.userId,
      idPsicologo: this.selectedPsychologist.idUsuario,
      ubicacion: this.ubicacion,
      estado: "Pendiente",
      fecha: this.selectedDate,
      horaInicio: horaInicio,
      horaFin: horaFin,
      comentarios:"Primera Cita - "+this.comentarios
    };
    
  
    console.log('Datos de cita a enviar:', appointmentData);  // Verifica que los datos sean correctos
  
    this.citasService.registrarCita(appointmentData).subscribe(
      async () => {
        this.successMessage = `¡Cita con ${this.selectedPsychologist.nombre} tomada exitosamente!`;
        setTimeout(() => {
          this.modalController.dismiss();
          this.router.navigate(['/home']);
        }, 2000);
      },
      async (error: any) => {
        const alert = await this.alertController.create({
          header: 'Error',
          message: 'Hubo un error al registrar la cita. Intenta nuevamente.',
          buttons: ['OK'],
        });
        await alert.present();
        console.error('Error al registrar cita:', error);
      }
    );
  }
  
  
  

  cancel() {
    this.modalController.dismiss();
  }
}
