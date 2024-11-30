import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AlarmasService {
  private citasAlarms: { id: string; time: Date; message: string }[] = [];
  private emotionalCheckAlarms: { id: string; time: Date; message: string }[] = [];
  private physiologicalAlerts: { id: string; message: string }[] = [];

  constructor() {
    // Pedir permiso para usar notificaciones del navegador
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }

  /**
   * Configurar una alarma para una cita.
   * @param citaId Identificador único de la cita.
   * @param time Fecha y hora de la cita.
   * @param message Mensaje de recordatorio.
   */
  setCitaAlarm(citaId: string, time: Date, message: string): void {
    const alarm = { id: citaId, time, message };
    this.citasAlarms.push(alarm);
    console.log(`Alarma de cita configurada: ${message} a las ${time}`);
    this.scheduleNotification(alarm);
  }

  /**
   * Cancelar una alarma para una cita.
   * @param citaId Identificador único de la cita.
   */
  cancelCitaAlarm(citaId: string): void {
    this.citasAlarms = this.citasAlarms.filter((alarm) => alarm.id !== citaId);
    console.log(`Alarma de cita cancelada para ID: ${citaId}`);
  }

  /**
   * Configurar una alarma si el usuario no registra su estado emocional.
   * @param userId Identificador único del usuario.
   * @param reminderTime Hora en la que debe aparecer el recordatorio.
   */
  setEmotionalCheckAlarm(userId: string, reminderTime: Date): void {
    const message = `Recuerda registrar tu estado emocional para hoy.`;
    const alarm = { id: userId, time: reminderTime, message };
    this.emotionalCheckAlarms.push(alarm);
    console.log(`Alarma de registro emocional configurada: ${message} a las ${reminderTime}`);
    this.scheduleNotification(alarm);
  }

  /**
   * Cancelar la alarma de registro emocional.
   * @param userId Identificador único del usuario.
   */
  cancelEmotionalCheckAlarm(userId: string): void {
    this.emotionalCheckAlarms = this.emotionalCheckAlarms.filter((alarm) => alarm.id !== userId);
    console.log(`Alarma de registro emocional cancelada para el usuario: ${userId}`);
  }

  /**
   * Crear una alerta para estados fisiológicos no óptimos.
   * @param userId Identificador único del usuario.
   * @param condition Descripción de la condición fisiológica.
   */
  addPhysiologicalAlert(userId: string, condition: string): void {
    const message = `Alerta: Tu estado fisiológico indica ${condition}. Por favor, revisa tu bienestar.`;
    const alert = { id: userId, message };
    this.physiologicalAlerts.push(alert);
    console.log(`Alerta fisiológica añadida: ${message}`);
    this.showImmediateNotification(message);
  }

  /**
   * Eliminar alerta de estado fisiológico.
   * @param userId Identificador único del usuario.
   */
  removePhysiologicalAlert(userId: string): void {
    this.physiologicalAlerts = this.physiologicalAlerts.filter((alert) => alert.id !== userId);
    console.log(`Alerta fisiológica eliminada para el usuario: ${userId}`);
  }

  /**
   * Programar una notificación futura.
   * @param alarm Objeto que contiene los detalles de la alarma.
   */
  private scheduleNotification(alarm: { id: string; time: Date; message: string }): void {
    const delay = alarm.time.getTime() - Date.now();
    if (delay > 0) {
      setTimeout(() => {
        this.showNotification(alarm.message);
      }, delay);
    }
  }

  /**
   * Mostrar una notificación inmediata.
   * @param message Mensaje de la notificación.
   */
  private showImmediateNotification(message: string): void {
    this.showNotification(message);
  }

  /**
   * Mostrar una notificación usando la API del navegador.
   * @param message Mensaje de la notificación.
   */
  private showNotification(message: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Alerta de PsyWell', { body: message });
    } else {
      alert(message); // Fallback para navegadores que no soportan notificaciones
    }
  }
}
