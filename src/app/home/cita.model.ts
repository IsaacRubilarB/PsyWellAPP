export interface Cita {
  nombrePaciente: string;
  nombrePsicologo: string;
  idCita: number;
  idPaciente: number;
  idPsicologo: number | null;
  ubicacion: string;
  estado: string;
  fecha: string;   
  horaInicio: string;  
  horaFin: string;  
  comentarios: string;
}

export interface ListaCitasResponse {
  status: string;
  data: Cita[];
}
  