CREATE TABLE IF NOT EXISTS categorias (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre     VARCHAR(50) NOT NULL,
  color_hex  VARCHAR(7) NOT NULL DEFAULT '#6366f1'
);