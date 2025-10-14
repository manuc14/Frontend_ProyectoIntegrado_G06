# FilterPanel Component

Componente reutilizable para mostrar y gestionar filtros en una ventana modal. Diseñado para trabajar junto con el SearchBar component.

## Características

- ✅ **Modal responsivo** con overlay y efectos de transición
- ✅ **Múltiples tipos de filtros**: select, multiselect, toggle, date, range
- ✅ **Estado temporal** - Los cambios no se aplican hasta confirmar
- ✅ **Contador de filtros activos** en tiempo real
- ✅ **Reseteo de filtros** individual y global
- ✅ **Accesibilidad completa** con ARIA labels
- ✅ **Mobile-first design** totalmente responsivo

## Uso Básico

```typescript
// En el componente padre
export class MyComponent {
  showFilters = false;
  appliedFilters: AppliedFilters = {};
  
  filterGroups: FilterGroup[] = [
    {
      id: 'status',
      label: 'Estado',
      type: 'select',
      placeholder: 'Seleccionar estado...',
      options: [
        { value: 'active', label: 'Activo', count: 45 },
        { value: 'inactive', label: 'Inactivo', count: 12 }
      ]
    },
    {
      id: 'roles',
      label: 'Roles',
      type: 'multiselect',
      options: [
        { value: 'admin', label: 'Administrador', count: 5 },
        { value: 'user', label: 'Usuario', count: 42 }
      ]
    }
  ];

  onFiltersChanged(filters: AppliedFilters) {
    this.appliedFilters = filters;
    // Aplicar filtros a los datos
    this.applyFiltersToData(filters);
  }

  onFiltersReset() {
    this.appliedFilters = {};
    // Mostrar todos los datos sin filtrar
    this.showAllData();
  }
}
```

```html
<!-- En el template -->
<app-filter-panel
  [isVisible]="showFilters"
  [title]="'Filtros de usuarios'"
  [filterGroups]="filterGroups"
  [appliedFilters]="appliedFilters"
  (filtersChanged)="onFiltersChanged($event)"
  (close)="showFilters = false"
  (reset)="onFiltersReset()">
</app-filter-panel>
```

## Tipos de Filtros

### 1. Select Simple
```typescript
{
  id: 'department',
  label: 'Departamento',
  type: 'select',
  placeholder: 'Seleccionar departamento...',
  options: [
    { value: 'tech', label: 'Tecnología', count: 15 },
    { value: 'marketing', label: 'Marketing', count: 8 }
  ]
}
```

### 2. Multi-Select
```typescript
{
  id: 'skills',
  label: 'Habilidades',
  type: 'multiselect',
  options: [
    { value: 'javascript', label: 'JavaScript', count: 25 },
    { value: 'python', label: 'Python', count: 18 }
  ]
}
```

### 3. Toggle/Switch
```typescript
{
  id: 'verified',
  label: 'Email verificado',
  type: 'toggle'
}
```

### 4. Fecha
```typescript
{
  id: 'createdAfter',
  label: 'Creado después de',
  type: 'date'
}
```

### 5. Rango Numérico
```typescript
{
  id: 'ageRange',
  label: 'Rango de edad',
  type: 'range',
  min: 18,
  max: 65
}
```

## Interfaces

### FilterOption
```typescript
interface FilterOption {
  value: string;        // Valor del filtro
  label: string;        // Texto mostrado al usuario
  count?: number;       // Opcional: cantidad de elementos
}
```

### FilterGroup
```typescript
interface FilterGroup {
  id: string;           // ID único del filtro
  label: string;        // Etiqueta mostrada
  type: 'select' | 'multiselect' | 'date' | 'range' | 'toggle';
  options?: FilterOption[];  // Para select y multiselect
  placeholder?: string;      // Para inputs
  min?: number;             // Para range
  max?: number;             // Para range
}
```

### AppliedFilters
```typescript
interface AppliedFilters {
  [key: string]: any;   // Valores de los filtros aplicados
}
```

## Eventos

- **filtersChanged**: Se emite cuando se aplican filtros
- **close**: Se emite cuando se cierra el panel
- **reset**: Se emite cuando se resetean todos los filtros

## Integración con SearchBar

```html
<app-search-bar (search)="onSearch($event)">
  <button 
    slot="actions" 
    (click)="showFilters = true"
    class="filter-button">
    Filtrar
  </button>
</app-search-bar>

<app-filter-panel
  [isVisible]="showFilters"
  [filterGroups]="filterGroups"
  [appliedFilters]="appliedFilters"
  (filtersChanged)="onFiltersChanged($event)"
  (close)="showFilters = false"
  (reset)="onFiltersReset()">
</app-filter-panel>
```

## Estados de los Filtros

- **Temporal**: Cambios no aplicados (se pueden cancelar)
- **Aplicado**: Filtros activos en los datos
- **Activo**: Filtro con valor seleccionado
- **Inactivo**: Filtro sin valor o vacío

## Responsividad

- **Desktop**: Modal centrado con ancho máximo
- **Tablet**: Adaptación del espaciado
- **Mobile**: Modal de ancho completo con botones expandidos

## Accesibilidad

- ✅ **ARIA labels** en todos los controles
- ✅ **Navegación por teclado** completa
- ✅ **Focus management** adecuado
- ✅ **Screen reader friendly**