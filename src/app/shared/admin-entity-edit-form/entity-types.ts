// src/app/shared/admin-entity-edit-form/entity-types.ts
export type EntityType = 'admin' | 'creator' | 'user';

export interface BaseEntityData {
  nombre: string;
  apellidos: string;
  alias: string;
  foto?: string;
  activo: boolean;
}

export interface AdminEntityData extends BaseEntityData {
  correo: string;
  departamento: string;
}

export interface CreatorEntityData extends BaseEntityData {
  correo: string;
  descripcion: string;
  especialidad: string;
  tipoContenido: string;
}

export interface UserEntityData extends BaseEntityData {
  correo: string;
  fechaNacimiento: string;
}

export type EntityData = AdminEntityData | CreatorEntityData | UserEntityData;