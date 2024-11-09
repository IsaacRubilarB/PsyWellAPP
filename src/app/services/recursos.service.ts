import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface Audio {
  titulo: string;
  url: string;
  categoria?: string;
  descripcion?: string;
  fecha_subida?: any;
  tipo?: string;
  visibilidad?: boolean;
}

interface Video {
  titulo: string;
  url: string;
  autor?: string;
  descripcion?: string;
  fecha_subida?: any;
  tipo?: string;
  visibilidad?: boolean;
}

interface Libro {
  titulo: string;
  url: string;
  autor: string;
  categoria?: string;
  descripcion?: string;
  fecha_subida?: any;
  tipo?: string;
  visibilidad?: boolean;
  portada?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RecursosService {
  constructor(private firestore: AngularFirestore) {}

  obtenerSonidos(): Observable<Audio[]> {
    return this.firestore.collection<Audio>('audios').valueChanges().pipe(
      catchError(error => {
        console.error('Error al obtener sonidos:', error);
        return throwError(error);
      })
    );
  }

  obtenerVideos(): Observable<Video[]> {
    return this.firestore.collection<Video>('recursos-materiales').valueChanges().pipe(
      catchError(error => {
        console.error('Error al obtener videos:', error);
        return throwError(error);
      })
    );
  }

  obtenerLibros(): Observable<Libro[]> {
    return this.firestore.collection<Libro>('libros').valueChanges().pipe(
      catchError(error => {
        console.error('Error al obtener libros:', error);
        return throwError(error);
      })
    );
  }
}
