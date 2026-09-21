'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { IconAlertCircle, IconBell } from '@/components/icons';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatarData } from '@/lib/formatacao';
import type { AreaSocial, Aviso, Bloco, LocalizacaoTipo, PerfilFuncionarioOuGestor } from '@/lib/types';

const CATEGORIAS_URGENTES = ['assembleia', 'urgente', 'seguranca'];

function ehUrgente(categoria: string): boolean {
  return CATEGORIAS_URGENTES.some((c) => categoria.toLowerCase().includes(c));
}

function grupoDoAviso(criadoEm: string): 'HOJE' | 'ESTA SEMANA' | 'ANTERIORES' {
  const data = new Date(criadoEm);
  const agora = new Date();
  const diffDias = (agora.getTime() - data.getTime()) / (1000 * 60 * 60 * 24);
  if (data.toDateString() === agora.toDateString()) return 'HOJE';
  if (diffDias <= 7) return 'ESTA SEMANA';
  return 'ANTERIORES';
}

function NovoAvisoForm({ predioId, aoCriar }: { predioId: string; aoCriar: () => void }) {
  const [blocos, setBlocos] = useState<Bloco[]>([]);
  const [areasSociais, setAreasSociais] = useState<AreaSocial[]>([]);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('geral');
  const [localizacaoTipo, setLocalizacaoTipo] = useState<LocalizacaoTipo>('AREA_SOCIAL');
  const [localizacaoId, setLocalizacaoId] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    api.get<Bloco[]>(`/predios/${predioId}/blocos`).then(setBlocos);
    api.get<AreaSocial[]>(`/predios/${predioId}/areas-sociais`).then(setAreasSociais);
  }, [predioId]);

  const opcoes = useMemo(() => {
    if (localizacaoTipo === 'BLOCO') return blocos.map((b) => ({ id: b.id, label: b.nome }));
    if (localizacaoTipo === 'APARTAMENTO') {
      return blocos.flatMap((b) => b.apartamentos.map((a) => ({ id: a.id, label: `${b.nome} — apto ${a.numero}` })));
    }
    return areasSociais.map((a) => ({ id: a.id, label: a.nome }));
  }, [localizacaoTipo, blocos, areasSociais]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!localizacaoId) {
      setErro('Selecione a localização do aviso.');
      return;
    }
    try {
      await api.post('/avisos', { titulo, descricao, categoria, localizacaoTipo, localizacaoId });
      setTitulo('');
      setDescricao('');
      setLocalizacaoId('');
      aoCriar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível criar o aviso.');
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>Novo aviso</h2>
      <div className="field" style={{ marginTop: 8 }}>
        <label htmlFor="titulo">Título</label>
        <input id="titulo" required value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="descricao">Descrição</label>
        <textarea id="descricao" required value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="categoria">Categoria</label>
        <input id="categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} />
      </div>
      <div className="row">
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="localizacaoTipo">Tipo de local</label>
          <select
            id="localizacaoTipo"
            value={localizacaoTipo}
            onChange={(e) => {
              setLocalizacaoTipo(e.target.value as LocalizacaoTipo);
              setLocalizacaoId('');
            }}
          >
            <option value="AREA_SOCIAL">Área social</option>
            <option value="BLOCO">Bloco</option>
            <option value="APARTAMENTO">Apartamento</option>
          </select>
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="localizacaoId">Local</label>
          <select id="localizacaoId" value={localizacaoId} onChange={(e) => setLocalizacaoId(e.target.value)}>
            <option value="">Selecione...</option>
            {opcoes.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {erro && <p className="erro">{erro}</p>}
      <button type="submit" className="btn-primary">
        Publicar aviso
      </button>
    </form>
  );
}

