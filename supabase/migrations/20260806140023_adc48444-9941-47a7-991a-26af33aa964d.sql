GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedidos TO anon, authenticated;
GRANT ALL ON public.pedidos TO service_role;
GRANT SELECT, INSERT ON public.historico_alteracoes TO anon, authenticated;
GRANT ALL ON public.historico_alteracoes TO service_role;