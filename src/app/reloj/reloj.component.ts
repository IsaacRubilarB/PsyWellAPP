import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

declare const google: any;

@Component({
  selector: 'app-reloj',
  templateUrl: './reloj.component.html',
  styleUrls: ['./reloj.component.scss']
})
export class RelojComponent implements OnInit {
  public accessToken: string = '';
  public currentSegment: string = 'home';
  private tokenClient: any;

  todayData: any = {
    steps: null,
    heartRate: null,
    sleep: null,
    oxygenSaturation: null,
    energyExpended: null
  };

  weeklyData: any = {
    steps: [],
    heartRate: [],
    sleep: [],
    oxygenSaturation: [],
    energyExpended: []
  };

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: '546817145485-9gut154rg11ernn0qnd116c7nob1rpna.apps.googleusercontent.com',
      scope: 'https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.heart_rate.read https://www.googleapis.com/auth/fitness.sleep.read https://www.googleapis.com/auth/fitness.oxygen_saturation.read',
      callback: (response: any) => this.handleAuthResponse(response)
    });
  }

  handleAuthResponse(response: any) {
    if (response && response.access_token) {
      this.accessToken = response.access_token;
      console.log('Usuario autenticado con Google, token:', this.accessToken);

      // Llamar a las funciones para obtener datos
      this.getTodayStepsData();
      this.getWeeklyStepsData();

      this.getTodayHeartRateData();
      this.getWeeklyHeartRateData();

      this.getTodaySleepData();
      this.getWeeklySleepData();

      this.getTodayOxygenSaturationData();
      this.getWeeklyOxygenSaturationData();

      this.getTodayEnergyExpendedData();
      this.getWeeklyEnergyExpendedData();
    } else {
      console.error('Error al autenticar con Google.');
    }
  }

  loginWithGoogle() {
    this.tokenClient.requestAccessToken();
  }

  logout() {
    console.log('Sesión cerrada');
    this.accessToken = '';
  }

  navigateTo(route: string) {
    this.currentSegment = route.split('/')[1];
    this.router.navigate([route]);
  }

  // Obtener datos de pasos de hoy
  getTodayStepsData() {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.accessToken}`);
    const body = {
      aggregateBy: [{ dataTypeName: "com.google.step_count.delta" }],
      bucketByTime: { durationMillis: 86400000 },
      startTimeMillis: Date.now() - 86400000,
      endTimeMillis: Date.now()
    };

    this.http.post('https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate', body, { headers })
      .subscribe((data: any) => {
        const steps = data?.bucket[0]?.dataset[0]?.point[0]?.value[0]?.intVal || 0;
        this.todayData.steps = steps;
      });
  }

  // Obtener datos de pasos de la semana
  getWeeklyStepsData() {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.accessToken}`);
    const body = {
      aggregateBy: [{ dataTypeName: "com.google.step_count.delta" }],
      bucketByTime: { durationMillis: 86400000 },
      startTimeMillis: Date.now() - 7 * 86400000,
      endTimeMillis: Date.now()
    };

    this.http.post('https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate', body, { headers })
      .subscribe((data: any) => {
        this.weeklyData.steps = data.bucket.map((bucket: any) => ({
          date: new Date(parseInt(bucket.startTimeMillis)).toLocaleDateString(),
          steps: bucket.dataset[0].point[0]?.value[0]?.intVal || 0
        }));
      });
  }

  // Obtener datos de frecuencia cardíaca de hoy
  getTodayHeartRateData() {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.accessToken}`);
    const body = {
      aggregateBy: [{ dataTypeName: "com.google.heart_rate.bpm" }],
      bucketByTime: { durationMillis: 86400000 },
      startTimeMillis: Date.now() - 86400000,
      endTimeMillis: Date.now()
    };

    this.http.post('https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate', body, { headers })
      .subscribe((data: any) => {
        const heartRate = Math.round(data?.bucket[0]?.dataset[0]?.point[0]?.value[0]?.fpVal || 0);
        this.todayData.heartRate = heartRate;
      });
  }

  // Obtener datos de frecuencia cardíaca de la semana
  getWeeklyHeartRateData() {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.accessToken}`);
    const body = {
      aggregateBy: [{ dataTypeName: "com.google.heart_rate.bpm" }],
      bucketByTime: { durationMillis: 86400000 },
      startTimeMillis: Date.now() - 7 * 86400000,
      endTimeMillis: Date.now()
    };

    this.http.post('https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate', body, { headers })
      .subscribe((data: any) => {
        this.weeklyData.heartRate = data.bucket.map((bucket: any) => ({
          date: new Date(parseInt(bucket.startTimeMillis)).toLocaleDateString(),
          heartRate: Math.round(bucket.dataset[0].point[0]?.value[0]?.fpVal || 0)
        }));
      });
  }

  // Obtener datos de sueño de hoy
  getTodaySleepData() {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.accessToken}`);
    const body = {
      aggregateBy: [{ dataTypeName: "com.google.sleep.stage" }], // Cambio a sleep.stage
      bucketByTime: { durationMillis: 86400000 }, // Agregación por día
      startTimeMillis: Date.now() - 86400000,
      endTimeMillis: Date.now()
    };

    this.http.post('https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate', body, { headers })
      .subscribe({
        next: (data: any) => {
          console.log("Datos completos de sueño (hoy):", JSON.stringify(data, null, 2));

          const bucket = data.bucket[0];
          const dataset = bucket?.dataset[0];

          if (dataset && dataset.point && dataset.point.length > 0) {
            const totalSleepHours = dataset.point.reduce((acc: number, point: any) => {
              const sleepDuration = (point.endTimeNanos - point.startTimeNanos) / (1000 * 60 * 60); // Convertir a horas
              return acc + sleepDuration;
            }, 0);
            this.todayData.sleep = totalSleepHours.toFixed(2); // Redondeo a dos decimales
            console.log(`Duración del sueño (hoy): ${this.todayData.sleep} horas`);
          } else {
            console.log("No se encontraron puntos de datos de sueño para hoy.");
            this.todayData.sleep = 0;
          }
        },
        error: (error) => console.error("Error al obtener los datos de sueño de hoy usando sleep.stage:", error)
      });
  }

  // Obtener datos de sueño de la semana
  getWeeklySleepData() {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.accessToken}`);
    const body = {
      aggregateBy: [{ dataTypeName: "com.google.sleep.stage" }], // Cambio a sleep.stage
      bucketByTime: { durationMillis: 86400000 }, // Agregación por día
      startTimeMillis: Date.now() - 7 * 86400000,
      endTimeMillis: Date.now()
    };

    this.http.post('https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate', body, { headers })
      .subscribe({
        next: (data: any) => {
          console.log("Datos completos de sueño (semanal):", JSON.stringify(data, null, 2));

          this.weeklyData.sleep = data.bucket.map((bucket: any) => {
            const totalSleepHours = bucket.dataset[0].point.reduce((acc: number, point: any) => {
              const sleepDuration = (point.endTimeNanos - point.startTimeNanos) / (1000 * 60 * 60); // Convertir a horas
              return acc + sleepDuration;
            }, 0);
            return {
              date: new Date(parseInt(bucket.startTimeMillis)).toLocaleDateString(),
              sleep: totalSleepHours.toFixed(2) // Redondeo a dos decimales
            };
          });
          console.log("Duración del sueño semanal:", this.weeklyData.sleep);
        },
        error: (error) => console.error("Error al obtener los datos de sueño de la semana usando sleep.stage:", error)
      });
  }

  // Obtener datos de energía gastada (kilocalorías)
  getTodayEnergyExpendedData() {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.accessToken}`);
    const body = {
      aggregateBy: [{ dataTypeName: "com.google.calories.expended" }],
      bucketByTime: { durationMillis: 86400000 },
      startTimeMillis: Date.now() - 86400000,
      endTimeMillis: Date.now()
    };

    this.http.post('https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate', body, { headers })
      .subscribe((data: any) => {
        const energyExpended = data?.bucket[0]?.dataset[0]?.point[0]?.value[0]?.fpVal || 0;
        this.todayData.energyExpended = Math.round(energyExpended); // Mostrar como entero
      });
  }

  getWeeklyEnergyExpendedData() {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.accessToken}`);
    const body = {
      aggregateBy: [{ dataTypeName: "com.google.calories.expended" }],
      bucketByTime: { durationMillis: 86400000 },
      startTimeMillis: Date.now() - 7 * 86400000,
      endTimeMillis: Date.now()
    };

    this.http.post('https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate', body, { headers })
      .subscribe((data: any) => {
        this.weeklyData.energyExpended = data.bucket.map((bucket: any) => ({
          date: new Date(parseInt(bucket.startTimeMillis)).toLocaleDateString(),
          energyExpended: Math.round(bucket.dataset[0].point[0]?.value[0]?.fpVal || 0) // Mostrar como entero
        }));
      });
  }

  // Obtener datos de saturación de oxígeno
  getTodayOxygenSaturationData() {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.accessToken}`);
    const body = {
      aggregateBy: [{ dataTypeName: "com.google.oxygen_saturation" }],
      bucketByTime: { durationMillis: 86400000 },
      startTimeMillis: Date.now() - 86400000,
      endTimeMillis: Date.now()
    };

    this.http.post('https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate', body, { headers })
      .subscribe((data: any) => {
        const oxygenSaturation = data?.bucket[0]?.dataset[0]?.point[0]?.value[0]?.fpVal || 0;
        this.todayData.oxygenSaturation = oxygenSaturation.toFixed(1); // Mostrar con un decimal
      });
  }

  getWeeklyOxygenSaturationData() {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.accessToken}`);
    const body = {
      aggregateBy: [{ dataTypeName: "com.google.oxygen_saturation" }],
      bucketByTime: { durationMillis: 86400000 },
      startTimeMillis: Date.now() - 7 * 86400000,
      endTimeMillis: Date.now()
    };

    this.http.post('https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate', body, { headers })
      .subscribe((data: any) => {
        this.weeklyData.oxygenSaturation = data.bucket.map((bucket: any) => ({
          date: new Date(parseInt(bucket.startTimeMillis)).toLocaleDateString(),
          oxygenSaturation: parseFloat(bucket.dataset[0].point[0]?.value[0]?.fpVal || 0).toFixed(1) // Mostrar con un decimal
        }));
      });
  }


}
