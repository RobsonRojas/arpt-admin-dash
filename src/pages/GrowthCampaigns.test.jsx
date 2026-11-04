import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '../services/api';
import { GrowthCampaigns } from './GrowthCampaigns';
import { acoesPermitidas, corpoCampanha, errosCampanha, previaCustoMaximo } from '../utils/growthCampaigns';

vi.mock('../services/api', () => ({ api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), defaults: {} } }));

/** add-growth-campaigns-module, 6.8: lista, formulário inválido, ativação e estado vazio. */
const TIPOS = [
  { tipo: 'indicacao_bonus', rotulo: 'Indicação com bônus de comissão', incentivo: true, metas: ['dropshipper_loja'] },
  { tipo: 'kit_imprensa', rotulo: 'Kit de imprensa e parceiros', incentivo: false, metas: ['dropshipper_loja', 'produtor_ativo'] },
];
const campanha = (extra = {}) => ({
  id: 1, nome: 'Indicação de lançamento', tipo: 'indicacao_bonus', estado: 'rascunho', inicio: '2026-11-05T00:00:00Z', fim: '2027-01-05T00:00:00Z',
  meta_tipo: 'dropshipper_loja', meta_valor: 100, parametros: { passoPontos: 1, limiteComissaoTotal: 20, duracaoBonusMeses: 4 }, progresso: 12, alertas: [], ...extra,
});
const METRICAS_VAZIAS = {
  campanhaId: 1, tipo: 'indicacao_bonus', estado: 'ativa', novosCadastros: 0, novosDropshippersComLoja: 0, novosProdutoresAtivos: 0,
  meta: { tipo: 'dropshipper_loja', valor: 100, progresso: 0, percentual: 0, diasRestantes: 60 },
  funil: ['alcance', 'cadastro', 'email_verificado', 'ativacao', 'primeira_venda'].map((etapa) => ({ etapa, quantidade: 0, taxaDaEtapaAnterior: null })),
  incentivo: { totalConcedido: 0, orcamento: null, custoPorNovoMembro: null }, retencao: { d30: { ativos: 0, elegiveis: 0, excluidos: 0, taxa: null }, d90: { ativos: 0, elegiveis: 0, excluidos: 0, taxa: null } },
  alertas: [], evolucaoDiaria: [],
};
function servidor({ campanhas = [campanha()], incentivos = true, metricas = METRICAS_VAZIAS } = {}) {
  api.get.mockImplementation(async (url) => {
    if (url.endsWith('/tipos')) return { data: TIPOS };
    if (url.endsWith('/metrics')) return { data: metricas };
    if (url.includes('/settings')) return { data: { growthIncentivesEnabled: incentivos, dropshipperCommissionPercent: 7 } };
    return { data: campanhas };
  });
}

beforeEach(() => { vi.clearAllMocks(); });
afterEach(cleanup);

describe('regras da tela', () => {
  it('formulário exige nome, prazo posterior ao início e meta; incentivo exige teto', () => {
    const tipo = TIPOS[0];
    const ok = { nome: 'Campanha X', tipo: 'indicacao_bonus', inicio: '2026-11-05T10:00', fim: '2027-01-05T10:00', metaTipo: 'dropshipper_loja', metaValor: '100', parametros: { passoPontos: '1', limiteComissaoTotal: '20', duracaoBonusMeses: '4' } };
    expect(errosCampanha(ok, tipo)).toEqual({});
    expect(errosCampanha({ ...ok, metaValor: '' }, tipo).metaValor).toBeDefined();
    expect(errosCampanha({ ...ok, fim: '2026-11-01T10:00' }, tipo).fim).toBeDefined();
    expect(errosCampanha({ ...ok, fim: '' }, tipo).fim).toMatch(/obrigatório/);
    expect(errosCampanha({ ...ok, parametros: { ...ok.parametros, limiteComissaoTotal: '' } }, tipo)['parametros.limiteComissaoTotal']).toBeDefined();
    expect(corpoCampanha(ok, tipo).parametros).toEqual({ passoPontos: 1, limiteComissaoTotal: 20, duracaoBonusMeses: 4 });
  });
  it('prévia do custo máximo: 20% de teto com 7% inicial = 13 pontos em 13 passos', () => {
    expect(previaCustoMaximo({ passoPontos: '1', limiteComissaoTotal: '20', duracaoBonusMeses: '4' }, 7)).toEqual({ bonusMaximoPontos: 13, passos: 13, meses: 4 });
    expect(previaCustoMaximo({ passoPontos: '', limiteComissaoTotal: '20', duracaoBonusMeses: '4' }, 7)).toBeNull();
  });
  it('ações disponíveis por estado', () => {
    expect(acoesPermitidas('rascunho')).toMatchObject({ editar: true, activate: true, pause: false, close: true, duplicate: false });
    expect(acoesPermitidas('ativa')).toMatchObject({ editar: false, activate: false, pause: true, resume: false, close: true });
    expect(acoesPermitidas('encerrada')).toMatchObject({ close: false, pause: false, duplicate: true });
  });
});

