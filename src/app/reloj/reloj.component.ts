import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

declare const google: any;

@Component({
  selector: 'app-reloj',
  templateUrl: './reloj.component.html',
  styleUrls: ['./reloj.component.scss']
})
export class RelojComponent implements OnInit {
  public accessToken: string = ''; // Token de acceso ahora es público
  public currentSegment: string = 'home'; // Define el segmento actual con un valor inicial
  private tokenClient: any;

  stepsData: any;
  heartRateData: any;
  sleepData: any;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: '546817145485-9gut154rg11ernn0qnd116c7nob1rpna.apps.googleusercontent.com',
      scope: 'https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.heart_rate.read https://www.googleapis.com/auth/fitness.sleep.read',
      callback: (response: any) => this.handleAuthResponse(response)
    });
  }

  handleAuthResponse(response: any) {
    if (response && response.access_token) {
      this.accessToken = response.access_token;
      console.log('Usuario autenticado con Google, token:', this.accessToken);
    } else {
      console.error('Error al autenticar con Google.');
    }
  }

  // Método para iniciar sesión con Google
  loginWithGoogle() {
    this.tokenClient.requestAccessToken();
  }

  // Método para cerrar sesión
  logout() {
    console.log('Sesión cerrada');
    this.accessToken = ''; // Opcional: Borrar token local
  }

  // Método para manejar la navegación entre segmentos
  navigateTo(route: string) {
    this.currentSegment = route.split('/')[1]; // Actualiza el segmento actual
  }

  getStepsData() {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.accessToken}`);
    const body = {
      aggregateBy: [{ dataTypeName: "com.google.step_count.delta" }],
      bucketByTime: { durationMillis: 86400000 },
      startTimeMillis: Date.now() - 7 * 86400000,
      endTimeMillis: Date.now()
    };

    this.http.post('https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate', body, { headers })
      .subscribe(data => this.stepsData = data);
  }

  getHeartRateData() {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.accessToken}`);
    const body = {
      aggregateBy: [{ dataTypeName: "com.google.heart_rate.bpm" }],
      bucketByTime: { durationMillis: 86400000 },
      startTimeMillis: Date.now() - 7 * 86400000,
      endTimeMillis: Date.now()
    };

    this.http.post('https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate', body, { headers })
      .subscribe(data => this.heartRateData = data);
  }

  getSleepData() {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.accessToken}`);
    const body = {
      aggregateBy: [{ dataTypeName: "com.google.sleep.segment" }],
      bucketByTime: { durationMillis: 86400000 },
      startTimeMillis: Date.now() - 7 * 86400000,
      endTimeMillis: Date.now()
    };

    this.http.post('https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate', body, { headers })
      .subscribe(data => this.sleepData = data);
  }
}
