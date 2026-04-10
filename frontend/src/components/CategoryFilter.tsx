import { useEffect, useState } from 'react';
import type { Category } from '../services/api.js';
import { getCategories } from '../services/api.js';
import './CategoryFilter.css';

interface CategoryFilterProps {
  selectedCategoryIds: string[];
  onChangeSelected: (ids: string[]) => void;
  categoriesRefreshNonce: number;
}

export function CategoryFilter({
  selectedCategoryIds,
  onChangeSelected,
  categoriesRefreshNonce,
}: CategoryFilterProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await getCategories();
        if (!cancelled) {
          setCategories(list);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Error al cargar categorías');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [categoriesRefreshNonce]);

  const toggleCategory = (id: string) => {
    if (selectedCategoryIds.includes(id)) {
      onChangeSelected(selectedCategoryIds.filter((x) => x !== id));
    } else {
      onChangeSelected([...selectedCategoryIds, id]);
    }
  };

  const showAll = () => onChangeSelected([]);

  const allActive = selectedCategoryIds.length === 0;

  return (
    <section className="category-filter-section" aria-label="Filtrar por categoría">
      <h2 className="category-filter-heading">
        CATEGORÍAS <span className="category-filter-heading-accent">[#]</span>
      </h2>
      {loading && <p className="category-filter-loading">Cargando categorías…</p>}
      {error && <p className="category-filter-error">{error}</p>}
      {!loading && !error && (
        <div className="category-filter-row">
          <button
            type="button"
            className={`category-filter-chip category-filter-chip--all ${allActive ? 'category-filter-chip--active' : ''}`}
            onClick={showAll}
          >
            TODAS
          </button>
          {categories.map((c) => {
            const active = selectedCategoryIds.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                className={`category-filter-chip ${active ? 'category-filter-chip--active' : ''}`}
                style={{ ['--category-accent' as string]: c.color_hex }}
                onClick={() => toggleCategory(c.id)}
              >
                {c.nombre}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
