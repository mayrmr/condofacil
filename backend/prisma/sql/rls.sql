-- Row Level Security (RLS) por predio_id — segunda camada de defesa (secao 11)
-- e a UNICA camada de protecao para o Supabase Realtime: o frontend assina
-- mudancas nas tabelas `ocorrencias`/`comentarios`/`avisos` diretamente via
-- supabase-js (com o JWT do usuario), sem passar pelo backend NestJS. Sem
-- RLS aqui, qualquer usuario autenticado receberia eventos de outros
-- predios pelo canal Realtime.
--
-- Como aplicar: depois que `prisma migrate deploy` (ou `db push`) tiver
-- criado as tabelas no projeto Supabase real, rode este arquivo uma vez no
-- SQL editor do Supabase (ou via `psql "$DATABASE_URL" -f prisma/sql/rls.sql`).
-- Nao e gerenciado pelo Prisma Migrate porque RLS/policies nao fazem parte
-- do schema.prisma (Prisma nao tem suporte nativo a `CREATE POLICY`).
--
-- Importante: a conexao que o backend NestJS usa (DATABASE_URL) deve ser um
-- role SEM `BYPASSRLS` para essas policies tambem valerem para as queries do
-- Prisma — caso contrario RLS protege so o acesso direto (Realtime/PostgREST),
-- e o isolamento das chamadas do backend continua a cargo exclusivo da
-- camada de aplicacao (ver `buscarEntidadeOuFalhar` em cada service).

-- Resolve o(s) predio_id(s) do usuario autenticado (auth.uid()) em qualquer
-- um dos tres perfis. SECURITY DEFINER evita recursao de RLS ao consultar
-- usuarios/funcionarios_predios/gestores_predios de dentro de uma policy.
-- predio_id e auth_user_id sao `text` no schema (Prisma String, sem
-- @db.Uuid) enquanto auth.uid() retorna `uuid` nativo — por isso o cast
-- explicito para text nas comparacoes abaixo.
create or replace function public.predios_do_usuario_autenticado()
returns setof text
language sql
security definer
stable
as $$
  select predio_id from public.usuarios where auth_user_id = auth.uid()::text
  union
  select fp.predio_id
    from public.funcionarios_predios fp
    join public.funcionarios f on f.id = fp.funcionario_id
   where f.auth_user_id = auth.uid()::text
  union
  select gp.predio_id
    from public.gestores_predios gp
    join public.gestores g on g.id = gp.gestor_id
   where g.auth_user_id = auth.uid()::text;
$$;

alter table public.ocorrencias enable row level security;
alter table public.avisos enable row level security;
alter table public.usuarios enable row level security;
alter table public.comentarios enable row level security;
alter table public.imagens enable row level security;
alter table public.historico_status enable row level security;
alter table public.faturas enable row level security;
alter table public.areas_sociais enable row level security;
alter table public.reservas enable row level security;
alter table public.visitantes enable row level security;
alter table public.encomendas enable row level security;

-- RLS so restringe QUAIS linhas aparecem — sem GRANT na tabela em si, o
-- Postgres nega o acesso inteiro ("permission denied for table ...") antes
-- mesmo de avaliar as policies. Tabelas criadas via Prisma Migrate (fora do
-- editor do Supabase) nao ganham esses grants automaticamente.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.ocorrencias to authenticated;
grant select, insert, update, delete on public.avisos to authenticated;
grant select on public.usuarios to authenticated;
grant select, insert, update, delete on public.comentarios to authenticated;
grant select, insert on public.imagens to authenticated;
grant select on public.historico_status to authenticated;
grant select, update on public.faturas to authenticated;
grant select, insert, update on public.areas_sociais to authenticated;
grant select, insert, update on public.reservas to authenticated;
grant select, insert, delete on public.visitantes to authenticated;
grant select, update on public.encomendas to authenticated;

