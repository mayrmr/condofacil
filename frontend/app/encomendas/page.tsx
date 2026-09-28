'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { PageTopBar } from '@/components/PageTopBar';
import { RequireAuth } from '@/components/RequireAuth';
import { IconX } from '@/components/icons';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { Bloco, Encomenda, PerfilFuncionarioOuGestor, PerfilUsuario } from '@/lib/types';

function formatarData(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

function nomeLocalizacao(enc: Encomenda): string {
  if (enc.usuario) return enc.usuario.nomeCompleto;
  return enc.nomeDestinatario ?? 'Destinatário não informado';
}

function localDestinoDescricao(enc: Encomenda): string | null {
  if (enc.bloco && enc.apartamento) return `${enc.bloco.nome} · apto ${enc.apartamento.numero}`;
  if (enc.bloco) return enc.bloco.nome;
  return null;
}

function RegistrarEncomendaForm({ aoCriar }: { aoCriar: () => void }) {
  const { perfil } = useAuth();
  const predioId = (perfil as PerfilFuncionarioOuGestor | null)?.predios?.[0]?.predio.id;

  const [usuarios, setUsuarios] = useState<PerfilUsuario[]>([]);
  const [blocos, setBlocos] = useState<Bloco[]>([]);

  const [busca, setBusca] = useState('');
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<PerfilUsuario | null>(null);
  const [blocoIdManual, setBlocoIdManual] = useState('');
  const [apartamentoIdManual, setApartamentoIdManual] = useState('');

  const [dataChegada, setDataChegada] = useState('');
  const [descricao, setDescricao] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    api.get<PerfilUsuario[]>('/gestor/usuarios').then(setUsuarios);
  }, []);

  useEffect(() => {
    if (!predioId) return;
    api.get<Bloco[]>(`/predios/${predioId}/blocos`).then(setBlocos);
  }, [predioId]);

  const resultadosBusca = useMemo(() => {
    if (!busca.trim() || usuarioSelecionado) return [];
    const termo = normalizar(busca);
    return usuarios.filter((u) => normalizar(u.nomeCompleto).includes(termo)).slice(0, 8);
  }, [busca, usuarios, usuarioSelecionado]);

  const blocoManual = blocos.find((b) => b.id === blocoIdManual);

  function limparSelecao() {
    setUsuarioSelecionado(null);
    setBusca('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    try {
      await api.post('/encomendas', {
        usuarioId: usuarioSelecionado?.id,
        nomeDestinatario: usuarioSelecionado ? undefined : busca || undefined,
        blocoId: usuarioSelecionado ? undefined : blocoIdManual || undefined,
        apartamentoId: usuarioSelecionado ? undefined : apartamentoIdManual || undefined,
        descricao: descricao || undefined,
        dataChegada: dataChegada || undefined,
      });
      limparSelecao();
      setBlocoIdManual('');
      setApartamentoIdManual('');
      setDataChegada('');
      setDescricao('');
      aoCriar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível registrar a encomenda.');
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>Registrar chegada</h2>
      <div className="field" style={{ marginTop: 8, position: 'relative' }}>
        <label htmlFor="destinatario">Destinatário</label>
        {usuarioSelecionado ? (
          <div className="destinatario-selecionado">
            <span>
              <strong>{usuarioSelecionado.nomeCompleto}</strong>
              {usuarioSelecionado.apartamento && (
                <span className="muted">
                  {' '}
                  · {blocos.find((b) => b.id === usuarioSelecionado.apartamento?.blocoId)?.nome ?? 'Bloco'} · apto{' '}
                  {usuarioSelecionado.apartamento.numero}
                </span>
              )}
            </span>
            <button type="button" onClick={limparSelecao} aria-label="Trocar destinatário">
              <IconX width={14} height={14} />
            </button>
          </div>
        ) : (
          <>
            <input
              id="destinatario"
              placeholder="Nome do destinatário..."
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setBuscaAberta(true);
              }}
              onFocus={() => setBuscaAberta(true)}
              onBlur={() => setTimeout(() => setBuscaAberta(false), 150)}
              autoComplete="off"
              required
            />
            {buscaAberta && resultadosBusca.length > 0 && (
              <div className="destinatario-sugestoes">
                {resultadosBusca.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setUsuarioSelecionado(u);
                      setBuscaAberta(false);
                    }}
                  >
                    {u.nomeCompleto}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {!usuarioSelecionado && (
        <div className="row">
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="blocoManual">Bloco</label>
            <select
              id="blocoManual"
              required
              value={blocoIdManual}
              onChange={(e) => {
                setBlocoIdManual(e.target.value);
                setApartamentoIdManual('');
              }}
            >
              <option value="">Selecione...</option>
              {blocos.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="apartamentoManual">Apartamento (opcional)</label>
            <select
              id="apartamentoManual"
              value={apartamentoIdManual}
              onChange={(e) => setApartamentoIdManual(e.target.value)}
              disabled={!blocoManual}
            >
              <option value="">Não informado</option>
              {blocoManual?.apartamentos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.numero}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="row">
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="dataChegada">Data de chegada</label>
          <input
            id="dataChegada"
            type="date"
            value={dataChegada}
            onChange={(e) => setDataChegada(e.target.value)}
          />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="descricao">Descrição (opcional)</label>
          <input
            id="descricao"
            placeholder="Ex: Mercado Livre"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </div>
      </div>
      {erro && <p className="erro">{erro}</p>}
      <button type="submit" className="btn-primary">
        Registrar
      </button>
    </form>
  );
}

function ConteudoEncomendas() {
  const { perfil } = useAuth();
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    const dados = await api.get<Encomenda[]>('/encomendas');
    setEncomendas(dados);
    setCarregando(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca inicial ao montar, padrao de data fetching em effect
    carregar();

  }, []);

  async function marcarRetirada(id: string) {
    await api.patch(`/encomendas/${id}/retirar`);
    await carregar();
  }

  return (
    <div className="stack">
      <PageTopBar title="Encomendas" />

      {(perfil?.role === 'FUNCIONARIO' || perfil?.role === 'GESTOR') && (
        <RegistrarEncomendaForm aoCriar={carregar} />
      )}

      {carregando && <p className="muted">Carregando...</p>}
      {!carregando && encomendas.length === 0 && <p className="muted">Nenhuma encomenda por aqui.</p>}
      <div className="stack">
        {encomendas.map((enc) => (
          <div key={enc.id} className="card row-between">
            <div>
              <strong>{enc.descricao || 'Encomenda'}</strong>
              <p className="muted" style={{ marginTop: 4 }}>
                {nomeLocalizacao(enc)}
                {localDestinoDescricao(enc) ? ` · ${localDestinoDescricao(enc)}` : ''}
              </p>
              <p className="muted">Chegou em {formatarData(enc.chegadaEm)}</p>
            </div>
            <div className="row">
              <span className={`badge ${enc.status === 'RETIRADA' ? 'badge-RESOLVIDA' : 'badge-ANALISE'}`}>
                {enc.status === 'RETIRADA' ? 'Retirada' : 'Aguardando retirada'}
              </span>
              {enc.status !== 'RETIRADA' && (
                <button className="btn-primary" onClick={() => marcarRetirada(enc.id)}>
                  Marcar retirada
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EncomendasPage() {
  return (
    <RequireAuth>
      <ConteudoEncomendas />
    </RequireAuth>
  );
}
