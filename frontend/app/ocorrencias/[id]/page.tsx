'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { IconCheck } from '@/components/icons';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatarData, LABEL_STATUS } from '@/lib/formatacao';
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

function DetalheOcorrencia() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { perfil } = useAuth();

  const [ocorrencia, setOcorrencia] = useState<Ocorrencia | null>(null);
  const [historico, setHistorico] = useState<HistoricoStatus[]>([]);
  const [funcionarios, setFuncionarios] = useState<PerfilFuncionarioOuGestor[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  const [novoStatus, setNovoStatus] = useState<StatusOcorrencia | ''>('');
  const [observacao, setObservacao] = useState('');
  const [solucaoAplicada, setSolucaoAplicada] = useState('');
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

  if (erro) return <p className="erro">{erro}</p>;
  if (!ocorrencia || !perfil) return <p className="muted">Carregando...</p>;

  const souCriador = perfil.role === 'USUARIO' && ocorrencia.criadoPorUsuarioId === perfil.id;
  const opcoesStatus = transicoesPermitidas(ocorrencia.statusAtual, perfil.role!);
  const podeAvaliar =
    souCriador && (ocorrencia.statusAtual === 'RESOLVIDA' || ocorrencia.statusAtual === 'CANCELAMENTO');
  const podeMudarPrioridade = perfil.role === 'FUNCIONARIO' || perfil.role === 'GESTOR';

  async function handleMudarStatus(e: FormEvent) {
    e.preventDefault();
    if (!novoStatus) return;
    try {
      await api.patch(`/ocorrencias/${id}/status`, {
        status: novoStatus,
        observacao: observacao || undefined,
        solucaoAplicada: novoStatus === 'RESOLVIDA' ? solucaoAplicada || undefined : undefined,
      });
      setNovoStatus('');
      setObservacao('');
      setSolucaoAplicada('');
      await carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível mudar o status.');
    }
  }

  async function handlePrioridade(prioridade: Prioridade) {
    await api.patch(`/ocorrencias/${id}/prioridade`, { prioridade });
    await carregar();
  }

  async function handleResponsavel(funcionarioId: string) {
    if (!funcionarioId) return;
    await api.patch(`/ocorrencias/${id}/responsavel`, { funcionarioId });
    await carregar();
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
    router.push('/');
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
      <div className="row-between">
        <h1>{ocorrencia.titulo}</h1>
        <span className={`badge badge-${ocorrencia.statusAtual}`}>{LABEL_STATUS[ocorrencia.statusAtual]}</span>
      </div>

      <div className="card">
        <p>{ocorrencia.descricao}</p>
        <p className="muted" style={{ marginTop: 8 }}>
          {ocorrencia.categoria} · {formatarData(ocorrencia.criadoEm)}
          {ocorrencia.prioridade ? ` · Prioridade ${ocorrencia.prioridade.toLowerCase()}` : ' · Sem prioridade definida'}
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

      {podeMudarPrioridade && (
        <div className="card">
          <h2>Prioridade</h2>
          <div className="row" style={{ marginTop: 8 }}>
            {(['BAIXA', 'MEDIA', 'ALTA', 'URGENTE'] as Prioridade[]).map((p) => (
              <button key={p} onClick={() => handlePrioridade(p)} disabled={ocorrencia.prioridade === p}>
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {perfil.role === 'GESTOR' && (
        <div className="card">
          <h2>Responsável</h2>
          <select
            style={{ marginTop: 8 }}
            value={ocorrencia.responsavelFuncionarioId ?? ''}
            onChange={(e) => handleResponsavel(e.target.value)}
          >
            <option value="" disabled>
              Atribuir funcionário...
            </option>
            {funcionarios.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nomeCompleto} {f.area ? `(${f.area})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {opcoesStatus.length > 0 && (
        <form className="card" onSubmit={handleMudarStatus}>
          <h2>Mudar status</h2>
          <div className="field" style={{ marginTop: 8 }}>
            <select value={novoStatus} onChange={(e) => setNovoStatus(e.target.value as StatusOcorrencia)}>
              <option value="" disabled>
                Selecione o novo status...
              </option>
              {opcoesStatus.map((s) => (
                <option key={s} value={s}>
                  {LABEL_STATUS[s]}
                </option>
              ))}
            </select>
          </div>
          {novoStatus === 'RESOLVIDA' && (
            <div className="field">
              <label htmlFor="solucao">Solução aplicada</label>
              <textarea id="solucao" value={solucaoAplicada} onChange={(e) => setSolucaoAplicada(e.target.value)} />
            </div>
          )}
          <div className="field">
            <label htmlFor="observacao">Observação (opcional)</label>
            <textarea id="observacao" value={observacao} onChange={(e) => setObservacao(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary" disabled={!novoStatus}>
            Confirmar mudança
          </button>
        </form>
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

      <div className="card">
        <h2>Imagens</h2>
        <div className="row" style={{ marginTop: 8, flexWrap: 'wrap' }}>
          {ocorrencia.imagens?.map((img) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={img.id} src={img.url} alt="" style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8 }} />
          ))}
        </div>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ marginTop: 8 }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUploadImagem(file);
          }}
        />
      </div>

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
                    {h.observacao ? ` · ${h.observacao}` : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

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

export default function OcorrenciaDetalhePage() {
  return (
    <RequireAuth>
      <DetalheOcorrencia />
    </RequireAuth>
  );
}
