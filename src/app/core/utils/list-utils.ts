/**
 * @fileoverview Utilidades genéricas para filtrado, búsqueda y ordenamiento de listas.
 * 
 * Este módulo proporciona funciones helper reutilizables para:
 * - Obtener filtros activos de grupos de filtros
 * - Filtrar items según filtros activos y término de búsqueda
 * - Ordenar items con comparación sensible al idioma español
 * - Manejo seguro de valores null/undefined
 * 
 * Estas utilidades son agnósticas del tipo de datos y se pueden usar
 * con cualquier estructura de lista (usuarios, contenidos, etc.).
 * 
 * @module list-utils
 */

/**
 * Extrae todos los filtros activos de grupos de filtros.
 * 
 * Procesa un array de grupos de filtros y devuelve solo aquellos
 * filtros que están marcados como activos, añadiendo el ID del grupo
 * al que pertenecen.
 * 
 * @param {any[]} filterGroups - Array de grupos de filtros con estructura { id, filters: [] }
 * @returns {any[]} Array de filtros activos con groupId añadido
 * 
 * @example
 * ```typescript
 * const filterGroups = [
 *   {
 *     id: 'status',
 *     filters: [
 *       { id: 'active', label: 'Activos', active: true },
 *       { id: 'inactive', label: 'Inactivos', active: false }
 *     ]
 *   },
 *   {
 *     id: 'type',
 *     filters: [
 *       { id: 'vip', label: 'VIP', active: true }
 *     ]
 *   }
 * ];
 * 
 * const active = getActiveFilters(filterGroups);
 * // => [
 * //   { id: 'active', label: 'Activos', active: true, groupId: 'status' },
 * //   { id: 'vip', label: 'VIP', active: true, groupId: 'type' }
 * // ]
 * ```
 */
export function getActiveFilters(filterGroups: any[]): any[] {
  return filterGroups.flatMap(group =>
    (group?.filters || [])
      .filter((filter: any) => filter?.active)
      .map((filter: any) => ({ ...filter, groupId: group.id }))
  );
}

/**
 * Verifica si un item cumple con todos los filtros activos.
 * 
 * Evalúa cada filtro usando la función matchFilter personalizada.
 * Si no se proporciona matchFilter, asume que todos los items coinciden.
 * 
 * @param {any} item - Item a evaluar
 * @param {any[]} activeFilters - Filtros activos a aplicar
 * @param {Function} [matchFilter] - Función opcional (item, filter) => boolean
 * @returns {boolean} true si el item cumple todos los filtros
 * @private
 */
function matchesFilters(item: any, activeFilters: any[], matchFilter?: (item: any, filter: any) => boolean): boolean {
  return activeFilters.every(filter => matchFilter ? matchFilter(item, filter) : true);
}

/**
 * Verifica si un item coincide con el término de búsqueda.
 * 
 * Busca el término en los campos especificados del item,
 * de forma case-insensitive. Maneja valores null/undefined de forma segura.
 * 
 * @param {any} item - Item a evaluar
 * @param {string} term - Término de búsqueda (ya debe estar en minúsculas)
 * @param {string[]} searchFields - Nombres de campos donde buscar
 * @returns {boolean} true si el término se encuentra en algún campo
 * @private
 */
function matchesSearch(item: any, term: string, searchFields: string[]): boolean {
  if (!term) return true;
  return searchFields.some(field => {
    try {
      const value = item[field] ?? '';
      return String(value).toLowerCase().includes(term);
    } catch {
      return false;
    }
  });
}

