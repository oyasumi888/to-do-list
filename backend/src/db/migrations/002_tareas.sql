CREATE TABLE IF NOT EXISTS tareas (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id   UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo       VARCHAR(200) NOT NULL,
  descripcion  TEXT,
  fecha_limite DATE,
  estado       VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                CHECK (estado IN ('pendiente', 'en_progreso', 'completada')),
  creado_en    TIMESTAMP DEFAULT NOW()
);