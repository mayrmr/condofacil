'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { FiltroDropdown } from './FiltroDropdown';
import { IconCheck } from './icons';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatarData, LABEL_CATEGORIA, LABEL_PRIORIDADE, LABEL_STATUS } from '@/lib/formatacao';
import { supabase } from '@/lib/supabase-client';
import { transicoesPermitidas } from '@/lib/state-machine';
import type {
  Comentario,
  HistoricoStatus,
  Ocorrencia,
  PerfilFuncionarioOuGestor,
  Prioridade,
  StatusOcorrencia,
} from '@/lib/types';

const PRIORIDADES: Prioridade[] = ['BAIXA', 'MEDIA', 'ALTA', 'URGENTE'];

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export function OcorrenciaDetalhe({
  id,
  aoAlterar,
  aoExcluir,
}: {
  id: string;
  /** Chamado apos qualquer mudanca que possa afetar listas externas (status, prioridade, responsavel). */
  aoAlterar?: () => void;
  /** Chamado apos a exclusao bem-sucedida da ocorrencia. */
  aoExcluir?: () => void;
}) {
  const { perfil } = useAuth();

  const [ocorrencia, setOcorrencia] = useState<Ocorrencia | null>(null);
  const [historico, setHistorico] = useState<HistoricoStatus[]>([]);
  const [funcionarios, setFuncionarios] = useState<PerfilFuncionarioOuGestor[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  const [statusPendente, setStatusPendente] = useState<StatusOcorrencia | null>(null);
  const [observacaoStatus, setObservacaoStatus] = useState('');
  const [solucaoAplicada, setSolucaoAplicada] = useState('');

  const [buscaResponsavel, setBuscaResponsavel] = useState('');
  const [buscaResponsavelAberta, setBuscaResponsavelAberta] = useState(false);

  const [novoComentario, setNovoComentario] = useState('');
  const [notaAvaliacao, setNotaAvaliacao] = useState(5);
  const [comentarioAvaliacao, setComentarioAvaliacao] = useState('');

  const carregar = useCallback(async () => {
    try {
      const [dadosOcorrencia, dadosHistorico] = await Promise.all([
        api.get<Ocorrencia>(`/ocorrencias/${id}`),
        api.get<HistoricoStatus[]>(`/ocorrencias/${id}/historico`),
      ]);
      setOcorrencia(dadosOcorrencia);
      setHistorico(dadosHistorico);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível carregar a ocorrência.');
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca inicial/refetch ao trocar de ocorrencia, padrao de data fetching em effect
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (perfil?.role === 'GESTOR') {
      api.get<PerfilFuncionarioOuGestor[]>('/gestor/funcionarios').then(setFuncionarios);
    }
  }, [perfil]);

  const resultadosResponsavel = useMemo(() => {
    if (!buscaResponsavel.trim()) return [];
    const termo = normalizar(buscaResponsavel);
    return funcionarios.filter((f) => normalizar(f.nomeCompleto).includes(termo)).slice(0, 8);
  }, [buscaResponsavel, funcionarios]);

  if (erro) return <p className="erro">{erro}</p>;
  if (!ocorrencia || !perfil) return <p className="muted">Carregando...</p>;

  const souCriador = perfil.role === 'USUARIO' && ocorrencia.criadoPorUsuarioId === perfil.id;
  const podeMudarStatusLivre = perfil.role === 'FUNCIONARIO' || perfil.role === 'GESTOR';
  const opcoesStatus = transicoesPermitidas(ocorrencia.statusAtual, perfil.role!);
  const podeCancelarPropria = perfil.role === 'USUARIO' && opcoesStatus.includes('EXCLUIDA');
  const podeAvaliar =
    souCriador && (ocorrencia.statusAtual === 'RESOLVIDA' || ocorrencia.statusAtual === 'CANCELAMENTO');
  const podeMudarPrioridade = perfil.role === 'FUNCIONARIO' || perfil.role === 'GESTOR';
  const responsavelAtual = funcionarios.find((f) => f.id === ocorrencia.responsavelFuncionarioId);

  async function aplicarMudancaStatus(status: StatusOcorrencia, extra?: { observacao?: string; solucaoAplicada?: string }) {
    try {
      await api.patch(`/ocorrencias/${id}/status`, { status, ...extra });
      setStatusPendente(null);
      setObservacaoStatus('');
      setSolucaoAplicada('');
      await carregar();
      aoAlterar?.();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível mudar o status.');
    }
  }

  async function handleConfirmarStatusPendente(e: FormEvent) {
    e.preventDefault();
    if (!statusPendente) return;
    await aplicarMudancaStatus(statusPendente, {
      observacao: observacaoStatus || undefined,
      solucaoAplicada: statusPendente === 'RESOLVIDA' ? solucaoAplicada || undefined : undefined,
    });
  }

  async function handleCancelarPropria() {
    if (!confirm('Cancelar esta ocorrência?')) return;
    await aplicarMudancaStatus('EXCLUIDA');
  }

  async function handlePrioridade(prioridade: Prioridade) {
    await api.patch(`/ocorrencias/${id}/prioridade`, { prioridade });
    await carregar();
    aoAlterar?.();
  }

  async function handleResponsavel(funcionarioId: string) {
    if (!funcionarioId) return;
    await api.patch(`/ocorrencias/${id}/responsavel`, { funcionarioId });
    setBuscaResponsavel('');
    setBuscaResponsavelAberta(false);
    await carregar();
    aoAlterar?.();
  }

  async function handleAvaliar(e: FormEvent) {
    e.preventDefault();
    await api.patch(`/ocorrencias/${id}/avaliacao`, {
      nota: notaAvaliacao,
      comentario: comentarioAvaliacao || undefined,
    });
    await carregar();
  }

  async function handleComentar(e: FormEvent) {
    e.preventDefault();
    if (!novoComentario.trim()) return;
    await api.post(`/ocorrencias/${id}/comentarios`, { texto: novoComentario });
    setNovoComentario('');
    await carregar();
  }

  async function handleExcluir() {
    if (!confirm('Excluir esta ocorrência permanentemente?')) return;
    await api.delete(`/ocorrencias/${id}`);
    aoAlterar?.();
    aoExcluir?.();
  }

  async function handleUploadImagem(file: File) {
    const { path, token } = await api.post<{ path: string; token: string }>(
      `/ocorrencias/${id}/imagens/solicitar-upload`,
      { contentType: file.type, tamanhoBytes: file.size },
    );
    const { error } = await supabase.storage.from('ocorrencias').uploadToSignedUrl(path, token, file);
    if (error) throw error;
    await api.post(`/ocorrencias/${id}/imagens`, { path });
    await carregar();
  }

  return (
    <div className="stack">
      {/* Bloco 1 */}
      <div className="row-between">
        <h1>{ocorrencia.titulo}</h1>
        <span className={`badge badge-${ocorrencia.statusAtual}`}>{LABEL_STATUS[ocorrencia.statusAtual]}</span>
      </div>

      <div className="card">
        <p>{ocorrencia.descricao}</p>
        <p className="muted" style={{ marginTop: 8 }}>
          {LABEL_CATEGORIA[ocorrencia.categoria] ?? ocorrencia.categoria} · {formatarData(ocorrencia.criadoEm)}
          {!ocorrencia.prioridade && ' · Sem prioridade definida'}
        </p>
        {ocorrencia.solucaoAplicada && (
          <p style={{ marginTop: 8 }}>
            <strong>Solução aplicada:</strong> {ocorrencia.solucaoAplicada}
          </p>
        )}
        {ocorrencia.avaliacaoNota && (
          <p style={{ marginTop: 8 }}>
            <strong>Avaliação:</strong> {ocorrencia.avaliacaoNota}/5 — {ocorrencia.avaliacaoComentario}
          </p>
        )}
      </div>

      {/* Prioridade — botao suspenso */}
      {podeMudarPrioridade && (
        <div className="card row" style={{ alignItems: 'center', gap: 12 }}>
          <strong style={{ fontSize: '0.85rem' }}>Prioridade</strong>
          {ocorrencia.prioridade && (
            <span className={`badge badge-prioridade-${ocorrencia.prioridade}`}>
              {LABEL_PRIORIDADE[ocorrencia.prioridade]}
            </span>
          )}
          <FiltroDropdown
            label="Mudar prioridade"
            valorSelecionado={ocorrencia.prioridade ?? ''}
            ativo={false}
            opcoes={PRIORIDADES.map((p) => ({ valor: p, texto: LABEL_PRIORIDADE[p] }))}
            aoSelecionar={(v) => handlePrioridade(v as Prioridade)}
          />
        </div>
      )}

      {/* Historico / linha do tempo */}
      <div className="card">
        <h2>Histórico</h2>
        <div style={{ marginTop: 14 }}>
          {historico.map((h, i) => {
            const isUltimo = i === historico.length - 1;
            return (
              <div key={h.id} className="timeline-item">
                <div className={`timeline-dot ${isUltimo ? 'atual' : 'completo'}`}>
                  {!isUltimo && <IconCheck />}
                </div>
                <div className="timeline-content">
                  <strong>{LABEL_STATUS[h.statusNovo]}</strong>
                  <span className="muted">
                    {formatarData(h.criadoEm)}
                    {h.usuarioResponsavelNome ? ` · ${h.usuarioResponsavelNome}` : ''}
                    {h.observacao ? ` · ${h.observacao}` : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Responsavel + status — compacto, so funcionario/gestor mudam etapa */}
      {podeMudarStatusLivre && (
        <div className="card">
          <div className="responsavel-status-bloco">
            {perfil.role === 'GESTOR' && (
              <div className="responsavel-status-campo" style={{ position: 'relative' }}>
                <label>Responsável</label>
                {responsavelAtual && !buscaResponsavelAberta ? (
                  <div className="destinatario-selecionado">
                    <span>
                      <strong>{responsavelAtual.nomeCompleto}</strong>
                      {responsavelAtual.area && <span className="muted"> · {responsavelAtual.area}</span>}
                    </span>
                    <button type="button" onClick={() => setBuscaResponsavelAberta(true)} aria-label="Trocar responsável">
                      Trocar
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      placeholder="Digite o nome do funcionário..."
                      value={buscaResponsavel}
                      onChange={(e) => setBuscaResponsavel(e.target.value)}
                      onFocus={() => setBuscaResponsavelAberta(true)}
                      onBlur={() => setTimeout(() => setBuscaResponsavelAberta(false), 150)}
                      autoComplete="off"
                    />
                    {buscaResponsavelAberta && resultadosResponsavel.length > 0 && (
                      <div className="destinatario-sugestoes">
                        {resultadosResponsavel.map((f) => (
                          <button key={f.id} type="button" onClick={() => handleResponsavel(f.id)}>
                            {f.nomeCompleto} {f.area ? `(${f.area})` : ''}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="responsavel-status-campo">
              <label>Status</label>
              <div className="row" style={{ alignItems: 'center' }}>
                <span className={`badge badge-${ocorrencia.statusAtual}`}>{LABEL_STATUS[ocorrencia.statusAtual]}</span>
                <FiltroDropdown
                  label="Mudar status"
                  valorSelecionado={statusPendente ?? ''}
                  ativo={false}
                  opcoes={opcoesStatus.map((s) => ({ valor: s, texto: LABEL_STATUS[s] }))}
                  aoSelecionar={(v) => setStatusPendente(v as StatusOcorrencia)}
                />
              </div>
            </div>
          </div>

          {statusPendente && (
            <form onSubmit={handleConfirmarStatusPendente} className="stack" style={{ marginTop: 14, gap: 8 }}>
              <p className="muted">
                Mudar para <strong>{LABEL_STATUS[statusPendente]}</strong>?
              </p>
              {statusPendente === 'RESOLVIDA' && (
                <div className="field">
                  <label htmlFor="solucao">Solução aplicada</label>
                  <textarea id="solucao" value={solucaoAplicada} onChange={(e) => setSolucaoAplicada(e.target.value)} />
                </div>
              )}
              <div className="field">
                <label htmlFor="observacaoStatus">Observação (opcional)</label>
                <textarea
                  id="observacaoStatus"
                  value={observacaoStatus}
                  onChange={(e) => setObservacaoStatus(e.target.value)}
                />
              </div>
              <div className="row">
                <button type="submit" className="btn-primary">
                  Confirmar mudança
                </button>
                <button type="button" onClick={() => setStatusPendente(null)}>
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {podeCancelarPropria && (
        <button type="button" className="btn-danger" onClick={handleCancelarPropria}>
          Cancelar ocorrência
        </button>
      )}

      {podeAvaliar && (
        <form className="card" onSubmit={handleAvaliar}>
          <h2>Avaliar resolução</h2>
          <div className="field" style={{ marginTop: 8 }}>
            <label htmlFor="nota">Nota (1 a 5)</label>
            <select id="nota" value={notaAvaliacao} onChange={(e) => setNotaAvaliacao(Number(e.target.value))}>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="comentarioAvaliacao">Comentário</label>
            <textarea
              id="comentarioAvaliacao"
              value={comentarioAvaliacao}
              onChange={(e) => setComentarioAvaliacao(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary">
            Enviar avaliação
          </button>
        </form>
      )}

      {/* Imagens — galeria otimizada */}
      <div className="card">
        <h2>Imagens</h2>
        <div className="imagens-galeria">
          {ocorrencia.imagens?.map((img) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={img.id} src={img.url} alt="" />
          ))}
        </div>
        <label className="btn" style={{ display: 'inline-flex', marginTop: 10, cursor: 'pointer' }}>
          Adicionar imagem
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUploadImagem(file);
            }}
          />
        </label>
      </div>

      {/* Comentarios */}
      <div className="card">
        <h2>Conversa</h2>
        <div className="chat" style={{ marginTop: 12 }}>
          {ocorrencia.comentarios?.map((c: Comentario) => (
            <div key={c.id} className={`chat-bubble ${c.autorId === perfil.id ? 'mine' : ''}`}>
              <p>{c.texto}</p>
              <span className="muted">
                {c.autorTipo} · {formatarData(c.criadoEm)}
              </span>
            </div>
          ))}
          {(!ocorrencia.comentarios || ocorrencia.comentarios.length === 0) && (
            <p className="muted">Nenhum comentário ainda.</p>
          )}
        </div>
        <form onSubmit={handleComentar} className="field" style={{ marginTop: 12 }}>
          <textarea
            placeholder="Adicionar um comentário..."
            value={novoComentario}
            onChange={(e) => setNovoComentario(e.target.value)}
          />
          <button type="submit" className="btn-primary" style={{ marginTop: 8 }}>
            Comentar
          </button>
        </form>
      </div>

      {perfil.role === 'GESTOR' && (
        <button className="btn-danger" onClick={handleExcluir}>
          Excluir ocorrência
        </button>
      )}
    </div>
  );
}
