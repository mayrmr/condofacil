import { randomUUID } from 'node:crypto';

// Fake em memoria do subconjunto do Prisma Client usado pelos services de
// Ocorrencias/Avisos, para testes de fluxo completo sem depender de um
// Postgres real (RLS/migrations exigem um projeto Supabase provisionado —
// ver docs/arquitetura-plataforma-chamados.md). Cobre so os metodos
// realmente chamados pelos services testados.
export class FakePrismaService {
  ocorrencias: any[] = [];
  historicos: any[] = [];
  comentarios: any[] = [];
  imagens: any[] = [];
  funcionarios: any[] = [];
  funcionarioPredios: any[] = [];
  usuarios: any[] = [];
  gestores: any[] = [];

  ocorrencia = {
    create: async ({ data }: { data: any }) => {
      const registro = { id: randomUUID(), statusAtual: 'ABERTURA', criadoEm: new Date(), ...data };
      this.ocorrencias.push(registro);
      return registro;
    },
    findUnique: async ({ where, include }: { where: { id: string }; include?: any }) => {
      const registro = this.ocorrencias.find((o) => o.id === where.id);
      if (!registro) return null;
      if (!include) return { ...registro };
      return {
        ...registro,
        ...(include.comentarios
          ? { comentarios: this.comentarios.filter((c) => c.ocorrenciaId === registro.id) }
          : {}),
        ...(include.imagens ? { imagens: this.imagens.filter((i) => i.ocorrenciaId === registro.id) } : {}),
      };
    },
    findMany: async ({ where }: { where: any }) => this.ocorrencias.filter((o) => matches(o, where)),
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const registro = this.ocorrencias.find((o) => o.id === where.id);
      Object.assign(registro, data);
      return { ...registro };
    },
    delete: async ({ where }: { where: { id: string } }) => {
      this.ocorrencias = this.ocorrencias.filter((o) => o.id !== where.id);
      this.comentarios = this.comentarios.filter((c) => c.ocorrenciaId !== where.id);
      this.imagens = this.imagens.filter((i) => i.ocorrenciaId !== where.id);
      this.historicos = this.historicos.filter((h) => h.ocorrenciaId !== where.id);
    },
  };

  historicoStatus = {
    create: async ({ data }: { data: any }) => {
      const registro = { id: randomUUID(), criadoEm: new Date(), ...data };
      this.historicos.push(registro);
      return registro;
    },
    findMany: async ({ where }: { where: any }) =>
      this.historicos
        .filter((h) => matches(h, where))
        .sort((a, b) => a.criadoEm.getTime() - b.criadoEm.getTime()),
  };

  comentario = {
    create: async ({ data }: { data: any }) => {
      const registro = { id: randomUUID(), criadoEm: new Date(), ...data };
      this.comentarios.push(registro);
      return registro;
    },
  };

  imagem = {
    create: async ({ data }: { data: any }) => {
      const registro = { id: randomUUID(), ...data };
      this.imagens.push(registro);
      return registro;
    },
  };

  funcionario = {
    findUnique: async ({ where }: { where: { id: string } }) => {
      const registro = this.funcionarios.find((f) => f.id === where.id);
      if (!registro) return null;
      return { ...registro, predios: this.funcionarioPredios.filter((p) => p.funcionarioId === registro.id) };
    },
    findMany: async ({ where }: { where: any }) => this.funcionarios.filter((f) => matches(f, where)),
  };

  usuario = {
    findMany: async ({ where }: { where: any }) => this.usuarios.filter((u) => matches(u, where)),
  };

  gestor = {
    findMany: async ({ where }: { where: any }) => this.gestores.filter((g) => matches(g, where)),
  };

  async $transaction(arg: unknown[] | ((tx: this) => Promise<unknown>)) {
    if (Array.isArray(arg)) {
      return Promise.all(arg);
    }
    return arg(this);
  }
}

function matches(registro: Record<string, unknown>, where: Record<string, any>): boolean {
  return Object.entries(where).every(([campo, condicao]) => {
    if (condicao && typeof condicao === 'object' && 'in' in condicao) {
      return (condicao.in as unknown[]).includes(registro[campo]);
    }
    return registro[campo] === condicao;
  });
}
