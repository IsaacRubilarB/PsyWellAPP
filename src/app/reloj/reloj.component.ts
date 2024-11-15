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

  showDetails: boolean = false;

  constructor(private http: HttpClient, private router: Router, private cdRef: ChangeDetectorRef) {}

  ngOnInit() {
    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: '546817145485-9gut154rg11ernn0qnd116c7nob1rpna.apps.googleusercontent.com',
      scope: 'https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.heart_rate.read https://www.googleapis.com/auth/fitness.sleep.read https://www.googleapis.com/auth/fitness.oxygen_saturation.read',
      callback: (response: any) => this.handleAuthResponse(response)
    });
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  calculateWeeklyAverage(metric: string): number {
    const values = this.weeklyData[metric]?.map((data: any) => parseFloat(data[metric]) || 0) || [];
    if (values.length === 0) return 0;
    const sum = values.reduce((acc: number, val: number) => acc + val, 0);
    return parseFloat((sum / values.length).toFixed(2));
  }

  prepareWeeklyDetails(): any[] {
    const daysCount = Math.max(
      this.weeklyData.steps.length,
      this.weeklyData.heartRate.length,
      this.weeklyData.sleep.length,
      this.weeklyData.oxygenSaturation.length,
      this.weeklyData.energyExpended.length
    );

    const weeklyDetails = [];

    for (let i = 0; i < daysCount; i++) {
      weeklyDetails.push({
        date: this.weeklyData.steps[i]?.date ||
              this.weeklyData.heartRate[i]?.date ||
              this.weeklyData.sleep[i]?.date ||
              this.weeklyData.oxygenSaturation[i]?.date ||
              this.weeklyData.energyExpended[i]?.date || 'Sin fecha',
        steps: this.weeklyData.steps[i]?.steps || 0,
        heartRate: this.weeklyData.heartRate[i]?.heartRate || 0,
        sleep: this.weeklyData.sleep[i]?.sleep || '0.00',
        oxygenSaturation: this.weeklyData.oxygenSaturation[i]?.oxygenSaturation || '0.0',
        energyExpended: this.weeklyData.energyExpended[i]?.energyExpended || 0
      });
    }

    return weeklyDetails;
  }

  toggleDetails(): void {
    this.showDetails = !this.showDetails;
  }

  handleAuthResponse(response: any) {
    if (response?.access_token) {
      this.accessToken = response.access_token;
      console.log('Usuario autenticado con Google, token:', this.accessToken);

      this.refreshInterval = setInterval(() => this.updateTodayData(), 5000);
      this.loadWeeklyData();
    } else {
      console.error('Error al autenticar con Google.');
    }
  }

  updateTodayData() {
    this.getTodayStepsData();
    this.getTodayHeartRateData();
    this.getTodaySleepData();
    this.getTodayOxygenSaturationData();
    this.getTodayEnergyExpendedData();
    this.cdRef.detectChanges(); // Actualiza los datos sin reposicionar la vista
  }

  loadWeeklyData() {
    this.getWeeklyStepsData();
    this.getWeeklyHeartRateData();
    this.getWeeklySleepData();
    this.getWeeklyOxygenSaturationData();
    this.getWeeklyEnergyExpendedData();
  }

  loginWithGoogle() {
    this.tokenClient.requestAccessToken();
  }

  logout() {
    console.log('Sesión cerrada');
    this.accessToken = '';
    clearInterval(this.refreshInterval);
  }

  navigateTo(route: string) {
    this.currentSegment = route.split('/')[1];
    this.router.navigate([route]);
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

  isOutlier(value: number, values: number[]): boolean {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const deviation = Math.sqrt(values.map(v => Math.pow(v - mean, 2)).reduce((sum, v) => sum + v, 0) / values.length);
    return value > mean + 2 * deviation || value < mean - 2 * deviation;
  }

  getTodayStepsData() {
    const headers = this.createRequestHeaders();
    const body = this.createAggregateBody("com.google.step_count.delta", 86400000);

    this.http.post('https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate', body, { headers })
      .subscribe({
        next: (data: any) => {
          const steps = data?.bucket[0]?.dataset[0]?.point[0]?.value[0]?.intVal || 0;
          this.todayData.steps = steps;
          console.log(`Pasos de hoy: ${steps}`);
        },
        error: (error) => console.error("Error al obtener pasos:", error)
      });
  }

  getTodayHeartRateData() {
    const headers = this.createRequestHeaders();
    const body = this.createAggregateBody("com.google.heart_rate.bpm", 86400000);

    this.http.post('https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate', body, { headers })
      .subscribe({
        next: (data: any) => {
          const heartRate = Math.round(data?.bucket[0]?.dataset[0]?.point[0]?.value[0]?.fpVal || 0);
          this.todayData.heartRate = heartRate;
          console.log(`Frecuencia cardíaca de hoy: ${heartRate}`);
        },
        error: (error) => console.error("Error al obtener frecuencia cardíaca:", error)
      });
  }

  getTodaySleepData() {
    const headers = this.createRequestHeaders();
    const body = {
      aggregateBy: [{ dataTypeName: "com.google.sleep.segment" }],
      bucketByTime: { durationMillis: 86400000 },
      startTimeMillis: Date.now() - 86400000 * 3, // Últimos 3 días
      endTimeMillis: Date.now()
    };

    this.http.post('https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate', body, { headers })
      .subscribe({
        next: (data: any) => {
          console.log("Datos de sueño recibidos:", data);
          const sleepBucket = data.bucket?.find((bucket: any) => bucket.dataset[0]?.point?.length > 0);
          if (sleepBucket) {
            const totalSleepHours = sleepBucket.dataset[0].point.reduce((total: number, point: any) => {
              const duration = (point.endTimeNanos - point.startTimeNanos) / (1e9 * 60 * 60);
              return total + duration;
            }, 0);
            this.todayData.sleep = totalSleepHours.toFixed(2);
          } else {
            console.log("No se encontraron datos de sueño.");
            this.todayData.sleep = "0";
          }
        },
        error: (error) => console.error("Error al obtener datos de sueño:", error)
      });
  }

  getTodayOxygenSaturationData() {
    const headers = this.createRequestHeaders();
    const body = {
      aggregateBy: [{ dataTypeName: "com.google.oxygen_saturation" }],
      bucketByTime: { durationMillis: 86400000 },
      startTimeMillis: Date.now() - 86400000,
      endTimeMillis: Date.now()
    };

    this.http.post('https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate', body, { headers })
      .subscribe({
        next: (data: any) => {
          console.log("Datos de saturación de oxígeno recibidos:", data);
          const oxygenPoint = data?.bucket[0]?.dataset[0]?.point?.find((point: any) => point.value);
          if (oxygenPoint) {
            this.todayData.oxygenSaturation = oxygenPoint.value[0]?.fpVal.toFixed(1) || "0";
          } else {
            console.log("No se encontraron datos de saturación de oxígeno.");
            this.todayData.oxygenSaturation = "0";
          }
        },
        error: (error) => console.error("Error al obtener saturación de oxígeno:", error)
      });
  }

  getTodayEnergyExpendedData() {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.accessToken}`);
    const body = {
      aggregateBy: [{ dataTypeName: "com.google.calories.expended" }],
      bucketByTime: { durationMillis: 86400000 },
      startTimeMillis: Date.now() - 86400000,
      endTimeMillis: Date.now()
    };

    this.http.post('https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate', body, { headers })
      .subscribe({
        next: (data: any) => {
          const energyPoint = data?.bucket[0]?.dataset[0]?.point[0]?.value[0]?.fpVal || 0;
          this.todayData.energyExpended = Math.round(energyPoint);
          console.log(`Energía gastada de hoy: ${this.todayData.energyExpended} kcal`);
        },
        error: (error) => {
          console.error("Error al obtener energía gastada:", error);
          this.todayData.energyExpended = 0;
        }
      });
  }

  getWeeklyStepsData() {
    const headers = this.createRequestHeaders();
    const body = this.createAggregateBody("com.google.step_count.delta", 86400000 * 7);

    this.http.post('https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate', body, { headers })
      .subscribe({
        next: (data: any) => {
          const allSteps = data.bucket.map((bucket: any) => bucket.dataset[0]?.point[0]?.value[0]?.intVal || 0);
          this.weeklyData.steps = data.bucket.map((bucket: any, index: number) => ({
            date: new Date(parseInt(bucket.startTimeMillis)).toLocaleDateString(),
            steps: allSteps[index],
            outlier: this.isOutlier(allSteps[index], allSteps)
          }));
        },
        error: (error) => console.error("Error al obtener pasos semanales:", error)
      });
  }

  getWeeklyHeartRateData() {
    const headers = this.createRequestHeaders();
    const body = this.createAggregateBody("com.google.heart_rate.bpm", 86400000 * 7);

    this.http.post('https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate', body, { headers })
      .subscribe({
        next: (data: any) => {
          this.weeklyData.heartRate = data.bucket.map((bucket: any) => ({
            date: new Date(parseInt(bucket.startTimeMillis)).toLocaleDateString(),
            heartRate: Math.round(bucket.dataset[0]?.point[0]?.value[0]?.fpVal || 0)
          }));
        },
        error: (error) => console.error("Error al obtener frecuencia cardíaca semanal:", error)
      });
  }

  getWeeklySleepData() {
    const headers = this.createRequestHeaders();
    const body = this.createAggregateBody("com.google.sleep.segment", 86400000 * 7);

    this.http.post('https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate', body, { headers })
      .subscribe({
        next: (data: any) => {
          this.weeklyData.sleep = data.bucket.map((bucket: any) => {
            const totalSleepHours = bucket.dataset[0]?.point?.reduce((total: number, point: any) => {
              const duration = (point.endTimeNanos - point.startTimeNanos) / (1e9 * 60 * 60);
              return total + duration;
            }, 0) || 0;
            return {
              date: new Date(parseInt(bucket.startTimeMillis)).toLocaleDateString(),
              sleep: totalSleepHours.toFixed(2)
            };
          });
        },
        error: (error) => console.error("Error al obtener los datos de sueño de la semana:", error)
      });
  }

  getWeeklyOxygenSaturationData() {
    const headers = this.createRequestHeaders();
    const body = this.createAggregateBody("com.google.oxygen_saturation", 86400000 * 7);

    this.http.post('https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate', body, { headers })
      .subscribe({
        next: (data: any) => {
          this.weeklyData.oxygenSaturation = data.bucket.map((bucket: any) => ({
            date: new Date(parseInt(bucket.startTimeMillis)).toLocaleDateString(),
            oxygenSaturation: parseFloat(bucket.dataset[0]?.point[0]?.value[0]?.fpVal || 0).toFixed(1)
          }));
        },
        error: (error) => console.error("Error al obtener saturación de oxígeno semanal:", error)
      });
  }

  getWeeklyEnergyExpendedData() {
    const headers = this.createRequestHeaders();
    const body = this.createAggregateBody("com.google.calories.expended", 86400000 * 7);

    this.http.post('https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate', body, { headers })
      .subscribe({
        next: (data: any) => {
          this.weeklyData.energyExpended = data.bucket.map((bucket: any) => ({
            date: new Date(parseInt(bucket.startTimeMillis)).toLocaleDateString(),
            energyExpended: Math.round(bucket.dataset[0]?.point[0]?.value[0]?.fpVal || 0)
          }));
        },
        error: (error) => console.error("Error al obtener energía gastada semanal:", error)
      });
  }
}
