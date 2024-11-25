import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Timestamp } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class FirebaseDataService {
  constructor(private firestore: AngularFirestore) {}

  async saveRealTimeData(email: string, data: any): Promise<void> {
    try {
      const docId = this.getDocumentId(email);
      await this.firestore.collection('real_time_data').doc(docId).set(
        {
          ...data,
          lastUpdated: Timestamp.now(),
        },
        { merge: true }
      );
      console.log('Datos de tiempo real guardados correctamente.');
    } catch (error) {
      console.error('Error al guardar datos de tiempo real:', error);
      throw error;
    }
  }

  async saveWeeklyData(email: string, data: any): Promise<void> {
    try {
      const collectionRef = this.firestore.collection('weekly_data');
      await collectionRef.add({
        ...data,
        email,
        savedAt: Timestamp.now(),
      });
      console.log('Datos semanales guardados correctamente.');
    } catch (error) {
      console.error('Error al guardar datos semanales:', error);
      throw error;
    }
  }

  async deleteOldWeeklyData(email: string): Promise<void> {
    try {
      const collectionRef = this.firestore.collection('weekly_data', (ref) =>
        ref.where('email', '==', email)
      );

      const snapshot = await collectionRef.get().toPromise();
      const now = new Date();
      const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;

      snapshot?.forEach((doc) => {
        const data = doc.data() as { savedAt: Timestamp }; // Especificar tipo esperado
        const savedAt = data.savedAt?.toDate(); // Manejar timestamp correctamente
        if (savedAt && savedAt.getTime() < sevenDaysAgo) {
          doc.ref.delete();
          console.log(`Registro antiguo eliminado: ${doc.id}`);
        }
      });
    } catch (error) {
      console.error('Error al eliminar datos antiguos:', error);
      throw error;
    }
  }

  async getDataByEmail(email: string, collection: string): Promise<any[]> {
    try {
      const collectionRef = this.firestore.collection(collection, (ref) =>
        ref.where('email', '==', email)
      );

      const snapshot = await collectionRef.get().toPromise();
      return snapshot?.docs.map((doc) => doc.data()) || [];
    } catch (error) {
      console.error(`Error al obtener datos de la colección ${collection}:`, error);
      throw error;
    }
  }

  private getDocumentId(email: string): string {
    return btoa(email); // Convierte el correo a Base64 como ID único
  }
}
