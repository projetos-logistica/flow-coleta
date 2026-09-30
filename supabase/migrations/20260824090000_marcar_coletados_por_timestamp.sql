-- Migration: marcar_coletados_por_timestamp
-- Estratégia por timestamp: elimina o problema de URI Too Long / Failed to Fetch
-- ao marcar pendentes como coletados. Em vez de passar um array de milhares de IDs,
-- atualiza todos os pedidos Pendente cujo importado_at seja anterior à carga atual.

CREATE OR REPLACE FUNCTION public.marcar_coletados_por_timestamp(
  p_antes_de  timestamptz,
  p_coletado_at timestamptz
)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.pedidos
  SET
    status_coleta = 'Coletado',
    coletado_at   = p_coletado_at,
    data_coleta   = p_coletado_at,
    updated_at    = p_coletado_at
  WHERE
    status_coleta = 'Pendente'
    AND importado_at < p_antes_de;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.marcar_coletados_por_timestamp(timestamptz, timestamptz)
  TO anon, authenticated, service_role;
