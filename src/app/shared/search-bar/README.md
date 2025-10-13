# SearchBar Component

Componente reutilizable para barras de búsqueda en las páginas de administración.

## 🎯 Características

- ✅ **Reutilizable**: Funciona en usuarios, admin y creadores
- ✅ **Accesible**: ARIA labels y navegación por teclado
- ✅ **Responsive**: Adaptable a móviles y tablets
- ✅ **Modular**: Slot para botones adicionales (filtros)
- ✅ **Estados**: Loading, error, disabled
- ✅ **Clean UX**: Botón para limpiar búsqueda automático

## 🚀 Uso Básico

```html
<!-- Búsqueda simple -->
<app-search-bar 
  [searchTerm]="searchTerm"
  placeholder="Buscar usuarios..."
  (search)="onSearch($event)">
</app-search-bar>
```

## 🎨 Uso con Botón de Filtros

```html
<!-- Con botón de filtros personalizado -->
<app-search-bar 
  [searchTerm]="searchTerm"
  placeholder="Buscar por nombre, email, alias…"
  ariaLabel="Campo de búsqueda de usuarios"
  (search)="onSearch($event)"
  (clear)="onClearSearch()">
  
  <!-- Botón de filtros insertado via content projection -->
  <button slot="actions" class="filter-btn" (click)="toggleFilters()">
    <img src="assets/admin/filtrar.svg" alt="filtrar">
    <span>Filtrar</span>
  </button>
</app-search-bar>
```

## 📋 API del Componente

### Inputs
| Propiedad | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `searchTerm` | `string` | `''` | Valor actual de la búsqueda |
| `placeholder` | `string` | `'Buscar...'` | Texto del placeholder |
| `disabled` | `boolean` | `false` | Estado deshabilitado |
| `ariaLabel` | `string` | `'Campo de búsqueda'` | Label de accesibilidad |

### Outputs
| Evento | Payload | Descripción |
|--------|---------|-------------|
| `search` | `string` | Se emite cuando cambia el texto de búsqueda |
| `clear` | `void` | Se emite cuando se limpia la búsqueda |

### Content Projection
- `slot="actions"`: Para insertar botones adicionales (filtros, etc.)

## 🎯 Implementación por Página

### AD-Users
```typescript
// ad-users.component.ts
export class AdminUsersPage {
  searchTerm = '';

  onSearch(term: string) {
    this.searchTerm = term;
    this.filterUsers();
  }

  onClearSearch() {
    this.searchTerm = '';
    this.filteredUsers = [...this.users];
  }
}
```

```html
<!-- ad-users.component.html -->
<div class="search-section">
  <app-search-bar 
    [searchTerm]="searchTerm"
    placeholder="Buscar por nombre, email, alias…"
    (search)="onSearch($event)"
    (clear)="onClearSearch()">
    
    <button slot="actions" class="filter-btn" (click)="toggleUserFilters()">
      <img src="assets/admin/filtrar.svg" alt="filtrar">
      <span>Filtrar</span>
    </button>
  </app-search-bar>
</div>
```

### AD-Creators
```html
<!-- ad-creators.component.html -->
<app-search-bar 
  placeholder="Buscar creadores por nombre, especialidad…"
  (search)="onSearchCreators($event)">
  
  <button slot="actions" class="filter-btn">
    <span>Filtrar por especialidad</span>
  </button>
</app-search-bar>
```

### AD-Admin
```html
<!-- ad-admin.component.html -->
<app-search-bar 
  placeholder="Buscar administradores por nombre, departamento…"
  (search)="onSearchAdmins($event)">
  
  <button slot="actions" class="filter-btn">
    <span>Filtrar por rol</span>
  </button>
</app-search-bar>
```

## 🎨 Personalización de Estilos

El componente usa variables CSS globales, pero puedes personalizar:

```scss
app-search-bar {
  // Cambiar ancho máximo
  max-width: 600px;
  
  // Personalizar en contexto específico
  .search-input-wrapper {
    background: var(--sidebar);
  }
}
```

## 🔧 Reemplazo en Código Existente

### Antes (código actual):
```html
<div class="background-border">
  <button class="search-icon-button">
    <img src="assets/admin/buscar.svg">
  </button>
  <input 
    [(ngModel)]="searchTerm"
    (keydown.enter)="onSearch()"
    placeholder="Buscar...">
</div>
<button class="filter-btn">Filtrar</button>
```

### Después (usando SearchBar):
```html
<app-search-bar 
  [searchTerm]="searchTerm"
  placeholder="Buscar..."
  (search)="onSearch($event)">
  
  <button slot="actions" class="filter-btn">Filtrar</button>
</app-search-bar>
```

## ✅ Ventajas

1. **Código más limpio**: Menos HTML repetitivo
2. **Consistencia**: Misma UX en todas las páginas
3. **Mantenimiento**: Cambios centralizados
4. **Accesibilidad**: Implementada por defecto
5. **Testing**: Un componente, múltiples usos

## 🚀 Próximos Pasos

1. Implementar en `ad-users.component.html`
2. Crear `user-filters.component` para filtros específicos
3. Replicar en `ad-creators` y `ad-admin`
4. Opcional: Agregar autocompletado/sugerencias