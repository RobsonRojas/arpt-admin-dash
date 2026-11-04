import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '../services/api';
import { PromocaoCampanha } from './PromocaoCampanha';
import { errosPromocao, estadoDoEnvio, motivoCanalBloqueado, segmentosDoPublico } from '../utils/campaignOutreach';

vi.mock('../services/api', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), defaults: {} } }));

/** add-campaign-adhesion-outreach, 5.6: formulário inválido, prévia, ligar com confirmação e cancelamento, chave desligada, funil e estado vazio. */
const TIPO = { tipo: 'indicacao_bonus', rotulo: 'Indicação com bônus de comissão', incentivo: true, metas: ['dropshipper_loja'] };
const campanha = (estado = 'ativa') => ({ id: 7, nome: 'Indicação', tipo: 'indicacao_bonus', estado });
const PROMOCAO = {
  campanha_id: 7, publico: 'dropshipper', segmento: null, titulo: 'Convide e ganhe', resumo: 'Bônus de comissão por indicado',
  corpo: 'Texto da promoção com as condições completas.', canal_notificacao: false, canal_email: false, lembrete_dias: 5, versao_texto: 1, incentivos: {},
};
const CHAVES = { notificacao: true, email: true, incentivosFinanceiros: true };
const PREVIA = { publico: 200, aviso: 200, emailComConsentimento: 60 };
const FUNIL_VAZIO = { etapas: ['alcancados', 'avisos_vistos', 'emails_enviados', 'adesoes', 'novos_membros'].map((etapa) => ({ etapa, total: 0, taxaDaEtapaAnterior: null })), descadastros: 0, semConsentimento: 0, avisosDispensados: 0, semDados: true };
const FUNIL_COM_DADOS = {
  etapas: [
    { etapa: 'alcancados', total: 200, taxaDaEtapaAnterior: null }, { etapa: 'avisos_vistos', total: 100, taxaDaEtapaAnterior: 0.5 },
    { etapa: 'emails_enviados', total: 60, taxaDaEtapaAnterior: 0.3 }, { etapa: 'adesoes', total: 40, taxaDaEtapaAnterior: 0.2 }, { etapa: 'novos_membros', total: 10, taxaDaEtapaAnterior: 0.25 },
  ], descadastros: 2, semConsentimento: 5, avisosDispensados: 7, semDados: false,
};

function servidor({ promocao = PROMOCAO, chaves = CHAVES, previa = PREVIA, funil = FUNIL_VAZIO } = {}) {
  api.get.mockImplementation(async (url) => {
    if (url.endsWith('/outreach/preview')) return { data: previa };
    if (url.endsWith('/outreach/metrics')) return { data: { configurada: !!promocao, canais: {}, envio: { enviados: 0, pendentes: 0, cancelados: 0 }, funil } };
    return { data: { promocao, chaves } };
  });
}
const abrir = async (estado = 'ativa') => { render(<PromocaoCampanha campanha={campanha(estado)} tipo={TIPO} />); await screen.findByTestId('aba-promocao'); };

beforeEach(() => { vi.clearAllMocks(); });
afterEach(cleanup);

