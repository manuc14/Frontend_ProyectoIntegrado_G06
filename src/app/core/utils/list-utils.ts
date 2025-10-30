export function getActiveFilters(filterGroups: any[]): any[] {
  return filterGroups.flatMap(group =>
    (group?.filters || [])
      .filter((filter: any) => filter?.active)
      .map((filter: any) => ({ ...filter, groupId: group.id }))
  );
}

function matchesFilters(item: any, activeFilters: any[], matchFilter?: (item: any, filter: any) => boolean): boolean {
  return activeFilters.every(filter => matchFilter ? matchFilter(item, filter) : true);
}

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
 * Generic filter + search helper.
 * - items: array to filter
 * - activeFilters: output of getActiveFilters
 * - searchTerm: string to search
 * - searchFields: array of field names to test when searching
 * - matchFilter: optional predicate (item, filter) => boolean to evaluate filter match
 */
export function filterAndSearch(items: any[], activeFilters: any[], searchTerm: string, searchFields: string[], matchFilter?: (item: any, filter: any) => boolean): any[] {
  const term = (searchTerm || '').toLowerCase().trim();
  return (items || []).filter(item =>
    matchesFilters(item, activeFilters, matchFilter) && matchesSearch(item, term, searchFields)
  );
}

function compareValues(a: any, b: any, dir: number): number {
  const va = a ?? '';
  const vb = b ?? '';

  if (typeof va === 'number' && typeof vb === 'number') {
    return (va - vb) * dir;
  }

  return String(va).localeCompare(String(vb), 'es', { sensitivity: 'base' }) * dir;
}

/**
 * Generic sorting helper. Takes a function to get the sort value from each item.
 */
export function applySorting(items: any[], sortOption: any, getSortValueFn: (item: any) => any): any[] {
  if (!sortOption) return items;
  const dir = sortOption.direction === 'asc' ? 1 : -1;

  return (items || []).sort((a: any, b: any) =>
    compareValues(getSortValueFn(a), getSortValueFn(b), dir)
  );
}
