import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '../../../services/api';
import Domain from './Domain';

vi.mock('../../../services/api', () => ({ api: { post: vi.fn(), delete: vi.fn() } }));
vi.mock('../LangContext', async () => {
  const { translate } = await import('../i18n');
  return { useLang: () => ({ lang: 'pt', t: (k, p) => translate('pt', k, p), err: () => 'erro' }) };
});
const ctx = vi.hoisted(() => ({ current: null }));
vi.mock('../PanelContext', () => ({ BASE: (id) => `/api/v1/dropshipping/stores/${id}`, usePanel: () => ctx.current }));

/** add-store-domain-dns-guide: o guia aparece no Domain, e os data-testid que os E2E do painel usam continuam existindo. */
const pendente = {
  id: 9, dominio: 'painel.exemplo.com.br', status: 'PENDENTE', tls_status: null,
  instrucoes: {
    zona: 'exemplo.com.br', raiz: false,
    txt: { nome: '_arpt-verify.painel.exemplo.com.br', nome_relativo: '_arpt-verify.painel', tipo: 'TXT', valor: 'f'.repeat(64) },
    apontamento: { cname: 'lojas.arpt.site', ips: [], raiz_suportada: false, recomendado: 'CNAME', observacao: 'x' },
  },
};
const painel = (domains) => ({ store: { id: 5 }, domains, reload: vi.fn(), notify: vi.fn(), access: 'edit' });

beforeEach(() => { vi.clearAllMocks(); ctx.current = painel([pendente]); });
afterEach(cleanup);

describe('Domain: guia de DNS', () => {
  it('domínio pendente mostra o guia, com o nome completo do TXT em dns-instructions (contrato dos E2E)', () => {
    render(<Domain />);
    expect(screen.getByTestId('domain-status').textContent).toBe('Pendente');
    expect(screen.getByTestId('dns-instructions').textContent).toContain('_arpt-verify.painel.exemplo.com.br');
    expect(screen.getByTestId('dns-point-destino').textContent).toBe('lojas.arpt.site');
  });

  it('domínio já verificado não mostra o guia', () => {
    ctx.current = painel([{ ...pendente, status: 'VERIFICADO', tls_status: 'ATIVO' }]);
    render(<Domain />);
    expect(screen.queryByTestId('dns-instructions')).toBeNull();
  });

  it('Verificar com pendência mostra verify-pending com o que falta (contrato dos E2E)', async () => {
    api.post.mockResolvedValue({ data: { verificado: false, faltando: ['TXT'], inconclusivo: false } });
    render(<Domain />);
    await userEvent.setup().click(screen.getByTestId('verify-domain'));
    const aviso = await screen.findByTestId('verify-pending');
    expect(api.post).toHaveBeenCalledWith('/api/v1/dropshipping/stores/5/storefront/domains/9/verify');
    expect(within(aviso).getByTestId('diag-txt')).toBeTruthy();
  });

  it('Verificar com consulta inconclusiva não acusa o dono', async () => {
    api.post.mockResolvedValue({ data: { verificado: false, faltando: ['TXT', 'APONTAMENTO'], inconclusivo: true } });
    render(<Domain />);
    await userEvent.setup().click(screen.getByTestId('verify-domain'));
    expect(await screen.findByTestId('diag-inconclusive')).toBeTruthy();
    expect(screen.queryByTestId('diag-txt')).toBeNull();
  });

  it('Verificar com sucesso não mostra pendência', async () => {
    api.post.mockResolvedValue({ data: { verificado: true, faltando: [], inconclusivo: false } });
    render(<Domain />);
    await userEvent.setup().click(screen.getByTestId('verify-domain'));
    await waitFor(() => expect(api.post).toHaveBeenCalled());
    expect(screen.queryByTestId('verify-pending')).toBeNull();
  });
});
