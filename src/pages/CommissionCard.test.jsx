import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '../services/api';
import { CommissionCard } from './DropshippingAdmin';

vi.mock('../services/api', () => ({ api: { get: vi.fn(), put: vi.fn(), post: vi.fn(), patch: vi.fn(), defaults: {} } }));

/** producer-defined-product-pricing (6.1): comissões globais com histórico e confirmação antes de pausar as lojas. */
const dados = (plataforma = 15) => ({
  vigentes: { PLATAFORMA: { id: 3, percentual: plataforma }, DROPSHIPPER: { id: 2, percentual: 15 } },
  historico: [
    { id: 3, tipo: 'PLATAFORMA', percentual: plataforma, vigente_a_partir_de: '2026-11-16T12:00:00Z', criado_por: 'admin-1' },
    { id: 2, tipo: 'DROPSHIPPER', percentual: 15, vigente_a_partir_de: '2026-11-15T12:00:00Z', criado_por: 'SYSTEM' },
  ],
  impacto: { alocacoes: 12, lojas: 4 },
});

beforeEach(() => { vi.clearAllMocks(); api.get.mockResolvedValue({ data: dados() }); });
afterEach(cleanup);

describe('CommissionCard', () => {
  it('mostra o vigente de cada tipo e o histórico com valor, vigência e autor', async () => {
    render(<CommissionCard />);
    expect(await screen.findByLabelText('Comissão da plataforma (%)')).toHaveValue('15');
    expect(screen.getByLabelText('Comissão do dropshipper (%)')).toHaveValue('15');
    expect(screen.getByText('admin-1')).toBeTruthy();
    expect(screen.getByText('SYSTEM')).toBeTruthy();
    expect(api.get).toHaveBeenCalledWith('/api/v1/admin/dropshipping/commission');
  });

  it('só salva depois da confirmação, que avisa quantas alocações e lojas serão pausadas', async () => {
    api.put.mockResolvedValue({ data: { versao: { id: 4 }, pausadas: 12, lojas: 4 } });
    render(<CommissionCard />);
    const campo = await screen.findByLabelText('Comissão da plataforma (%)');
    await userEvent.clear(campo);
    await userEvent.type(campo, '18');
    await userEvent.click(screen.getAllByRole('button', { name: 'Salvar' })[0]);
    expect(api.put).not.toHaveBeenCalled();
    const dialogo = await screen.findByRole('dialog');
    expect(within(dialogo).getByText('12')).toBeTruthy();
    expect(within(dialogo).getByText('4')).toBeTruthy();
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar e pausar' }));
    await waitFor(() => expect(api.put).toHaveBeenCalledWith('/api/v1/admin/dropshipping/commission', { tipo: 'PLATAFORMA', percentual: 18 }));
    expect(await screen.findByText(/12 alocação\(ões\) em 4 loja\(s\)/)).toBeTruthy();
  });

  it('cancelar a confirmação não altera nada; valor negativo é recusado antes de abrir a confirmação', async () => {
    render(<CommissionCard />);
    const campo = await screen.findByLabelText('Comissão do dropshipper (%)');
    await userEvent.clear(campo);
    await userEvent.type(campo, '-1');
    await userEvent.click(screen.getAllByRole('button', { name: 'Salvar' })[1]);
    expect(screen.queryByRole('dialog')).toBeNull();
    await userEvent.clear(campo);
    await userEvent.type(campo, '10');
    await userEvent.click(screen.getAllByRole('button', { name: 'Salvar' })[1]);
    await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancelar' }));
    expect(api.put).not.toHaveBeenCalled();
  });

  it('erro do servidor (soma de comissões inválida) aparece e a tela segue com o valor vigente', async () => {
    api.put.mockRejectedValue({ response: { data: { error: 'Comissões inválidas: devem somar menos de 100%.' } } });
    render(<CommissionCard />);
    const campo = await screen.findByLabelText('Comissão da plataforma (%)');
    await userEvent.clear(campo);
    await userEvent.type(campo, '90');
    await userEvent.click(screen.getAllByRole('button', { name: 'Salvar' })[0]);
    await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Confirmar e pausar' }));
    expect(await screen.findByText(/devem somar menos de 100%/)).toBeTruthy();
  });
});
