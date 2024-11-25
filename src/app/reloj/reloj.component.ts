import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-reloj',
  templateUrl: './reloj.component.html',
  styleUrls: ['./reloj.component.scss'],
})
export class RelojComponent implements OnInit, OnDestroy {
  public accessToken: string = '';
  private refreshInterval: any;
  private weeklyUpdateInterval: any;

  todayData = {
    steps: 0,
    heartRate: 0,
    sleep: 0,
    oxygenSaturation: 0,
    energyExpended: 0,
    stress: 0, // Agregada
  };

  weeklyTotals = {
    steps: 0,
    heartRate: 0,
    sleep: 0,
    oxygenSaturation: 0,
    energyExpended: 0,
  };

  currentSegment: string = 'reloj'; // Agregada

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

  private startAutoRefresh() {
    this.refreshInterval = setInterval(() => {
      this.updateTodayData();
    }, 5000);

    this.weeklyUpdateInterval = setInterval(() => {
      this.updateWeeklyData();
    }, 3600000);
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
    const oneDay = 86400000;

    try {
      this.todayData.steps = await this.fetchFitnessData(
        'com.google.step_count.delta',
        oneDay
      );
      this.todayData.heartRate = await this.fetchFitnessData(
        'com.google.heart_rate.bpm',
        oneDay
      );
      this.todayData.sleep = await this.fetchFitnessData(
        'com.google.sleep.segment',
        oneDay
      );
      this.todayData.oxygenSaturation = await this.fetchFitnessData(
        'com.google.oxygen_saturation',
        oneDay
      );
      this.todayData.energyExpended = await this.fetchFitnessData(
        'com.google.calories.expended',
        oneDay
      );

      console.log('Datos actualizados para hoy:', this.todayData);
      this.cdRef.detectChanges();
    } catch (error) {
      console.error('Error al actualizar datos de hoy:', error);
    }
  }

  private async updateWeeklyData() {
    const oneWeek = 86400000 * 7;

    try {
      this.weeklyTotals.steps = await this.fetchFitnessData(
        'com.google.step_count.delta',
        oneWeek
      );
      this.weeklyTotals.heartRate = await this.fetchFitnessData(
        'com.google.heart_rate.bpm',
        oneWeek
      );
      this.weeklyTotals.sleep = await this.fetchFitnessData(
        'com.google.sleep.segment',
        oneWeek
      );
      this.weeklyTotals.oxygenSaturation = await this.fetchFitnessData(
        'com.google.oxygen_saturation',
        oneWeek
      );
      this.weeklyTotals.energyExpended = await this.fetchFitnessData(
        'com.google.calories.expended',
        oneWeek
      );

      console.log('Datos totales de la semana:', this.weeklyTotals);
      this.cdRef.detectChanges();
    } catch (error) {
      console.error('Error al actualizar datos de la semana:', error);
    }
  }

  private async fetchFitnessData(dataType: string, duration: number): Promise<number> {
    const endTime = Date.now();
    const startTime = endTime - duration;

    try {
      const endpoint = `https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate`;
      const body = {
        aggregateBy: [
          {
            dataTypeName: dataType,
          },
        ],
        bucketByTime: { durationMillis: duration },
        startTimeMillis: startTime,
        endTimeMillis: endTime,
      };

      const data = await this.authService.fetchGoogleFitData(endpoint, body);
      return data.bucket.reduce((sum: number, bucket: any) => {
        return sum + (bucket.dataset[0]?.point[0]?.value[0]?.fpVal || 0);
      }, 0);
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
