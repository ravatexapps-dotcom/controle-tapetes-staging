alter table public.fornecedores
  add column if not exists email text,
  add column if not exists telefone text;

alter table public.clientes
  add column if not exists contato text,
  add column if not exists telefone text;