function LinhaAviso({
  aviso,
  aberto,
  aoAlternar,
  aoAtualizar,
}: {
  aviso: Aviso;
  aberto: boolean;
  aoAlternar: () => void;
  aoAtualizar: () => void;
}) {
  const { perfil } = useAuth();
  const [texto, setTexto] = useState('');
  const urgente = ehUrgente(aviso.categoria);

  async function comentar(e: FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;
    await api.post(`/avisos/${aviso.id}/comentarios`, { texto });
    setTexto('');
    aoAtualizar();
  }

  async function encerrar() {
    await api.patch(`/avisos/${aviso.id}`, { status: 'ENCERRADO' });
    aoAtualizar();
  }

  return (
    <div id={aviso.id} className="card">
      <button
        onClick={aoAlternar}
        className="row"
        style={{
          width: '100%',
          alignItems: 'flex-start',
          background: 'transparent',
          border: 'none',
          padding: 0,
          textAlign: 'left',
        }}
      >
        <span className="chip" style={urgente ? { background: 'var(--accent-soft)', color: 'var(--warning)' } : undefined}>
          {urgente ? <IconAlertCircle style={{ width: 18, height: 18 }} /> : <IconBell style={{ width: 18, height: 18 }} />}
        </span>
        <div style={{ flex: 1 }}>
          <div className="row-between">
            <strong style={{ fontSize: '0.92rem' }}>{aviso.titulo}</strong>
            <span className="muted">{formatarData(aviso.criadoEm)}</span>
          </div>
          {!aberto && (
            <p className="muted" style={{ marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {aviso.descricao}
            </p>
          )}
          {aviso.status === 'ENCERRADO' && (
            <span className="badge" style={{ marginTop: 4 }}>
              Encerrado
            </span>
          )}
        </div>
      </button>

      {aberto && (
        <div style={{ marginTop: 12, paddingLeft: 52 }}>
          <p>{aviso.descricao}</p>

          <div className="chat" style={{ marginTop: 12 }}>
            {aviso.comentarios?.map((c) => (
              <div key={c.id} className={`chat-bubble ${c.autorId === perfil?.id ? 'mine' : ''}`}>
                <p>{c.texto}</p>
                <span className="muted">
                  {c.autorTipo} · {formatarData(c.criadoEm)}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={comentar} className="field" style={{ marginTop: 12 }}>
            <textarea placeholder="Comentar..." value={texto} onChange={(e) => setTexto(e.target.value)} />
            <button type="submit" className="btn-primary" style={{ marginTop: 8 }}>
              Comentar
            </button>
          </form>

          {perfil?.role === 'GESTOR' && aviso.status === 'ATIVO' && (
            <button className="btn-danger" onClick={encerrar} style={{ marginTop: 8 }}>
              Encerrar aviso
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ListaAvisos() {
  const { perfil } = useAuth();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [abertoId, setAbertoId] = useState<string | null>(null);

  async function carregar() {
    const dados = await api.get<Aviso[]>('/avisos');
    setAvisos(dados);
    setCarregando(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca inicial ao montar, padrao de data fetching em effect
    carregar();
  }, []);

  const predioIdGestor =
    perfil?.role === 'GESTOR' ? (perfil as PerfilFuncionarioOuGestor).predios?.[0]?.predio.id : undefined;

  const grupos: Record<string, Aviso[]> = { HOJE: [], 'ESTA SEMANA': [], ANTERIORES: [] };
  for (const aviso of avisos) {
    grupos[grupoDoAviso(aviso.criadoEm)].push(aviso);
  }

  return (
    <div className="stack">
      <h1>Avisos</h1>
      {predioIdGestor && <NovoAvisoForm predioId={predioIdGestor} aoCriar={carregar} />}
      {carregando && <p className="muted">Carregando...</p>}
      {!carregando && avisos.length === 0 && <p className="muted">Nenhum aviso publicado ainda.</p>}
      {(['HOJE', 'ESTA SEMANA', 'ANTERIORES'] as const)
        .filter((g) => grupos[g].length > 0)
        .map((g) => (
          <div key={g} className="stack">
            <p className="muted" style={{ textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.03em' }}>
              {g}
            </p>
            {grupos[g].map((a) => (
              <LinhaAviso
                key={a.id}
                aviso={a}
                aberto={abertoId === a.id}
                aoAlternar={() => setAbertoId((atual) => (atual === a.id ? null : a.id))}
                aoAtualizar={carregar}
              />
            ))}
          </div>
        ))}
    </div>
  );
}

export default function AvisosPage() {
  return (
    <RequireAuth>
      <ListaAvisos />
    </RequireAuth>
  );
}
