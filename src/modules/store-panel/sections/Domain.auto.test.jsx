import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { api } from '../../../services/api';
import Domain, { ACOMPANHAR_MS } from './Domain';
import { translate } from '../i18n';

vi.mock('../../../services/api', () => ({ api: { post: vi.fn(), delete: vi.fn() } }));
vi.mock('../LangContext', async () => {
  const { translate: tr } = await import('../i18n');
  return { useLang: () => ({ lang: 'pt', t: (k, p) => tr('pt', k, p), err: () => 'erro' }) };
});
const ctx = vi.hoisted(() => ({ current: null }));
vi.mock('../PanelContext', () => ({ BASE: (id) => `/api/v1/dropshipping/stores/${id}`, usePanel: () => ctx.current }));

/** add-automatic-store-domain-activation (2.1 e 2.2): a tela do domínio acompanha o estado sozinha, sem clique. */
const base = {
  id: 9, dominio: 'painel.exemplo.com.br', status: 'PENDENTE', tls_status: null,
  instrucoes: {
    zona: 'exemplo.com.br', raiz: false,
    txt: { nome: '_arpt-verify.painel.exemplo.com.br', nome_relativo: '_arpt-verify.painel', tipo: 'TXT', valor: 'f'.repeat(64) },
    apontamento: { cname: 'lojas.arpt.site', ips: [], raiz_suportada: false, recomendado: 'CNAME', observacao: 'x' },
  },
};
let reloadDomains; let notify; let oculta;
const painel = (domains) => ({ store: { id: 5 }, domains, reload: vi.fn(), reloadDomains, notify, access: 'edit' });
const avancar = (ms) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  reloadDomains = vi.fn().mockResolvedValue(undefined);
  notify = vi.fn();
  oculta = false;
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => oculta });
  ctx.current = painel([base]);
});
afterEach(() => { cleanup(); vi.useRealTimers(); delete document.hidden; });

describe('acompanha o estado sozinho', () => {
  it('domínio pendente: confere a cada intervalo, sem clique, e continua conferindo', async () => {
    render(<Domain />);
    expect(reloadDomains).not.toHaveBeenCalled();
    await avancar(ACOMPANHAR_MS - 1);
    expect(reloadDomains).not.toHaveBeenCalled();
    await avancar(1);
    expect(reloadDomains).toHaveBeenCalledTimes(1);
    await avancar(ACOMPANHAR_MS);
    await avancar(ACOMPANHAR_MS);
    expect(reloadDomains).toHaveBeenCalledTimes(3);
  });

  it('certificado em emissão também é acompanhado', async () => {
    ctx.current = painel([{ ...base, status: 'VERIFICADO', tls_status: 'EMITINDO' }]);
    render(<Domain />);
    await avancar(ACOMPANHAR_MS);
    expect(reloadDomains).toHaveBeenCalledTimes(1);
  });

  it('domínio verificado com certificado ativo, ou sem domínio nenhum: não consulta', async () => {
    ctx.current = painel([{ ...base, status: 'VERIFICADO', tls_status: 'ATIVO' }]);
    const { unmount } = render(<Domain />);
    await avancar(ACOMPANHAR_MS * 4);
    expect(reloadDomains).not.toHaveBeenCalled();
    unmount();
    ctx.current = painel([]);
    render(<Domain />);
    await avancar(ACOMPANHAR_MS * 4);
    expect(reloadDomains).not.toHaveBeenCalled();
  });

  it('para quando não há mais nada em andamento (o domínio ficou ativo)', async () => {
    const { rerender } = render(<Domain />);
    await avancar(ACOMPANHAR_MS);
    expect(reloadDomains).toHaveBeenCalledTimes(1);
    ctx.current = painel([{ ...base, status: 'VERIFICADO', tls_status: 'ATIVO' }]);
    rerender(<Domain />);
    await avancar(ACOMPANHAR_MS * 4);
    expect(reloadDomains).toHaveBeenCalledTimes(1);
  });

  it('aba oculta: pausa; ao voltar a ficar visível, confere na hora e retoma o ritmo', async () => {
    render(<Domain />);
    oculta = true;
    await avancar(ACOMPANHAR_MS * 3);
    expect(reloadDomains).not.toHaveBeenCalled();
    oculta = false;
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(reloadDomains).toHaveBeenCalledTimes(1);
    await avancar(ACOMPANHAR_MS);
    expect(reloadDomains).toHaveBeenCalledTimes(2);
  });

  it('ao sair da tela, para de consultar', async () => {
    const { unmount } = render(<Domain />);
    await avancar(ACOMPANHAR_MS);
    expect(reloadDomains).toHaveBeenCalledTimes(1);
    unmount();
    await avancar(ACOMPANHAR_MS * 4);
    expect(reloadDomains).toHaveBeenCalledTimes(1);
  });

  it('não atropela uma ação do dono em andamento (verificar ou cadastrar)', async () => {
    let terminar;
    api.post.mockImplementation(() => new Promise((ok) => { terminar = () => ok({ data: { verificado: false, faltando: ['TXT'], inconclusivo: false } }); }));
    render(<Domain />);
    fireEvent.click(screen.getByTestId('verify-domain'));
    await avancar(ACOMPANHAR_MS * 2);
    expect(reloadDomains).not.toHaveBeenCalled();
    await act(async () => { terminar(); });
    await avancar(ACOMPANHAR_MS);
    expect(reloadDomains).toHaveBeenCalledTimes(1);
  });
});

