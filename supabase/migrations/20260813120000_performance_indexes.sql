-- Migration: Performance Indexes for Supabase
-- Description: Adds indexes to heavily filtered and sorted columns in the 'pedidos' table to optimize queries for large datasets (10k+ rows).

CREATE INDEX IF NOT EXISTS idx_pedidos_numero ON public.pedidos USING btree (numero_pedido);
CREATE INDEX IF NOT EXISTS idx_pedidos_loja ON public.pedidos USING btree (nome_loja);
CREATE INDEX IF NOT EXISTS idx_pedidos_escala ON public.pedidos USING btree (escala_coleta);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON public.pedidos USING btree (status_coleta);
