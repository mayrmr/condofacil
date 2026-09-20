# Plataforma de Chamados

MVP de uma plataforma digital para registro, acompanhamento e resolução de ocorrências em condomínios (iluminação, equipamentos quebrados, vazamentos, acessibilidade, segurança, manutenção, entre outras), substituindo o fluxo informal de mensagens/e-mails por um processo estruturado, com histórico completo e rastreável.

## Stack

- **Linguagem**: TypeScript em todo o projeto
- **Backend**: Node.js + NestJS (`backend/`)
- **Frontend**: Next.js (`frontend/`)
- **Banco de dados**: Supabase PostgreSQL
- **ORM**: Prisma (v7, com driver adapter `@prisma/adapter-pg`)
- **Storage de imagens**: Supabase Storage (URLs assinadas, nunca públicas)
- **Autenticação**: Supabase Auth + tabela própria de perfis (`role` + `predio_id`), com Row Level Security (RLS) no Postgres como segunda camada de defesa
- **Empacotamento**: Docker + docker-compose
- **Deploy**: backend no Render/Railway; frontend na Vercel
- **Arquitetura**: monólito modular — módulos internos: Auth, Ocorrencias, Avisos, Usuarios, Predios, Notificacoes
- **Realtime**: Supabase Realtime, para notificações de acompanhamento de ocorrência

## Perfis de usuário

- **Usuário**: cria e acompanha ocorrências (auto-cadastro)
- **Funcionário**: executa o atendimento (cadastro por convite)
- **Gestor**: analisa e administra, CRUD completo (cadastro por convite ou no cadastro inicial da empresa)

Veja a documentação completa do domínio, modelo de dados, máquina de estados e endpoints em [`docs/arquitetura-plataforma-chamados.md`](docs/arquitetura-plataforma-chamados.md).

## Estrutura do repositório

```
plataforma-chamados/
├── backend/     # API NestJS + Prisma
├── frontend/    # App Next.js
├── docs/        # Documentação de arquitetura e domínio
└── docker-compose.yml
```

## Status atual

🚀 **Em produção**, ponta a ponta (Vercel → Railway → Supabase), validado com um cadastro real de teste:

- **Frontend**: https://frontend-five-opal-12.vercel.app
- **Backend**: https://plataforma-chamados-backend-production.up.railway.app

Todo o roteiro de desenvolvimento (seção abaixo) está concluído.

### O que já funciona

- **Backend (NestJS)**: módulos `auth`, `ocorrencias`, `avisos`, `usuarios`, `predios`, `notificacoes`, com DTOs validados (`class-validator`) e guards de autenticação/autorização (`SupabaseAuthGuard` + `RolesGuard`).
- **Máquina de estados da ocorrência**: tabela de transições por perfil (`backend/src/ocorrencias/state-machine/`), validada antes de qualquer troca de status, com histórico automático.
- **Auth completo**: auto-cadastro de usuário, login (proxy para Supabase Auth), convite de funcionário/gestor por token com expiração, aceite de convite, e cadastro inicial de empresa+prédio+primeiro gestor. Validado de ponta a ponta contra o Supabase real (cadastro → login → JWT → perfil).
- **Upload de imagens**: fluxo de signed URL (solicitar upload → cliente envia direto ao Storage → confirmação), com validação de tipo/tamanho no backend. Bucket `ocorrencias` (privado) já criado no Storage.
- **RLS**: policies aplicadas e testadas em [`backend/prisma/sql/rls.sql`](backend/prisma/sql/rls.sql) — isolam ocorrências/avisos/usuários/comentários/imagens por `predio_id`, e são o que protege o canal Realtime (o frontend assina mudanças direto no Postgres via Supabase, sem passar pelo backend). Inclui os `GRANT`s necessários para o role `authenticated` (tabelas criadas via Prisma Migrate não ganham isso automaticamente, ao contrário das criadas pelo editor do Supabase).
- **Testes**: 18 unitários da máquina de estados, 16 e2e do fluxo completo abertura → análise → atendimento → resolução → avaliação (três perfis, via fakes em memória), 1 integração real de RLS — **executado contra o projeto Supabase real**, não só simulado.
- **Frontend (Next.js)**: login, criar conta, feed principal (ocorrências + avisos), minhas ocorrências, nova ocorrência, detalhe da ocorrência (mudar status, prioridade, responsável, comentar, anexar imagem, avaliar), avisos (criar/comentar/encerrar), área do usuário, dashboard de funcionário (4 modos) e gestor (6 modos).

### Deploy

- **Backend**: Railway, a partir do `Dockerfile` em `backend/` (build automático via Nixpacks/Docker detection). Variáveis de ambiente configuradas: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NODE_ENV=production`.
- **Frontend**: Vercel, direto do diretório `frontend/`. Variáveis: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL` (apontando para a URL do backend no Railway).
- Redeploy do backend: `cd backend && railway up --service <service-id>`. Redeploy do frontend: `cd frontend && npx vercel deploy --prod`.

## Rodando localmente

### Backend

```bash
cd backend
cp .env.example .env   # preencher DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
npm install
npx prisma migrate dev   # cria as tabelas no Supabase (depois de configurar o .env)
npm run start:dev        # API em http://localhost:3001
```

Depois da primeira migration, aplique as policies de RLS uma vez:

```bash
psql "$DATABASE_URL" -f prisma/sql/rls.sql
```

### Frontend

```bash
cd frontend
cp .env.example .env.local   # preencher NEXT_PUBLIC_SUPABASE_URL/ANON_KEY e NEXT_PUBLIC_API_URL
npm install
npm run dev   # http://localhost:3000
```

### Testes (backend)

```bash
cd backend
npm test          # unitários (máquina de estados)
npm run test:e2e  # e2e (fluxo completo); some junto a integração real de RLS se TEST_DATABASE_URL estiver definida
```

Para rodar a integração real de RLS contra o Supabase provisionado (recomendado depois de qualquer mudança em `rls.sql`):

```bash
TEST_DATABASE_URL="$DATABASE_URL" npm run test:e2e
```

## Roteiro de desenvolvimento

1. ✅ Modelar o banco de dados (schema Prisma) e estrutura de pastas
2. ✅ Configurar autenticação e perfis (Supabase Auth + RLS) — projeto Supabase real provisionado, migration e RLS aplicadas
3. ✅ Estruturar módulos do NestJS com DTOs tipados
4. ✅ Implementar a máquina de estados da ocorrência
5. ✅ Endpoints principais + testes
6. ✅ Frontend consumindo a API
7. ✅ Empacotar com Docker (backend)
8. ✅ Deploy e documentação final (backend no Railway, frontend na Vercel)
