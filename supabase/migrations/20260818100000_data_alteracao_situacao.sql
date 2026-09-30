-- Migration: Campo data_alteracao_situacao e regra de auditoria
-- Description: Adiciona a coluna data_alteracao_situacao na tabela 'pedidos' para controle de SLA de 48h no status AG. MOVIMENTAÇÃO.

ALTER TABLE public.pedidos 
  ADD COLUMN IF NOT EXISTS data_alteracao_situacao timestamptz;

-- Popula registros existentes que já possuam situacao_updated_at
UPDATE public.pedidos 
SET data_alteracao_situacao = situacao_updated_at 
WHERE data_alteracao_situacao IS NULL AND situacao_updated_at IS NOT NULL;
