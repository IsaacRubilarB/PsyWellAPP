import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-ver-registros',
  templateUrl: './ver-registros.page.html',
  styleUrls: ['./ver-registros.page.scss'],
})
export class VerRegistrosPage {
  registros = [
    { fecha: new Date('2024-09-01'), emocion: 'happy', comentario: 'Me siento muy bien' },
    { fecha: new Date('2024-09-05'), emocion: 'angry', comentario: '' },
    { fecha: new Date('2024-09-08'), emocion: 'neutral', comentario: 'Un día normal' },
    { fecha: new Date('2024-09-12'), emocion: 'sad', comentario: 'Me siento un poco mal' },
    { fecha: new Date('2024-09-15'), emocion: 'very-happy', comentario: '' }
  ];

  emotionSummary = [
    { type: 'happy', count: 0 },
    { type: 'angry', count: 0 },
    { type: 'neutral', count: 0 },
    { type: 'sad', count: 0 },
    { type: 'very-happy', count: 0 }
  ];

  currentSegment: string = 'ver-registros';

  constructor(private router: Router) {
    this.calculateEmotionSummary();
  }

  // Navegación a otras páginas
  navigateTo(path: string) {
    this.router.navigate([path]);
    this.currentSegment = path.substring(1);  // Actualiza el segmento activo basado en la ruta
  }

  // Función para obtener el ícono correspondiente a la emoción
  getEmotionIcon(emotion: string): string {
    switch (emotion) {
      case 'happy':
        return 'assets/emotes/feliz.svg';
      case 'angry':
        return 'assets/emotes/enojado.svg';
      case 'neutral':
        return 'assets/emotes/normal.svg';
      case 'sad':
        return 'assets/emotes/triste.svg';
      case 'very-happy':
        return 'assets/emotes/espectacular.svg';
      default:
        return 'assets/emotes/normal.svg';
    }
  }

  // Función para calcular el recuento de emociones del mes actual
  calculateEmotionSummary() {
    const currentMonth = new Date().getMonth();
    this.registros.forEach(registro => {
      const registroMonth = new Date(registro.fecha).getMonth();
      if (registroMonth === currentMonth) {
        const emotion = this.emotionSummary.find(e => e.type === registro.emocion);
        if (emotion) {
          emotion.count++;
        }
      }
    });
  }
}
