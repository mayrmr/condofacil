'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { AreaSocial, Bloco, LocalizacaoTipo, Ocorrencia, PerfilUsuario } from '@/lib/types';

const CATEGORIAS = [
  'iluminacao',
  'equipamento',
  'vazamento',
  'acessibilidade',
  'seguranca',
  'manutencao',
  'outro',
];

function FormularioNovaOcorrencia() {
  const router = useRouter();
  const { perfil } = useAuth();
  const predioId = (perfil as PerfilUsuario | null)?.predioId;

  const [blocos, setBlocos] = useState<Bloco[]>([]);
  const [areasSociais, setAreasSociais] = useState<AreaSocial[]>([]);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [localizacaoTipo, setLocalizacaoTipo] = useState<LocalizacaoTipo>('AREA_SOCIAL');
  const [localizacaoId, setLocalizacaoId] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!predioId) return;
    api.get<Bloco[]>(`/predios/${predioId}/blocos`).then(setBlocos);
    api.get<AreaSocial[]>(`/predios/${predioId}/areas-sociais`).then(setAreasSociais);
  }, [predioId]);

  const opcoesLocalizacao = useMemo(() => {
    if (localizacaoTipo === 'BLOCO') {
      return blocos.map((b) => ({ id: b.id, label: b.nome }));
    }
    if (localizacaoTipo === 'APARTAMENTO') {
      return blocos.flatMap((b) => b.apartamentos.map((a) => ({ id: a.id, label: `${b.nome} — apto ${a.numero}` })));
    }
    return areasSociais.map((a) => ({ id: a.id, label: a.nome }));
  }, [localizacaoTipo, blocos, areasSociais]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!localizacaoId) {
      setErro('Selecione a localização da ocorrência.');
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      const criada = await api.post<Ocorrencia>('/ocorrencias', {
        titulo,
        descricao,
        categoria,
        localizacaoTipo,
        localizacaoId,
      });
      router.push(`/ocorrencias/${criada.id}`);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível abrir a ocorrência.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="titulo">Título</label>
        <input id="titulo" required value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="descricao">Descrição</label>
        <textarea id="descricao" required value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="categoria">Categoria</label>
        <select id="categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
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
      <div className="field">
        <label htmlFor="localizacaoId">Local</label>
        <select id="localizacaoId" required value={localizacaoId} onChange={(e) => setLocalizacaoId(e.target.value)}>
          <option value="" disabled>
            Selecione...
          </option>
          {opcoesLocalizacao.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      {erro && <p className="erro">{erro}</p>}
      <button type="submit" className="btn-primary" disabled={enviando} style={{ width: '100%' }}>
        {enviando ? 'Enviando...' : 'Abrir ocorrência'}
      </button>
    </form>
  );
}

export default function NovaOcorrenciaPage() {
  return (
    <RequireAuth papeis={['USUARIO']}>
      <h1>Nova ocorrência</h1>
      <FormularioNovaOcorrencia />
    </RequireAuth>
  );
}
