export interface Cita {
    idCita: number;       
    idUsuario: number;     
    fechaHora: Date;       
    estado: string;
    ubicacion: string;
    comentarios: string;
  }
  
  export interface ListaCitasResponse {
    status: string;
    data: Cita[];
  }
  