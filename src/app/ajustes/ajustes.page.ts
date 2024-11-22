import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface UserProfile {
  name: string;
  age: number;
  condition: string;
  image: string;
}

@Component({
  selector: 'app-ajustes',
  templateUrl: './ajustes.page.html',
  styleUrls: ['./ajustes.page.scss'],
})
export class AjustesPage implements OnInit {
  // Variables de modales
  showNotification = false;
  showSound = false;
  showLanguage = false;
  showPrivacy = false;
  showAbout = false;
  showProfile = false;

  // Información del usuario logueado
  userProfile: UserProfile = {
    name: 'Cristina Ormazábal',
    age: 29,
    condition: 'Depresión',
    image: 'assets/perfil.png',
  };

  // Variables de notificaciones
  notificationsEnabled = false;

  // Segmento actual
  currentSegment = 'ajustes';

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadUserProfile(); // Cargar datos dinámicos
  }

  // Cargar perfil de usuario (simulación)
  loadUserProfile() {
    // Aquí podrías implementar la lógica para obtener los datos del usuario desde un servicio
    this.userProfile = {
      name: 'Cristina Ormazábal',
      age: 29,
      condition: 'Depresión',
      image: 'assets/perfil.png', // Reemplaza por una URL dinámica
    };
  }

  // Mostrar modales
  showNotificationModal() {
    this.closeAllModals();
    this.showNotification = true;
  }

  showSoundModal() {
    this.closeAllModals();
    this.showSound = true;
  }

  showLanguageModal() {
    this.closeAllModals();
    this.showLanguage = true;
  }

  showPrivacyModal() {
    this.closeAllModals();
    this.showPrivacy = true;
  }

  showAboutModal() {
    this.closeAllModals();
    this.showAbout = true;
  }

  showProfileModal() {
    this.closeAllModals();
    this.showProfile = true;
  }

  closeModal() {
    this.closeAllModals();
  }

  closeAllModals() {
    this.showNotification = false;
    this.showSound = false;
    this.showLanguage = false;
    this.showPrivacy = false;
    this.showAbout = false;
    this.showProfile = false;
  }

  saveProfile() {
    console.log('Perfil guardado:', this.userProfile);
    this.closeModal();
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
    this.currentSegment = path.substring(1);
  }
}
