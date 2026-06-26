-- Tabelas de dados do painel (jsonb para flexibilidade)
create table if not exists eventos      (id bigserial primary key, data jsonb, created_at timestamptz default now());
create table if not exists processos    (id bigserial primary key, data jsonb, created_at timestamptz default now());
create table if not exists colaboradores(id bigserial primary key, data jsonb, created_at timestamptz default now());
create table if not exists consultores  (id bigserial primary key, data jsonb, created_at timestamptz default now());
create table if not exists areas        (id bigserial primary key, data jsonb, created_at timestamptz default now());

alter table eventos       disable row level security;
alter table processos     disable row level security;
alter table colaboradores disable row level security;
alter table consultores   disable row level security;

-- ─── Seed: Colaboradores ──────────────────────────────────────
insert into colaboradores (data) values
  ('{"nome":"Beatriz Santos","cargo":"Financeiro","telefone":"(61) 9 9123-4567","email":"beatriz@dfturismo.com.br"}'),
  ('{"nome":"Mariana Lima","cargo":"RH","telefone":"(61) 9 9234-5678","email":"mariana@dfturismo.com.br"}'),
  ('{"nome":"Rodrigo Torres","cargo":"Compras","telefone":"(61) 9 9345-6789","email":"rodrigo@dfturismo.com.br"}'),
  ('{"nome":"Felipe Andrade","cargo":"Marketing","telefone":"(61) 9 9456-7890","email":"felipe@dfturismo.com.br"}'),
  ('{"nome":"Sofia Rezende","cargo":"Comercial","telefone":"(61) 9 9567-8901","email":"sofia@dfturismo.com.br"}'),
  ('{"nome":"Gerência Geral","cargo":"Gerência","telefone":"(61) 9 9678-9012","email":"gerencia@dfturismo.com.br"}');

-- ─── Seed: Consultores ────────────────────────────────────────
insert into consultores (data) values
  ('{"nome":"Ana Lima","especialidade":"Processos Comerciais","telefone":"(61) 9 9001-0001","email":"ana.lima@consultoria.com"}'),
  ('{"nome":"Carlos M.","especialidade":"Processos Operacionais","telefone":"(61) 9 9001-0002","email":"carlos.m@consultoria.com"}');

-- ─── Seed: Eventos ────────────────────────────────────────────
insert into eventos (data) values
  ('{"title":"Kick-off do Sprint","who":"Pedro + Equipe","date":"2026-06-23","sh":9,"sm":0,"eh":10,"em":0,"ci":0,"canceled":false}'),
  ('{"title":"Review de Requisitos","who":"Coordenação","date":"2026-06-24","sh":14,"sm":0,"eh":15,"em":0,"ci":1,"canceled":false}'),
  ('{"title":"Alinhamento Cliente","who":"Grupo DF Turismo","date":"2026-06-25","sh":10,"sm":30,"eh":11,"em":30,"ci":2,"canceled":false}'),
  ('{"title":"Coleta — Proc. Financ.","who":"Beatriz Santos","date":"2026-06-25","sh":14,"sm":0,"eh":15,"em":30,"ci":3,"canceled":false}'),
  ('{"title":"Sync Técnico","who":"Equipe Interna","date":"2026-06-26","sh":16,"sm":0,"eh":16,"em":45,"ci":4,"canceled":false}'),
  ('{"title":"Validação COPS","who":"Coordenação","date":"2026-06-26","sh":9,"sm":0,"eh":10,"em":0,"ci":1,"canceled":false}'),
  ('{"title":"Sprint Retrospectiva","who":"All Hands","date":"2026-06-27","sh":11,"sm":0,"eh":12,"em":0,"ci":0,"canceled":false}');

-- ─── Seed: Processos ─────────────────────────────────────────
insert into processos (data) values
  ('{"num":1,"nome":"Emissão de Pacotes Turísticos","area":["Comercial"],"comQuem":["Gerência Geral"],"consultor":["Ana Lima"],"formato":"Fluxograma","coleta":true,"modelagem":true,"valCOPS":true,"corrCOPS":false,"valCliente":false,"corrCliente":false,"analise":false,"confirmed":false,"comentarios":[]}'),
  ('{"num":2,"nome":"Atendimento e Reservas","area":["Comercial"],"comQuem":["Sofia Rezende"],"consultor":["Carlos M."],"formato":"POP - Procedimento Operacional Padrão","coleta":true,"modelagem":true,"valCOPS":true,"corrCOPS":true,"valCliente":true,"corrCliente":true,"analise":false,"confirmed":false,"comentarios":[]}'),
  ('{"num":3,"nome":"Controle Financeiro","area":["Financeiro"],"comQuem":["Beatriz Santos"],"consultor":["Ana Lima"],"formato":"Fluxograma","coleta":true,"modelagem":false,"valCOPS":false,"corrCOPS":false,"valCliente":false,"corrCliente":false,"analise":false,"confirmed":false,"comentarios":[]}'),
  ('{"num":4,"nome":"Gestão de Fornecedores","area":["Compras"],"comQuem":["Rodrigo Torres"],"consultor":["Carlos M."],"formato":"POP - Procedimento Operacional Padrão","coleta":true,"modelagem":true,"valCOPS":false,"corrCOPS":false,"valCliente":false,"corrCliente":false,"analise":false,"confirmed":false,"comentarios":[]}'),
  ('{"num":5,"nome":"Recrutamento & Seleção","area":["RH"],"comQuem":["Mariana Lima"],"consultor":["Ana Lima"],"formato":"Fluxograma","coleta":false,"modelagem":false,"valCOPS":false,"corrCOPS":false,"valCliente":false,"corrCliente":false,"analise":false,"confirmed":false,"comentarios":[]}'),
  ('{"num":6,"nome":"Marketing Digital","area":["Marketing"],"comQuem":["Felipe Andrade"],"consultor":["Carlos M."],"formato":"Fluxograma","coleta":true,"modelagem":true,"valCOPS":true,"corrCOPS":true,"valCliente":false,"corrCliente":false,"analise":false,"confirmed":false,"comentarios":[]}'),
  ('{"num":7,"nome":"Controle de Vendas","area":["Comercial"],"comQuem":["Sofia Rezende"],"consultor":["Ana Lima"],"formato":"POP - Procedimento Operacional Padrão","coleta":true,"modelagem":true,"valCOPS":true,"corrCOPS":true,"valCliente":true,"corrCliente":true,"analise":true,"confirmed":true,"comentarios":[]}'),
  ('{"num":8,"nome":"Onboarding de Colaboradores","area":["RH"],"comQuem":["Mariana Lima"],"consultor":["Carlos M."],"formato":"POP - Procedimento Operacional Padrão","coleta":true,"modelagem":true,"valCOPS":false,"corrCOPS":false,"valCliente":false,"corrCliente":false,"analise":false,"confirmed":false,"comentarios":[]}'),
  ('{"num":9,"nome":"Gestão de Transportes","area":["Operações"],"comQuem":[],"consultor":["Ana Lima"],"formato":"Fluxograma","coleta":false,"modelagem":false,"valCOPS":false,"corrCOPS":false,"valCliente":false,"corrCliente":false,"analise":false,"confirmed":false,"comentarios":[]}'),
  ('{"num":10,"nome":"Relatórios Gerenciais","area":["Gerência"],"comQuem":["Gerência Geral"],"consultor":["Carlos M."],"formato":"Fluxograma","coleta":true,"modelagem":true,"valCOPS":true,"corrCOPS":false,"valCliente":false,"corrCliente":false,"analise":false,"confirmed":false,"comentarios":[]}');
