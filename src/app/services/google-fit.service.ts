import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class GoogleFitService {
  constructor(private http: HttpClient) {}

  private apiUrl = 'https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate';

  async getFitnessData(dataType: string, duration: number, accessToken: string): Promise<any> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${accessToken}`);
    const body = this.createAggregateBody(dataType, duration);

    try {
      const response: any = await this.http.post(this.apiUrl, body, { headers }).toPromise();
      return this.processResponse(dataType, response);
    } catch (error) {
      console.error(`Error al obtener datos para ${dataType}:`, error);
      throw error;
    }
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

  private processResponse(dataType: string, response: any): any {
    switch (dataType) {
      case 'com.google.step_count.delta':
        return response?.bucket.map((b: any) => ({
          date: new Date(parseInt(b.startTimeMillis)).toLocaleDateString(),
          steps: b?.dataset[0]?.point[0]?.value[0]?.intVal || 0,
        }));
      case 'com.google.heart_rate.bpm':
        return response?.bucket.map((b: any) => ({
          date: new Date(parseInt(b.startTimeMillis)).toLocaleDateString(),
          heartRate: b?.dataset[0]?.point[0]?.value[0]?.fpVal || 0,
        }));
      case 'com.google.sleep.segment':
        return response?.bucket.reduce((sum: number, bucket: any) => {
          const points = bucket?.dataset[0]?.point || [];
          return (
            sum +
            points.reduce((pSum: number, point: any) => pSum + (point.endTimeNanos - point.startTimeNanos) / 1e6, 0)
          );
        }, 0) / (1000 * 60 * 60); // Total de horas de sueño
      case 'com.google.oxygen_saturation':
        return response?.bucket.map((b: any) => ({
          date: new Date(parseInt(b.startTimeMillis)).toLocaleDateString(),
          oxygenSaturation: b?.dataset[0]?.point[0]?.value[0]?.fpVal || 0,
        }));
      case 'com.google.calories.expended':
        return response?.bucket.map((b: any) => ({
          date: new Date(parseInt(b.startTimeMillis)).toLocaleDateString(),
          energyExpended: b?.dataset[0]?.point[0]?.value[0]?.fpVal || 0,
        }));
      default:
        return null;
    }
  }
}
