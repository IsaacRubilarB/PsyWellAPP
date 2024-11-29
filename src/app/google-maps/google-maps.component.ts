import { Component, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { ModalController } from '@ionic/angular'; // Importación del ModalController

declare const google: any;

@Component({
  selector: 'app-google-maps',
  standalone: true,
  templateUrl: './google-maps.component.html',
  styleUrls: ['./google-maps.component.scss'],
})
export class GoogleMapsComponent implements AfterViewInit {
  @Output() locationSelected = new EventEmitter<{ address: string; lat: number; lng: number }>();

  latitude: number = -33.4489; // Coordenadas iniciales (Santiago, Chile)
  longitude: number = -70.6693;
  zoom: number = 12;
  selectedAddress: string = 'Ninguna dirección seleccionada';
  private map!: any;
  private marker!: any; // Referencia al marcador

  constructor(private modalController: ModalController) {} // Constructor con ModalController

  ngAfterViewInit(): void {
    setTimeout(() => {
      const mapElement = document.getElementById('map');
      if (mapElement) {
        this.loadMap();
      } else {
        console.error('El contenedor del mapa no está disponible.');
      }
    }, 200); // Ajusta el tiempo si es necesario
  }

  loadMap(): void {
    const mapOptions = {
      center: { lat: this.latitude, lng: this.longitude },
      zoom: this.zoom,
    };

    this.map = new google.maps.Map(document.getElementById('map') as HTMLElement, mapOptions);

    // Listener para clics en el mapa
    this.map.addListener('click', (event: any) => {
      if (event.latLng) {
        this.latitude = event.latLng.lat();
        this.longitude = event.latLng.lng();
        this.getAddressFromCoordinates(this.latitude, this.longitude);
        this.addMarker(this.latitude, this.longitude);
      }
    });

    // Agrega un marcador inicial
    this.addMarker(this.latitude, this.longitude);
  }

  addMarker(lat: number, lng: number): void {
    // Elimina el marcador anterior si existe
    if (this.marker) {
      this.marker.setMap(null);
    }

    // Crea un nuevo marcador
    this.marker = new google.maps.Marker({
      position: { lat, lng },
      map: this.map,
      animation: google.maps.Animation.DROP,
    });
  }

  getAddressFromCoordinates(lat: number, lng: number): void {
    const geocoder = new google.maps.Geocoder();
    const latLng = { lat, lng };

    geocoder.geocode({ location: latLng }, (results: any, status: string) => {
      if (status === 'OK' && results[0]) {
        this.selectedAddress = results[0].formatted_address;
        // Emitir la ubicación seleccionada
        this.locationSelected.emit({
          address: this.selectedAddress,
          lat: this.latitude,
          lng: this.longitude,
        });
      } else {
        console.error('Error al obtener la dirección:', status);
        this.selectedAddress = 'Dirección no disponible';
      }
    });
  }

  searchLocation(query: string): void {
    if (!query.trim()) {
      alert('Por favor, ingrese una ubicación válida.');
      return;
    }

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: query }, (results: any, status: string) => {
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        this.latitude = location.lat();
        this.longitude = location.lng();
        this.map.setCenter({ lat: this.latitude, lng: this.longitude });
        this.addMarker(this.latitude, this.longitude);
      } else {
        console.error('Error al buscar la ubicación:', status);
        alert('No se pudo encontrar la ubicación.');
      }
    });
  }

  saveLocation(): void {
    if (this.selectedAddress) {
      console.log('Dirección guardada:', this.selectedAddress);

      // Emitir la ubicación seleccionada al componente padre
      this.locationSelected.emit({
        address: this.selectedAddress,
        lat: this.latitude,
        lng: this.longitude,
      });

      // Cierra el modal automáticamente
      this.modalController.dismiss({
        address: this.selectedAddress,
        lat: this.latitude,
        lng: this.longitude,
      });
    } else {
      alert('No se ha seleccionado una dirección.');
    }
  }

  getCurrentLocation(): void {
    if (!navigator.geolocation) {
      alert('La geolocalización no es compatible con este navegador.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.latitude = position.coords.latitude;
        this.longitude = position.coords.longitude;
        this.map.setCenter({ lat: this.latitude, lng: this.longitude });
        this.addMarker(this.latitude, this.longitude);
        this.getAddressFromCoordinates(this.latitude, this.longitude);
      },
      (error) => {
        console.error('Error al obtener la ubicación actual:', error);
        alert('No se pudo obtener la ubicación actual.');
      }
    );
  }
}
