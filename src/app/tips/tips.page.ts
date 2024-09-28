import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tips',
  templateUrl: './tips.page.html',
  styleUrls: ['./tips.page.scss'],
})
export class TipsPage implements OnInit {
  isBreathingIn: boolean = true;
  breathText: string = 'Inhala...';
  currentSegment: string = 'tips';
  breathingInterval: any;

  constructor(private router: Router) {}

  ngOnInit() {}

  startBreathing() {
    if (this.breathingInterval) {
      clearInterval(this.breathingInterval); // Detener intervalo previo si existe
    }

    this.isBreathingIn = true;
    this.breathText = 'Inhala...';
    this.breathingInterval = setInterval(() => {
      this.isBreathingIn = !this.isBreathingIn;
      this.breathText = this.isBreathingIn ? 'Inhala...' : 'Exhala...';
    }, 4000); // Cambio de estado cada 4 segundos
  }

  // Función para cambiar el segmento activo y navegar
  navigateTo(path: string) {
    this.router.navigate([path]);
    this.currentSegment = path.substring(1); // Actualiza el segmento activo basado en la ruta
  }

  // Función para reproducir sonidos relajantes
  playSound(sound: string) {
    // Lógica para reproducir el sonido seleccionado
    console.log(`Reproduciendo sonido: ${sound}`);
  }
}
