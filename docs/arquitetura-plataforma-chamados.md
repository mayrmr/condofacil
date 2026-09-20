# Arquitetura — Plataforma de Chamados

## Contexto

Plataforma digital para registro, acompanhamento e resolução de ocorrências em condomínios (problemas de iluminação, equipamentos quebrados, vazamentos, falta de acessibilidade, segurança, manutenção, entre outras), substituindo o fluxo informal de mensagens/e-mails por um processo estruturado, com histórico completo e rastreável.

## Stack

- **Linguagem**: TypeScript em todo o projeto
- **Backend**: Node.js + NestJS
- **Frontend**: Next.js
- **Banco de dados**: Supabase PostgreSQL
- **ORM**: Prisma
- **Storage de imagens**: Supabase Storage
- **Autenticação**: Supabase Auth + tabela própria de perfis (`role` + `predio_id`), com Row Level Security (RLS) no Postgres como segunda camada de defesa
- **Empacotamento**: Docker + docker-compose
- **Deploy**: backend no Render ou Railway; frontend na Vercel
- **Estilo arquitetural**: monólito modular (não microserviços) — módulos internos: Auth, Ocorrencias, Avisos, Usuarios, Predios, Notificacoes
- **Realtime**: Supabase Realtime, para notificações de acompanhamento de ocorrência

## Perfis de usuário

O sistema tem três perfis: **Usuário** (cria e acompanha ocorrências, auto-cadastro), **Funcionário** (executa o atendimento, cadastro por convite) e **Gestor** (analisa e administra, cadastro por convite ou no cadastro inicial da empresa; pode gerir mais de um prédio).

### Matriz de permissões

| Ação | Usuário | Funcionário | Gestor |
|---|:---:|:---:|:---:|
| Criar/acompanhar ocorrência | ✅ | ✅ | ✅ |
| Adicionar imagem/comentário | ✅ | ✅ | ✅ |
| Editar status/prioridade | ❌ | ✅ | ✅ |
| Excluir/concluir ocorrência | ❌ | ❌ | ✅ |
| Atribuir responsável/área | ❌ | ❌ | ✅ |
| CRUD de usuários/funcionários/gestores | ❌ | ❌ | ✅ |
| Criar aviso | ❌ | ❌ | ✅ |
| Comentar aviso | ✅ | ✅ | ✅ |
| Auto-cadastro | ✅ | ❌ (convite) | ❌ (convite) |

## Entidades (empresa/prédio)

- **Empresa**: cadastra o prédio; usuários, funcionários e gestores se vinculam a ela.
- **Prédio**: pertence a uma empresa. Contém blocos, apartamentos e áreas sociais.
- **Bloco**: pertence a um prédio.
- **Apartamento**: pertence a um bloco.
- **Área social**: pertence a um prédio (ex: salão de festas, playground, garagem).

Cada usuário só visualiza ocorrências, avisos e filtros do prédio onde reside. Funcionário/Gestor podem estar vinculados a mais de um prédio.

## Ciclo de vida da ocorrência (máquina de estados)

```
Abertura
   │
   ├──► Excluir (usuário, apenas antes de análise)
   │
   ▼
Análise (gestor)
   │
   ├──► Cancelamento (gestor) ──► Avaliação
   │
   ▼
Atendimento (funcionário)
   │
   ├──► Cancelamento (gestor) ──► Avaliação
   │
   ├──► Aguarda material
   │        │
   │        ├──► Cancelamento (gestor) ──► Avaliação
   │        │
   │        ▼
   │     Resolvida ──► Avaliação
   │
   ▼
Resolvida ──► Avaliação
```

As transições permitidas devem ser implementadas como tabela/configuração (`status_origem`, `status_destino`, `roles_permitidas`), validada no backend antes de qualquer update de status — nunca como `if/else` espalhado pelo código. Toda mudança de status (mesmo sistêmica) gera uma entrada em `historico_status` com status anterior, novo status, data/horário, usuário responsável e observação opcional.

