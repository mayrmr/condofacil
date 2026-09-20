'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatarData } from '@/lib/formatacao';
import type { AreaSocial, Aviso, Bloco, LocalizacaoTipo, PerfilFuncionarioOuGestor } from '@/lib/types';

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

function CardAviso({ aviso, aoAtualizar }: { aviso: Aviso; aoAtualizar: () => void }) {
  const { perfil } = useAuth();
  const [texto, setTexto] = useState('');

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
      <div className="row-between">
        <strong>📢 {aviso.titulo}</strong>
        {aviso.status === 'ENCERRADO' && <span className="badge">Encerrado</span>}
      </div>
      <p style={{ marginTop: 6 }}>{aviso.descricao}</p>
      <p className="muted" style={{ marginTop: 6 }}>
        {aviso.categoria} · {formatarData(aviso.criadoEm)}
      </p>

      <div className="stack" style={{ marginTop: 12 }}>
        {aviso.comentarios?.map((c) => (
          <div key={c.id}>
            <span className="muted">
              {c.autorTipo} · {formatarData(c.criadoEm)}
            </span>
            <p>{c.texto}</p>
          </div>
        ))}
      </div>
      <form onSubmit={comentar} className="field" style={{ marginTop: 8 }}>
        <textarea placeholder="Comentar..." value={texto} onChange={(e) => setTexto(e.target.value)} />
        <button type="submit" style={{ marginTop: 8 }}>
          Comentar
        </button>
      </form>

      {perfil?.role === 'GESTOR' && aviso.status === 'ATIVO' && (
        <button onClick={encerrar} style={{ marginTop: 8 }}>
          Encerrar aviso
        </button>
      )}
    </div>
  );
}

function ListaAvisos() {
  const { perfil } = useAuth();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [carregando, setCarregando] = useState(true);

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

  return (
    <div className="stack">
      <h1>Avisos</h1>
      {predioIdGestor && <NovoAvisoForm predioId={predioIdGestor} aoCriar={carregar} />}
      {carregando && <p className="muted">Carregando...</p>}
      {!carregando && avisos.length === 0 && <p className="muted">Nenhum aviso publicado ainda.</p>}
      {avisos.map((a) => (
        <CardAviso key={a.id} aviso={a} aoAtualizar={carregar} />
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
