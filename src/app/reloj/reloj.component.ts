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

  todayData: any = {
    steps: 0,
    heartRate: 0,
    sleep: 0,
    oxygenSaturation: 0,
    energyExpended: 0
  };

  weeklyData: any = {
    steps: [],
    heartRate: [],
    sleep: [],
    oxygenSaturation: [],
    energyExpended: []
  };

  weeklyTotals: any = {
    steps: 0,
    heartRate: 0,
    sleep: 0,
    oxygenSaturation: 0,
    energyExpended: 0
  };

  showDetails: boolean = false;

  constructor(private http: HttpClient, private router: Router, private cdRef: ChangeDetectorRef) {}

  async ngOnInit() {
    try {
      await this.loadGoogleScript();
      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: '546817145485-9gut154rg11ernn0qnd116c7nob1rpna.apps.googleusercontent.com',
        scope: 'https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.heart_rate.read https://www.googleapis.com/auth/fitness.sleep.read https://www.googleapis.com/auth/fitness.oxygen_saturation.read',
        callback: (response: any) => this.handleAuthResponse(response)
      });
    } catch (error) {
      console.error('Error al inicializar tokenClient:', error);
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
  }

  navigateTo(route: string) {
    this.currentSegment = route.split('/')[1];
    this.router.navigate([route]);
  }

  toggleDetails() {
    this.showDetails = !this.showDetails;
  }

  handleAuthResponse(response: any) {
    if (response?.access_token) {
      this.accessToken = response.access_token;
      this.refreshInterval = setInterval(() => this.updateTodayData(), 5000);
      if (!this.isWeeklyDataLoaded) {
        this.loadWeeklyData();
        this.isWeeklyDataLoaded = true; // Marca los datos semanales como cargados
      }
    }
  }

  updateTodayData() {
    this.getTodayStepsData();
    this.getTodayHeartRateData();
    this.getTodayOxygenSaturationData();
    this.getTodayEnergyExpendedData();
    this.cdRef.detectChanges();
  }

  loadWeeklyData() {
    this.weeklyData = {
      steps: [],
      heartRate: [],
      sleep: [],
      oxygenSaturation: [],
      energyExpended: []
    };
    this.getWeeklyStepsData();
    this.getWeeklyHeartRateData();
    this.getWeeklyOxygenSaturationData();
    this.getWeeklyEnergyExpendedData();
  }

  prepareWeeklyDetails() {
    const daysCount = Math.max(
      this.weeklyData.steps.length,
      this.weeklyData.heartRate.length,
      this.weeklyData.oxygenSaturation.length,
      this.weeklyData.energyExpended.length
    );

    const weeklyDetails = [];
    for (let i = 0; i < daysCount; i++) {
      weeklyDetails.push({
        date: this.weeklyData.steps[i]?.date || 'Sin fecha',
        steps: this.weeklyData.steps[i]?.steps?.toLocaleString() || '0', // Formato de miles
        heartRate: Math.round(this.weeklyData.heartRate[i]?.heartRate || 0), // Sin decimales
        oxygenSaturation: this.weeklyData.oxygenSaturation[i]?.oxygenSaturation || '0.0',
        energyExpended: this.weeklyData.energyExpended[i]?.energyExpended?.toLocaleString() || '0' // Formato de miles
      });
    }

    return weeklyDetails;
  }

  calculateWeeklyTotals() {
    this.weeklyTotals.steps = this.weeklyData.steps
      .reduce((sum: number, day: { steps: number }) => sum + day.steps, 0)
      .toLocaleString(); // Formato de miles para los pasos

    this.weeklyTotals.heartRate = Math.round(
      this.weeklyData.heartRate.reduce((sum: number, day: { heartRate: number }) => sum + day.heartRate, 0) /
        this.weeklyData.heartRate.length || 0
    ).toString(); // Quitar decimales y convertir a cadena para formato consistente

    this.weeklyTotals.energyExpended = this.weeklyData.energyExpended
      .reduce((sum: number, day: { energyExpended: number }) => sum + day.energyExpended, 0)
      .toLocaleString(); // Formato de miles para energía gastada

    this.weeklyTotals.oxygenSaturation = (
      this.weeklyData.oxygenSaturation.reduce(
        (sum: number, day: { oxygenSaturation: string }) => sum + parseFloat(day.oxygenSaturation),
        0
      ) / this.weeklyData.oxygenSaturation.length || 0
    ).toFixed(1); // Promedio de saturación con un decimal
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

  // Datos diarios
  getTodayStepsData() {
    const headers = this.createRequestHeaders();
    const body = this.createAggregateBody('com.google.step_count.delta', 86400000);

    this.http.post('https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate', body, { headers }).subscribe({
      next: (data: any) => {
        const steps = data?.bucket[0]?.dataset[0]?.point[0]?.value[0]?.intVal || 0;
        this.todayData.steps = steps.toLocaleString(); // Formato de miles
        console.log(`Pasos de hoy: ${this.todayData.steps}`);
      },
      error: (error) => console.error('Error al obtener pasos:', error)
    });
  }

  getTodayHeartRateData() {
    const headers = this.createRequestHeaders();
    const body = this.createAggregateBody('com.google.heart_rate.bpm', 86400000);

    this.http.post('https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate', body, { headers }).subscribe({
      next: (data: any) => {
        const heartRate = Math.round(data?.bucket[0]?.dataset[0]?.point[0]?.value[0]?.fpVal || 0);
        this.todayData.heartRate = heartRate; // Mantener como número (sin formato de miles)
        console.log(`Frecuencia cardíaca de hoy: ${this.todayData.heartRate}`);
      },
      error: (error) => console.error('Error al obtener frecuencia cardíaca:', error)
    });
  }

  getTodayOxygenSaturationData() {
    const headers = this.createRequestHeaders();
    const body = this.createAggregateBody('com.google.oxygen_saturation', 86400000);

    this.http.post('https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate', body, { headers }).subscribe({
      next: (data: any) => {
        const oxygenPoint = data?.bucket[0]?.dataset[0]?.point?.find((point: any) => point.value);
        this.todayData.oxygenSaturation = oxygenPoint?.value[0]?.fpVal.toFixed(1) || '0';
        console.log(`Saturación de oxígeno de hoy: ${this.todayData.oxygenSaturation}`);
      },
      error: (error) => console.error('Error al obtener saturación de oxígeno:', error)
    });
  }

  getTodayEnergyExpendedData() {
    const headers = this.createRequestHeaders();
    const body = this.createAggregateBody('com.google.calories.expended', 86400000);

    this.http.post('https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate', body, { headers }).subscribe({
      next: (data: any) => {
        const energyExpended = Math.round(data?.bucket[0]?.dataset[0]?.point[0]?.value[0]?.fpVal || 0);
        this.todayData.energyExpended = energyExpended.toLocaleString(); // Formato de miles
        console.log(`Energía gastada de hoy: ${this.todayData.energyExpended} kcal`);
      },
      error: (error) => console.error('Error al obtener energía gastada:', error)
    });
  }

  getWeeklyStepsData() {
    const headers = this.createRequestHeaders();
    const body = this.createAggregateBody('com.google.step_count.delta', 86400000 * 7);

    this.http.post('https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate', body, { headers })
      .subscribe({
        next: (data: any) => {
          if (data?.bucket?.length > 0) {
            this.weeklyData.steps = data.bucket.map((bucket: any) => {
              const steps = bucket?.dataset[0]?.point[0]?.value[0]?.intVal || 0;
              const date = new Date(parseInt(bucket.startTimeMillis)).toLocaleDateString();
              return { date, steps }; // Datos diarios
            });

            this.calculateWeeklyTotals(); // Calcula totales después de obtener los datos
          } else {
            console.warn('No se encontraron datos de pasos semanales.');
            this.weeklyData.steps = [];
          }
        },
        error: (error) => console.error('Error al obtener pasos semanales:', error)
      });
  }

  getWeeklyHeartRateData() {
    const headers = this.createRequestHeaders();
    const body = this.createAggregateBody('com.google.heart_rate.bpm', 86400000 * 7);

    this.http.post('https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate', body, { headers })
      .subscribe({
        next: (data: any) => {
          if (data?.bucket?.length > 0) {
            this.weeklyData.heartRate = data.bucket.map((bucket: any) => {
              const heartRate = Math.round(bucket?.dataset[0]?.point[0]?.value[0]?.fpVal || 0);
              const date = new Date(parseInt(bucket.startTimeMillis)).toLocaleDateString();
              return { date, heartRate };
            });

            this.calculateWeeklyTotals(); // Actualiza totales
          } else {
            console.warn('No se encontraron datos de frecuencia cardíaca semanal.');
            this.weeklyData.heartRate = [];
          }
        },
        error: (error) => console.error('Error al obtener frecuencia cardíaca semanal:', error)
      });
  }

  getWeeklyOxygenSaturationData() {
    const headers = this.createRequestHeaders();
    const body = this.createAggregateBody('com.google.oxygen_saturation', 86400000 * 7);

    this.http.post('https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate', body, { headers })
      .subscribe({
        next: (data: any) => {
          if (data?.bucket?.length > 0) {
            this.weeklyData.oxygenSaturation = data.bucket.map((bucket: any) => {
              const oxygenSaturation = parseFloat(bucket?.dataset[0]?.point[0]?.value[0]?.fpVal || 0).toFixed(1);
              const date = new Date(parseInt(bucket.startTimeMillis)).toLocaleDateString();
              return { date, oxygenSaturation };
            });

            this.calculateWeeklyTotals(); // Actualiza totales
          } else {
            console.warn('No se encontraron datos de saturación de oxígeno semanal.');
            this.weeklyData.oxygenSaturation = [];
          }
        },
        error: (error) => console.error('Error al obtener saturación de oxígeno semanal:', error)
      });
  }

  getWeeklyEnergyExpendedData() {
    const headers = this.createRequestHeaders();
    const body = this.createAggregateBody('com.google.calories.expended', 86400000 * 7);

    this.http.post('https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate', body, { headers })
      .subscribe({
        next: (data: any) => {
          if (data?.bucket?.length > 0) {
            this.weeklyData.energyExpended = data.bucket.map((bucket: any) => {
              const energyExpended = Math.round(bucket?.dataset[0]?.point[0]?.value[0]?.fpVal || 0);
              const date = new Date(parseInt(bucket.startTimeMillis)).toLocaleDateString();
              return { date, energyExpended };
            });

            this.calculateWeeklyTotals(); // Actualiza totales
          } else {
            console.warn('No se encontraron datos de energía gastada semanal.');
            this.weeklyData.energyExpended = [];
          }
        },
        error: (error) => console.error('Error al obtener energía gastada semanal:', error)
      });
  }
}
