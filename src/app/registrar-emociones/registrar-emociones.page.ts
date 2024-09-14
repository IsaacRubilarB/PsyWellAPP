import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registrar-emociones',
  templateUrl: './registrar-emociones.page.html',
  styleUrls: ['./registrar-emociones.page.scss'],
})
export class RegistrarEmocionesPage {
  selectedEmotion: string = '';  // Para almacenar la emoción seleccionada
  comment: string = '';  // Almacenar el comentario adicional
  remindMedication: boolean = false;  // Estado del toggle para recordar la medicación
  currentSegment: string = 'registrar-emociones';  // Segmento actual de la navegación

  constructor(private router: Router) {}

  // Función para seleccionar la emoción
  selectEmotion(emotion: string) {
    this.selectedEmotion = emotion;
  }

  // Función para guardar la emoción
  saveEmotion() {
    console.log(`Emoción seleccionada: ${this.selectedEmotion}`);
    console.log(`Comentario: ${this.comment}`);
    console.log(`Recordar tomar pastilla: ${this.remindMedication}`);
    alert('Emoción registrada correctamente');
    this.selectedEmotion = '';  // Reiniciar emoción seleccionada después de guardar
    this.comment = '';  // Limpiar el comentario
    this.remindMedication = false;  // Reiniciar el estado del toggle
  }

  // Función para cambiar el segmento activo y navegar
  navigateTo(path: string) {
    this.router.navigate([path]);
    this.currentSegment = path.substring(1);  // Actualiza el segmento activo basado en la ruta
  }
}
