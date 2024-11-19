import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RegistroService } from 'src/app/services/registroService';
import { RegistroEmocionalDTO } from 'src/app/models/registro-emocional-dto';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-registrar-emociones',
  templateUrl: './registrar-emociones.page.html',
  styleUrls: ['./registrar-emociones.page.scss'],
})
export class RegistrarEmocionesPage implements OnInit {
  selectedEmotion: string = '';
  comment: string = '';
  hiddenComment: string = '';
  remindMedication: boolean = false;
  currentSegment: string = 'registrar-emociones';
  showGratification: boolean = false;
  idRegistro: string = '1';
  idUsuario: string = '';
  userLoaded: boolean = false;
  selectedKeywords: string[] = [];
  showAllKeywords: boolean = true;
  userGender: string = 'hombre';

  constructor(
    private router: Router,
    private registroService: RegistroService,
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore
  ) {}

  ngOnInit() {
    this.loadUserId();
  }

  async loadUserId() {
    try {
      const user = await this.afAuth.currentUser;
      if (user) {
        const userDocRef = this.afs.collection('users').doc(user.uid);
        const userDoc = await userDocRef.get().toPromise();

        if (userDoc && userDoc.exists) {
          const userData = userDoc.data() as { idUsuario?: string; gender?: string };
          this.idUsuario = userData?.idUsuario || '';
          this.userGender = userData?.gender || 'hombre';
          console.log('ID de usuario obtenido:', this.idUsuario);
          this.userLoaded = true;
        } else {
          console.error('No se encontró el documento del usuario en Firestore');
        }
      } else {
        console.error('No se encontró un usuario autenticado');
      }
    } catch (error) {
      console.error('Error al cargar el ID del usuario:', error);
    }
  }

  selectEmotion(emotion: string) {
    this.selectedEmotion = emotion;
    this.selectedKeywords = [];
    this.showAllKeywords = true;
  }

  addKeywordToComment(keyword: string) {
    if (!this.selectedKeywords.includes(keyword)) {
      this.selectedKeywords.push(keyword);
    }
    if (this.hiddenComment) {
      this.hiddenComment = `${keyword}, ${this.hiddenComment}`;
    } else {
      this.hiddenComment = keyword;
    }
  }

  onCommentFocus() {
    this.showAllKeywords = false;
  }

  getEmotionImage(selectedEmotion: string): string {
    const basePath = 'assets/image.registro/';
    
    if (selectedEmotion === 'Muy enojado' || selectedEmotion === 'Molesto') {
      return `${basePath}${this.userGender === 'hombre' ? 'hombre_triste.png' : 'mujer_triste.png'}`;
    } else if (selectedEmotion === 'neutral') {
      return `${basePath}${this.userGender === 'hombre' ? 'hombre_normal.png' : 'mujer_normal.png'}`;
    } else if (selectedEmotion === 'Feliz' || selectedEmotion === 'Muy Feliz!') {
      return `${basePath}${this.userGender === 'hombre' ? 'hombre_feliz.png' : 'mujer_feliz.png'}`;
    }
    
    return ''; // En caso de que no coincida con ninguna emoción
  }
  
  
  getImageUrl(): string {
    console.log('Emoción seleccionada:', this.selectedEmotion);
    return this.getEmotionImage(this.selectedEmotion);
  }
  
  
  handleImageError() {
    console.error('Error al cargar la imagen. Verifica que la ruta y el nombre de la imagen sean correctos.');
  }
  
  

  closeOverlay() {
    this.showGratification = false;
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  emotionImageUrl: string = '';

saveEmotion() {
  if (!this.userLoaded || !this.idUsuario) {
    console.error('No se puede guardar la emoción, el ID de usuario no está disponible o no se ha cargado');
    alert('No se puede guardar la emoción. Asegúrate de estar registrado correctamente.');
    return;
  }

  const combinedComment = this.hiddenComment ? `${this.hiddenComment}, ${this.comment}` : this.comment;

  const emotionData: RegistroEmocionalDTO = {
    idRegistro: this.idRegistro,
    idUsuario: this.idUsuario,
    fecha: new Date(),
    estadoEmocional: this.selectedEmotion,
    comentarios: combinedComment,
    pastilla: this.remindMedication,
  };

  this.registroService.addRegistro(emotionData).subscribe(
    (response: any) => {
      console.log('Emoción registrada:', response);
      this.emotionImageUrl = this.getEmotionImage(this.selectedEmotion); // Define la URL de la imagen aquí
      this.showGratification = true; // Mostrar la alerta de éxito desde el HTML
      this.resetForm();
    },
    (error: any) => {
      console.error('Error al registrar la emoción:', error);
      alert('Hubo un error al registrar la emoción. Inténtalo de nuevo.');
    }
  );
}


  private resetForm() {
    this.selectedEmotion = '';
    this.comment = '';
    this.hiddenComment = '';
    this.remindMedication = false;
    this.selectedKeywords = [];
    this.showAllKeywords = true;
  }


  
}
