// src/app/models/paquete.model.ts

// Definición de las actividades dentro de un día del itinerario
export interface PaqueteDiaActividad {
  day: number;
  title: string;
  description: string;
  activities: string[]; // Lista de puntos clave del día
}

export interface PaqueteViaje {
  id?: string;
  nombre: string;
  
  // Datos de la Agencia
  nombre_de_la_agencia: string;
  contacto_de_la_agencia: string; 

  descripcion: string;
  
  // Array de identificadores de destino que componen el paquete
  identificadores_de_destino: string[]; // Se mantiene para relacionar con Destino
  
  precio: number;
  duracion_dias: number; 
  
  // NUEVOS CAMPOS DEL DETALLE DEL PAQUETE
  
  // Inclusiones y Exclusiones (Listas de texto)
  incluye: string[];
  excluye: string[];
  
  // Itinerario
  itinerario: PaqueteDiaActividad[];
  
  // Fechas de Salida (Formato de texto para almacenar)
  fechas_de_salida: string[]; 
  
  // Logística/Metadatos
  dificultad: number; // Nuevo: de 1 a 10 (ej. 18 de Italia lo interpretaremos como un ID o un error, lo ajustaremos)
  nivel_de_facilidad: string; // Nuevo: ej. "facilidad", "moderado"
  tematica: string; // Nuevo: ej. "cultural", "aventura"
  
  // Imágenes
  url_de_la_imagen: string;
  galeria_adicional: string[]; 
  clasificacion: number; // Calificación promedio del paquete
}