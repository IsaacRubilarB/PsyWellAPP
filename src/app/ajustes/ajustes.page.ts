import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-ajustes',
  templateUrl: './ajustes.page.html',
  styleUrls: ['./ajustes.page.scss'],
})
export class AjustesPage {
  // Variables para mostrar u ocultar modales
  showNotification = false;
  showSound = false;
  showLanguage = false;
  showPrivacy = false;
  showAbout = false;
  showProfile = false; // Para mostrar el modal de editar perfil
  
  // Variable para activar/desactivar notificaciones
  notificationsEnabled = false;

  // Variable para mantener el segmento activo
  currentSegment = 'ajustes';

  constructor(private router: Router) {}

  // Métodos para mostrar los modales correspondientes
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
    this.showProfile = true; // Mostrar el modal de editar perfil
  }

  // Método para cerrar todos los modales
  closeModal() {
    this.closeAllModals();
  }

  // Método para cambiar el idioma de la aplicación (se debe implementar)
  changeLanguage(language: string) {
    console.log(`Idioma cambiado a: ${language}`);
    // Aquí se puede agregar la lógica para cambiar el idioma de la aplicación
  }

  // Método para cerrar todos los modales
  closeAllModals() {
    this.showNotification = false;
    this.showSound = false;
    this.showLanguage = false;
    this.showPrivacy = false;
    this.showAbout = false;
    this.showProfile = false;
  }

  // Método para navegar entre rutas y cambiar el segmento actual
  navigateTo(path: string) {
    this.router.navigate([path]);
    this.currentSegment = path.substring(1); // Actualiza el segmento activo basado en la ruta
  }
  
  // Método para guardar cambios de perfil (puedes implementar la lógica según necesites)
  saveProfile() {
    console.log("Perfil actualizado");
    this.closeModal();
  }
}
