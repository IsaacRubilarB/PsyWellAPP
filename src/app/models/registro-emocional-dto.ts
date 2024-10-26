export interface RegistroEmocionalDTO {
    idRegistro: string; // ID del registro
    idUsuario: string; // ID del usuario
    fecha: Date; // Fecha del registro
    estadoEmocional: string; // Estado emocional seleccionado
    comentarios: string; // Comentarios del usuario
    pastilla: boolean; // Indicador de si se toman pastillas
  }