describe('ativação feita pelo servidor', () => {
  it('avisa quando o domínio pendente passa a verificado com a tela aberta', async () => {
    const { rerender } = render(<Domain />);
    expect(notify).not.toHaveBeenCalled();
    ctx.current = painel([{ ...base, status: 'VERIFICADO', tls_status: 'EMITINDO' }]);
    rerender(<Domain />);
    expect(notify).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledWith('success', 'O domínio painel.exemplo.com.br foi verificado automaticamente.');
    expect(screen.getByTestId('domain-status').textContent).toBe('Verificado');
  });

  it('domínio que já chega verificado não gera aviso, e o certificado ficar ativo depois também não', async () => {
    ctx.current = painel([{ ...base, status: 'VERIFICADO', tls_status: 'EMITINDO' }]);
    const { rerender } = render(<Domain />);
    ctx.current = painel([{ ...base, status: 'VERIFICADO', tls_status: 'ATIVO' }]);
    rerender(<Domain />);
    expect(notify).not.toHaveBeenCalled();
  });

  it('o botão Verificar continua existindo para checar na hora', async () => {
    api.post.mockResolvedValue({ data: { verificado: false, faltando: ['TXT'], inconclusivo: false } });
    render(<Domain />);
    fireEvent.click(screen.getByTestId('verify-domain'));
    await avancar(1);
    expect(api.post).toHaveBeenCalledWith('/api/v1/dropshipping/stores/5/storefront/domains/9/verify');
  });
});

describe('textos deixam de pedir o clique', () => {
  it('guia: explica que a verificação é automática e que o Verificar é opcional (pt e en)', () => {
    render(<Domain />);
    const guia = screen.getByTestId('dns-instructions').parentElement?.textContent ?? document.body.textContent;
    expect(document.body.textContent).not.toMatch(/Depois clique em Verificar/);
    expect(document.body.textContent).toMatch(/confere o DNS sozinho/);
    expect(guia).toBeTruthy();
    for (const lang of ['pt', 'en']) {
      const intro = translate(lang, 'dnsg_intro');
      const prop = translate(lang, 'dnsg_propagation');
      expect(intro).not.toMatch(/Depois clique em Verificar|Then click Verify/);
      expect(prop).not.toMatch(/clicar em Verificar de novo|click Verify again/);
      expect(intro + prop).toMatch(lang === 'pt' ? /sozinho/ : /on its own/);
      expect(prop).toMatch(lang === 'pt' ? /Se quiser conferir na hora, clique em Verificar/ : /To check right away, click Verify/);
      expect(translate(lang, 'domain_added')).not.toMatch(/verifique\.|and verify\./);
    }
  });
});
