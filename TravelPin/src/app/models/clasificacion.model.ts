// src/app/models/clasificacion.model.ts

export interface Clasificacion {
  id?: string;
  // Clave para filtrar: El ID del destino que está siendo calificado
  id_destino: string; 
  id_viaje: string;
  id_usuario: string;
  clasificacion: number; // La calificación numérica (ej. 5)
  comentario: string;    // El texto de la reseña (ej. "excelente viaje")
  // Puedes añadir el ID del usuario que hizo la clasificación si es necesario:
  // userId: string; 
}