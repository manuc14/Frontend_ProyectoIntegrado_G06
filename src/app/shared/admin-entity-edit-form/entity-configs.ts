// src/app/shared/admin-entity-edit-form/entity-configs.ts
import { Observable } from 'rxjs';
import { AdminEntityService } from '../../core/services/admin-entity.service';
import { EntityType, EntityData, AdminEntityData, CreatorEntityData, UserEntityData } from './entity-types';

export interface EntityConfig {
  formConfig: Record<string, any>;
  requiredFields: string[];
  listMethod: (service: AdminEntityService) => Observable<any[]>;
  editMethod: (service: AdminEntityService) => (id: string, changes: any) => Observable<any>;
  mapEntityToData: (entity: any) => EntityData;
}

export const ENTITY_CONFIGS: Record<EntityType, EntityConfig> = {
  admin: {
    formConfig: {
      nombre: '',
      apellidos: '',
      departamento: 'Operaciones'
    },
    requiredFields: ['nombre', 'apellidos', 'departamento'],
    listMethod: (service) => service.listarAdministradores(),
    editMethod: (service) => service.editarAdministrador.bind(service),
    mapEntityToData: (entity: any): AdminEntityData => ({
      nombre: entity.nombre ?? '',
      apellidos: entity.apellidos ?? '',
      alias: entity.alias ?? '',
      correo: entity.correo ?? '',
      foto: entity.foto ?? '',
      activo: entity.activo ?? true,
      departamento: entity.departamento ?? 'Operaciones'
    })
  },
  creator: {
    formConfig: {
      nombre: '',
      apellidos: '',
      alias: '',
      descripcion: '',
      especialidad: 'Música'
    },
    requiredFields: ['nombre', 'apellidos', 'descripcion', 'especialidad', 'alias'],
    listMethod: (service) => service.listarCreadores(),
    editMethod: (service) => service.editarCreador.bind(service),
    mapEntityToData: (entity: any): CreatorEntityData => ({
      nombre: entity.nombre ?? '',
      apellidos: entity.apellidos ?? '',
      alias: entity.alias ?? '',
      correo: entity.correo ?? '',
      foto: entity.foto ?? '',
      activo: entity.activo ?? true,
      descripcion: entity.descripcion ?? '',
      especialidad: entity.especialidad ?? 'Música',
      tipoContenido: entity.tipoContenido ?? 'VIDEO'
    })
  },
  user: {
    formConfig: {
      nombre: '',
      apellidos: '',
      fechaNacimiento: ''
    },
    requiredFields: ['nombre', 'apellidos', 'fechaNacimiento'],
    listMethod: (service) => service.listarUsuarios(),
    editMethod: (service) => service.editarUsuario.bind(service),
    mapEntityToData: (entity: any): UserEntityData => ({
      nombre: entity.nombre ?? '',
      apellidos: entity.apellidos ?? '',
      alias: entity.alias ?? '',
      correo: entity.correo ?? '',
      foto: entity.foto ?? '',
      activo: entity.activo ?? true,
      fechaNacimiento: entity.fechaNacimiento ?? ''
    })
  }
};