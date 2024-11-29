import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

// Asegúrate de que los tipos de google estén disponibles
declare var google: any; // Añadir esta declaración para permitir el uso de google.maps

@Injectable({
  providedIn: 'root',
})
export class GoogleMapsService {
  constructor() {}

  // Método para obtener la ubicación actual del usuario
  getCurrentLocation(): Observable<GeolocationCoordinates | null> {
    return new Observable((observer) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            observer.next(position.coords);
            observer.complete();
          },
          (error) => {
            observer.error('No se pudo obtener la ubicación');
          }
        );
      } else {
        observer.error('Geolocalización no es compatible con este navegador');
      }
    });
  }

  // Método para buscar una dirección con el servicio de geocodificación
  searchLocation(query: string): Observable<any> {
    return new Observable((observer) => {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: query }, (results: google.maps.GeocoderResult[], status: google.maps.GeocoderStatus) => {
        if (status === 'OK' && results.length > 0) {
          observer.next(results[0]);
        } else {
          observer.error('Dirección no encontrada');
        }
      });
    });
  }

  // Método para obtener la dirección con geocodificación inversa
  getAddressFromCoordinates(lat: number, lng: number): Observable<string> {
    return new Observable((observer) => {
      const geocoder = new google.maps.Geocoder();
      const latLng = new google.maps.LatLng(lat, lng);
      geocoder.geocode({ location: latLng }, (results: google.maps.GeocoderResult[], status: google.maps.GeocoderStatus) => {
        if (status === 'OK' && results.length > 0) {
          observer.next(results[0].formatted_address);
        } else {
          observer.error('No se pudo obtener la dirección');
        }
      });
    });
  }
}
