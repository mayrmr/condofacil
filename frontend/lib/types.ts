export type Role = 'USUARIO' | 'FUNCIONARIO' | 'GESTOR';

export type StatusOcorrencia =
  | 'ABERTURA'
  | 'ANALISE'
  | 'ATENDIMENTO'
  | 'AGUARDA_MATERIAL'
  | 'RESOLVIDA'
  | 'CANCELAMENTO'
  | 'AVALIACAO'
  | 'EXCLUIDA';

export type Prioridade = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export type LocalizacaoTipo = 'BLOCO' | 'APARTAMENTO' | 'AREA_SOCIAL';

export type StatusAviso = 'ATIVO' | 'ENCERRADO';

export interface Ocorrencia {
  id: string;
  predioId: string;
  criadoPorUsuarioId: string;
  responsavelFuncionarioId: string | null;
  gestorAnaliseId: string | null;
  titulo: string;
  descricao: string;
  categoria: string;
  localizacaoTipo: LocalizacaoTipo;
  localizacaoId: string;
  prioridade: Prioridade | null;
  statusAtual: StatusOcorrencia;
  solucaoAplicada: string | null;
  observacoesGestao: string | null;
  observacoesFuncionario: string | null;
  avaliacaoNota: number | null;
  avaliacaoComentario: string | null;
  criadoEm: string;
  comentarios?: Comentario[];
  imagens?: (Imagem & { url: string })[];
}

export interface Comentario {
  id: string;
  ocorrenciaId?: string | null;
  avisoId?: string | null;
  autorId: string;
  autorTipo: Role;
  texto: string;
  criadoEm: string;
}

export interface Imagem {
  id: string;
  ocorrenciaId: string;
  storageUrl: string;
}

export interface HistoricoStatus {
  id: string;
  ocorrenciaId: string;
  statusAnterior: StatusOcorrencia | null;
  statusNovo: StatusOcorrencia;
  usuarioResponsavelId: string;
  autorTipo: Role;
  observacao: string | null;
  criadoEm: string;
}

export interface Aviso {
  id: string;
  predioId: string;
  gestorId: string;
  titulo: string;
  descricao: string;
  categoria: string;
  localizacaoTipo: LocalizacaoTipo;
  localizacaoId: string;
  status: StatusAviso;
  criadoEm: string;
  comentarios?: Comentario[];
}

export interface Predio {
  id: string;
  empresaId: string;
  nome: string;
  endereco: string;
}

export interface Apartamento {
  id: string;
  blocoId: string;
  numero: string;
}

export interface Bloco {
  id: string;
  predioId: string;
  nome: string;
  apartamentos: Apartamento[];
}

export interface AreaSocial {
  id: string;
  predioId: string;
  nome: string;
}

export interface PerfilUsuario {
  id: string;
  authUserId: string;
  predioId: string;
  apartamentoId: string | null;
  nomeCompleto: string;
  email: string;
  telefone: string | null;
  fotoUrl: string | null;
  predio?: Predio;
}

export interface PerfilFuncionarioOuGestor {
  id: string;
  authUserId: string;
  nomeCompleto: string;
  email: string;
  telefone: string | null;
  fotoUrl: string | null;
  area?: string;
  predios: { predio: Predio }[];
}

export type Perfil = (PerfilUsuario | PerfilFuncionarioOuGestor) & { role?: Role };
