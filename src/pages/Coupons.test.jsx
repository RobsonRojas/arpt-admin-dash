import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '../services/api';
import { Coupons } from './Coupons';
import { corpoCupom, errosCupom, estadoDoCupom, formVazio } from '../utils/coupons';

vi.mock('../services/api', () => ({ api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), defaults: {} } }));

/** add-store-discount-coupons, 6.1 e 6.2: lista, formulário, travas de cupom usado, pausa e usos. */
const cupom = (extra = {}) => ({
  id: 1, codigo: 'PROMO2026', tipo: 'PERCENTUAL', valor: 1000, validoDe: '2026-11-01T00:00:00Z', validoAte: '2099-01-01T00:00:00Z', quantidadeTotal: 10,
  valorMinimoCents: null, ativo: true, lojaIds: [7], consumidos: 2, reservados: 1, saldo: 7, jaUsado: true, ...extra,
});
const LOJAS = { data: [{ id: 7, nome: 'Loja Sete', slug: 'sete' }, { id: 8, nome: 'Loja Oito', slug: 'oito' }], total: 2 };
function servidor({ cupons = [cupom()], usos } = {}) {
  api.get.mockImplementation(async (url) => {
    if (url.endsWith('/usos')) return { data: usos ?? { cupom: { id: 1, codigo: 'PROMO2026', quantidadeTotal: 10, consumidos: 2, reservados: 1, saldo: 7 }, usos: [] } };
    if (url.includes('/stores')) return { data: LOJAS };
    return { data: cupons };
  });
}

beforeEach(() => { vi.clearAllMocks(); });
afterEach(cleanup);

describe('regras da tela', () => {
  const ok = { ...formVazio(), codigo: 'promo2026', valor: '10', quantidadeTotal: '5', lojas: [{ id: 7 }] };
  it('valida código, percentual, validade, quantidade e lojas', () => {
    expect(errosCupom(ok)).toEqual({});
    expect(errosCupom({ ...ok, codigo: 'curto' }).codigo).toBeDefined();
    expect(errosCupom({ ...ok, valor: '100' }).valor).toBeDefined();
    expect(errosCupom({ ...ok, tipo: 'FIXO', valor: '100' }).valor).toBeUndefined();
    expect(errosCupom({ ...ok, validoAte: ok.validoDe }).validoAte).toBeDefined();
    expect(errosCupom({ ...ok, quantidadeTotal: '0' }).quantidadeTotal).toBeDefined();
    expect(errosCupom({ ...ok, lojas: [] }).lojas).toBeDefined();
  });
  it('corpo: percentual em pontos-base, valores em centavos, código em maiúsculas', () => {
    const c = corpoCupom({ ...ok, valorMinimo: '50,50' });
    expect(c).toMatchObject({ codigo: 'PROMO2026', tipo: 'PERCENTUAL', valor: 1000, quantidadeTotal: 5, valorMinimoCents: 5050, lojaIds: [7] });
    expect(corpoCupom({ ...ok, tipo: 'FIXO', valor: '12,34' }).valor).toBe(1234);
  });
  it('cupom já usado não reenvia código, tipo nem valor', () => {
    const c = corpoCupom({ ...ok, id: 1, jaUsado: true });
    expect(c).not.toHaveProperty('codigo'); expect(c).not.toHaveProperty('tipo'); expect(c).not.toHaveProperty('valor');
    expect(c.lojaIds).toEqual([7]);
  });
  it('estado: pausado, vencido, agendado, esgotado e ativo', () => {
    const agora = Date.parse('2026-11-21T00:00:00Z');
    expect(estadoDoCupom(cupom({ ativo: false }), agora).rotulo).toBe('Pausado');
    expect(estadoDoCupom(cupom({ validoAte: '2026-11-02T00:00:00Z' }), agora).rotulo).toBe('Vencido');
    expect(estadoDoCupom(cupom({ validoDe: '2026-12-01T00:00:00Z' }), agora).rotulo).toBe('Agendado');
    expect(estadoDoCupom(cupom({ saldo: 0 }), agora).rotulo).toBe('Esgotado');
    expect(estadoDoCupom(cupom(), agora).rotulo).toBe('Ativo');
  });
});

describe('página', () => {
  it('lista os cupons com desconto, usos e situação', async () => {
    servidor();
    render(<Coupons />);
    expect(await screen.findByText('PROMO2026')).toBeInTheDocument();
    expect(screen.getByText('10%')).toBeInTheDocument();
    expect(screen.getByText('3/10')).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });

  it('estado vazio', async () => {
    servidor({ cupons: [] });
    render(<Coupons />);
    expect(await screen.findByText('Nenhum cupom criado.')).toBeInTheDocument();
  });

  it('formulário inválido não chama a API e mostra o aviso de impacto nas comissões', async () => {
    servidor({ cupons: [] });
    render(<Coupons />);
    await userEvent.click(await screen.findByRole('button', { name: 'Novo cupom' }));
    expect(screen.getByTestId('aviso-comissoes')).toHaveTextContent(/comissões/);
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByText(/8 a 32 caracteres/)).toBeInTheDocument();
    expect(screen.getByText('Escolha ao menos uma loja.')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('edição de cupom já usado trava código, tipo e valor', async () => {
    servidor();
    render(<Coupons />);
    await userEvent.click(await screen.findByRole('button', { name: 'Editar' }));
    expect(screen.getByLabelText('Código')).toBeDisabled();
    expect(screen.getByLabelText('Percentual')).toBeDisabled();
    expect(screen.getByText(/Cupom já usado/)).toBeInTheDocument();
  });

  it('pausar chama a rota e recarrega', async () => {
    servidor();
    api.post.mockResolvedValue({ data: {} });
    render(<Coupons />);
    await userEvent.click(await screen.findByRole('button', { name: 'Pausar' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/admin/cupons/1/pausar'));
  });

  it('detalhe mostra consumidos, reservados, saldo e os usos', async () => {
    servidor({ usos: {
      cupom: { id: 1, codigo: 'PROMO2026', quantidadeTotal: 10, consumidos: 2, reservados: 1, saldo: 7 },
      usos: [{ id: 5, status: 'CONSUMIDO', descontoCents: 2000, pedidoId: 99, data: '2026-11-20T10:00:00Z', lojaId: 7, lojaNome: 'Loja Sete' }],
    } });
    render(<Coupons />);
    await userEvent.click(await screen.findByRole('button', { name: 'Usos' }));
    const resumo = await screen.findByTestId('resumo-usos');
    expect(within(resumo).getByText('Consumidos: 2')).toBeInTheDocument();
    expect(within(resumo).getByText('Reservados: 1')).toBeInTheDocument();
    expect(within(resumo).getByText('Saldo: 7')).toBeInTheDocument();
    expect(screen.getByText('#99')).toBeInTheDocument();
    expect(screen.getByText('Consumido')).toBeInTheDocument();
  });
});
