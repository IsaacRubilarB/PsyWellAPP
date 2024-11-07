import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Router } from '@angular/router';
import { UsersService } from '../services/userService';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-psicologo-modal',
  templateUrl: './psicologo-modal.component.html',
  styleUrls: ['./psicologo-modal.component.scss'],
})
export class PsicologoModalComponent implements OnInit {
  psychologists: any[] = []; // Lista de psicólogos
  selectedPsychologist: any = null; // Solo puede haber un psicólogo seleccionado
  selectedTime: string = ''; // Hora seleccionada
  selectedDate: string = ''; // Fecha seleccionada
  successMessage: string = ''; // Mensaje de éxito
  showTimes: boolean = false; // Mostrar u ocultar los horarios

  constructor(
    private modalController: ModalController,
    private router: Router,
    private usersService: UsersService,
    private alertController: AlertController // Inyectar AlertController
  ) {}

  ngOnInit() {
    this.usersService.obtenerUsuarios().subscribe((usuarios: any) => {
      if (Array.isArray(usuarios.data)) {
        this.psychologists = usuarios.data.filter((usuario: { perfil: string }) => usuario.perfil === 'psicologo');
        
        // Añadir tiempos disponibles a los psicólogos
        this.psychologists.forEach(psychologist => {
          psychologist.availableTimes = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
        });
      } else {
        console.error('La propiedad "data" no es un array:', usuarios.data);
      }
    });
  }

  selectPsychologist(psychologist: any) {
    if (this.selectedPsychologist === psychologist) {
      this.selectedPsychologist = null; // Desmarcar psicólogo si ya estaba seleccionado
    } else {
      this.selectedPsychologist = psychologist;
    }
    this.selectedTime = ''; // Limpiar la hora seleccionada al cambiar psicólogo
    this.selectedDate = ''; // Limpiar la fecha seleccionada
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
    if (!this.selectedPsychologist) {
      const alert = await this.alertController.create({
        header: 'Selección de Psicólogo',
        message: 'Por favor, selecciona un psicólogo antes de continuar.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    if (!this.selectedTime) {
      const alert = await this.alertController.create({
        header: 'Selección de Hora',
        message: 'Por favor, selecciona una hora antes de continuar.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    if (!this.selectedDate) {
      const alert = await this.alertController.create({
        header: 'Selección de Fecha',
        message: 'Por favor, selecciona una fecha antes de continuar.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    this.successMessage = `¡Cita con ${this.selectedPsychologist.nombre} el ${this.selectedDate} a las ${this.selectedTime} tomada exitosamente!`;

    setTimeout(() => {
      this.modalController.dismiss();
      this.router.navigate(['/home']);
    }, 2000);
  }

  cancel() {
    this.modalController.dismiss();
  }
}
