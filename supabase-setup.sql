-- Tabela de usuários com acesso ao painel
create table if not exists usuarios (
  id bigserial primary key,
  nome text not null,
  email text,
  telefone text,
  role text not null default 'cliente',
  cargo text,
  grupo text default 'cliente',
  senha_custom text,
  status text default 'ativo',
  created_at timestamptz default now()
);

-- Tabela de solicitações pendentes de cadastro
create table if not exists solicitacoes (
  id bigserial primary key,
  nome text not null,
  email text,
  telefone text,
  grupo text,
  role text,
  cargo text,
  area text,
  status text default 'pendente',
  invite_token text,
  created_at timestamptz default now()
);

-- Tabela de convites
create table if not exists convites (
  id bigserial primary key,
  token text unique not null,
  role text not null,
  status text default 'ativo',
  created_at timestamptz default now()
);

-- Permitir acesso público (app usa auth própria)
alter table usuarios   disable row level security;
alter table solicitacoes disable row level security;
alter table convites   disable row level security;
