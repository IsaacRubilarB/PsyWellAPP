import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth'; // Importar Firebase Auth para obtener el correo del usuario
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-modal-image',
  templateUrl: './modal-image.component.html',
  styleUrls: ['./modal-image.component.scss']
})
export class ModalImageComponent implements OnInit {
  @Input() options: string[] = []; // Lista de imágenes disponibles (avatares o banners)
  @Input() title: string = 'Selecciona una imagen'; // Título del modal
  @Input() tipo: 'profile' | 'banner' = 'profile'; // Tipo de imagen: perfil o portada

  selectedImage: string | null = null; // Imagen seleccionada por el usuario
  isUploading: boolean = false; // Indica si se está subiendo una imagen
  userEmail: string | null = null; // Almacena el correo del usuario

  constructor(
    private modalController: ModalController,
    private storage: AngularFireStorage,
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth // Uso de Firebase Auth directamente
  ) {}

  ngOnInit(): void {
    // Obtener el correo del usuario al inicializar el componente
    this.afAuth.authState.subscribe(user => {
      if (user && user.email) {
        this.userEmail = user.email.replace(/[@.]/g, '_'); // Reemplazar '@' y '.' para evitar problemas en los nombres de archivo
        this.cargarImagenes();
      } else {
        console.error('No se pudo obtener el correo del usuario.');
      }
    });
  }

  // Método para seleccionar una imagen
  selectImage(image: string): void {
    this.selectedImage = image;
  }

  // Método para confirmar la selección y cerrar el modal
  confirmSelection(): void {
    if (this.selectedImage) {
      this.modalController.dismiss({ selectedImage: this.selectedImage });
    } else {
      console.warn('No se ha seleccionado ninguna imagen');
    }
  }

  // Método para cancelar la selección y cerrar el modal
  cancel(): void {
    this.modalController.dismiss();
  }

  // Método para activar el input de carga de archivos
  triggerFileInput(): void {
    const fileInputId = this.tipo === 'profile' ? 'uploadInputPerfil' : 'uploadInputPortada';
    const fileInput = document.getElementById(fileInputId) as HTMLInputElement;
    if (fileInput) fileInput.click();
  }

  // Método para manejar la selección de archivos
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0] && this.userEmail) {
      const file = input.files[0];
      const filePath = this.tipo === 'profile'
        ? `fotoPerfil/${this.userEmail}`
        : `fotoPortada/${this.userEmail}`;
      const fileRef = this.storage.ref(filePath);
      const uploadTask = this.storage.upload(filePath, file);

      this.isUploading = true; // Muestra indicador de carga

      uploadTask.snapshotChanges().pipe(
        finalize(() => {
          fileRef.getDownloadURL().subscribe((url) => {
            console.log(`URL de la imagen subida (${this.tipo}):`, url);

            // Actualizar Firestore con la URL
            this.updateFirestore(url);
            this.isUploading = false;

            // Añadir la imagen a las opciones y seleccionarla automáticamente
            this.options.push(url);
            this.selectedImage = url;
          });
        })
      ).subscribe();
    } else {
      console.warn('No se pudo subir la imagen porque no se seleccionó ningún archivo o el correo del usuario no está disponible.');
    }
  }

  // Método para actualizar Firestore
  updateFirestore(url: string): void {
    if (this.userEmail) {
      const userDocPath = `users/${this.userEmail}`; // Utilizar el correo modificado como ID del documento
      const fieldToUpdate = this.tipo === 'profile' ? 'avatar' : 'banner';

      this.firestore
        .doc(userDocPath)
        .set({ [fieldToUpdate]: url }, { merge: true }) // Usar 'merge: true' para actualizar o agregar campos al documento existente
        .then(() => {
          console.log(`Campo ${fieldToUpdate} actualizado exitosamente con la URL:`, url);
        })
        .catch((error) => {
          console.error(`Error al actualizar el campo ${fieldToUpdate} en Firestore:`, error);
        });
    } else {
      console.error('No se pudo actualizar Firestore porque el correo del usuario no está disponible.');
    }
  }

  // Método para cargar imágenes previamente almacenadas
  cargarImagenes(): void {
    if (this.userEmail) {
      console.log('Cargando imágenes para el usuario:', this.userEmail);

      const perfilPath = `fotoPerfil/${this.userEmail}`;
      const portadaPath = `fotoPortada/${this.userEmail}`;

      const perfilUrl = `https://firebasestorage.googleapis.com/v0/b/psywell-ab0ee.firebasestorage.app/o/${encodeURIComponent(perfilPath)}?alt=media`;
      const portadaUrl = `https://firebasestorage.googleapis.com/v0/b/psywell-ab0ee.firebasestorage.app/o/${encodeURIComponent(portadaPath)}?alt=media`;

      if (this.tipo === 'profile') {
        this.selectedImage = perfilUrl; // Mostrar la imagen de perfil previamente cargada
      } else if (this.tipo === 'banner') {
        this.selectedImage = portadaUrl; // Mostrar la imagen de portada previamente cargada
      }
    }
  }

  // Método para definir el texto del botón según el tipo
  getUploadButtonText(): string {
    return this.tipo === 'profile' ? 'Subir Imagen de Perfil' : 'Subir Imagen de Portada';
  }
}
