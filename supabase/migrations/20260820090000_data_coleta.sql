-- Migration: Campo data_coleta e atualização do marcar_coletados_bulk
-- Description: Adiciona a coluna data_coleta e garante sincronismo no delta de importação.

ALTER TABLE public.pedidos 
  ADD COLUMN IF NOT EXISTS data_coleta timestamptz;

-- Popula registros existentes onde coletado_at já existe
UPDATE public.pedidos 
SET data_coleta = coletado_at 
WHERE data_coleta IS NULL AND coletado_at IS NOT NULL;

-- Atualiza a função marcar_coletados_bulk para preencher data_coleta e coletado_at
CREATE OR REPLACE FUNCTION public.marcar_coletados_bulk(p_numeros text[], p_coletado_at timestamptz)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.pedidos
  SET status_coleta = 'Coletado', 
      coletado_at = p_coletado_at,
      data_coleta = p_coletado_at
  WHERE numero_pedido = ANY(p_numeros);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.marcar_coletados_bulk(text[], timestamptz) TO anon, authenticated, service_role;
