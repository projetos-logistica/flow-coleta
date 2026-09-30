CREATE OR REPLACE FUNCTION public.importar_pedidos_bulk(p_pedidos jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  INSERT INTO public.pedidos AS p (
    numero_pedido, data_pedido, nome_loja, transportadora, origem,
    marca, uf_destino, escala_coleta, status_coleta, status_contato,
    situacao, situacao_updated_at, coletado_at, importado_at, updated_at
  )
  SELECT
    x.numero_pedido,
    COALESCE(x.data_pedido, ''),
    COALESCE(x.nome_loja, ''),
    COALESCE(x.transportadora, ''),
    COALESCE(x.origem, ''),
    COALESCE(x.marca, ''),
    COALESCE(x.uf_destino, ''),
    COALESCE(x.escala_coleta, ''),
    COALESCE(x.status_coleta, 'Pendente'),
    COALESCE(x.status_contato, ''),
    COALESCE(x.situacao, 'AGUARDANDO'),
    x.situacao_updated_at,
    x.coletado_at,
    COALESCE(x.importado_at, now()),
    COALESCE(x.updated_at, now())
  FROM jsonb_to_recordset(p_pedidos) AS x(
    numero_pedido text, data_pedido text, nome_loja text, transportadora text,
    origem text, marca text, uf_destino text, escala_coleta text,
    status_coleta text, status_contato text, situacao text,
    situacao_updated_at timestamptz, coletado_at timestamptz,
    importado_at timestamptz, updated_at timestamptz
  )
  WHERE x.numero_pedido IS NOT NULL AND x.numero_pedido <> ''
  ON CONFLICT (numero_pedido) DO UPDATE SET
    data_pedido = EXCLUDED.data_pedido,
    nome_loja = EXCLUDED.nome_loja,
    transportadora = EXCLUDED.transportadora,
    origem = EXCLUDED.origem,
    marca = EXCLUDED.marca,
    uf_destino = EXCLUDED.uf_destino,
    escala_coleta = EXCLUDED.escala_coleta,
    status_coleta = EXCLUDED.status_coleta,
    coletado_at = EXCLUDED.coletado_at,
    importado_at = EXCLUDED.importado_at,
    updated_at = EXCLUDED.updated_at;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.importar_pedidos_bulk(jsonb) TO anon, authenticated, service_role;

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
  SET status_coleta = 'Coletado', coletado_at = p_coletado_at
  WHERE numero_pedido = ANY(p_numeros);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.marcar_coletados_bulk(text[], timestamptz) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.registrar_historico_bulk(p_eventos jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  INSERT INTO public.historico_alteracoes (numero_pedido, usuario, campo, valor_anterior, valor_novo)
  SELECT x.numero_pedido, COALESCE(x.usuario, 'Anônimo'), x.campo,
         COALESCE(x.valor_anterior, ''), COALESCE(x.valor_novo, '')
  FROM jsonb_to_recordset(p_eventos) AS x(
    numero_pedido text, usuario text, campo text, valor_anterior text, valor_novo text
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.registrar_historico_bulk(jsonb) TO anon, authenticated, service_role;