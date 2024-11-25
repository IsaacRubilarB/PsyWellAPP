import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Plugins, registerPlugin, Capacitor } from '@capacitor/core';

// Definir el tipo del plugin manualmente
type SamsungHealthPlugin = {
  initialize: () => Promise<void>;
  requestPermissions: () => Promise<void>;
  getSteps: () => Promise<{ steps: number }>;
  getSleep: () => Promise<{ sleep: number }>;
};

const SamsungHealth = registerPlugin<SamsungHealthPlugin>('SamsungHealth');

@Component({
  selector: 'app-reloj',
  templateUrl: './reloj.component.html',
  styleUrls: ['./reloj.component.scss'],
})
export class RelojComponent implements OnInit, OnDestroy {
  public accessToken: string = '';
  private refreshInterval: any;
  private weeklyUpdateInterval: any;
  private isAndroid: boolean = Capacitor.getPlatform() === 'android';

  todayData = {
    steps: 0,
    heartRate: 0,
    sleep: 0,
    oxygenSaturation: 0,
    energyExpended: 0,
    stress: 0, // Agregado
    samsungSteps: 0, // Agregado
    samsungSleep: 0, // Agregado
  };

  weeklyTotals = {
    steps: 0,
    heartRate: 0,
    sleep: 0,
    oxygenSaturation: 0,
    energyExpended: 0,
  };

  currentSegment: string = 'reloj';

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdRef: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    try {
      if (!this.authService.isAuthenticated()) {
        this.router.navigate(['/login']);
        return;
      }

      this.accessToken = this.authService.getAccessToken() || '';
      if (!this.accessToken) {
        console.warn('No se encontró un token de acceso. Intentando obtener uno nuevo...');
        const loginResult = await this.authService.loginWithGoogle();
        this.accessToken = loginResult.token;
      }

      console.log('Token de acceso:', this.accessToken);

      if (this.isAndroid) {
        await this.initializeSamsungHealth();
        await this.requestSamsungHealthPermissions();
      }

      await this.updateData();
      this.startAutoRefresh();
    } catch (error) {
      console.error('Error durante la inicialización:', error);
      this.router.navigate(['/login']);
    }
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    if (this.weeklyUpdateInterval) {
      clearInterval(this.weeklyUpdateInterval);
      this.weeklyUpdateInterval = null;
    }
  }

  // Cambio en la lógica de auto-refresh
private startAutoRefresh(): void {
  this.refreshInterval = setInterval(() => {
    this.updateTodayData();
  }, 5000);

  // Ejecuta la actualización semanal después de que el componente esté cargado
  this.updateWeeklyData().then(() => {
    this.weeklyUpdateInterval = setInterval(() => {
      this.updateWeeklyData();
    }, 300000); // 5 minutos
  });
}

  private async initializeSamsungHealth() {
    if (!this.isAndroid) return;

    try {
      await SamsungHealth.initialize();
      console.log('Samsung Health inicializado correctamente.');
    } catch (error) {
      console.error('Error al inicializar Samsung Health:', error);
    }
  }

  private async requestSamsungHealthPermissions() {
    if (!this.isAndroid) return;

    try {
      await SamsungHealth.requestPermissions();
      console.log('Permisos de Samsung Health otorgados.');
    } catch (error) {
      console.error('Error al solicitar permisos de Samsung Health:', error);
    }
  }

  private async updateData() {
    try {
      await this.updateTodayData();
      await this.updateWeeklyData();
    } catch (error) {
      console.error('Error al actualizar los datos:', error);
    }
  }

  private async updateTodayData() {
    const now = new Date();
    const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 1).getTime(); // 00:00:01 de hoy
    const endTime = now.getTime(); // Hora actual

    try {
      // Datos de Google Fit
      this.todayData.steps = await this.fetchStepsData(startTime, endTime);
      this.todayData.heartRate = await this.fetchFitnessData('com.google.heart_rate.bpm', startTime, endTime);
      this.todayData.sleep = await this.fetchFitnessData('com.google.sleep.segment', startTime, endTime);
      this.todayData.oxygenSaturation = await this.fetchFitnessData('com.google.oxygen_saturation', startTime, endTime);
      this.todayData.energyExpended = await this.fetchFitnessData('com.google.calories.expended', startTime, endTime);

      // Datos de Samsung Health (solo si estamos en Android)
      if (this.isAndroid) {
        this.todayData.samsungSteps = await this.fetchSamsungHealthSteps();
        this.todayData.samsungSleep = await this.fetchSamsungHealthSleep();
      }

      this.cdRef.detectChanges();
    } catch (error) {
      console.error('Error al actualizar datos de hoy:', error);
    }
  }

  // Función específica para pasos
