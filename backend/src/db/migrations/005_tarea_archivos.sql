CREATE TABLE IF NOT EXISTS tarea_archivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarea_id UUID NOT NULL REFERENCES tareas(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  nombre_original VARCHAR(255) NOT NULL,
  creado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tarea_archivos_tarea_id ON tarea_archivos(tarea_id);
