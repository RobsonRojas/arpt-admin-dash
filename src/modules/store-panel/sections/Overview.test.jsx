import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { api } from '../../../services/api';
import Overview from './Overview';

vi.mock('../../../services/api', () => ({ api: { get: vi.fn(), post: vi.fn() } }));
const idioma = vi.hoisted(() => ({ lang: 'pt' }));
vi.mock('../LangContext', async () => {
  const { translate } = await import('../i18n');
  return { useLang: () => ({ lang: idioma.lang, t: (k, p) => translate(idioma.lang, k, p), err: () => 'erro' }) };
});
vi.mock('../CampaignsCard', () => ({ default: () => null }));

const ctx = { current: null };
vi.mock('../PanelContext', () => ({
  BASE: (id) => `/api/v1/dropshipping/stores/${id}`,
  usePanel: () => ctx.current,
}));

const painel = (extra = {}) => ({
  store: { id: 5, nome: 'Acurui', slug: 'acurui', status: 'ATIVA' },
  papel: 'dono', config: { rascunho: {}, versao_publicada: 2, tem_alteracoes: false }, products: [], domains: [],
  reload: vi.fn(), refreshStores: vi.fn(), notify: vi.fn(), ...extra,
});
const endereco = (estado, extra = {}) => api.get.mockImplementation(async (url) => {
  if (url.endsWith('/storefront/address')) return { data: { estado, endereco: 'acurui.arpt.site', origem: 'plataforma', ...extra } };
  return { data: {} };
});
const montar = () => render(<Overview />);

beforeEach(() => { vi.clearAllMocks(); idioma.lang = 'pt'; ctx.current = painel(); });
afterEach(cleanup);

/** fix-store-subdomain-unreachable, 3.3: o aviso do endereço da plataforma na visão geral da loja. */
describe('visão geral: endereço da loja', () => {
  it('indisponivel: mostra o aviso com o endereço e tira o link e a pré-visualização ao vivo', async () => {
    endereco('indisponivel');
    montar();
    const aviso = await screen.findByTestId('address-inactive');
    expect(aviso.textContent).toContain('acurui.arpt.site');
    expect(aviso.textContent).toContain('ainda não está ativo');
    expect(screen.queryByTestId('store-link')).toBeNull();
    expect(screen.queryByTestId('preview-live')).toBeNull();
  });

  it('ativo: link e pré-visualização normais, sem aviso', async () => {
    endereco('ativo');
    montar();
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/v1/dropshipping/stores/5/storefront/address'));
    expect(screen.queryByTestId('address-inactive')).toBeNull();
    expect(screen.getByTestId('store-link').getAttribute('href')).toBe('https://acurui.arpt.site');
    expect(screen.getByTestId('preview-live')).toBeTruthy();
  });

  it('desconhecido: mantém o link, sem aviso de falha', async () => {
    endereco('desconhecido');
    montar();
    await waitFor(() => expect(api.get).toHaveBeenCalled());
    expect(screen.queryByTestId('address-inactive')).toBeNull();
    expect(screen.getByTestId('store-link')).toBeTruthy();
  });

  it('falha na consulta ou ainda carregando: mantém o link', async () => {
    api.get.mockRejectedValue(new Error('rede'));
    montar();
    expect(screen.getByTestId('store-link')).toBeTruthy(); // antes da resposta
    await waitFor(() => expect(api.get).toHaveBeenCalled());
    expect(screen.queryByTestId('address-inactive')).toBeNull();
    expect(screen.getByTestId('store-link')).toBeTruthy();
  });

  it('domínio próprio ativo: vale o domínio próprio e não há aviso, mesmo que o servidor diga indisponivel da plataforma', async () => {
    ctx.current = painel({ domains: [{ dominio: 'minhaloja.example.com', tls_status: 'ATIVO' }] });
    endereco('indisponivel', { endereco: 'minhaloja.example.com', origem: 'dominio_proprio' });
    montar();
    await waitFor(() => expect(api.get).toHaveBeenCalled());
    expect(screen.queryByTestId('address-inactive')).toBeNull();
    expect(screen.getByTestId('store-link').getAttribute('href')).toBe('https://minhaloja.example.com');
  });

  it('em inglês, o aviso aparece em inglês', async () => {
    idioma.lang = 'en';
    endereco('indisponivel');
    montar();
    expect((await screen.findByTestId('address-inactive')).textContent).toContain('is not live on the internet yet');
  });
});
