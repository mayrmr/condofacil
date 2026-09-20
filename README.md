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

O backend e o frontend estão implementados e testados localmente (com dados/serviços simulados onde é preciso). **Falta só o que exige as suas próprias contas externas**: provisionar o projeto Supabase real e fazer o deploy.

### O que já funciona

- **Backend (NestJS)**: módulos `auth`, `ocorrencias`, `avisos`, `usuarios`, `predios`, `notificacoes`, com DTOs validados (`class-validator`) e guards de autenticação/autorização (`SupabaseAuthGuard` + `RolesGuard`).
- **Máquina de estados da ocorrência**: tabela de transições por perfil (`backend/src/ocorrencias/state-machine/`), validada antes de qualquer troca de status, com histórico automático.
- **Auth completo**: auto-cadastro de usuário, login (proxy para Supabase Auth), convite de funcionário/gestor por token com expiração, aceite de convite, e cadastro inicial de empresa+prédio+primeiro gestor.
- **Upload de imagens**: fluxo de signed URL (solicitar upload → cliente envia direto ao Storage → confirmação), com validação de tipo/tamanho no backend.
- **RLS**: policies prontas em [`backend/prisma/sql/rls.sql`](backend/prisma/sql/rls.sql) — isolam ocorrências/avisos/usuários/comentários/imagens por `predio_id`, e são o que protege o canal Realtime (o frontend assina mudanças direto no Postgres via Supabase, sem passar pelo backend).
- **Testes**: 18 testes unitários da máquina de estados, 14 testes e2e do fluxo completo abertura → análise → atendimento → resolução → avaliação (com os três perfis, via fakes em memória), 1 teste de integração real de RLS (roda só com `TEST_DATABASE_URL` configurada).
- **Frontend (Next.js)**: login, criar conta, feed principal (ocorrências + avisos), minhas ocorrências, nova ocorrência, detalhe da ocorrência (mudar status, prioridade, responsável, comentar, anexar imagem, avaliar), avisos (criar/comentar/encerrar), área do usuário, dashboard de funcionário (4 modos) e gestor (6 modos).

### O que falta (depende das suas contas)

1. **Criar o projeto Supabase** (Postgres + Auth + Storage) e preencher `backend/.env` / `frontend/.env.local` com as credenciais reais (veja os `.env.example` de cada pasta).
2. Rodar a primeira migration (`npx prisma migrate dev` dentro de `backend/`) e aplicar `backend/prisma/sql/rls.sql` no SQL editor do Supabase.
3. Criar o bucket **`ocorrencias`** (privado) no Supabase Storage.
4. Deploy: backend no Render/Railway, frontend na Vercel, variáveis de ambiente de produção configuradas.

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
npm run test:e2e  # e2e (fluxo completo) + integração de RLS (pulada sem TEST_DATABASE_URL)
```

## Roteiro de desenvolvimento

1. ✅ Modelar o banco de dados (schema Prisma) e estrutura de pastas
2. 🚧 Configurar autenticação e perfis (Supabase Auth + RLS) — código pronto, falta provisionar o projeto Supabase real
3. ✅ Estruturar módulos do NestJS com DTOs tipados
4. ✅ Implementar a máquina de estados da ocorrência
5. ✅ Endpoints principais + testes
6. ✅ Frontend consumindo a API
7. ✅ Empacotar com Docker (backend)
8. ⬜ Deploy e documentação final (Supabase/Render/Vercel — precisa das suas contas)
