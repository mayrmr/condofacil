'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { IconCamera } from '@/components/icons';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase-client';
import type { AreaSocial, Bloco, PerfilFuncionarioOuGestor } from '@/lib/types';

const GRADIENTES_AREA = [
  'linear-gradient(160deg, var(--primary), var(--sidebar-bg))',
  'linear-gradient(160deg, var(--accent), var(--primary))',
  'linear-gradient(160deg, var(--primary-hover), var(--sidebar-bg))',
  'linear-gradient(160deg, var(--warning), var(--primary-hover))',
];

interface FormAreaValores {
  nome: string;
  descricao: string;
  capacidadeMaxima: string;
  horarioFuncionamento: string;
  regras: string;
}

const FORM_AREA_VAZIO: FormAreaValores = {
  nome: '',
  descricao: '',
  capacidadeMaxima: '',
  horarioFuncionamento: '',
  regras: '',
};

function CardAreaSocial({
  area,
  indice,
  predioId,
  aoAtualizar,
}: {
  area: AreaSocial;
  indice: number;
  predioId: string;
  aoAtualizar: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const [valores, setValores] = useState<FormAreaValores>({
    nome: area.nome,
    descricao: area.descricao ?? '',
    capacidadeMaxima: area.capacidadeMaxima ? String(area.capacidadeMaxima) : '',
    horarioFuncionamento: area.horarioFuncionamento ?? '',
    regras: area.regras ?? '',
  });
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSalvar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    try {
      await api.patch(`/predios/${predioId}/areas-sociais/${area.id}`, {
        nome: valores.nome,
        descricao: valores.descricao || undefined,
        capacidadeMaxima: valores.capacidadeMaxima ? Number(valores.capacidadeMaxima) : undefined,
        horarioFuncionamento: valores.horarioFuncionamento || undefined,
        regras: valores.regras || undefined,
      });
      setEditando(false);
      aoAtualizar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível salvar.');
    }
  }

  async function handleUploadFoto(file: File) {
    setEnviandoFoto(true);
    setErro(null);
    try {
      const { path, token } = await api.post<{ path: string; token: string }>(
        `/predios/${predioId}/areas-sociais/${area.id}/foto/solicitar-upload`,
        { contentType: file.type, tamanhoBytes: file.size },
      );
      const { error } = await supabase.storage.from('ocorrencias').uploadToSignedUrl(path, token, file);
      if (error) throw error;
      await api.post(`/predios/${predioId}/areas-sociais/${area.id}/foto`, { path });
      aoAtualizar();
    } catch {
      setErro('Não foi possível enviar a foto.');
    } finally {
      setEnviandoFoto(false);
    }
  }

  return (
    <div className={`area-card${area.ativa ? '' : ' area-card-indisponivel'}`}>
      <div
        className="area-card-banner"
        style={{
          background: area.fotoUrl ? `url(${area.fotoUrl}) center/cover` : GRADIENTES_AREA[indice % GRADIENTES_AREA.length],
          position: 'relative',
        }}
      >
        <label className="area-card-foto-upload" title="Trocar foto">
          <IconCamera width={16} height={16} />
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            disabled={enviandoFoto}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUploadFoto(file);
            }}
          />
        </label>
      </div>
      <div className="area-card-body">
        {editando ? (
          <form onSubmit={handleSalvar} className="stack" style={{ gap: 8 }}>
            <input
              value={valores.nome}
              onChange={(e) => setValores((v) => ({ ...v, nome: e.target.value }))}
              placeholder="Nome"
              required
            />
            <input
              value={valores.descricao}
              onChange={(e) => setValores((v) => ({ ...v, descricao: e.target.value }))}
              placeholder="Descrição"
            />
            <div className="row">
              <input
                type="number"
                min={1}
                value={valores.capacidadeMaxima}
                onChange={(e) => setValores((v) => ({ ...v, capacidadeMaxima: e.target.value }))}
                placeholder="Capacidade"
                style={{ flex: 1 }}
              />
              <input
                value={valores.horarioFuncionamento}
                onChange={(e) => setValores((v) => ({ ...v, horarioFuncionamento: e.target.value }))}
                placeholder="Ex: 08h às 22h"
                style={{ flex: 1 }}
              />
            </div>
            <textarea
              value={valores.regras}
              onChange={(e) => setValores((v) => ({ ...v, regras: e.target.value }))}
              placeholder="Regras de uso (opcional)"
            />
            {erro && <p className="erro">{erro}</p>}
            <div className="row">
              <button type="submit" className="btn-primary">
                Salvar
              </button>
              <button type="button" onClick={() => setEditando(false)}>
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="area-card-nome">{area.nome}</div>
            <div className="area-card-status">{area.descricao || 'Sem descrição'}</div>
            {(area.capacidadeMaxima || area.horarioFuncionamento) && (
              <div className="muted" style={{ marginTop: 6, fontSize: '0.78rem' }}>
                {area.capacidadeMaxima ? `Até ${area.capacidadeMaxima} pessoas` : ''}
                {area.capacidadeMaxima && area.horarioFuncionamento ? ' · ' : ''}
                {area.horarioFuncionamento ?? ''}
              </div>
            )}
            {area.regras && (
              <p className="muted" style={{ marginTop: 6, fontSize: '0.78rem' }}>
                {area.regras}
              </p>
            )}
            {!area.ativa && <span className="badge badge-CANCELAMENTO" style={{ marginTop: 8 }}>Indisponível</span>}
            <button type="button" style={{ marginTop: 10 }} onClick={() => setEditando(true)}>
              Editar
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function GerenciarEstrutura() {
  const { perfil } = useAuth();
  const predioId = (perfil as PerfilFuncionarioOuGestor | null)?.predios?.[0]?.predio.id;

  const [blocos, setBlocos] = useState<Bloco[]>([]);
  const [areasSociais, setAreasSociais] = useState<AreaSocial[]>([]);
  const [nomeBloco, setNomeBloco] = useState('');
  const [andares, setAndares] = useState('');
  const [apartamentosPorAndar, setApartamentosPorAndar] = useState('');
  const [novaArea, setNovaArea] = useState<FormAreaValores>(FORM_AREA_VAZIO);
  const [numeroApartamento, setNumeroApartamento] = useState<Record<string, string>>({});
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    if (!predioId) return;
    const [b, a] = await Promise.all([
      api.get<Bloco[]>(`/predios/${predioId}/blocos`),
      api.get<AreaSocial[]>(`/predios/${predioId}/areas-sociais`),
    ]);
    setBlocos(b);
    setAreasSociais(a);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca inicial ao montar/trocar de predio, padrao de data fetching em effect
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [predioId]);

  async function handleCriarBloco(e: FormEvent) {
    e.preventDefault();
    if (!predioId || !nomeBloco.trim()) return;
    try {
      await api.post(`/predios/${predioId}/blocos`, {
        nome: nomeBloco,
        andares: andares ? Number(andares) : undefined,
        apartamentosPorAndar: apartamentosPorAndar ? Number(apartamentosPorAndar) : undefined,
      });
      setNomeBloco('');
      setAndares('');
      setApartamentosPorAndar('');
      await carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível criar o bloco.');
    }
  }

  async function handleCriarArea(e: FormEvent) {
    e.preventDefault();
    if (!predioId || !novaArea.nome.trim()) return;
    try {
      await api.post(`/predios/${predioId}/areas-sociais`, {
        nome: novaArea.nome,
        descricao: novaArea.descricao || undefined,
        capacidadeMaxima: novaArea.capacidadeMaxima ? Number(novaArea.capacidadeMaxima) : undefined,
        horarioFuncionamento: novaArea.horarioFuncionamento || undefined,
        regras: novaArea.regras || undefined,
      });
      setNovaArea(FORM_AREA_VAZIO);
      await carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível criar a área social.');
    }
  }

  async function handleCriarApartamento(blocoId: string, e: FormEvent) {
    e.preventDefault();
    const numero = numeroApartamento[blocoId]?.trim();
    if (!predioId || !numero) return;
    try {
      await api.post(`/predios/${predioId}/blocos/${blocoId}/apartamentos`, { numero });
      setNumeroApartamento((prev) => ({ ...prev, [blocoId]: '' }));
      await carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível criar o apartamento.');
    }
  }

  if (!predioId) return <p className="muted">Carregando...</p>;

  return (
    <div className="stack">
      <h1>Estrutura do prédio</h1>
      <p className="muted">
        Cadastre os blocos, apartamentos e áreas sociais para que os moradores possam escolher a localização
        ao abrir uma ocorrência ou publicar um aviso. As áreas sociais cadastradas aqui também aparecem na
        aba Reservas para os moradores reservarem.
      </p>
      {erro && <p className="erro">{erro}</p>}

      <div className="card">
        <h2>Áreas sociais</h2>
        <div className="areas-grid" style={{ marginTop: 12 }}>
          {areasSociais.map((a, i) => (
            <CardAreaSocial key={a.id} area={a} indice={i} predioId={predioId} aoAtualizar={carregar} />
          ))}
          {areasSociais.length === 0 && <p className="muted">Nenhuma área social cadastrada.</p>}
        </div>
        <form onSubmit={handleCriarArea} className="row" style={{ marginTop: 16 }}>
          <input
            placeholder="Ex: Salão de festas"
            value={novaArea.nome}
            onChange={(e) => setNovaArea((v) => ({ ...v, nome: e.target.value }))}
            style={{ flex: 1 }}
          />
          <input
            placeholder="Descrição (opcional)"
            value={novaArea.descricao}
            onChange={(e) => setNovaArea((v) => ({ ...v, descricao: e.target.value }))}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn-primary">
            Adicionar
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Blocos e apartamentos</h2>
        <div className="stack" style={{ marginTop: 8 }}>
          {blocos.map((b) => (
            <div key={b.id} className="card">
              <strong>{b.nome}</strong>
              <div className="stack" style={{ marginTop: 8 }}>
                {b.apartamentos.map((ap) => (
                  <span key={ap.id} className="muted">
                    Apto {ap.numero}
                  </span>
                ))}
                {b.apartamentos.length === 0 && <span className="muted">Nenhum apartamento ainda.</span>}
              </div>
              <form
                onSubmit={(e) => handleCriarApartamento(b.id, e)}
                className="row"
                style={{ marginTop: 12 }}
              >
                <input
                  placeholder="Número do apartamento"
                  value={numeroApartamento[b.id] ?? ''}
                  onChange={(e) => setNumeroApartamento((prev) => ({ ...prev, [b.id]: e.target.value }))}
                  style={{ flex: 1 }}
                />
                <button type="submit">Adicionar</button>
              </form>
            </div>
          ))}
          {blocos.length === 0 && <p className="muted">Nenhum bloco cadastrado.</p>}
        </div>
        <form onSubmit={handleCriarBloco} className="stack" style={{ marginTop: 12, gap: 8 }}>
          <div className="row">
            <input
              placeholder="Ex: Bloco A"
              value={nomeBloco}
              onChange={(e) => setNomeBloco(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn-primary">
              Adicionar bloco
            </button>
          </div>
          <div className="row">
            <input
              type="number"
              min={1}
              placeholder="Andares (opcional)"
              value={andares}
              onChange={(e) => setAndares(e.target.value)}
              style={{ flex: 1 }}
            />
            <input
              type="number"
              min={1}
              placeholder="Apartamentos por andar (opcional)"
              value={apartamentosPorAndar}
              onChange={(e) => setApartamentosPorAndar(e.target.value)}
              style={{ flex: 1 }}
            />
          </div>
          <p className="muted" style={{ fontSize: '0.78rem' }}>
            Preencha andares e apartamentos por andar para gerar tudo de uma vez (ex.: 5 andares × 4
            apartamentos gera 20 unidades numeradas 101–504).
          </p>
        </form>
      </div>
    </div>
  );
}

export default function EstruturaPredioPage() {
  return (
    <RequireAuth papeis={['GESTOR']}>
      <GerenciarEstrutura />
    </RequireAuth>
  );
}