## Modelo de dados

Ver [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma) — fonte de verdade do modelo de dados.

```
erDiagram
  EMPRESA ||--o{ PREDIO : possui
  PREDIO ||--o{ BLOCO : contem
  PREDIO ||--o{ AREA_SOCIAL : contem
  BLOCO ||--o{ APARTAMENTO : contem
  PREDIO ||--o{ USUARIO : vincula
  PREDIO ||--o{ FUNCIONARIO : vincula
  PREDIO ||--o{ GESTOR : vincula
  USUARIO ||--o{ OCORRENCIA : cria
  APARTAMENTO ||--o{ OCORRENCIA : localizacao
  AREA_SOCIAL ||--o{ OCORRENCIA : localizacao
  FUNCIONARIO ||--o{ OCORRENCIA : atende
  GESTOR ||--o{ OCORRENCIA : analisa
  OCORRENCIA ||--o{ HISTORICO_STATUS : registra
  OCORRENCIA ||--o{ COMENTARIO : recebe
  OCORRENCIA ||--o{ IMAGEM : anexa
  GESTOR ||--o{ AVISO : cria
  AVISO ||--o{ COMENTARIO : recebe
```

Notas de implementação:
- `Funcionario` e `Gestor` podem estar vinculados a múltiplos prédios → tabelas associativas `funcionarios_predios` e `gestores_predios`.
- `localizacaoTipo` + `localizacaoId` em `Ocorrencia`/`Aviso` é relacionamento polimórfico (aponta para `Bloco`, `Apartamento` ou `AreaSocial`); Prisma não suporta isso nativamente, então a integridade referencial desse par é responsabilidade da camada de aplicação.
- `historico_status` é a fonte de verdade da timeline — nunca sobrescrever status sem gravar uma linha aqui.

## Endpoints da API (implementados em `backend/src/`)

```
POST   /auth/cadastro-empresa           (público — bootstrap: empresa + 1º prédio + gestor)
POST   /auth/registro                   (público — usuário, auto-cadastro)
POST   /auth/login                      (público — proxy para Supabase Auth)
POST   /auth/convite                    (gestor — convida funcionário/gestor)
POST   /auth/convite/:token/aceitar     (público — aceita convite, cria a conta)

GET    /predios/:id
POST   /predios                         (gestor — novo prédio de uma empresa que já administra)
GET    /predios/:id/blocos
GET    /predios/:id/areas-sociais

GET    /ocorrencias?categoria=&data=&localizacaoId=&prioridade=&status=&minhas=
POST   /ocorrencias                     (usuário)
GET    /ocorrencias/:id
GET    /ocorrencias/:id/historico
PATCH  /ocorrencias/:id/status
PATCH  /ocorrencias/:id/avaliacao       (usuário — nota + comentário)
PATCH  /ocorrencias/:id/prioridade      (funcionário/gestor)
PATCH  /ocorrencias/:id/responsavel     (gestor)
DELETE /ocorrencias/:id                 (gestor)
POST   /ocorrencias/:id/comentarios
POST   /ocorrencias/:id/imagens/solicitar-upload   (valida tipo/tamanho, retorna signed upload URL)
POST   /ocorrencias/:id/imagens                    (confirma upload, registra o path)

GET    /avisos?categoria=&data=&localizacaoId=
POST   /avisos                          (gestor)
PATCH  /avisos/:id                      (gestor)
DELETE /avisos/:id                      (gestor)
POST   /avisos/:id/comentarios

GET    /usuarios/me
PATCH  /usuarios/me
GET    /gestor/usuarios                 (gestor)
GET    /gestor/funcionarios             (gestor)
GET    /gestor/dashboard?view=kanban|calendario|lista|prioridades|funcionarios|areas
GET    /funcionario/dashboard?view=kanban|calendario|lista|prioridades
```

