# Flow Coleta

Crie um site com base nessa interface e estrutura de acordo com esse html. 

# Painel de Coletas — Especificação Funcional

**AZZAS 2154**

## 1. Objetivo da ferramenta

Substituir o controle manual de pedidos pendentes de coleta (hoje feito em planilha) por um painel web compartilhado, onde múltiplos usuários veem e atualizam a mesma base em tempo real, com automações que eliminam trabalho manual repetitivo.

---

## 2. Modelo de dados

Cada pedido é um registro único, identificado pelo **Número do Pedido** (chave, nunca duplica). Colunas:

| Campo | Tipo | Origem | Editável? |

|---|---|---|---|

| Data do Pedido | texto/data | Importado da planilha | Não |

| Número do Pedido | texto (chave única) | Importado da planilha | Não |

| Nome da Loja | texto | Importado da planilha | Não |

| Transportadora | texto | Importado da planilha | Não |

| Origem | texto | Importado da planilha | Não |

| Status Coleta | `Pendente` / `Coletado` | Definido pelo sistema (ver seção 3) | Sim (manual ou em massa) |

| Status Contato | `Contato Realizado` / `Contato Falhou` / vazio | Definido pelo usuário | Sim (manual ou em massa) |

| Situação | `Aguardando` / `Finalizado` / `Erro da Loja` / `Não Entregue` | Definido pelo usuário (padrão inicial: Aguardando) | Sim (manual ou em massa) |

| Última atualização | data/hora | Automático | — |

---

## 3. Importação de planilha (upload .xlsx/.csv)

- O usuário sobe um arquivo com as 5 colunas de origem (Data, Número do Pedido, Loja, Transportadora, Origem).

- O sistema identifica automaticamente essas colunas mesmo com pequenas variações de nome/acentuação no cabeçalho.

- **Regra de importação (a lógica mais importante da ferramenta):**

  - Pedido que aparece pela **primeira vez** → entra como `Pendente`.

  - Pedido que **já existia** e aparece de novo na nova planilha → permanece/retorna a `Pendente` (nunca duplica; é o mesmo registro, identificado pelo Número do Pedido).

  - Pedido que **existia antes e não aparece mais** na nova planilha → é marcado automaticamente como `Coletado` (interpretação: se sumiu da lista de pendentes, foi coletado).

  - Os campos Status Contato e Situação **nunca são alterados** por esse processo — só o Status Coleta é automático.

- Ao final da importação, mostrar um resumo: quantos pedidos novos, quantos mantidos como pendentes, quantos marcados como coletados automaticamente.

---

## 4. Exclusão automática (higiene da base)

- Todo pedido com Status Coleta = `Coletado` tem a data/hora dessa mudança registrada internamente.

- A cada sincronização, o sistema verifica: já se passaram **2 dias úteis** (segunda a sexta, sem contar sábado/domingo) desde que o pedido virou "Coletado"?

- Se sim, o pedido é **removido automaticamente** da base ativa.

- Essa remoção gera um registro no histórico de alterações (ver seção 8) — nada se perde, apenas sai da visão operacional do dia a dia.

---

## 5. Indicadores (KPIs)

Dois blocos de cartões, sempre visíveis no topo:

- **Status de Coleta:** contagem de `Pendente` e `Coletado`.

- **Situação:** contagem de `Aguardando`, `Finalizado`, `Erro da Loja`, `Não Entregue`.

Cada cartão é clicável: ao clicar, filtra a tabela para mostrar só os pedidos daquele valor. Clicar de novo remove o filtro.

---

## 6. Ranking de lojas

- Painel lateral lista todas as lojas com pedidos pendentes, **ordenadas da maior para a menor quantidade**, com numeração (1º, 2º, 3º...).

- Clicar em uma loja filtra a tabela para mostrar só os pedidos daquela loja.

---

## 7. Tabela de pedidos

- Lista todos os pedidos com as colunas da seção 2.

- Três campos (Status Coleta, Status Contato, Situação) são editáveis diretamente na linha, via seletor — a alteração salva automaticamente, sem botão "Salvar".

- Campo de busca livre: filtra por número do pedido, nome da loja ou transportadora, em tempo real conforme o usuário digita.

- Filtro adicional por Status Contato (lista suspensa).

---

## 8. Ações em massa

- Cada linha tem uma caixa de seleção; existe também "selecionar todos os visíveis".

- Com um ou mais pedidos selecionados, aparece uma barra de ação permitindo aplicar um novo valor a **todos os selecionados de uma vez**, separadamente para:

  - Status Coleta

  - Status Contato

  - Situação

- Útil combinado com os filtros (ex.: filtrar por "Pendente", selecionar todos, aplicar novo Status Contato em lote).

---

## 9. Histórico de alterações (auditoria)

- Toda alteração de status (manual, em massa, ou automática na importação/exclusão) gera um evento de histórico com: data/hora, usuário responsável, número do pedido, campo alterado, valor anterior, novo valor.

- O histórico é a fonte de rastreabilidade — mesmo pedidos removidos da base continuam auditáveis por ali.

---

## 10. Identificação de usuário (não é login/autenticação)

- Ao acessar o painel, o usuário informa um nome/apelido para se identificar.

- Esse nome aparece nos registros do histórico, para saber quem fez cada alteração.

- **Isso não é controle de acesso** — qualquer pessoa com o link consegue usar a ferramenta e editar dados. Se for necessário restringir quem pode acessar/editar, isso exige um sistema de autenticação de verdade (login com senha, SSO corporativo, perfis de permissão), que é uma camada adicional a ser definida separadamente.

---

## 11. Exportações

- **Exportar base atual (.xlsx):** baixa todos os pedidos e seus status atuais, no mesmo formato de colunas usado na ferramenta.

- **Exportar histórico (.csv):** baixa todos os eventos de alteração já registrados.

---

## 12. Sincronização em tempo real

- Todos os usuários que acessam o mesmo link veem a mesma base.

- Mudanças feitas por um usuário aparecem para os demais em poucos segundos (atualização automática periódica), sem precisar recarregar a página manualmente.

---

## 13. Fora do escopo desta especificação

Pontos que a ferramenta **não resolve** e que devem ser tratados à parte, se necessários:

- Autenticação real de usuários (login, senha, perfis de permissão).

- Retenção de longo prazo/arquivamento formal do histórico (recomenda-se rotina de exportação periódica para um repositório oficial da empresa).

- Notificações automáticas (e-mail, WhatsApp, etc.) sobre pedidos pendentes.

- Integração direta com sistemas de transportadoras ou ERP — hoje a entrada de dados é via upload manual de planilha.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/421f4eb6-db50-4dae-af94-0d9ace293ae5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