private async fetchStepsData(startTime: number, endTime: number): Promise<number> {
  try {
    const endpoint = `https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate`;
    const body = {
      aggregateBy: [
        {
          dataTypeName: 'com.google.step_count.delta',
        },
      ],
      bucketByTime: { durationMillis: endTime - startTime },
      startTimeMillis: startTime,
      endTimeMillis: endTime,
    };

    const data = await this.authService.fetchGoogleFitData(endpoint, body);

    // Procesa los datos de pasos
    if (data.bucket && data.bucket.length > 0) {
      return data.bucket.reduce((sum: number, bucket: any) => {
        if (bucket.dataset[0]?.point.length > 0) {
          return (
            sum +
            bucket.dataset[0].point.reduce((innerSum: number, point: any) => {
              return innerSum + (point.value[0]?.intVal || 0);
            }, 0)
          );
        }
        return sum;
      }, 0);
    } else {
      return 0; // Sin datos disponibles
    }
  } catch (error) {
    console.error('Error al obtener datos de pasos:', error);
    return 0;
  }
}

  private async fetchSamsungHealthSteps(): Promise<number> {
    if (!this.isAndroid) return 0;

    try {
      const result = await SamsungHealth.getSteps();
      return result.steps || 0;
    } catch (error) {
      console.error('Error al obtener pasos de Samsung Health:', error);
      return 0;
    }
  }

  private async fetchSamsungHealthSleep(): Promise<number> {
    if (!this.isAndroid) return 0;

    try {
      const result = await SamsungHealth.getSleep();
      return result.sleep || 0;
    } catch (error) {
      console.error('Error al obtener datos de sueño de Samsung Health:', error);
      return 0;
    }
  }

  private async updateWeeklyData() {
    const now = new Date();
    const endTime = now.getTime(); // Hora actual
    const startTime = endTime - 86400000 * 7; // 7 días hacia atrás

    try {
      // Obtén los datos semanales
      this.weeklyTotals.steps = await this.fetchFitnessData('com.google.step_count.delta', startTime, endTime);
      this.weeklyTotals.heartRate = await this.fetchFitnessData('com.google.heart_rate.bpm', startTime, endTime);
      this.weeklyTotals.sleep = await this.fetchFitnessData('com.google.sleep.segment', startTime, endTime);
      this.weeklyTotals.oxygenSaturation = await this.fetchFitnessData('com.google.oxygen_saturation', startTime, endTime);
      this.weeklyTotals.energyExpended = await this.fetchFitnessData('com.google.calories.expended', startTime, endTime);

      this.cdRef.detectChanges();
    } catch (error) {
      console.error('Error al actualizar datos de la semana:', error);
    }
  }


  // Ajuste de fetchFitnessData para aceptar startTime y endTime directamente
private async fetchFitnessData(dataType: string, startTime: number, endTime: number): Promise<number> {
  try {
    const endpoint = `https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate`;
    const body = {
      aggregateBy: [
        {
          dataTypeName: dataType,
        },
      ],
      bucketByTime: { durationMillis: endTime - startTime },
      startTimeMillis: startTime,
      endTimeMillis: endTime,
    };

    const data = await this.authService.fetchGoogleFitData(endpoint, body);

    // Procesa los datos recibidos
    if (data.bucket && data.bucket.length > 0) {
      return data.bucket.reduce((sum: number, bucket: any) => {
        if (bucket.dataset[0]?.point.length > 0) {
          return (
            sum +
            bucket.dataset[0].point.reduce((innerSum: number, point: any) => {
              return innerSum + (point.value[0]?.fpVal || point.value[0]?.intVal || 0); // Maneja float e int
            }, 0)
          );
        }
        return sum;
      }, 0);
    } else {
      return 0; // Sin datos disponibles
    }
  } catch (error) {
    console.error(`Error al obtener datos para ${dataType}:`, error);
    return 0;
  }
}

  navigateTo(route: string): void {
    this.currentSegment = route.split('/')[1]; // Actualizamos el segmento actual
    this.router.navigate([route]); // Navegamos a la ruta especificada
  }
}