describe('lista', () => {
  it('mostra nome, mecanismo, estado, período, progresso e alerta', async () => {
    servidor({ campanhas: [campanha({ estado: 'ativa', alertas: ['ritmo_abaixo_do_esperado'] })] });
    render(<GrowthCampaigns />);
    expect(await screen.findByText('Indicação de lançamento')).toBeTruthy();
    expect(screen.getAllByText('Indicação com bônus de comissão').length).toBeGreaterThan(0);
    expect(screen.getByText('Ativa')).toBeTruthy();
    expect(screen.getByText('12 / 100')).toBeTruthy();
    expect(screen.getByText(/Ritmo abaixo do esperado/)).toBeTruthy();
  });
  it('sem campanhas explica como criar a primeira', async () => {
    servidor({ campanhas: [] });
    render(<GrowthCampaigns />);
    expect(await screen.findByText(/Nenhuma campanha/)).toBeTruthy();
  });
});

describe('formulário', () => {
  it('inválido: mostra os erros por campo e não envia', async () => {
    servidor();
    render(<GrowthCampaigns />);
    await screen.findByText('Indicação de lançamento');
    await userEvent.click(screen.getByRole('button', { name: 'Nova campanha' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Salvar rascunho' }));
    expect(await screen.findByText(/nome com ao menos 3 letras/)).toBeTruthy();
    expect(screen.getByText(/Escolha o mecanismo/)).toBeTruthy();
    expect(screen.getByText(/A meta é obrigatória/)).toBeTruthy();
    expect(api.post).not.toHaveBeenCalled();
  });
  it('erro do servidor aparece junto do campo', async () => {
    servidor();
    api.post.mockRejectedValue({ response: { data: { message: 'Dados da campanha inválidos.', campos: { 'parametros.limiteComissaoTotal': 'O limite não pode superar a comissão ARPT bruta vigente.' } } } });
    render(<GrowthCampaigns />);
    await screen.findByText('Indicação de lançamento');
    await userEvent.click(screen.getByRole('button', { name: 'Nova campanha' }));
    const dialogo = await screen.findByRole('dialog');
    await userEvent.type(within(dialogo).getByLabelText('Nome da campanha'), 'Campanha nova');
    await userEvent.click(within(dialogo).getByLabelText('Mecanismo'));
    await userEvent.click(await screen.findByRole('option', { name: 'Indicação com bônus de comissão' }));
    await userEvent.type(within(dialogo).getByLabelText('Meta (quantidade)'), '100');
    expect(within(dialogo).getByTestId('previa-custo').textContent).toMatch(/até 13 pontos percentuais/);
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Salvar rascunho' }));
    expect(await within(dialogo).findByText(/não pode superar a comissão ARPT bruta/)).toBeTruthy();
  });
});

describe('ativação e estado vazio', () => {
  it('ativar pede confirmação e chama a rota', async () => {
    servidor();
    api.post.mockResolvedValue({ data: campanha({ estado: 'ativa' }) });
    render(<GrowthCampaigns />);
    await userEvent.click(await screen.findByText('Indicação de lançamento'));
    await userEvent.click(await screen.findByRole('button', { name: 'Ativar' }));
    expect(api.post).not.toHaveBeenCalled(); // só depois de confirmar
    await userEvent.click(await screen.findByRole('button', { name: 'Confirmar' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/admin/growth/campaigns/1/activate'));
  });
  it('com a chave de incentivo desligada avisa e desabilita a ativação de campanha com incentivo', async () => {
    servidor({ incentivos: false });
    render(<GrowthCampaigns />);
    expect(await screen.findByTestId('aviso-chave')).toBeTruthy();
    await userEvent.click(await screen.findByText('Indicação de lançamento'));
    expect(await screen.findByRole('button', { name: 'Ativar' })).toHaveProperty('disabled', true);
  });
  it('campanha sem dados mostra o estado vazio explicativo e os botões que o estado não permite desabilitados', async () => {
    servidor({ campanhas: [campanha({ estado: 'ativa' })] });
    render(<GrowthCampaigns />);
    await userEvent.click(await screen.findByText('Indicação de lançamento'));
    expect(await screen.findByText(/Ainda não há dados/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Retomar' })).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: 'Duplicar' })).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: 'Pausar' })).toHaveProperty('disabled', false);
  });
});