describe('regras puras', () => {
  const ok = { publico: 'dropshipper', segmento: '', titulo: 'Convide e ganhe', resumo: 'Resumo', corpo: 'Texto da promoção completo.', lembreteDias: '5', incentivos: { citaBonus: false } };
  it('exige título, resumo, texto, segmento coerente e lembrete de 1 a 30 dias', () => {
    expect(errosPromocao(ok)).toEqual({});
    expect(errosPromocao({ ...ok, titulo: '' }).titulo).toBeDefined();
    expect(errosPromocao({ ...ok, corpo: 'curto' }).corpo).toBeDefined();
    expect(errosPromocao({ ...ok, publico: 'produtor', segmento: 'dropshipper_sem_loja' }).segmento).toBeDefined();
    expect(errosPromocao({ ...ok, publico: 'ambos', segmento: 'dropshipper_sem_loja' }).segmento).toBeDefined();
    expect(errosPromocao({ ...ok, lembreteDias: '0' }).lembreteDias).toBeDefined();
  });
  it('citar o bônus exige campanha com incentivo e a chave financeira ligada', () => {
    const cita = { ...ok, incentivos: { citaBonus: true } };
    expect(errosPromocao(cita, { incentivoDoTipo: true, incentivosLigados: true })).toEqual({});
    expect(errosPromocao(cita, { incentivoDoTipo: true, incentivosLigados: false })['incentivos.citaBonus']).toMatch(/desligada/);
    expect(errosPromocao(cita, { incentivoDoTipo: false, incentivosLigados: true })['incentivos.citaBonus']).toMatch(/não concede/);
  });
  it('segmentos só do público escolhido', () => {
    expect(segmentosDoPublico('produtor').map((s) => s.chave)).toEqual(['produtor_sem_produto_ativo']);
    expect(segmentosDoPublico('ambos')).toEqual([]);
  });
  it('motivo de o canal não poder ser ligado', () => {
    const base = { campanhaEstado: 'ativa', chaves: CHAVES, previa: PREVIA, citaBonus: false };
    expect(motivoCanalBloqueado('email', base)).toBeNull();
    expect(motivoCanalBloqueado('email', { ...base, campanhaEstado: 'pausada' })).toMatch(/campanha ativa/);
    expect(motivoCanalBloqueado('email', { ...base, chaves: { ...CHAVES, email: false } })).toMatch(/desligado na configuração/);
    expect(motivoCanalBloqueado('email', { ...base, previa: { ...PREVIA, publico: 0 } })).toMatch(/nenhuma pessoa/);
    expect(motivoCanalBloqueado('email', { ...base, citaBonus: true, chaves: { ...CHAVES, incentivosFinanceiros: false } })).toMatch(/bônus/);
  });
  it('estado do envio', () => {
    const base = { campanhaEstado: 'ativa', canais: { email: false, notificacao: false }, envio: { enviados: 0, pendentes: 0, cancelados: 0 }, previa: PREVIA };
    expect(estadoDoEnvio(base)).toBe('aguardando');
    expect(estadoDoEnvio({ ...base, canais: { email: true } })).toBe('enviando');
    expect(estadoDoEnvio({ ...base, canais: { email: true }, campanhaEstado: 'pausada' })).toBe('interrompido');
    expect(estadoDoEnvio({ ...base, canais: { email: true }, envio: { enviados: 60, pendentes: 0, cancelados: 140 } })).toBe('concluido');
  });
});

describe('formulário', () => {
  it('rascunho sem promoção: campos inválidos mostram o erro no campo e nada é enviado', async () => {
    servidor({ promocao: null });
    await abrir('rascunho');
    await userEvent.click(screen.getByRole('button', { name: /Salvar promoção/ }));
    expect(await screen.findByText('Informe um título.')).toBeInTheDocument();
    expect(screen.getByText('Escreva o texto da promoção.')).toBeInTheDocument();
    expect(api.put).not.toHaveBeenCalled();
  });
  it('erro do servidor aparece no próprio campo', async () => {
    servidor({ promocao: null });
    api.put.mockRejectedValue({ response: { data: { message: 'Dados da promoção inválidos.', campos: { corpo: 'O servidor recusou o texto.' } } } });
    await abrir('rascunho');
    await userEvent.type(screen.getByLabelText('Título'), 'Convide e ganhe');
    await userEvent.type(screen.getByLabelText('Resumo (aparece no aviso)'), 'Resumo do aviso');
    await userEvent.type(screen.getByLabelText('Texto da promoção'), 'Texto da promoção completo.');
    await userEvent.click(screen.getByRole('button', { name: /Salvar promoção/ }));
    expect(await screen.findByText('O servidor recusou o texto.')).toBeInTheDocument();
    expect(api.put).toHaveBeenCalledTimes(1);
  });
  it('salvar válido manda o corpo estrito e avisa que nada foi enviado', async () => {
    servidor({ promocao: null });
    api.put.mockResolvedValue({ data: PROMOCAO });
    await abrir('rascunho');
    await userEvent.type(screen.getByLabelText('Título'), 'Convide e ganhe');
    await userEvent.type(screen.getByLabelText('Resumo (aparece no aviso)'), 'Resumo do aviso');
    await userEvent.type(screen.getByLabelText('Texto da promoção'), 'Texto da promoção completo.');
    await userEvent.click(screen.getByRole('button', { name: /Salvar promoção/ }));
    await screen.findByText(/Nada foi enviado/);
    expect(api.put).toHaveBeenCalledWith('/admin/growth/campaigns/7/outreach', expect.objectContaining({
      publico: 'dropshipper', segmento: null, titulo: 'Convide e ganhe', lembreteDias: 5, incentivos: { selo: false, materiaisAntecipados: false, citaBonus: false },
    }));
  });
  it('campanha ativa: campos travados e sem botão de salvar', async () => {
    servidor();
    await abrir('ativa');
    expect(screen.getByLabelText('Título')).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Salvar promoção/ })).not.toBeInTheDocument();
  });
});

