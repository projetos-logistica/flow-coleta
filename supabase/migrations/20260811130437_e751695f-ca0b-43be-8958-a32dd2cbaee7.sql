UPDATE public.pedidos SET situacao = 'ERRO SISTÊMICO' WHERE upper(situacao) = 'ERRO SISTEMICO';
UPDATE public.historico_alteracoes SET valor_anterior = 'ERRO SISTÊMICO' WHERE upper(valor_anterior) = 'ERRO SISTEMICO';
UPDATE public.historico_alteracoes SET valor_novo = 'ERRO SISTÊMICO' WHERE upper(valor_novo) = 'ERRO SISTEMICO';