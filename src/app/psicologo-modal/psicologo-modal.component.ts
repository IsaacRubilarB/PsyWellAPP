import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Router } from '@angular/router';
import { UsersService } from '../services/userService';
import { AlertController } from '@ionic/angular';
import { CitasService } from '../services/citasService';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { GoogleMapsComponent } from '../google-maps/google-maps.component';

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
  comentarios: any = '';
  ubicacion: any = '';
  userId: any;
  estado: any;
  availableTimes: string[] = [];
  showDateSelector: boolean = false;

  isMapModalOpen: boolean = false;  // Control para el modal del mapa

  constructor(
    private citasService: CitasService,
    private modalController: ModalController,
    private router: Router,
    private usersService: UsersService,
    private alertController: AlertController,
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore
  ) {}

  async ngOnInit() {
    await this.loadUserName();

    this.usersService.listarUsuarios().subscribe((usuarios: any) => {
      if (Array.isArray(usuarios.data)) {
        this.psychologists = usuarios.data
          .filter((usuario: { perfil: string }) => usuario.perfil === 'psicologo')
          .map((psychologist: any) => {
            psychologist.fotoUrl = this.getPsychologistImageUrl(psychologist.email); 
            psychologist.citasDisponibles = true;
            return psychologist;
          });
      } else {
        console.error('La propiedad "data" no es un array:', usuarios.data);
      }
    });
  }

  getPsychologistImageUrl(email: string): string {
    const sanitizedEmail = email;
  
    const imageUrl = `https://firebasestorage.googleapis.com/v0/b/psywell-ab0ee.firebasestorage.app/o/fotoPerfil%2F${encodeURIComponent(sanitizedEmail)}?alt=media&token=c5469faf-f49d-4f4c-b927-e4f502a27914`;
  
    console.log('URL generada para la foto del psicólogo:', imageUrl);
    return imageUrl;
  }
  

  async openLocationModal() {
    const modal = await this.modalController.create({
      component: GoogleMapsComponent, // Componente del mapa
      cssClass: 'custom-modal-class',
    });
  
    // Escuchar el evento al cerrar el modal
    modal.onWillDismiss().then((result) => {
      if (result.data) {
        const { address, lat, lng } = result.data; // Recibir la dirección y coordenadas
        this.ubicacion = address; // Actualizar la ubicación en el input del modal de agendar cita
        console.log('Ubicación guardada:', address, lat, lng);
      }
    });
  
    await modal.present();
  }
  
  
  
  

  async presentModal() {
    const modal = await this.modalController.create({
      component: GoogleMapsComponent,
    });
    await modal.present();
  }
  

// Método para cerrar el modal del mapa
closeLocationModal() {
  this.isMapModalOpen = false; // Cerrar el modal del mapa
}


setLocation(address: string): void {
  this.ubicacion = address; // Asigna la dirección seleccionada
  this.closeLocationModal(); // Cierra el modal después de seleccionar la ubicación
}


