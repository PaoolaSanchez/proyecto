// src/app/models/pago.model.ts

// Usamos el tipo Date para manejar la fecha correctamente
import { FieldValue } from 'firebase/firestore'; 

export interface Pago {
  id?: string; // ID único del documento de Firestore (opcional)

  // 🚨 CORRECCIÓN CLAVE: El campo en tu base de datos se llama 'id_viaje'
  id_viaje: string; 

  descripcion: string; // "Cena en restaurante frances"
  cantidad: number; // 120
  Divisa: string; // "USD"
  categoria: string; // "alimento"

  // 🚨 CORRECCIÓN: Tipo de dato para el array
  dividir_entre: string[]; // ["usuario@correo electrónico.com ", "amigo1@email.com", ...]

  pagado_por: string; // "amiga2@email.com"
  
  // Tipo de dato para el booleano
  esta_resuelto: boolean; // false

  // Tipo de dato para la fecha
  // Si usas el tipo nativo de Firestore (Timestamp), será 'Date' en Angular
  // Si lo guardaste como texto ("15 de enero de 2025..."), debería ser 'string'
  fecha: Date | string | FieldValue; 
}