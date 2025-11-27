// src/app/models/recopilacion.model.ts

export interface Recopilacion {
  id?: string;
  nombre: string;         // 'vacaciones', 'Favoritos'
  descripcion: string;    // 'Colección vacaciones', 'Mis destinos favoritos'
  destinos: string[];     // Array de IDs de destino
  color: string;
  es_privado: boolean;
  userId: string;         // Para filtrar por el usuario loggeado
}