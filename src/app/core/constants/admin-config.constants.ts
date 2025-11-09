// src/app/core/constants/admin-config.constants.ts
import { FilterGroup } from '../../shared/filter-buttons/filter-buttons.component';
import { SortOption } from '../../shared/sort-dropdown/sort-dropdown.component';
import { ResolucionVideo } from '../models/contenido.models';

// Configuraciones compartidas para componentes de administración
export const ADMIN_CONFIG = {
  // Opciones de ordenamiento comunes
  sortOptions: {
    users: [
      { id: 'name-asc', label: 'Nombre A-Z', field: 'name', direction: 'asc' },
      { id: 'name-desc', label: 'Nombre Z-A', field: 'name', direction: 'desc' },
      { id: 'lastName-asc', label: 'Apellido A-Z', field: 'lastName', direction: 'asc' },
      { id: 'lastName-desc', label: 'Apellido Z-A', field: 'lastName', direction: 'desc' },
      { id: 'alias-asc', label: 'Alias A-Z', field: 'alias', direction: 'asc' },
      { id: 'alias-desc', label: 'Alias Z-A', field: 'alias', direction: 'desc' },
      { id: 'birthDate-desc', label: 'Fecha nacimiento (más reciente)', field: 'birthDate', direction: 'desc' },
      { id: 'birthDate-asc', label: 'Fecha nacimiento (más antigua)', field: 'birthDate', direction: 'asc' }
    ] as SortOption[],
    admins: [
      { id: 'name-asc', label: 'Nombre A-Z', field: 'nombre', direction: 'asc' },
      { id: 'name-desc', label: 'Nombre Z-A', field: 'nombre', direction: 'desc' },
      { id: 'lastName-asc', label: 'Apellido A-Z', field: 'apellidos', direction: 'asc' },
      { id: 'lastName-desc', label: 'Apellido Z-A', field: 'apellidos', direction: 'desc' },
      { id: 'department-asc', label: 'Departamento A-Z', field: 'departamento', direction: 'asc' },
      { id: 'department-desc', label: 'Departamento Z-A', field: 'departamento', direction: 'desc' }
    ] as SortOption[],
    creators: [
      { id: 'name-asc', label: 'Nombre A-Z', field: 'nombre', direction: 'asc' },
      { id: 'name-desc', label: 'Nombre Z-A', field: 'nombre', direction: 'desc' },
      { id: 'lastName-asc', label: 'Apellido A-Z', field: 'apellidos', direction: 'asc' },
      { id: 'lastName-desc', label: 'Apellido Z-A', field: 'apellidos', direction: 'desc' },
      { id: 'alias-asc', label: 'Alias A-Z', field: 'alias', direction: 'asc' },
      { id: 'alias-desc', label: 'Alias Z-A', field: 'alias', direction: 'desc' },
      { id: 'category-asc', label: 'Categoría A-Z', field: 'especialidad', direction: 'asc' },
      { id: 'category-desc', label: 'Categoría Z-A', field: 'especialidad', direction: 'desc' }
    ] as SortOption[],
    content: [
      { id: 'title-asc', label: 'Título A-Z', field: 'title', direction: 'asc' },
      { id: 'title-desc', label: 'Título Z-A', field: 'title', direction: 'desc' },
      { id: 'rating-desc', label: 'Valoración (mayor)', field: 'rating', direction: 'desc' },
      { id: 'rating-asc', label: 'Valoración (menor)', field: 'rating', direction: 'asc' }
    ] as SortOption[]
  },

  // Grupos de filtros comunes
  filterGroups: {
    users: [
      {
        id: 'role',
        label: 'Tipo',
        mutuallyExclusive: true,
        filters: [
          { id: 'vip', label: 'VIP', value: 'VIP', active: false },
          { id: 'standard', label: 'Estándar', value: 'Estándar', active: false }
        ]
      },
      {
        id: 'status',
        label: 'Estado',
        mutuallyExclusive: true,
        filters: [
          { id: 'active', label: 'Activos', value: 'activo', active: false },
          { id: 'blocked', label: 'Bloqueados', value: 'bloqueado', active: false }
        ]
      }
    ] as FilterGroup[],
    admins: [
      {
        id: 'department',
        label: 'Departamento',
        mutuallyExclusive: true,
        filters: [
          { id: 'operaciones', label: 'Operaciones', value: 'Operaciones', active: false },
          { id: 'marketing', label: 'Marketing', value: 'Marketing', active: false },
          { id: 'finanzas', label: 'Finanzas', value: 'Finanzas', active: false },
          { id: 'rrhh', label: 'Recursos Humanos', value: 'Recursos Humanos', active: false },
          { id: 'soporte', label: 'Soporte', value: 'Soporte', active: false }
        ]
      },
      {
        id: 'status',
        label: 'Estado',
        mutuallyExclusive: true,
        filters: [
          { id: 'active', label: 'Activos', value: true, active: false },
          { id: 'blocked', label: 'Bloqueados', value: false, active: false }
        ]
      }
    ] as FilterGroup[],
    creators: [
      {
        id: 'category',
        label: 'Categoría',
        mutuallyExclusive: true,
        filters: [
          { id: 'musica', label: 'Música', value: 'Música', active: false },
          { id: 'educacion', label: 'Educación', value: 'Educación', active: false },
          { id: 'tecnologia', label: 'Tecnología', value: 'Tecnología', active: false },
          { id: 'cocina', label: 'Cocina', value: 'Cocina', active: false },
          { id: 'deportes', label: 'Deportes', value: 'Deportes', active: false },
          { id: 'arte', label: 'Arte', value: 'Arte', active: false },
          { id: 'ciencia', label: 'Ciencia', value: 'Ciencia', active: false },
          { id: 'viajes', label: 'Viajes', value: 'Viajes', active: false }
        ]
      },
      {
        id: 'status',
        label: 'Estado',
        mutuallyExclusive: true,
        filters: [
          { id: 'active', label: 'Activos', value: true, active: false },
          { id: 'blocked', label: 'Bloqueados', value: false, active: false }
        ]
      }
    ] as FilterGroup[],
    content: [] as FilterGroup[] // Contenido usa filtros custom (pills)
  },

  // Opciones de calidad de video
  qualityOptions: ['4K', '1080p', '720p', '480p'] as ResolucionVideo[],

  // Opciones de categorías para contenido
  categoryOptions: ['Música', 'Educación', 'Tecnología', 'Cocina', 'Deportes', 'Arte', 'Ciencia', 'Viajes', 'Naturaleza', 'Fitness'],

  // Opciones de restricción de edad (en años)
  ageRestrictionOptions: [7, 13, 18],

  // Rutas de navegación
  navRoutes: {
    users: {
      base: '/ad-users',
      add: '/ad-users-add',
      edit: '/ad-users-edit'
    },
    admins: {
      base: '/ad-admin',
      add: '/ad-admin-add',
      edit: '/ad-admin-edit'
    },
    creators: {
      base: '/ad-creators',
      add: '/ad-creators-add',
      edit: '/ad-creators-edit'
    }
  } as const,

  // Campos de búsqueda por entidad
  searchFields: {
    users: ['name', 'lastName', 'alias', 'email', 'fullName'],
    admins: ['nombre', 'apellidos', 'correo', 'departamento', 'fullName'],
    creators: ['nombre', 'apellidos', 'alias', 'correo', 'especialidad', 'fullName'],
    content: ['title', 'creator', 'category']
  } as const,

  // Nombres de entidad
  entityNames: {
    users: 'usuarios',
    admins: 'administradores',
    creators: 'creadores',
    content: 'contenido'
  } as const,

  // Rutas actuales
  currentRoutes: {
    users: '/ad-users',
    admins: '/ad-admin',
    creators: '/ad-creators',
    content: '/ad-content'
  } as const
};