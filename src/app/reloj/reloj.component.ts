import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Plugins, registerPlugin, Capacitor } from '@capacitor/core';
import { FirebaseDataService } from '../services/firebase-data.service';

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
    stress: 0,
    samsungSteps: 0,
    samsungSleep: 0,
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
    private cdRef: ChangeDetectorRef,
    private firebaseDataService: FirebaseDataService
  ) {}

  async ngOnInit() {
    try {
      // Verificar autenticación y token
      this.accessToken = this.authService.getAccessToken() || '';
      if (!this.accessToken) {
        console.warn('No se encontró un token de acceso. Intentando obtener uno nuevo...');
        const loginResult = await this.authService.loginWithGoogle();
        this.accessToken = loginResult?.token || '';
      }

      if (!this.accessToken) {
        throw new Error('No se pudo obtener el token de acceso. Requiere iniciar sesión nuevamente.');
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

  private startAutoRefresh(): void {
    this.refreshInterval = setInterval(() => {
      this.updateTodayData();
    }, 5000);

    this.updateWeeklyData().then(() => {
      this.weeklyUpdateInterval = setInterval(() => {
        this.updateWeeklyData();
      }, 300000);
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
    const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 1).getTime();
    const endTime = now.getTime();

    try {
      this.todayData.steps = await this.fetchFitnessData(
        'com.google.step_count.delta',
        startTime,
        endTime
      );
      this.todayData.heartRate = await this.fetchFitnessData(
        'com.google.heart_rate.bpm',
        startTime,
        endTime
      );
      this.todayData.oxygenSaturation = await this.fetchFitnessData(
        'com.google.oxygen_saturation',
        startTime,
        endTime
      );
      this.todayData.energyExpended = await this.fetchFitnessData(
        'com.google.calories.expended',
        startTime,
        endTime
      );

      if (this.isAndroid) {
        this.todayData.samsungSteps = await this.fetchSamsungHealthSteps();
        this.todayData.samsungSleep = await this.fetchSamsungHealthSleep();
      }

      const email = this.authService.getCurrentUser()?.email || '';
      const realTimeData = {
        steps: this.todayData.steps,
        heartRate: this.todayData.heartRate,
        oxygenSaturation: this.todayData.oxygenSaturation,
        calories: this.todayData.energyExpended,
        lastUpdated: new Date(),
      };
      await this.firebaseDataService.saveRealTimeData(email, realTimeData);

      this.cdRef.detectChanges();
    } catch (error) {
      console.error('Error al actualizar datos de hoy:', error);
    }
  }

  private async updateWeeklyData() {
    const now = new Date();
    const endTime = now.getTime();
    const startTime = endTime - 86400000 * 7;

    try {
      this.weeklyTotals.steps = await this.fetchFitnessData(
        'com.google.step_count.delta',
        startTime,
        endTime
      );
      this.weeklyTotals.heartRate = await this.fetchFitnessData(
        'com.google.heart_rate.bpm',
        startTime,
        endTime
      );
      this.weeklyTotals.oxygenSaturation = await this.fetchFitnessData(
        'com.google.oxygen_saturation',
        startTime,
        endTime
      );
      this.weeklyTotals.energyExpended = await this.fetchFitnessData(
        'com.google.calories.expended',
        startTime,
        endTime
      );

      const email = this.authService.getCurrentUser()?.email || '';
      const weeklyData = {
        steps: this.weeklyTotals.steps,
        heartRate: this.weeklyTotals.heartRate,
        oxygenSaturation: this.weeklyTotals.oxygenSaturation,
        calories: this.weeklyTotals.energyExpended,
        savedAt: new Date(),
      };
      await this.firebaseDataService.saveWeeklyData(email, weeklyData);

      this.cdRef.detectChanges();
    } catch (error) {
      console.error('Error al actualizar datos de la semana:', error);
    }
  }

  async fetchFitnessData(dataType: string, startTime: number, endTime: number): Promise<number> {
    try {
      const endpoint = `https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate`;
      const body = {
        aggregateBy: [{ dataTypeName: dataType }],
        bucketByTime: { durationMillis: endTime - startTime },
        startTimeMillis: startTime,
        endTimeMillis: endTime,
      };

      const data = await this.authService.fetchGoogleFitData(endpoint, body);

      if (data.bucket && data.bucket.length > 0) {
        return data.bucket.reduce((sum: number, bucket: any) => {
          if (bucket.dataset[0]?.point.length > 0) {
            return (
              sum +
              bucket.dataset[0].point.reduce((innerSum: number, point: any) => {
                return innerSum + (point.value[0]?.fpVal || point.value[0]?.intVal || 0);
              }, 0)
            );
          }
          return sum;
        }, 0);
      } else {
        return 0;
      }
    } catch (error) {
      console.error(`Error al obtener datos para ${dataType}:`, error);
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

  navigateTo(route: string): void {
    this.currentSegment = route.split('/')[1];
    this.router.navigate([route]);
  }
}
