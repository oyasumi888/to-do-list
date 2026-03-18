CREATE TABLE IF NOT EXISTS tarea_categoria (
  tarea_id    UUID NOT NULL REFERENCES tareas(id) ON DELETE CASCADE,
  categoria_id UUID NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
  PRIMARY KEY (tarea_id, categoria_id)
);