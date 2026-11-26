import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgenteIA } from './AgenteIA';
import { PropostaCard } from '../components/PropostaCard';
import { conversarComAgente, estadoDoAgente, eventosDoTexto } from '../services/agente';

vi.mock('../services/agente', async (orig) => ({ ...(await orig()), conversarComAgente: vi.fn(), estadoDoAgente: vi.fn(), confirmarProposta: vi.fn(), rejeitarProposta: vi.fn() }));
vi.mock('../services/api', () => ({ api: { get: vi.fn(), post: vi.fn(), defaults: {} } }));
vi.mock('../services/firebase', () => ({ auth: null }));

beforeEach(() => { vi.clearAllMocks(); estadoDoAgente.mockResolvedValue({ habilitado: true }); });
afterEach(cleanup);

describe('chat', () => {
  it('mostra a resposta em streaming com os valores reais', async () => {
    conversarComAgente.mockImplementation(async ({ aoEvento }) => {
      aoEvento({ tipo: 'sessao', sessaoId: 's1' });
      aoEvento({ tipo: 'texto', delta: 'O comprador é ' });
      aoEvento({ tipo: 'texto', delta: 'maria@exemplo.com.' });
    });
    render(<AgenteIA />);
    await userEvent.type(screen.getByPlaceholderText(/pergunte/i), 'quem comprou?{enter}');
    expect(await screen.findByText('O comprador é maria@exemplo.com.')).toBeTruthy();
    expect(conversarComAgente.mock.calls[0][0].mensagem).toBe('quem comprou?');
  });
  it('agente desligado (503): avisa e bloqueia o envio', async () => {
    estadoDoAgente.mockResolvedValue({ habilitado: false });
    render(<AgenteIA />);
    expect(await screen.findByText(/desativado no momento/i)).toBeTruthy();
    expect(screen.getByPlaceholderText(/pergunte/i).disabled).toBe(true);
  });
  it('teto atingido (429): mostra mensagem clara', async () => {
    conversarComAgente.mockImplementation(async ({ aoEvento }) => aoEvento({ tipo: 'erro', codigo: 'TETO_DIA', status: 429, mensagem: 'x' }));
    render(<AgenteIA />);
    await userEvent.type(screen.getByPlaceholderText(/pergunte/i), 'oi{enter}');
    expect(await screen.findByText(/teto diário/i)).toBeTruthy();
  });
});

describe('card de proposta', () => {
  const proposta = { id: 'p1', tool: 'cupom_pausar', resumo: 'Pausar o cupom NATAL10', args: { id: 3 } };
  it('mostra ação e parâmetros exatos; confirmar chama o servidor só com o id', async () => {
    const conf = vi.fn().mockResolvedValue({});
    render(<PropostaCard proposta={proposta} onConfirmar={conf} onRejeitar={vi.fn()} />);
    expect(screen.getByText('Pausar o cupom NATAL10')).toBeTruthy();
    expect(screen.getByText(/"id": 3/)).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    await waitFor(() => expect(screen.getByText('Executada.')).toBeTruthy());
    expect(conf).toHaveBeenCalledWith('p1');
    expect(screen.queryByRole('button', { name: 'Confirmar' })).toBeNull();
  });
  it('rejeitar e erro de execução', async () => {
    const rej = vi.fn().mockResolvedValue({});
    const { unmount } = render(<PropostaCard proposta={proposta} onConfirmar={vi.fn()} onRejeitar={rej} />);
    await userEvent.click(screen.getByRole('button', { name: 'Rejeitar' }));
    expect(await screen.findByText('Recusada.')).toBeTruthy();
    unmount();
    render(<PropostaCard proposta={proposta} onConfirmar={vi.fn().mockRejectedValue({ response: { data: { error: 'A proposta expirou.' } } })} onRejeitar={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(await screen.findByText('A proposta expirou.')).toBeTruthy();
  });
});

describe('leitor SSE', () => {
  it('junta blocos partidos entre leituras', () => {
    let buf = 'event: texto\ndata: {"tipo":"texto","delta":"a"}\n\nevent: texto\ndata: {"tip';
    const lidos = [];
    for (const i of eventosDoTexto(buf)) { if (i.evento) lidos.push(i.evento); else buf = i.resto; }
    expect(lidos).toEqual([{ tipo: 'texto', delta: 'a' }]);
    expect(buf).toContain('{"tip');
  });
});
