import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registrar-emociones',
  templateUrl: './registrar-emociones.page.html',
  styleUrls: ['./registrar-emociones.page.scss'],
})
export class RegistrarEmocionesPage implements OnInit {
  selectedEmotion: string = '';  // Emoción seleccionada
  comment: string = '';  // Comentario del usuario
  remindMedication: boolean = false;  // Recordatorio de medicación
  currentSegment: string = 'registrar-emociones';  // Segmento de navegación
  showGratification: boolean = false;  // Mostrar gratificación emocional
  gratificationClass: string = '';  // Clase para animaciones de gratificación
  sexoPaciente: string = 'hombre';  // Variable para determinar el sexo del paciente

  // Lista de palabras clave para cada emoción
  emotionKeywords: { [key: string]: string[] } = {
    'very-angry': ['Discutí con alguien', 'Me siento frustrado', 'Tuve un mal día'],
    'angry': ['Me siento decepcionado', 'Problemas en el trabajo'],
    'neutral': ['Día normal', 'Todo tranquilo'],
    'happy': ['Me hicieron un cumplido', 'Pasé tiempo con amigos', 'Tuve un buen día'],
    'very-happy': ['Logré una meta', 'Recibí buenas noticias']
  };

  constructor(private router: Router) {}

  ngOnInit() {}

  // Función para seleccionar la emoción y mostrar la gratificación
  selectEmotion(emotion: string) {
    this.selectedEmotion = emotion;
    this.showGratification = true;

    // Definir la animación según la emoción seleccionada
    if (emotion === 'happy' || emotion === 'very-happy') {
      this.gratificationClass = 'animate__animated animate__bounce';  // Animación bounce para emociones positivas
    } else {
      this.gratificationClass = 'animate__animated animate__fadeIn';  // Animación fadeIn para otras emociones
    }

    // Mostramos la ruta de la imagen en la consola para verificar
    const imagePath = this.getEmotionImage(this.sexoPaciente, this.selectedEmotion);
    console.log(`Ruta de la imagen: assets/image.registro/${imagePath}`);
  }

  // Función para guardar la emoción y registrar los datos
  saveEmotion() {
    console.log(`Emoción seleccionada: ${this.selectedEmotion}`);
    console.log(`Comentario: ${this.comment}`);
    console.log(`Recordar tomar pastilla: ${this.remindMedication}`);

    // Lógica para guardar los datos en la base de datos (por implementar)
    
    alert('Emoción registrada correctamente');
    this.selectedEmotion = '';  // Reiniciar emoción seleccionada después de guardar
    this.comment = '';  // Limpiar el comentario
    this.remindMedication = false;  // Reiniciar el estado del toggle
  }

  // Función para cerrar la gratificación emocional con un clic en cualquier parte del overlay
  closeOverlay() {
    this.showGratification = false;  // Ocultar la imagen de gratificación
  }

  // Obtener la imagen de gratificación según el sexo y la emoción seleccionada
  getEmotionImage(sexo: string, emotion: string): string {
    let imagePath = '';
    switch (emotion) {
      case 'very-angry':
        imagePath = sexo === 'hombre' ? 'hombre_triste.png' : 'mujer_triste.png';
        break;
      case 'angry':
        imagePath = sexo === 'hombre' ? 'hombre_triste.png' : 'mujer_triste.png';
        break;
      case 'neutral':
        imagePath = sexo === 'hombre' ? 'hombre_normal.png' : 'mujer_normal.png';
        break;
      case 'happy':
        imagePath = sexo === 'hombre' ? 'hombre_feliz.png' : 'mujer_feliz.png';
        break;
      case 'very-happy':
        imagePath = sexo === 'hombre' ? 'hombre_feliz.png' : 'mujer_feliz.png';
        break;
      default:
        imagePath = sexo === 'hombre' ? 'hombre_normal.png' : 'mujer_normal.png';
        break;
    }
    return imagePath;
  }

  // Obtener las palabras clave según la emoción seleccionada
  getEmotionKeywords(emotion: string): string[] {
    return this.emotionKeywords[emotion] || [];
  }

  // Función para cambiar el segmento activo y navegar
  navigateTo(path: string) {
    this.router.navigate([path]);
    this.currentSegment = path.substring(1);  // Actualiza el segmento activo basado en la ruta
  }
}
