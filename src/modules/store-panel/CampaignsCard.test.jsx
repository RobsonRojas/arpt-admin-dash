import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '../../services/api';
import { LangProvider } from './LangContext';
import CampaignsCard from './CampaignsCard';

vi.mock('../../services/api', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), defaults: {} } }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }));

/** add-campaign-adhesion-outreach, 6.1 a 6.3 no painel do dropshipper: aviso, condições, adesão, desistência e a caixa opcional de e-mail. */
const campanha = (extra = {}) => ({
  id: 7, nome: 'Indicação', tipo: 'indicacao_bonus', titulo: 'Convide e ganhe', resumo: 'Bônus de comissão por indicado', corpo: 'Texto <b>da</b> promoção.',
  fim: '2027-01-05T00:00:00Z', incentivos: { selo: true }, papel: 'dropshipper', aderiu: false, dispensada: false, aviso: true,
  bonus: { passoPontos: 1, limiteComissaoTotal: 20, duracaoBonusMeses: 4 }, ...extra,
});
function servidor(lista, recebe = false) {
  api.get.mockImplementation(async (url) => (url.includes('preferencias') ? { data: { recebe } } : { data: lista }));
}
const montar = () => render(<LangProvider><CampaignsCard /></LangProvider>);

beforeEach(() => { vi.clearAllMocks(); api.post.mockResolvedValue({ data: {} }); api.put.mockResolvedValue({ data: {} }); api.delete.mockResolvedValue({ data: {} }); });
afterEach(cleanup);

describe('cartão de campanhas do dropshipper', () => {
  it('mostra o aviso com contador e conta "visto" uma só vez', async () => {
    servidor([campanha()]);
    montar();
    expect(await screen.findByText('Convide e ganhe')).toBeTruthy();
    expect(screen.getByTestId('campaigns-count').textContent).toBe('1');
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/growth/campanhas/7/aviso/visto'));
    expect(api.post.mock.calls.filter((c) => c[0].endsWith('/visto'))).toHaveLength(1);
  });
  it('condições aparecem como TEXTO, com o bônus e a regra de que não retroage', async () => {
    servidor([campanha()]);
    montar();
    await userEvent.click(await screen.findByRole('button', { name: 'Ver condições' }));
    const cond = screen.getByTestId('conditions-7');
    expect(cond.textContent).toContain('Texto <b>da</b> promoção.');
    expect(cond.querySelector('b')).toBeNull();
    expect(cond.textContent).toContain('teto de 20% de comissão total');
    expect(cond.textContent).toContain('depois da sua adesão');
  });
  it('aderir manda o papel; depois mostra "Você participa" e permite deixar de participar', async () => {
    let aderiu = false;
    api.get.mockImplementation(async (url) => (url.includes('preferencias') ? { data: { recebe: false } } : { data: [campanha({ aderiu, aviso: !aderiu })] }));
    api.post.mockImplementation(async (url) => { if (url.endsWith('/adesao')) aderiu = true; return { data: {} }; });
    api.delete.mockImplementation(async () => { aderiu = false; return { data: {} }; });
    montar();
    await userEvent.click(await screen.findByRole('button', { name: 'Quero participar' }));
    expect(api.post).toHaveBeenCalledWith('/growth/campanhas/7/adesao', { papel: 'dropshipper' });
    expect(await screen.findByText('Você participa')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Deixar de participar' }));
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/growth/campanhas/7/adesao'));
  });
  it('recusa do servidor aparece no cartão', async () => {
    servidor([campanha()]);
    api.post.mockImplementation(async (url) => { if (url.endsWith('/adesao')) throw { response: { data: { message: 'A campanha não está ativa.' } } }; return { data: {} }; });
    montar();
    await userEvent.click(await screen.findByRole('button', { name: 'Quero participar' }));
    expect(await screen.findByText('A campanha não está ativa.')).toBeTruthy();
  });
  it('dispensar remove o aviso e avisa o servidor', async () => {
    servidor([campanha()]);
    montar();
    await userEvent.click(await screen.findByRole('button', { name: 'Dispensar' }));
    await waitFor(() => expect(screen.queryByText('Convide e ganhe')).toBeNull());
    expect(api.post).toHaveBeenCalledWith('/growth/campanhas/7/aviso/dispensar');
  });
  it('sem campanhas mostra a mensagem vazia', async () => {
    servidor([]);
    montar();
    expect(await screen.findByText('Nenhuma campanha ativa para o seu perfil no momento.')).toBeTruthy();
  });
  it('a caixa de e-mail vem desmarcada e só leva "receber" (nunca um e-mail digitado)', async () => {
    servidor([]);
    montar();
    const caixa = await screen.findByRole('checkbox');
    expect(caixa.checked).toBe(false);
    await userEvent.click(caixa);
    await waitFor(() => expect(api.put).toHaveBeenCalledWith('/growth/preferencias/campanha-email', { receber: true }));
    expect(Object.keys(api.put.mock.calls[0][1])).toEqual(['receber']);
  });
  it('carga repetida não acontece: uma única chamada de lista por montagem', async () => {
    servidor([campanha()]);
    montar();
    await screen.findByText('Convide e ganhe');
    await new Promise((r) => setTimeout(r, 50));
    expect(api.get.mock.calls.filter((c) => c[0] === '/growth/campanhas')).toHaveLength(1);
  });
});
