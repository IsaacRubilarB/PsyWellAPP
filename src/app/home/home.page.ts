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
  profileImage: string = 'assets/avatares/avatar4.png'; // Imagen predeterminada de perfil
  bannerImage: string = 'assets/banners/banner6.jpg'; // Imagen predeterminada del banner

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
    // Suscribirse al estado del usuario para detectar cualquier cambio en el inicio de sesión
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.userEmail = user.email || '';
        if (this.userEmail) {
          // Llama a los métodos que dependen del email solo cuando el email está disponible
          this.cargarPaciente(this.userEmail);
          this.loadUserImages(this.userEmail);
        } else {
          console.error('El correo del usuario aún no está disponible.');
        }
      } else {
        this.resetUserData(); // Limpiar los datos del usuario al cerrar sesión
      }
    });
  
    this.obtenerUsuarios(); // Cargar la lista de usuarios para poder identificar psicólogos y pacientes
    setTimeout(() => {
      this.initializeDrag(); // Inicializar la funcionalidad de arrastrar
    });
  }
  
  private loadUserImages(email: string): void {
    if (email) {
      // Reemplazar caracteres no permitidos en el correo electrónico para usarlo como ID del documento
      const sanitizedEmail = email.replace('@', '_').replace('.', '_');
  
      // Obtener la URL del perfil y del banner desde Firebase Storage
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
    this.profileImage = 'assets/avatares/avatar4.png'; // Imagen predeterminada
    this.bannerImage = 'assets/banners/banner6.jpg'; // Imagen predeterminada
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
  
    // Crear el modal y pasar los componentes necesarios
    const modal = await this.modalController.create({
      component: ModalImageComponent,
      componentProps: {
        options: options,
        title: title,
        tipo: type // Pasar el tipo ('profile' o 'banner') como 'tipo'
      }
    });
  
    // Presentar el modal
    await modal.present();
  
    // Manejar la selección de la imagen al cerrar el modal
    modal.onDidDismiss().then((result) => {
      if (result.data?.selectedImage) {
        const selectedImage = result.data.selectedImage;
  
        // Dependiendo del tipo, asignar la imagen seleccionada
        if (type === 'profile') {
          this.profileImage = selectedImage; // Actualizar la imagen de perfil en la vista
          this.saveImageUrlToFirestore('profile', selectedImage); // Guarda en Firestore
        } else if (type === 'banner') {
          this.bannerImage = selectedImage; // Actualizar la imagen de banner en la vista
          this.saveImageUrlToFirestore('banner', selectedImage); // Guarda en Firestore
        }
      }
    });
  }
  
  private async saveImageUrlToFirestore(type: 'profile' | 'banner', url: string): Promise<void> {
    try {
      const user = await this.afAuth.currentUser;
  
      if (user && user.email) {
        // Sanitiza el correo del usuario
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
          this.obtenerCitas(); // Asegúrate de llamar a obtenerCitas después de cargar el usuario
        } else {
          console.warn('Usuario no encontrado, usando datos predeterminados');
        }
      },
      (error) => {
        console.error('Error al cargar el usuario:', error);
      }
    );
  }
  
  

  obtenerCitas() {
    if (!this.userId) {
      console.warn('ID de usuario no disponible para cargar citas.');
      return;
    }
  
    this.citasService.listarCitas().subscribe({
      next: (response) => {
        if (response && response.status === 'success' && Array.isArray(response.data)) {
          console.log('Citas obtenidas:', response.data);
  
          // Filtrar las citas relacionadas con el usuario actual
          this.citas = response.data.filter(
            (cita: Cita) => `${cita.idPaciente}` === `${this.userId}` || `${cita.idPsicologo}` === `${this.userId}`
          );
  
          this.citas = this.citas.map((cita: Cita) => {
            const psicologo = this.psicologos.find((p: any) => `${p.idUsuario}` === `${cita.idPsicologo}`) || {};
            const fotoPsicologoUrl = psicologo.email
              ? `https://firebasestorage.googleapis.com/v0/b/psywell-ab0ee.firebasestorage.app/o/fotoPerfil%2F${encodeURIComponent(psicologo.email)}?alt=media`
              : 'assets/default-psicologo.png';
  
            return {
              ...cita,
              nombrePsicologo: psicologo.nombre || 'Desconocido',
              fotoPsicologo: fotoPsicologoUrl,
              nombrePaciente: this.getNombreUsuario(cita.idPaciente),
            };
          });
  
          console.log('Citas filtradas:', this.citas);
        } else {
          console.error('La respuesta no es válida:', response);
        }
      },
      error: (error) => {
        console.error('Error al listar citas:', error);
        this.errorMessage = 'No se pudo cargar las citas. Intenta de nuevo más tarde.';
      }
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
      component: PsicologoModalComponent, // Cambiar por el componente de selección de imagen
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
      component: PsicologoModalComponent, // Cambiar por el componente de selección de imagen
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
  
      // Limpiar los datos del usuario al cerrar sesión
      this.userName = '';
      this.userEmail = '';
      this.profileImage = 'assets/avatares/avatar4.png';
      this.bannerImage = 'assets/banners/banner6.jpg';
      this.userId = null;
  
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
  async toggleAlarm(cita: any) {
    // Verificar si la alarma ya está activa
    if (cita.alarmActive) {
      // Desactivar la alarma
      cita.alarmActive = false;
      this.showAlert('Alarma Desactivada', 'La alarma para esta cita ha sido desactivada.');
    } else {
      // Activar la alarma
      cita.alarmActive = true;
      this.showAlert('Alarma Activada', 'La alarma para esta cita ha sido activada.');
      // Aquí podrías agregar lógica adicional para programar la alarma, usando plugins nativos si es necesario
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
}