logLocation(event: any): void {
  console.log('Evento recibido:', event);
}


  // Métodos de selección de psicólogo, fecha y hora
  selectPsychologist(psychologist: any) {
    if (this.selectedPsychologist === psychologist) {
      this.selectedPsychologist = null;
      this.selectedPsychologistId = null;
      this.availableTimes = [];
      this.showTimes = false;
      this.showDateSelector = false;
    } else {
      this.selectedPsychologist = psychologist;
      this.selectedPsychologistId = psychologist.idUsuario;
      this.selectedTime = '';
      this.selectedDate = '';
      this.showTimes = false;
      this.showDateSelector = true;
      this.availableTimes = [];
    }
  }
  
  

  showAvailableTimes() {
    if (this.selectedPsychologist && this.selectedDate) {
      const formattedDate = this.formatDate(this.selectedDate);
      this.citasService.obtenerDisponibilidad(this.selectedPsychologist.idUsuario, formattedDate).subscribe(
        (disponibilidad: any) => {
          this.availableTimes = [];
          if (Array.isArray(disponibilidad)) {
            disponibilidad.forEach((hora: string) => {
              if (hora) {
                this.availableTimes.push(hora);
              }
            });
            this.showTimes = this.availableTimes.length > 0;
          } else {
            console.error('La disponibilidad no tiene el formato esperado:', disponibilidad);
            this.showTimes = false;
          }
        },
        async (error: any) => {
          const alert = await this.alertController.create({
            header: 'Error',
            message: 'No se pudo cargar la disponibilidad del psicólogo. Intenta nuevamente.',
            buttons: ['OK'],
          });
          await alert.present();
          console.error('Error al obtener disponibilidad:', error);
        }
      );
    }
  }

  formatDate(date: string): string {
    const parsedDate = new Date(date);
    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const day = String(parsedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  selectTime(time: string) {
    this.selectedTime = time;
  }

  calculateEndTime(horaInicio: string): string {
    const [hours, minutes] = horaInicio.split(':').map(Number);
    const date = new Date(0, 0, 0, hours, minutes); // Creamos un objeto Date con la hora de inicio
    date.setHours(date.getHours() + 1); // Sumamos una hora
  
    const endHours = String(date.getHours()).padStart(2, '0');
    const endMinutes = String(date.getMinutes()).padStart(2, '0');
    const endSeconds = '00'; // Siempre será el minuto exacto, sin segundos
  
    return `${endHours}:${endMinutes}:${endSeconds}`;
  }
  

  resetForm() {
    this.selectedPsychologist = null;
    this.selectedDate = '';
    this.selectedTime = '';
    this.ubicacion = '';
    this.comentarios = '';
    this.showTimes = false;
    this.successMessage = '';
  }
  
  resetSelection(): void {
    this.selectedPsychologist = null;
    this.selectedPsychologistId = null;
    this.selectedDate = '';
    this.selectedTime = '';
    this.availableTimes = [];
    this.showTimes = false;
    this.showDateSelector = false;
    this.ubicacion = ''; // Limpiar ubicación
    this.comentarios = ''; // Limpiar comentarios
  
    this.psychologists = this.psychologists.map(psychologist => {
      psychologist.selected = false; // Desmarcar cualquier psicólogo previamente seleccionado
      return psychologist;
    });
  
    console.log('Selección restablecida. Todos los valores han sido reiniciados.');
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
  
  async loadUserName(): Promise<void> {
    const user = await this.afAuth.currentUser;
    if (user) {
      const uid = user.uid;

      if (uid) {
        const userDoc = await this.afs.collection('users').doc(uid).get().toPromise();

        if (userDoc && userDoc.exists) {
          const userData = userDoc.data() as { nombre?: string; idUsuario?: string };
          this.userId = userData?.idUsuario || null;
          if (!this.userId) {
            console.error('No se encontró el idUsuario para el usuario actual.');
          }
        } else {
          console.error('No se encontró el documento del usuario en Firestore.');
          this.userId = null;
        }
      } else {
        console.error('No se pudo obtener el UID del usuario.');
      }
    } else {
      console.error('No se encontró un usuario autenticado.');
      this.userId = null;
    }
  }

  async cancel() {
    await this.modalController.dismiss();
  }

  async refreshPsychologists() {
    try {
      const usuarios = await this.usersService.listarUsuarios().toPromise();
      if (Array.isArray(usuarios.data)) {
        this.psychologists = usuarios.data.filter((usuario: { perfil: string }) => usuario.perfil === 'psicologo');
        this.selectedPsychologist = null; // Resetear la selección del psicólogo
      } else {
        console.error('La propiedad "data" no es un array:', usuarios.data);
      }
    } catch (error) {
      console.error('Error al obtener psicólogos:', error);
    }
  }
  

  // Método para cargar psicólogos en la interfaz
  async loadPsychologists() {
    this.usersService.listarUsuarios().subscribe((usuarios: any) => {
      if (Array.isArray(usuarios.data)) {
        this.psychologists = usuarios.data.filter((usuario: { perfil: string }) => usuario.perfil === 'psicologo');
      } else {
        console.error('La propiedad "data" no es un array:', usuarios.data);
      }
    });
  }

 // Método para aceptar la cita y registrarla
async acceptAppointment() {
  // Validación de campos obligatorios
  if (!this.selectedPsychologist || !this.selectedTime || !this.selectedDate || !this.userId || !this.ubicacion || !this.comentarios) {
    const alert = await this.alertController.create({
      header: 'Error',
      message: 'Por favor selecciona un psicólogo, fecha, hora, ubicación y agrega comentarios para continuar.',
      buttons: ['OK'],
    });
    await alert.present();
    return;
  }

  // Calculamos la hora de fin automáticamente sumando una hora a la hora de inicio seleccionada
  const [horaInicio] = this.selectedTime.split(' - ');
  const horaFin = this.calculateEndTime(horaInicio);

  const appointmentData = {
    idPaciente: this.userId,
    idPsicologo: this.selectedPsychologist.idUsuario,
    ubicacion: this.ubicacion,  // Utilizamos la ubicación seleccionada
    estado: 'Pendiente',
    fecha: this.selectedDate,
    horaInicio: horaInicio,
    horaFin: horaFin,
    comentarios: 'Primera Cita - ' + this.comentarios,
  };

  console.log('Cita aceptada:', appointmentData);

  try {
    await this.citasService.registrarCita(appointmentData).toPromise();
    this.successMessage = 'Cita registrada correctamente!';
    this.resetForm();
    this.router.navigate(['/home']);
  } catch (error) {
    console.error('Error al registrar la cita:', error);
    this.successMessage = 'Hubo un error al registrar la cita.';
  }
}


  // Método para abrir el modal del mapa
  openMapModal() {
    this.isMapModalOpen = true;
  }

  // Método para cerrar el modal del mapa
  closeMapModal() {
    this.isMapModalOpen = false;
  }
}

