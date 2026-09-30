ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS marca text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS uf_destino text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS escala_coleta text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS importado_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS situacao_updated_at timestamp with time zone;