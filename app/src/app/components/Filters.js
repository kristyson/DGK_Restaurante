import styles from "../page.module.css";

export default function Filters({ filters, updateFilter, selectableCategories }) {
  return (
    <div className={styles.filtersPanel}>
      <div className={styles.fieldGroup}>
        <label>Filtrar por nome</label>
        <input
          value={filters.name}
          onChange={(e) => updateFilter("name", e.target.value)}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label>Categoria</label>
        <select
          value={filters.category}
          onChange={(e) => updateFilter("category", e.target.value)}
        >
          <option value="TODAS">Todas</option>
          {selectableCategories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.fieldGroup}>
        <label>Disponibilidade</label>
        <select
          value={filters.availability}
          onChange={(e) => updateFilter("availability", e.target.value)}
        >
          <option value="TODOS">Todos</option>
          <option value="DISPONIVEL">Disponíveis</option>
          <option value="INDISPONIVEL">Indisponíveis</option>
        </select>
      </div>

      <div className={styles.fieldGroup}>
        <label>Preço mínimo</label>
        <input
          type="number"
          step="0.01"
          value={filters.minPrice}
          onChange={(e) => updateFilter("minPrice", e.target.value)}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label>Preço máximo</label>
        <input
          type="number"
          step="0.01"
          value={filters.maxPrice}
          onChange={(e) => updateFilter("maxPrice", e.target.value)}
        />
      </div>
    </div>
  );
}