describe('prévia e canais', () => {
  it('prévia mostra só contagens', async () => {
    servidor();
    await abrir();
    const previa = await screen.findByTestId('previa-alcance');
    const valorDe = (rotulo) => within(within(previa).getByText(rotulo).parentElement).getByText(/^\d+$/).textContent;
    expect(valorDe('No público')).toBe('200');
    expect(valorDe('Receberiam o aviso na plataforma')).toBe('200');
    expect(valorDe('Com consentimento de e-mail')).toBe('60');
    expect(previa.textContent).not.toMatch(/@/);
  });
  it('ligar o e-mail pede confirmação e só então chama o servidor', async () => {
    servidor();
    api.post.mockResolvedValue({ data: { ...PROMOCAO, canal_email: true } });
    await abrir();
    await userEvent.click((await screen.findAllByRole('button', { name: 'Ligar' }))[1]);
    expect(api.post).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/admin/growth/campaigns/7/outreach/channels/email/enable'));
  });
  it('cancelar a confirmação não chama o servidor', async () => {
    servidor();
    await abrir();
    await userEvent.click((await screen.findAllByRole('button', { name: 'Ligar' }))[1]);
    await userEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(api.post).not.toHaveBeenCalled();
  });
  it('recusa do servidor aparece na confirmação', async () => {
    servidor();
    api.post.mockRejectedValue({ response: { data: { message: 'O público escolhido não tem nenhuma pessoa.' } } });
    await abrir();
    await userEvent.click((await screen.findAllByRole('button', { name: 'Ligar' }))[0]);
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(await screen.findByText('O público escolhido não tem nenhuma pessoa.')).toBeInTheDocument();
  });
  it('chave do canal desligada: avisa e desabilita o botão de ligar', async () => {
    servidor({ chaves: { ...CHAVES, email: false } });
    await abrir();
    expect(await screen.findByTestId('aviso-chave-email')).toBeInTheDocument();
    expect(screen.getByTestId('motivo-email')).toHaveTextContent(/desligado na configuração/);
    expect((await screen.findAllByRole('button', { name: 'Ligar' }))[1]).toBeDisabled();
    expect(screen.getAllByRole('button', { name: 'Ligar' })[0]).toBeEnabled();
  });
  it('público vazio e campanha pausada desabilitam o botão com o motivo', async () => {
    servidor({ previa: { publico: 0, aviso: 0, emailComConsentimento: 0 } });
    await abrir();
    expect(await screen.findByTestId('motivo-notificacao')).toHaveTextContent(/nenhuma pessoa/);
    cleanup();
    servidor();
    await abrir('pausada');
    expect(await screen.findByTestId('motivo-email')).toHaveTextContent(/campanha ativa/);
  });
  it('canal ligado oferece desligar, mesmo com a chave desligada', async () => {
    servidor({ promocao: { ...PROMOCAO, canal_email: true }, chaves: { ...CHAVES, email: false } });
    await abrir();
    const desligar = await screen.findByRole('button', { name: 'Desligar' });
    expect(desligar).toBeEnabled();
  });
});

describe('funil de promoção', () => {
  it('com dados mostra a taxa entre etapas e os descadastros', async () => {
    servidor({ funil: FUNIL_COM_DADOS });
    await abrir();
    const linha = (await screen.findByText('Adesões')).closest('tr');
    expect(within(linha).getByText('40')).toBeInTheDocument();
    expect(within(linha).getByText('20,0%')).toBeInTheDocument();
    expect(screen.getByTestId('resumo-descadastros')).toHaveTextContent('Descadastros: 2');
  });
  it('sem envio mostra o estado vazio e nenhuma taxa inválida', async () => {
    servidor({ funil: FUNIL_VAZIO });
    await abrir();
    expect(await screen.findByTestId('funil-vazio')).toHaveTextContent(/ainda não foi enviada/);
    expect(screen.queryByText(/NaN|Infinity/)).not.toBeInTheDocument();
  });
});
