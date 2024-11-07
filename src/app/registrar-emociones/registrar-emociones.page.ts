import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RegistroService } from 'src/app/services/registroService';
import { RegistroEmocionalDTO } from 'src/app/models/registro-emocional-dto';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ListaCitasResponse } from '../home/cita.model';

@Component({
  selector: 'app-registrar-emociones',
  templateUrl: './registrar-emociones.page.html',
  styleUrls: ['./registrar-emociones.page.scss'],
})
export class RegistrarEmocionesPage implements OnInit {
  citasService: any;
  citas: any;
  addKeywordToComment(keyword: string) {
    if (this.hiddenComment) {
      // Si ya hay texto en hiddenComment, agrega la palabra clave al inicio con una coma
      this.hiddenComment = `${keyword}, ${this.hiddenComment}`;
    } else {
      // Si hiddenComment está vacío, simplemente agrega la palabra clave
      this.hiddenComment = keyword;
    }
  }

getEmotionImage(selectedEmotion: string): string {
  return `${selectedEmotion}.svg`;
}

closeOverlay() {
  this.showGratification = false;
}

navigateTo(route: string) {
  this.router.navigate([route]);
}

  selectedEmotion: string = '';
  comment: string = '';
  hiddenComment: string = '';
  remindMedication: boolean = false;
  currentSegment: string = 'registrar-emociones';
  showGratification: boolean = false;
  idRegistro: string = '1';
  idUsuario: string = ''; // Inicializado como vacío

  constructor(
    private router: Router,
    private registroService: RegistroService,
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore
  ) {}

ngOnInit() {
  this.loadUserId(); // Cargar el ID de usuario cuando se inicia el componente
}

async loadUserId() {
  const user = await this.afAuth.currentUser;
  if (user) {
    const userDocRef = this.afs.collection('users').doc(user.uid);
    const userDoc = await userDocRef.get().toPromise();

    if (userDoc && userDoc.exists) {
      const userData = userDoc.data() as { idUsuario?: string }; 
      this.idUsuario = userData?.idUsuario || '';
      console.log('ID de usuario obtenido:', this.idUsuario);
    } else {
      console.error('No se encontró el documento del usuario en Firestore');
    }
  } else {
    console.error('No se encontró un usuario autenticado');
  }
}

saveEmotion() {
  // Asegúrate de que idUsuario no esté vacío
  if (!this.idUsuario) {
    console.error('No se puede guardar la emoción, el ID de usuario no está disponible');
    alert('No se puede guardar la emoción. Asegúrate de estar registrado correctamente.');
    return;
  }

  const combinedComment = this.hiddenComment 
    ? `${this.hiddenComment}, ${this.comment}` 
    : this.comment;

  const emotionData: RegistroEmocionalDTO = {
    idRegistro: this.idRegistro,
    idUsuario: this.idUsuario, // Asegúrate de que este valor es el correcto
    fecha: new Date(),
    estadoEmocional: this.selectedEmotion,
    comentarios: combinedComment,
    pastilla: this.remindMedication
  };

  // Debes asegurarte de que el servicio de registro emocional está configurado
  this.registroService.addRegistro(emotionData).subscribe(
    (response: any) => {
      console.log('Emoción registrada:', response);
      alert('Emoción registrada correctamente');
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
  }
}
