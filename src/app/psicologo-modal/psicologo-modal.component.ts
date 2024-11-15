import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
  comentarios: any = '';
  ubicacion: any = '';
  userId: any;
  estado: any;
  availableTimes: string[] = []; // Aquí guardamos las horas disponibles
  showDateSelector: boolean = false; // Variable para controlar la visibilidad del selector de fecha

  constructor(
    private citasService: CitasService,
    private modalController: ModalController,
    private router: Router,
    private usersService: UsersService,
    private alertController: AlertController,
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private cdRef: ChangeDetectorRef // Inyecta ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadUserId();
    this.usersService.listarUsuarios().subscribe((usuarios: any) => {
      if (Array.isArray(usuarios.data)) {
        this.psychologists = usuarios.data.filter((usuario: { perfil: string }) => usuario.perfil === 'psicologo');
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
    console.log('Seleccionado psicólogo:', psychologist);
    if (this.selectedPsychologist === psychologist) {
      this.selectedPsychologist = null;
      this.selectedPsychologistId = null;
      this.availableTimes = []; // Limpiar las horas disponibles
      this.showTimes = false;
      this.showDateSelector = false; // Ocultar el selector de fecha al deseleccionar
    } else {
      this.selectedPsychologist = psychologist;
      this.selectedPsychologistId = psychologist.idUsuario;
      this.selectedTime = '';
      this.selectedDate = '';
      this.showTimes = false; // Ocultar las horas disponibles al seleccionar un psicólogo
      this.showDateSelector = true; // Mostrar el selector de fecha
      this.availableTimes = []; // Limpiar las horas disponibles
    }
  }

  showAvailableTimes() {
    console.log('Mostrando horarios para el psicólogo:', this.selectedPsychologist);
  
    if (this.selectedPsychologist && this.selectedDate) {
      const formattedDate = this.formatDate(this.selectedDate);
      console.log('Fecha formateada:', formattedDate);
  
      // Aquí pasamos el ID del psicólogo y la fecha al backend para obtener la disponibilidad
      this.citasService.obtenerDisponibilidad(this.selectedPsychologist.idUsuario, formattedDate).subscribe(
        (disponibilidad: any) => {
          this.availableTimes = [];  // Limpiar las horas anteriores
          console.log('Disponibilidad recibida:', disponibilidad);
  
          if (Array.isArray(disponibilidad)) {  // Cambié esto para verificar si es un arreglo directamente
            disponibilidad.forEach((hora: string) => {
              // Asegúrate de que estamos recibiendo las horas correctamente
              console.log('Hora disponible:', hora);
              if (hora) {
                this.availableTimes.push(hora); // Agregar la hora disponible al arreglo
              }
            });
  
            if (this.availableTimes.length > 0) {
              this.showTimes = true; // Mostrar las horas disponibles si hay al menos una
            } else {
              this.showTimes = false;  // No hay horas disponibles
            }
          } else {
            console.error('La disponibilidad no tiene el formato esperado:', disponibilidad);
            this.showTimes = false;  // No mostrar horarios si la respuesta es inválida
          }
  
          console.log('Horas disponibles:', this.availableTimes);
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
    console.log('Hora seleccionada:', time);
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
  
    console.log('ID del paciente:', this.userId);
    console.log('ID del psicólogo:', this.selectedPsychologist.idUsuario);
    
    // Calculamos la hora de fin automáticamente sumando una hora a la hora de inicio seleccionada
    const [horaInicio] = this.selectedTime.split(' - ');
    const horaFin = this.calculateEndTime(horaInicio);
  
    const appointmentData = {
      idPaciente: this.userId,
      idPsicologo: this.selectedPsychologist.idUsuario,
      ubicacion: this.ubicacion,
      estado: "Pendiente",
      fecha: this.selectedDate,
      horaInicio: horaInicio,
      horaFin: horaFin,
      comentarios: "Primera Cita - " + this.comentarios
    };
  
    console.log('Cita aceptada:', appointmentData);
  
    try {
      await this.citasService.registrarCita(appointmentData).toPromise();
      this.successMessage = 'Cita registrada correctamente!';
      // Llamar a un método para refrescar la lista de psicólogos
      this.refreshPsychologists();
      this.resetForm();
    } catch (error) {
      console.error('Error al registrar la cita:', error);
      this.successMessage = 'Hubo un error al registrar la cita.';
    }
  }
  
  // Función para calcular la hora de fin sumando una hora a la hora de inicio
  calculateEndTime(horaInicio: string): string {
    const [hours, minutes] = horaInicio.split(':').map(Number);
    const date = new Date(0, 0, 0, hours, minutes); // Creamos un objeto Date con la hora de inicio
    date.setHours(date.getHours() + 1); // Sumamos una hora
  
    // Devolvemos la hora de fin en formato HH:mm:ss
    const endHours = String(date.getHours()).padStart(2, '0');
    const endMinutes = String(date.getMinutes()).padStart(2, '0');
    const endSeconds = '00'; // Siempre será el minuto exacto, sin segundos
  
    return `${endHours}:${endMinutes}:${endSeconds}`;
  }
  

  async refreshPsychologists() {
    // Recargar la lista de psicólogos después de registrar la cita
    try {
      const usuarios = await this.usersService.listarUsuarios().toPromise();
      if (Array.isArray(usuarios.data)) {
        this.psychologists = usuarios.data.filter((usuario: { perfil: string }) => usuario.perfil === 'psicologo');
        this.selectedPsychologist = null;  // Resetear la selección del psicólogo
      } else {
        console.error('La propiedad "data" no es un array:', usuarios.data);
      }
    } catch (error) {
      console.error('Error al obtener psicólogos:', error);
    }
  }
  
  async loadPsychologists() {
    this.usersService.listarUsuarios().subscribe((usuarios: any) => {
      if (Array.isArray(usuarios.data)) {
        this.psychologists = usuarios.data.filter((usuario: { perfil: string }) => usuario.perfil === 'psicologo');
      } else {
        console.error('La propiedad "data" no es un array:', usuarios.data);
      }
    });
  }
  

  async cancel() {
    await this.modalController.dismiss();
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
  
}
