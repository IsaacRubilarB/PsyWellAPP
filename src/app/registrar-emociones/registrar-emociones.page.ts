import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RegistroService } from 'src/app/services/registroService';
import { RegistroEmocionalDTO } from 'src/app/models/registro-emocional-dto';

@Component({
  selector: 'app-registrar-emociones',
  templateUrl: './registrar-emociones.page.html',
  styleUrls: ['./registrar-emociones.page.scss'],
})
export class RegistrarEmocionesPage implements OnInit {
  selectedEmotion: string = '';
  comment: string = ''; // Comentario visible en el front y personalizado por el usuario
  hiddenComment: string = ''; // Comentario oculto con palabras clave predefinidas
  remindMedication: boolean = false;
  currentSegment: string = 'registrar-emociones';
  showGratification: boolean = false;
  idUsuario: string = '2'; // Obtén el ID del usuario dinámicamente
  idRegistro: string = '1'; // También puede ser dinámico

  constructor(private router: Router, private registroService: RegistroService) {}

  ngOnInit() {}

  getEmotionImage(selectedEmotion: string): string {
    return `${selectedEmotion}.svg`;
  }

  closeOverlay() {
    this.showGratification = false;
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  saveEmotion() {
    // Combina hiddenComment y comment personalizado, separados por una coma
    const combinedComment = this.hiddenComment 
      ? `${this.hiddenComment}, ${this.comment}` 
      : this.comment;

    // Preparar los datos con la fecha actual y el estado de remindMedication
    const emotionData: RegistroEmocionalDTO = {
      idRegistro: this.idRegistro,
      idUsuario: this.idUsuario,
      fecha: new Date(), // Fecha actual
      estadoEmocional: this.selectedEmotion,
      comentarios: combinedComment, // Enviar el comentario combinado al backend
      pastilla: this.remindMedication ? true : false // True si está activado, false si no
    };

    this.registroService.addRegistro(emotionData).subscribe(
      (response: any) => {
        console.log('Emoción registrada:', response);
        alert('Emoción registrada correctamente');
        this.resetForm();
      },
      (error: any) => {
        console.error('Error al registrar la emoción:', error);
        alert('Hubo un error al registrar la emoción. Inténtalo de nuevo.');
      }
    );
  }

  addKeywordToComment(keyword: string) {
    if (this.hiddenComment) {
      // Si ya hay texto en hiddenComment, agrega la palabra clave al inicio con una coma
      this.hiddenComment = `${keyword}, ${this.hiddenComment}`;
    } else {
      // Si hiddenComment está vacío, simplemente agrega la palabra clave
      this.hiddenComment = keyword;
    }
  }

  private resetForm() {
    this.selectedEmotion = '';
    this.comment = '';
    this.hiddenComment = ''; // También resetea el comentario oculto
    this.remindMedication = false;
  }
}
