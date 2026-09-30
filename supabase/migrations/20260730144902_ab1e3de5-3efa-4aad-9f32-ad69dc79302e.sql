CREATE TABLE public.pedidos (
  numero_pedido TEXT PRIMARY KEY,
  data_pedido TEXT NOT NULL DEFAULT '',
  nome_loja TEXT NOT NULL DEFAULT '',
  transportadora TEXT NOT NULL DEFAULT '',
  origem TEXT NOT NULL DEFAULT '',
  status_coleta TEXT NOT NULL DEFAULT 'Pendente',
  status_contato TEXT NOT NULL DEFAULT '',
  situacao TEXT NOT NULL DEFAULT 'Aguardando',
  coletado_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedidos TO anon, authenticated;
GRANT ALL ON public.pedidos TO service_role;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Painel compartilhado: leitura publica de pedidos" ON public.pedidos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Painel compartilhado: insercao publica de pedidos" ON public.pedidos FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Painel compartilhado: atualizacao publica de pedidos" ON public.pedidos FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Painel compartilhado: exclusao publica de pedidos" ON public.pedidos FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE public.historico_alteracoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_pedido TEXT NOT NULL,
  usuario TEXT NOT NULL DEFAULT '',
  campo TEXT NOT NULL,
  valor_anterior TEXT NOT NULL DEFAULT '',
  valor_novo TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.historico_alteracoes TO anon, authenticated;
GRANT ALL ON public.historico_alteracoes TO service_role;
ALTER TABLE public.historico_alteracoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Painel compartilhado: leitura publica do historico" ON public.historico_alteracoes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Painel compartilhado: insercao publica no historico" ON public.historico_alteracoes FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE INDEX idx_historico_created_at ON public.historico_alteracoes (created_at DESC);
CREATE INDEX idx_pedidos_status_coleta ON public.pedidos (status_coleta);

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER pedidos_set_updated_at BEFORE UPDATE ON public.pedidos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos;