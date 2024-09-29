import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  currentSegment: string = 'home';

  // Variables para los datos IoT
  heartRate: number = 0;
  bodyTemperature: number = 0;
  activityLevel: number = 0;
  hydration: number = 0;
  sleepQuality: number = 0;

  constructor(private router: Router) {}

  ngOnInit() {
    this.connectToIoTDevice();
  }

  // Simular la conexión y actualización de datos de IoT
  connectToIoTDevice() {
    setInterval(() => {
      this.heartRate = this.getRandomNumber(60, 100);
      this.bodyTemperature = this.getRandomNumber(36, 37.5);
      this.activityLevel = this.getRandomNumber(2000, 10000);
      this.hydration = this.getRandomNumber(1, 10);
      this.sleepQuality = this.getRandomNumber(4, 9);
    }, 3000);
  }

  // Función para generar un número aleatorio
  getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Función para convertir la hidratación en vasos de agua
  getHydrationInGlasses(): string {
    return `${this.hydration} vasos de agua`;
  }

  // Función de navegación
  navigateTo(path: string) {
    this.router.navigate([path]);
    this.currentSegment = path.substring(1);
  }

  navigateToAjustes() {
    this.router.navigate(['/ajustes']);
  }
}
