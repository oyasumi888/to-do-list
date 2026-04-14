import './TaskDueDateFilter.css';

interface TaskDueDateFilterProps {
  value: string;
  onChange: (fechaYmd: string) => void;
}

export function TaskDueDateFilter({ value, onChange }: TaskDueDateFilterProps) {
  return (
    <section className="task-due-filter-section" aria-label="Filtrar por fecha límite">
      <h2 className="task-due-filter-heading">
        FECHA LÍMITE <span className="task-due-filter-heading-accent">[≡]</span>
      </h2>
      <div className="task-due-filter-row">
        <div>
          <label className="task-due-filter-label" htmlFor="task-due-filter-date">
            Mostrar solo tareas con límite el día
          </label>
          <input
            id="task-due-filter-date"
            type="date"
            className="task-due-filter-input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="task-due-filter-clear"
          onClick={() => onChange('')}
          disabled={!value}
        >
          QUITAR FILTRO
        </button>
      </div>
    </section>
  );
}
