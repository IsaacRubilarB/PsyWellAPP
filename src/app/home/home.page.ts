import { AlertController } from '@ionic/angular'; 
import { Component, ElementRef, OnInit, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular'; 
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { CitasService } from '../services/citasService';
import { PsicologoModalComponent } from '../psicologo-modal/psicologo-modal.component'; 
import { ListaCitasResponse, Cita } from '../home/cita.model';
import { FormBuilder } from '@angular/forms';
import { UsersService } from '../services/userService';
import { DomSanitizer } from '@angular/platform-browser';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { finalize } from 'rxjs/operators';
import interact from 'interactjs';
import { catchError } from 'rxjs/operators';
import { ModalImageComponent } from '../modal-image/modal-image.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  email: any;
  currentSegment: string = 'home';
  userName: string = '';
  userEmail: string | null = '';
  profileImage: string = 'assets/avatares/avatar4.png'; 
  bannerImage: string = 'assets/banners/banner6.jpg'; 

  citas: any[] = [];
  idUsuario: any;
  errorMessage: string | null = null;

  psicologos: any[] = [];
  pacientes: any[] = [];
  psychologists = [];
  userId: string | null = null;
  selectedPsychologist: any = null;
  availableTimes: string[] = [];

  defaultAvatars: string[] = [
    'assets/avatares/avatar1.png',
    'assets/avatares/avatar2.png',
    'assets/avatares/avatar3.png',
    'assets/avatares/avatar4.png',
    'assets/avatares/avatar5.png',
    'assets/avatares/avatar6.png',
  ];

  defaultBanners: string[] = [
    'assets/banners/banner1.jpg',
    'assets/banners/banner2.png',
    'assets/banners/banner3.jpg',
    'assets/banners/banner4.jpg',
    'assets/banners/banner5.jpeg',
    'assets/banners/banner6.jpg',
  ];

  constructor(
    private router: Router,
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private citasService: CitasService,
    private modalController: ModalController,
    private fb: FormBuilder, 
    private usersService: UsersService,
    private el: ElementRef,
    private sanitizer: DomSanitizer,
    private renderer: Renderer2,
    private storage: AngularFireStorage,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.userEmail = user.email || '';
        if (this.userEmail) {
          this.cargarPaciente(this.userEmail);
          this.loadUserImages(this.userEmail);
        } else {
          console.error('El correo del usuario aún no está disponible.');
        }
      } else {
        this.resetUserData(); 
      }
    });
  
    this.obtenerUsuarios(); 
    setTimeout(() => {
      this.initializeDrag(); 
    });
  }
  
  private loadUserImages(email: string): void {
    if (email) {
      const sanitizedEmail = email.replace('@', '_').replace('.', '_');
  
      this.profileImage = this.getFirebaseImageUrl(sanitizedEmail, 'profile');
      this.bannerImage = this.getFirebaseImageUrl(sanitizedEmail, 'banner');
    } else {
      console.error('El correo proporcionado está vacío. No se puede cargar las imágenes.');
    }
  }
  
  private resetUserData(): void {
    this.userName = '';
    this.userEmail = '';
    this.userId = null;
    this.profileImage = 'assets/avatares/avatar4.png'; 
    this.bannerImage = 'assets/banners/banner6.jpg'; 
  }
  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  initializeDrag() {
    interact('.sticky-note-item')
      .draggable({
        listeners: {
          move: (event) => {
            const target = event.target;
            const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
            const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

            target.style.transform = `translate(${x}px, ${y}px)`;
            target.setAttribute('data-x', x);
            target.setAttribute('data-y', y);
          }
        }
      });
  }

  async openImageModal(type: 'profile' | 'banner'): Promise<void> {
    const user = await this.afAuth.currentUser;
    if (!user || !user.email) {
      console.error('No se pudo obtener el correo del usuario antes de abrir el modal.');
      return;
    }
  
    const options = type === 'profile' ? this.defaultAvatars : this.defaultBanners;
    const title = type === 'profile' ? 'Selecciona un Avatar' : 'Selecciona un Banner';
  
    const modal = await this.modalController.create({
      component: ModalImageComponent,
      componentProps: {
        options: options,
        title: title,
        tipo: type 
      }
    });
  
    await modal.present();
  
    modal.onDidDismiss().then((result) => {
      if (result.data?.selectedImage) {
        const selectedImage = result.data.selectedImage;
  
        if (type === 'profile') {
          this.profileImage = selectedImage; 
          this.saveImageUrlToFirestore('profile', selectedImage); 
        } else if (type === 'banner') {
          this.bannerImage = selectedImage; 
          this.saveImageUrlToFirestore('banner', selectedImage); 
        }
      }
    });
  }
  

  
  private async saveImageUrlToFirestore(type: 'profile' | 'banner', url: string): Promise<void> {
    try {
      const user = await this.afAuth.currentUser;
  
      if (user && user.email) {
        const sanitizedEmail = user.email.replace(/[@.]/g, '_');
        const userDoc = this.afs.collection('users').doc(sanitizedEmail);
        const field = type === 'profile' ? 'profileImage' : 'bannerImage';
  
        await userDoc.set({ [field]: url }, { merge: true });
        console.log(`${type === 'profile' ? 'Avatar' : 'Banner'} guardado correctamente en Firestore.`);
      } else {
        console.error('No se pudo obtener el correo del usuario actual.');
      }
    } catch (error) {
      console.error(`Error al guardar ${type === 'profile' ? 'avatar' : 'banner'} en Firestore:`, error);
    }
  }
  
  
  
  
  async loadUserName(): Promise<void> {
    const user = await this.afAuth.currentUser;
    if (user) {
      const uid = user.uid;
      this.userEmail = user.email || '';
      
      if (uid) {
        const userDoc = await this.afs.collection('users').doc(uid).get().toPromise();
        
        if (userDoc && userDoc.exists) {
          const userData = userDoc.data() as { nombre?: string; idUsuario?: string };
          this.userName = userData?.nombre || 'Usuario';
          this.idUsuario = userData?.idUsuario || '';
          this.profileImage = this.getFirebaseImageUrl(user.email || '', 'profile');
          this.bannerImage = this.getFirebaseImageUrl(user.email || '', 'banner');
        } else {
          this.userName = 'Usuario';
        }
      } else {
        console.error('No se pudo obtener el UID del usuario.');
      }
    }
  }
  

  
  private async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    return new Promise((resolve) => {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address }, (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
        if (status === 'OK' && results && results[0]) {
          resolve({
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng(),
          });
        } else {
          console.error('Error al geocodificar la dirección:', status);
          resolve(null); // Devuelve null si no se encuentran las coordenadas
        }
      });
    });
  }
  
  
  
  openGoogleMaps(lat: number, lng: number): void {
    if (lat && lng) {
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(googleMapsUrl, '_blank');
    } else {
      console.error('Las coordenadas no están disponibles.');
      alert('No se pudo obtener la ubicación del destino.');
    }
  }
  


  cargarPaciente(email: string) {
    this.usersService.listarUsuarios().subscribe(
      (response: any) => {
        const user = response.data.find((user: any) => user.email === email);
        if (user) {
          this.userId = user.idUsuario;
          this.userName = user.nombre || 'Usuario';
          this.profileImage = this.getFirebaseImageUrl(user.email, 'profile');
          this.bannerImage = this.getFirebaseImageUrl(user.email, 'banner');
          console.log('Usuario cargado:', user);
          this.obtenerCitas(); 
        } else {
          console.warn('Usuario no encontrado, usando datos predeterminados');
        }
      },
      (error) => {
        console.error('Error al cargar el usuario:', error);
      }
    );
  }
  
  

  async obtenerCitas() {
    if (!this.userId) {
      console.warn('ID de usuario no disponible para cargar citas.');
      return;
    }
  
    this.citasService.listarCitas().subscribe({
      next: async (response) => {
        if (response && response.status === 'success' && Array.isArray(response.data)) {
          console.log('Citas obtenidas:', response.data);
  
          this.citas = await Promise.all(
            response.data
              .filter(
                (cita: Cita) =>
                  `${cita.idPaciente}` === `${this.userId}` || `${cita.idPsicologo}` === `${this.userId}`
              )
              .map(async (cita: Cita) => {
                const psicologo = this.psicologos.find((p: any) => `${p.idUsuario}` === `${cita.idPsicologo}`) || {};
                const fotoPsicologoUrl = psicologo.email
                  ? `https://firebasestorage.googleapis.com/v0/b/psywell-ab0ee.firebasestorage.app/o/fotoPerfil%2F${encodeURIComponent(psicologo.email)}?alt=media`
                  : 'assets/default-psicologo.png';
  
                // Convertir dirección a coordenadas
                let coordinates = null;
                if (cita.ubicacion) {
                  coordinates = await this.geocodeAddress(cita.ubicacion);
                }
  
                return {
                  ...cita,
                  nombrePsicologo: psicologo.nombre || 'Desconocido',
                  fotoPsicologo: fotoPsicologoUrl,
                  nombrePaciente: this.getNombreUsuario(cita.idPaciente),
                  latitud: coordinates?.lat || null,
                  longitud: coordinates?.lng || null,
                };
              })
          );
  
          console.log('Citas filtradas con coordenadas:', this.citas);
        } else {
          console.error('La respuesta no es válida:', response);
        }
      },
      error: (error) => {
        console.error('Error al listar citas:', error);
        this.errorMessage = 'No se pudo cargar las citas. Intenta de nuevo más tarde.';
      },
    });
  }
  
  
  
  
  

  obtenerUsuarios() {
    this.usersService.listarUsuarios().subscribe(
      (response: any) => {
        if (response && response.data) {
          console.log('Usuarios cargados:', response);
          this.psicologos = response.data.filter((user: { perfil: string }) => user.perfil === 'psicologo');
          this.pacientes = response.data.filter((user: { perfil: string }) => user.perfil === 'paciente');
        } else {
          console.error('No se encontraron usuarios');
        }
      },
      (error) => {
        console.error('Error al obtener usuarios', error);
      }
    );
  }

  getNombreUsuario(id: number): string {
    if (!id) {
      return 'Desconocido';
    }
    
    const usuario = this.pacientes.find(p => p.idUsuario === id) || this.psicologos.find(p => p.idUsuario === id);
    return usuario ? usuario.nombre : 'Desconocido';
  }

  triggerFileInput(type: 'profile' | 'banner'): void {
    const fileInput = document.getElementById(type) as HTMLInputElement;
    fileInput?.click();
  }

  async openAvatarSelectionModal() {
    const modal = await this.modalController.create({
      component: PsicologoModalComponent, 
      componentProps: {
        options: this.defaultAvatars,
      },
    });

    modal.onDidDismiss().then((result) => {
      if (result.data?.selectedImage) {
        this.profileImage = result.data.selectedImage;
        console.log('Avatar actualizado:', this.profileImage);
      }
    });

    return await modal.present();
  }

  async openBannerSelectionModal() {
    const modal = await this.modalController.create({
      component: PsicologoModalComponent, 
      componentProps: {
        options: this.defaultBanners,
      },
    });

    modal.onDidDismiss().then((result) => {
      if (result.data?.selectedImage) {
        this.bannerImage = result.data.selectedImage;
        console.log('Banner actualizado:', this.bannerImage);
      }
    });

    return await modal.present();
  }

  onProfileImageChange(event: Event): void {
    this.uploadImage(event, 'profile');
  }
  
  onBannerImageChange(event: Event): void {
    this.uploadImage(event, 'banner');
  }
  
  private uploadImage(event: Event, type: 'profile' | 'banner'): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const filePath = type === 'profile' ? `fotoPerfil/${this.userId}` : `fotoPortada/${this.userId}`;
      const fileRef = this.storage.ref(filePath);
      const uploadTask = this.storage.upload(filePath, file);
  
      uploadTask.snapshotChanges().pipe(
        finalize(() => {
          fileRef.getDownloadURL().subscribe(async (url) => {
            if (type === 'profile') {
              this.profileImage = url;
            } else if (type === 'banner') {
              this.bannerImage = url;
            }
          });
        })
      ).subscribe();
    }
  }
  


  private getFirebaseImageUrl(email: string, tipo: 'profile' | 'banner'): string {
    const sanitizedEmail = email.replace(/@/g, '_').replace(/\./g, '_');
    const folder = tipo === 'profile' ? 'fotoPerfil' : 'fotoPortada';
    return `https://firebasestorage.googleapis.com/v0/b/psywell-ab0ee.firebasestorage.app/o/${folder}%2F${encodeURIComponent(sanitizedEmail)}?alt=media`;
  }
  
  

  async logout() {
    try {
      await this.afAuth.signOut();
      console.log('Cierre de sesión exitoso');
  
      this.userName = '';
      this.userEmail = '';
      this.profileImage = 'assets/avatares/avatar4.png';
      this.bannerImage = 'assets/banners/banner6.jpg';
      this.userId = null;

      this.citas = [];
      this.idUsuario= null;    
      this.psicologos= [];
      this.pacientes= [];
      this.psychologists = [];
      this.selectedPsychologist = null;
      this.availableTimes= [];
  
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
  async toggleAlarm(cita: any) {
    if (cita.alarmActive) {
      cita.alarmActive = false;
      this.showAlert('Alarma Desactivada', 'La alarma para esta cita ha sido desactivada.');
    } else {
      cita.alarmActive = true;
      this.showAlert('Alarma Activada', 'La alarma para esta cita ha sido activada.');
    }
  }

  private async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK']
    });

    await alert.present();
  }

  async openPsychologistModal() {
    const modal = await this.modalController.create({
      component: PsicologoModalComponent, 
      cssClass: 'modal-psychologist-class' 
    });
  
    await modal.present();
  
    modal.onDidDismiss().then((result) => {
      if (result.data) {
        console.log('Resultado del modal:', result.data);
        this.obtenerCitas(); 
      }
    });
  }

  // Método para navegar al mapa
  navigateToMap(): void {
    this.router.navigate(['/google-maps']);
  }
  
}


