'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase-client';
import type { Aviso, AreaSocial, Bloco, DestinatarioAviso, LocalizacaoTipoAviso, PerfilFuncionarioOuGestor } from '@/lib/types';

const CATEGORIAS = ['geral', 'manutencao', 'seguranca', 'assembleia', 'urgente', 'financeiro', 'evento', 'outro'];

function FormularioNovoAviso() {
  const router = useRouter();
  const { perfil } = useAuth();
  const predioId = (perfil as PerfilFuncionarioOuGestor | null)?.predios?.[0]?.predio.id;

  const [blocos, setBlocos] = useState<Bloco[]>([]);
  const [areasSociais, setAreasSociais] = useState<AreaSocial[]>([]);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [localizacaoTipo, setLocalizacaoTipo] = useState<LocalizacaoTipoAviso>('GERAL');
  const [localizacaoId, setLocalizacaoId] = useState('');
  const [destinatarioTipo, setDestinatarioTipo] = useState<DestinatarioAviso>('TODOS');
  const [destinatarioBlocoId, setDestinatarioBlocoId] = useState('');
  const [imagem, setImagem] = useState<File | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!predioId) return;
    api.get<Bloco[]>(`/predios/${predioId}/blocos`).then(setBlocos);
    api.get<AreaSocial[]>(`/predios/${predioId}/areas-sociais`).then(setAreasSociais);
  }, [predioId]);

  const opcoesLocalizacao = useMemo(() => {
    if (localizacaoTipo === 'BLOCO') return blocos.map((b) => ({ id: b.id, label: b.nome }));
    if (localizacaoTipo === 'AREA_SOCIAL') return areasSociais.map((a) => ({ id: a.id, label: a.nome }));
    return [];
  }, [localizacaoTipo, blocos, areasSociais]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (localizacaoTipo !== 'GERAL' && !localizacaoId) {
      setErro('Selecione o local do aviso.');
      return;
    }
    if (destinatarioTipo === 'BLOCO' && !destinatarioBlocoId) {
      setErro('Selecione para qual bloco enviar o aviso.');
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      const criado = await api.post<Aviso>('/avisos', {
        titulo,
        descricao,
        categoria,
        localizacaoTipo,
        ...(localizacaoTipo !== 'GERAL' ? { localizacaoId } : {}),
        destinatarioTipo,
        ...(destinatarioTipo === 'BLOCO' ? { destinatarioBlocoId } : {}),
      });

      if (imagem) {
        const { path, token } = await api.post<{ path: string; token: string }>(
          `/avisos/${criado.id}/imagens/solicitar-upload`,
          { contentType: imagem.type, tamanhoBytes: imagem.size },
        );
        const { error } = await supabase.storage.from('ocorrencias').uploadToSignedUrl(path, token, imagem);
        if (error) throw error;
        await api.post(`/avisos/${criado.id}/imagens`, { path });
      }

      router.push('/avisos');
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível publicar o aviso.');
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

      <div className="row">
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="destinatarioTipo">Enviar para</label>
          <select
            id="destinatarioTipo"
            value={destinatarioTipo}
            onChange={(e) => {
              setDestinatarioTipo(e.target.value as DestinatarioAviso);
              setDestinatarioBlocoId('');
            }}
          >
            <option value="TODOS">Todos</option>
            <option value="BLOCO">Um bloco específico</option>
          </select>
        </div>
        {destinatarioTipo === 'BLOCO' && (
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="destinatarioBlocoId">Bloco</label>
            <select
              id="destinatarioBlocoId"
              value={destinatarioBlocoId}
              onChange={(e) => setDestinatarioBlocoId(e.target.value)}
            >
              <option value="">Selecione...</option>
              {blocos.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nome}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="row">
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="localizacaoTipo">Tipo de local</label>
          <select
            id="localizacaoTipo"
            value={localizacaoTipo}
            onChange={(e) => {
              setLocalizacaoTipo(e.target.value as LocalizacaoTipoAviso);
              setLocalizacaoId('');
            }}
          >
            <option value="GERAL">Geral</option>
            <option value="AREA_SOCIAL">Área social</option>
            <option value="BLOCO">Bloco</option>
          </select>
        </div>
        {localizacaoTipo !== 'GERAL' && (
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="localizacaoId">Local</label>
            <select id="localizacaoId" value={localizacaoId} onChange={(e) => setLocalizacaoId(e.target.value)}>
              <option value="">Selecione...</option>
              {opcoesLocalizacao.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="field">
        <label htmlFor="imagem">Imagem (opcional)</label>
        <input
          id="imagem"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setImagem(e.target.files?.[0] ?? null)}
        />
      </div>

      {erro && <p className="erro">{erro}</p>}
      <button type="submit" className="btn-primary" disabled={enviando} style={{ width: '100%' }}>
        {enviando ? 'Publicando...' : 'Publicar aviso'}
      </button>
    </form>
  );
}

export default function NovoAvisoPage() {
  return (
    <RequireAuth papeis={['GESTOR']}>
      <h1>Novo aviso</h1>
      <FormularioNovoAviso />
    </RequireAuth>
  );
}