Regra fixa: todas as rotas de listagem derivam o filtro de `predio_id` do usuário autenticado (`request.user`, resolvido pelo `SupabaseAuthGuard`) — nunca de parâmetro de query.

Decisões tomadas ao implementar (onde a especificação original era ambígua ou o modelo de dados do ER diagram divergia da matriz de permissões):
- Só **Usuário** cria ocorrências (`Ocorrencia.criadoPorUsuarioId` só referencia `Usuario`, conforme o ER diagram da seção anterior); Funcionário/Gestor acompanham e atuam, mas não abrem em nome próprio.
- Avaliar a resolução é uma ação dedicada (`PATCH .../avaliacao`) e não um `PATCH .../status` genérico, porque ela sempre vem acompanhada de nota + comentário.
- `POST /auth/cadastro-empresa` cobre o "cadastro inicial da empresa" do gestor (seção 3): cria `Empresa` + primeiro `Predio` + o `Gestor`, tudo antes de existir qualquer sessão autenticada.

## Segurança

- **RLS** por `predio_id` em ocorrências/avisos/usuários/comentários/imagens/histórico: policies prontas em [`backend/prisma/sql/rls.sql`](../backend/prisma/sql/rls.sql), a aplicar manualmente depois da primeira migration (Prisma não gerencia `CREATE POLICY`). É a única proteção do canal Realtime, que o frontend assina direto no Postgres via Supabase — por isso a conexão do backend (`DATABASE_URL`) precisa ser um role sem `BYPASSRLS` para RLS valer também para as queries do Prisma.
- **Autenticação**: sem JWT próprio — o backend só valida o JWT emitido pelo Supabase Auth (`supabase.auth.getUser(token)`, em `SupabaseAuthGuard`) e resolve `role`/`predio_id`(s) a partir da tabela de perfil correspondente (`Usuario`/`Funcionario`/`Gestor`).
- URLs de imagem do Storage assinadas/expiráveis (`StorageService`), nunca públicas permanentemente.
- Tipo/tamanho de upload validados no backend (`SolicitarUploadImagemDto`) antes de gerar a signed URL.
- Token de convite com expiração (7 dias) e vínculo a e-mail específico — só o hash SHA-256 fica no banco (`Convite.tokenHash`).
- Isolamento por `predio_id` também reforçado na camada de aplicação (`buscarEntidadeOuFalhar` em cada service) — defesa em profundidade além da RLS.
- Pendente (depende de infra real): rate limiting em `/auth/login` e `/auth/registro`; sanitização de comentários contra XSS fica a cargo do frontend ao renderizar (React já escapa por padrão, mas revisar se algum campo virar `dangerouslySetInnerHTML`).

## Testes

- **Unitários** (`backend/src/ocorrencias/state-machine/*.spec.ts`): todas as transições permitidas/negadas por perfil da máquina de estados — 18 casos.
- **E2E** (`backend/test/ocorrencias-fluxo-completo.e2e-spec.ts`): fluxo completo abertura → análise → atendimento → resolução → avaliação para os três perfis, incluindo negações de permissão e isolamento entre prédios — via um Prisma fake em memória (não depende de banco real).
- **Integração de RLS** (`backend/test/rls-isolamento.e2e-spec.ts`): teste real contra Postgres, habilitado só com `TEST_DATABASE_URL` definida (pulado neste ambiente, que não tem um Supabase provisionado) — roda depois de aplicar `rls.sql` num banco de teste.

## Observação sobre escopo em relação ao edital oficial

O edital do hackathon (POSTECH — Fase 5, FSDT) define, no mínimo, 2 perfis (Solicitante e Gestor) e 5 estados de ocorrência (Aberta, Em análise, Em atendimento, Resolvida, Cancelada). Este projeto **decidiu conscientemente ampliar o escopo** para 3 perfis (Usuário, Funcionário, Gestor) e estados adicionais (Aguarda material, Avaliação), adequados ao domínio de condomínios.