-- drop + create em vez de "create or replace" (policies nao suportam
-- replace) para o script poder ser reaplicado com seguranca.
drop policy if exists ocorrencias_isolamento_predio on public.ocorrencias;
drop policy if exists avisos_isolamento_predio on public.avisos;
drop policy if exists usuarios_isolamento_predio on public.usuarios;
drop policy if exists comentarios_isolamento_predio on public.comentarios;
drop policy if exists imagens_isolamento_predio on public.imagens;
drop policy if exists historico_status_isolamento_predio on public.historico_status;
drop policy if exists faturas_isolamento_predio on public.faturas;
drop policy if exists areas_sociais_isolamento_predio on public.areas_sociais;
drop policy if exists reservas_isolamento_predio on public.reservas;
drop policy if exists visitantes_isolamento_predio on public.visitantes;
drop policy if exists encomendas_isolamento_predio on public.encomendas;

-- OCORRENCIAS: visivel/gravavel so por quem pertence ao mesmo predio.
create policy ocorrencias_isolamento_predio on public.ocorrencias
  for all
  using (predio_id in (select predios_do_usuario_autenticado()))
  with check (predio_id in (select predios_do_usuario_autenticado()));

-- AVISOS: mesma regra.
create policy avisos_isolamento_predio on public.avisos
  for all
  using (predio_id in (select predios_do_usuario_autenticado()))
  with check (predio_id in (select predios_do_usuario_autenticado()));

-- USUARIOS: um usuario so aparece para quem esta no mesmo predio (gestor/
-- funcionario daquele predio, ou ele mesmo).
create policy usuarios_isolamento_predio on public.usuarios
  for select
  using (predio_id in (select predios_do_usuario_autenticado()));

-- COMENTARIOS e IMAGENS nao tem predio_id proprio — o isolamento segue o
-- predio da ocorrencia/aviso pai.
create policy comentarios_isolamento_predio on public.comentarios
  for all
  using (
    exists (select 1 from public.ocorrencias o where o.id = ocorrencia_id and o.predio_id in (select predios_do_usuario_autenticado()))
    or exists (select 1 from public.avisos a where a.id = aviso_id and a.predio_id in (select predios_do_usuario_autenticado()))
  )
  with check (
    exists (select 1 from public.ocorrencias o where o.id = ocorrencia_id and o.predio_id in (select predios_do_usuario_autenticado()))
    or exists (select 1 from public.avisos a where a.id = aviso_id and a.predio_id in (select predios_do_usuario_autenticado()))
  );

create policy imagens_isolamento_predio on public.imagens
  for all
  using (exists (select 1 from public.ocorrencias o where o.id = ocorrencia_id and o.predio_id in (select predios_do_usuario_autenticado())))
  with check (exists (select 1 from public.ocorrencias o where o.id = ocorrencia_id and o.predio_id in (select predios_do_usuario_autenticado())));

create policy historico_status_isolamento_predio on public.historico_status
  for select
  using (exists (select 1 from public.ocorrencias o where o.id = ocorrencia_id and o.predio_id in (select predios_do_usuario_autenticado())));

-- Modulos adicionais (Financeiro, Reservas, Visitantes, Encomendas).
create policy faturas_isolamento_predio on public.faturas
  for all
  using (predio_id in (select predios_do_usuario_autenticado()))
  with check (predio_id in (select predios_do_usuario_autenticado()));

-- AREAS_SOCIAIS: usada tanto para localizacao de ocorrencias/avisos quanto
-- como lista de areas reservaveis (ver Reserva.area).
create policy areas_sociais_isolamento_predio on public.areas_sociais
  for all
  using (predio_id in (select predios_do_usuario_autenticado()))
  with check (predio_id in (select predios_do_usuario_autenticado()));

create policy reservas_isolamento_predio on public.reservas
  for all
  using (predio_id in (select predios_do_usuario_autenticado()))
  with check (predio_id in (select predios_do_usuario_autenticado()));

create policy visitantes_isolamento_predio on public.visitantes
  for all
  using (predio_id in (select predios_do_usuario_autenticado()))
  with check (predio_id in (select predios_do_usuario_autenticado()));

create policy encomendas_isolamento_predio on public.encomendas
  for all
  using (predio_id in (select predios_do_usuario_autenticado()))
  with check (predio_id in (select predios_do_usuario_autenticado()));
