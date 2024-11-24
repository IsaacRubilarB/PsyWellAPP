import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

declare const google: any;

@Component({
  selector: 'app-reloj',
  templateUrl: './reloj.component.html',
  styleUrls: ['./reloj.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    energyExpended: [],
  };

  weeklyTotals = {
    steps: 0,
    heartRate: 0,
    sleep: 0,
    oxygenSaturation: 0,
    energyExpended: 0,
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
    private cdRef: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']); // Redirige al login si no está autenticado
      return;
    }
  
    const user = this.authService.getCurrentUser();
    const token = this.authService.getAccessToken();
  
    if (token) {
      this.accessToken = token;
      console.log('Token de acceso encontrado:', this.accessToken);
      this.initializeGoogleClient();
      this.fetchTodayData();
      this.fetchWeeklyData();
    } else {
      console.error('No se encontró un token de acceso para el usuario actual.');
    }
  }
  
  getAccessToken(): string | null {
    return this.accessToken;
  }

  navigateTo(route: string): void {
    this.currentSegment = route.split('/')[1]; // Cambia el segmento actual basado en la ruta
    this.router.navigate([route]); // Navega a la ruta especificada
  }
  
  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  private initializeGoogleClient() {
    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: '546817145485-9gut154rg11ernn0qnd116c7nob1rpna.apps.googleusercontent.com',
      scope: 'https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.heart_rate.read https://www.googleapis.com/auth/fitness.sleep.read https://www.googleapis.com/auth/fitness.oxygen_saturation.read',
      callback: (response: any) => this.handleAuthResponse(response),
    });
  }

  private handleAuthResponse(response: any) {
    if (response?.access_token) {
      this.accessToken = response.access_token;
      console.log('Token actualizado exitosamente.');
      this.startAutoRefresh();
    } else {
      console.error('Error en la respuesta de autenticación:', response);
      this.tokenClient.requestAccessToken(); // Solicitar un nuevo token si el actual no es válido
    }
  }
  

  loginWithGoogle() {
    if (this.tokenClient) {
      this.tokenClient.requestAccessToken();
    } else {
      console.error('TokenClient no inicializado.');
    }
  }

  logout() {
    this.authService.logout(); // Usar AuthService para manejar la sesión
    this.accessToken = '';
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    this.router.navigate(['/login']);
  }

  private startAutoRefresh() {
    this.refreshInterval = setInterval(() => {
      this.fetchTodayData();
      this.cdRef.markForCheck();
    }, 60000); // Actualizar datos cada 60 segundos
  }

  fetchTodayData() {
    const oneDay = 86400000;

    // Pasos
    this.fetchDataFromGoogleFit('com.google.step_count.delta', oneDay, (data) => {
      this.todayData.steps = data?.bucket[0]?.dataset[0]?.point[0]?.value[0]?.intVal || 0;
      console.log(`Pasos: ${this.todayData.steps}`);
    });

    // Frecuencia cardíaca
    this.fetchDataFromGoogleFit('com.google.heart_rate.bpm', oneDay, (data) => {
      this.todayData.heartRate = Math.round(data?.bucket[0]?.dataset[0]?.point[0]?.value[0]?.fpVal || 0);
      console.log(`Frecuencia cardíaca: ${this.todayData.heartRate}`);
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

  fetchWeeklyData() {
    const oneWeek = 86400000 * 7;

    // Pasos semanales
    this.fetchDataFromGoogleFit('com.google.step_count.delta', oneWeek, (data) => {
      this.weeklyData.steps = data?.bucket.map((bucket: any) => ({
        date: new Date(parseInt(bucket.startTimeMillis)).toLocaleDateString(),
        steps: bucket?.dataset[0]?.point[0]?.value[0]?.intVal || 0,
      }));
      console.log('Datos semanales de pasos:', this.weeklyData.steps);
    });

    // Otros datos semanales...
  }

  private fetchDataFromGoogleFit(dataType: string, duration: number, callback: (data: any) => void) {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.accessToken}`);
    const body = this.createAggregateBody(dataType, duration);

    this.http.post('https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate', body, { headers }).subscribe({
      next: callback,
      error: (error) => {
        console.error(`Error al obtener datos para ${dataType}:`, error);
      },
    });
  }

  private createAggregateBody(dataType: string, duration: number): any {
    const endTimeMillis = Date.now();
    const startTimeMillis = endTimeMillis - duration;
    return {
      aggregateBy: [{ dataTypeName: dataType }],
      bucketByTime: { durationMillis: duration },
      startTimeMillis,
      endTimeMillis,
    };
  }
}
