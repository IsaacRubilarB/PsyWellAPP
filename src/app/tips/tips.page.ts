import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tips',
  templateUrl: './tips.page.html',
  styleUrls: ['./tips.page.scss'],
})
export class TipsPage implements OnInit {
  currentSegment: string = 'tips';
  audio: HTMLAudioElement | undefined; // Definimos la variable de audio
  activeSound: string | null = null; // Variable para controlar el sonido activo
  showVideo: string = ''; // Variable para controlar cuál video está visible

  constructor(private router: Router) {}

  ngOnInit() {}

  // Función para reproducir o detener sonidos relajantes
  playSound(sound: string) {
    // Si el sonido ya está activo, lo detenemos
    if (this.activeSound === sound) {
      this.audio?.pause();
      this.audio = undefined;
      this.activeSound = null; // Reseteamos el sonido activo
    } else {
      if (this.audio) {
        this.audio.pause(); // Detener cualquier sonido que esté sonando
      }

      // Cargamos el sonido seleccionado
      switch (sound) {
        case 'lluvia':
          this.audio = new Audio('assets/sonidos/lluvia.mp3');
          break;
        case 'olas':
          this.audio = new Audio('assets/sonidos/olas.mp3');
          break;
        case 'bosque':
          this.audio = new Audio('assets/sonidos/bosque.mp3');
          break;
      }

      if (this.audio) {
        this.audio.play(); // Reproducimos el nuevo sonido
        this.activeSound = sound; // Actualizamos el sonido activo
      }
    }
  }

  // Método para alternar la visualización de los videos
  toggleVideo(videoId: string) {
    // Si el video ya está visible, lo oculta
    if (this.showVideo === videoId) {
      this.showVideo = ''; 
    } else {
      // Muestra el video seleccionado
      this.showVideo = videoId; 
    }
  }

  // Función para cambiar el segmento activo y navegar
  navigateTo(path: string) {
    this.router.navigate([path]);
    this.currentSegment = path.substring(1); // Actualiza el segmento activo basado en la ruta
  }
}
