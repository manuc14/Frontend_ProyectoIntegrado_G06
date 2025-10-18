export function getActiveFilters(filterGroups: any[]): any[] {
  const activeFilters: any[] = [];
  filterGroups.forEach(group => {
    (group?.filters || []).forEach((filter: any) => {
      if (filter?.active) activeFilters.push({ ...filter, groupId: group.id });
    });
  });
  return activeFilters;
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
    return (items || []).filter(item => {
    if (activeFilters && activeFilters.length > 0) {
      const ok = activeFilters.every(filter => {
        if (matchFilter) return matchFilter(item, filter);
        return true;
      });
      if (!ok) return false;
    }

    if (!term) return true;

    return searchFields.some(field => {
      try {
        const value = item[field] ?? '';
        return String(value).toLowerCase().includes(term);
      } catch {
        return false;
      }
    });
  });
}

/**
 * Generic sorting helper. If a dateParseFn is provided, it will be used to compare date-like fields.
 */
export function applySorting(items: any[], sortOption: any, dateParseFn?: (val: any) => number): any[] {
  if (!sortOption) return items;
  const field = sortOption.field;
  const dir = sortOption.direction === 'asc' ? 1 : -1;

  return (items || []).sort((a: any, b: any) => {
  const va = a[field] ?? '';
  const vb = b[field] ?? '';

    if (dateParseFn) {
      const ta = dateParseFn(va) ?? 0;
      const tb = dateParseFn(vb) ?? 0;
      return (ta - tb) * dir;
    }

    return String(va).localeCompare(String(vb), 'es', { sensitivity: 'base' }) * dir;
  });
}
