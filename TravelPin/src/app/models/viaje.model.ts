// src/app/models/viaje.model.ts

import { FieldValue } from 'firebase/firestore'; 

export interface Viaje {
  id?: string;
  titulo: string;
  descripcion: string;
  
  fecha_inicio: Date | FieldValue;
  fecha_fin: Date | FieldValue;
  
  // 🚨 Clave de seguridad: Lista de emails/UIDs de los participantes
  miembros: string[]; 
  
  // 🚨 Opcional: Lista de IDs de destinos incluidos en el viaje
  destinos_ids: string[]; 
  
  url_imagen: string;
  
  // Campo que parece ser el ID del usuario creador o un ID interno, si es nulo, lo ignoramos.
  creador_id?: string | null; 
}