import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

declare const google: any;

@Component({
  selector: 'app-reloj',
  templateUrl: './reloj.component.html',
  styleUrls: ['./reloj.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RelojComponent implements OnInit, OnDestroy {
  public accessToken: string = '';
  public currentSegment: string = 'home';
  private tokenClient: any;
  private refreshInterval: any;
  private isWeeklyDataLoaded: boolean = false;

  todayData = {
    steps: 0,
    heartRate: 0,
    sleep: 0,
    oxygenSaturation: 0,
    energyExpended: 0,
    stress: 0,
  };

  weeklyData: any = {
    steps: [],
    heartRate: [],
    sleep: [],
    oxygenSaturation: [],
    energyExpended: []
  };

  weeklyTotals = {
    steps: 0,
    heartRate: 0,
    sleep: 0,
    oxygenSaturation: 0,
    energyExpended: 0
  };

  constructor(private http: HttpClient, private router: Router, private cdRef: ChangeDetectorRef) {}

  async ngOnInit() {
    try {
      await this.loadGoogleScript();
      this.initializeGoogleClient();
    } catch (error) {
      console.error('Error al inicializar la API de Google:', error);
    }
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  private loadGoogleScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).google && (window as any).google.accounts) {
        resolve();
      } else {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = (error) => reject(error);
        document.head.appendChild(script);
      }
    });
  }

  private initializeGoogleClient() {
    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: '546817145485-9gut154rg11ernn0qnd116c7nob1rpna.apps.googleusercontent.com',
      scope: 'https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.heart_rate.read https://www.googleapis.com/auth/fitness.sleep.read https://www.googleapis.com/auth/fitness.oxygen_saturation.read',
      callback: (response: any) => this.handleAuthResponse(response),
    });
  }

  loginWithGoogle() {
    if (!this.tokenClient) {
      console.error('tokenClient no está inicializado.');
      return;
    }
    this.tokenClient.requestAccessToken();
  }

  logout() {
    this.accessToken = '';
    clearInterval(this.refreshInterval);
    console.log('Sesión cerrada.');
  }

  private handleAuthResponse(response: any) {
    if (response?.access_token) {
      this.accessToken = response.access_token;
      console.log('Autenticación exitosa. Token recibido.');
      this.refreshInterval = setInterval(() => this.updateTodayData(), 5000); // Actualización cada 5 segundos
      if (!this.isWeeklyDataLoaded) {
        this.loadWeeklyData();
        this.isWeeklyDataLoaded = true;
      }
    } else {
      console.error('Error en la autenticación.');
    }
  }

  updateTodayData() {
    console.log('Actualizando datos diarios...');
    this.fetchTodayData();
    this.cdRef.detectChanges();
  }

  loadWeeklyData() {
    console.log('Cargando datos semanales...');
    this.fetchWeeklyData();
  }

  private createRequestHeaders(): HttpHeaders {
    return new HttpHeaders().set('Authorization', `Bearer ${this.accessToken}`);
  }

  private createAggregateBody(dataType: string, duration: number, daysBack: number = 0): any {
    const endTimeMillis = Date.now() - daysBack * 86400000;
    const startTimeMillis = endTimeMillis - duration;
    return {
      aggregateBy: [{ dataTypeName: dataType }],
      bucketByTime: { durationMillis: duration },
      startTimeMillis: startTimeMillis,
      endTimeMillis: endTimeMillis
    };
  }

  private fetchDataFromGoogleFit(dataType: string, duration: number, callback: (data: any) => void) {
    const headers = this.createRequestHeaders();
    const body = this.createAggregateBody(dataType, duration);

    this.http.post('https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate', body, { headers }).subscribe({
      next: callback,
      error: (error) => {
        console.error(`Error al obtener datos para ${dataType}:`, error);
      }
    });
  }

  fetchTodayData() {
    const oneDay = 86400000;

    // Pasos
    this.fetchDataFromGoogleFit('com.google.step_count.delta', oneDay, (data) => {
      this.todayData.steps = data?.bucket[0]?.dataset[0]?.point[0]?.value[0]?.intVal || 0;
      console.log(`Pasos de hoy: ${this.todayData.steps}`);
    });

    // Frecuencia cardíaca
    this.fetchDataFromGoogleFit('com.google.heart_rate.bpm', oneDay, (data) => {
      this.todayData.heartRate = Math.round(data?.bucket[0]?.dataset[0]?.point[0]?.value[0]?.fpVal || 0);
      console.log(`Frecuencia cardíaca de hoy: ${this.todayData.heartRate}`);
    });

   // Sueño
this.fetchDataFromGoogleFit('com.google.sleep.segment', oneDay, (data) => {
  const sleepData = data?.bucket[0]?.dataset[0]?.point || [];
  if (sleepData.length > 0) {
    const totalSleepMillis = sleepData.reduce((sum: number, point: any) => {
      return sum + (point.endTimeNanos - point.startTimeNanos) / 1e6;
    }, 0);
    this.todayData.sleep = parseFloat((totalSleepMillis / (1000 * 60 * 60)).toFixed(1));
  } else {
    this.todayData.sleep = 0;
  }
  console.log(`Horas de sueño: ${this.todayData.sleep}`);
});


    

    // Saturación de oxígeno
    this.fetchDataFromGoogleFit('com.google.oxygen_saturation', oneDay, (data) => {
      const oxygenPoint = data?.bucket[0]?.dataset[0]?.point[0];
      this.todayData.oxygenSaturation = oxygenPoint?.value[0]?.fpVal.toFixed(1) || '0.0';
      console.log(`Saturación de oxígeno: ${this.todayData.oxygenSaturation}%`);
    });

    // Energía gastada
    this.fetchDataFromGoogleFit('com.google.calories.expended', oneDay, (data) => {
      this.todayData.energyExpended = Math.round(data?.bucket[0]?.dataset[0]?.point[0]?.value[0]?.fpVal || 0);
      console.log(`Energía gastada: ${this.todayData.energyExpended} kcal`);
    });
  }

  navigateTo(route: string): void {
    this.currentSegment = route.split('/')[1];
    this.router.navigate([route]);
  }
  
  fetchWeeklyData() {
    const oneWeek = 86400000 * 7;

    // Pasos semanales
    this.fetchDataFromGoogleFit('com.google.step_count.delta', oneWeek, (data) => {
      this.weeklyData.steps = data?.bucket.map((bucket: any) => ({
        date: new Date(parseInt(bucket.startTimeMillis)).toLocaleDateString(),
        steps: bucket?.dataset[0]?.point[0]?.value[0]?.intVal || 0
      }));
      console.log('Datos semanales de pasos:', this.weeklyData.steps);
    });

    // Otros datos semanales (se puede añadir más de la misma forma)
  }

  syncDataNow() {
    console.log('Sincronizando datos manualmente...');
    this.updateTodayData();
    this.loadWeeklyData();
  }
}