/**
 * Filtra y busca items según filtros activos y término de búsqueda.
 * 
 * Combina filtrado por criterios específicos y búsqueda de texto libre
 * en campos especificados. Ambas operaciones se aplican simultáneamente
 * (AND lógico).
 * 
 * @param {any[]} items - Array de items a filtrar
 * @param {any[]} activeFilters - Filtros activos obtenidos de getActiveFilters
 * @param {string} searchTerm - Término de búsqueda de texto libre
 * @param {string[]} searchFields - Campos donde buscar el término
 * @param {Function} [matchFilter] - Función opcional (item, filter) => boolean para evaluar filtros
 * @returns {any[]} Array de items que cumplen filtros y búsqueda
 * 
 * @example
 * ```typescript
 * const users = [
 *   { id: 1, nombre: 'Juan', tipo: 'VIP', activo: true },
 *   { id: 2, nombre: 'Ana', tipo: 'Standard', activo: true },
 *   { id: 3, nombre: 'Pedro', tipo: 'VIP', activo: false }
 * ];
 * 
 * const activeFilters = [
 *   { id: 'vip', groupId: 'type' },
 *   { id: 'active', groupId: 'status' }
 * ];
 * 
 * const matchFilter = (user: any, filter: any) => {
 *   if (filter.groupId === 'type') return user.tipo === 'VIP';
 *   if (filter.groupId === 'status') return user.activo === true;
 *   return true;
 * };
 * 
 * const filtered = filterAndSearch(
 *   users,
 *   activeFilters,
 *   'juan',
 *   ['nombre', 'tipo'],
 *   matchFilter
 * );
 * // => [{ id: 1, nombre: 'Juan', tipo: 'VIP', activo: true }]
 * // (Es VIP, está activo y su nombre contiene 'juan')
 * ```
 */
export function filterAndSearch(items: any[], activeFilters: any[], searchTerm: string, searchFields: string[], matchFilter?: (item: any, filter: any) => boolean): any[] {
  const term = (searchTerm || '').toLowerCase().trim();
  return (items || []).filter(item =>
    matchesFilters(item, activeFilters, matchFilter) && matchesSearch(item, term, searchFields)
  );
}

/**
 * Compara dos valores para ordenamiento.
 * 
 * Maneja números y strings de forma apropiada:
 * - Números: comparación numérica
 * - Strings: comparación alfabética sensible al español (localeCompare)
 * - null/undefined: se tratan como strings vacíos
 * 
 * @param {any} a - Primer valor a comparar
 * @param {any} b - Segundo valor a comparar
 * @param {number} dir - Dirección (1 para asc, -1 para desc)
 * @returns {number} Resultado de comparación (-1, 0, 1)
 * @private
 */
function compareValues(a: any, b: any, dir: number): number {
  const va = a ?? '';
  const vb = b ?? '';

  if (typeof va === 'number' && typeof vb === 'number') {
    return (va - vb) * dir;
  }

  return String(va).localeCompare(String(vb), 'es', { sensitivity: 'base' }) * dir;
}

/**
 * Ordena items según una opción de ordenamiento y una función extractora.
 * 
 * Utilidad genérica que permite ordenar cualquier tipo de lista proporcionando
 * una función que extrae el valor a comparar de cada item.
 * 
 * @param {any[]} items - Array de items a ordenar
 * @param {any} sortOption - Opción de ordenamiento con { direction: 'asc' | 'desc' }
 * @param {Function} getSortValueFn - Función que extrae el valor a comparar de cada item
 * @returns {any[]} Nuevo array ordenado (no muta el original)
 * 
 * @example
 * ```typescript
 * const users = [
 *   { nombre: 'Carlos', edad: 30 },
 *   { nombre: 'Ana', edad: 25 },
 *   { nombre: 'Beatriz', edad: 28 }
 * ];
 * 
 * // Ordenar por nombre ascendente
 * const sortedByName = applySorting(
 *   users,
 *   { direction: 'asc' },
 *   (user) => user.nombre
 * );
 * // => [Ana, Beatriz, Carlos]
 * 
 * // Ordenar por edad descendente
 * const sortedByAge = applySorting(
 *   users,
 *   { direction: 'desc' },
 *   (user) => user.edad
 * );
 * // => [Carlos: 30, Beatriz: 28, Ana: 25]
 * 
 * // Sin ordenamiento (devuelve original)
 * const unsorted = applySorting(users, null, (u) => u.nombre);
 * // => array original sin cambios
 * ```
 */
export function applySorting(items: any[], sortOption: any, getSortValueFn: (item: any) => any): any[] {
  if (!sortOption) return items;
  const dir = sortOption.direction === 'asc' ? 1 : -1;

  return (items || []).sort((a: any, b: any) =>
    compareValues(getSortValueFn(a), getSortValueFn(b), dir)
  );
}
