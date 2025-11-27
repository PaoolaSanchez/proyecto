// src/app/models/recordatorio.model.ts

// Usamos FieldValue para manejar fechas de Firestore
import { FieldValue } from 'firebase/firestore'; 

export interface Recordatorio {
  id?: string;
  //  Clave para filtrar: El ID del viaje al que pertenece el recordatorio
  id_viaje: string; 
  titulo: string;               // Título del recordatorio (ej. "desayuno familiar")
  fecha_vencimiento: Date | FieldValue; // La fecha en que debe cumplirse
  esta_completado: boolean;     // Estado (verdadero/falso)
}