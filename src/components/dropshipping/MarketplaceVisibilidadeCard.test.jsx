import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { get, put } = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn() }));
vi.mock('../../services/api', () => ({ api: { get, put } }));

import MarketplaceVisibilidadeCard from './MarketplaceVisibilidadeCard';

const URL = '/api/v1/admin/marketplace/visibility';
const chave = () => screen.findByRole('checkbox', { name: 'Visível somente para usuários logados' });

beforeEach(() => { get.mockReset(); put.mockReset(); });
afterEach(cleanup);

/** add-marketplace-login-visibility, 2.2. */
describe('cartão de visibilidade do marketplace', () => {
  it('reflete o valor atual: público = desligado, logados = ligado', async () => {
    get.mockResolvedValueOnce({ data: { visibilidade: 'publico' } });
    const { unmount } = render(<MarketplaceVisibilidadeCard />);
    expect((await chave()).checked).toBe(false);
    unmount();
    get.mockResolvedValueOnce({ data: { visibilidade: 'logados' } });
    render(<MarketplaceVisibilidadeCard />);
    expect((await chave()).checked).toBe(true);
  });

  it('ligar salva "logados", confirma e explica o atraso; desligar salva "publico"', async () => {
    get.mockResolvedValue({ data: { visibilidade: 'publico' } });
    put.mockResolvedValue({ data: {} });
    const user = userEvent.setup();
    render(<MarketplaceVisibilidadeCard />);
    await user.click(await chave());
    expect(put).toHaveBeenCalledWith(URL, { visibilidade: 'logados' });
    expect(await screen.findByText(/só para usuários logados em até 1 minuto/)).toBeTruthy();
    await user.click(await chave());
    await waitFor(() => expect(put).toHaveBeenLastCalledWith(URL, { visibilidade: 'publico' }));
    expect(await screen.findByText(/volta a ser público em até 1 minuto/)).toBeTruthy();
  });

  it('falha ao salvar: mostra o erro e o interruptor volta ao valor anterior', async () => {
    get.mockResolvedValue({ data: { visibilidade: 'publico' } });
    put.mockRejectedValue({ response: { data: { error: 'Acesso negado.' } } });
    const user = userEvent.setup();
    render(<MarketplaceVisibilidadeCard />);
    await user.click(await chave());
    expect(await screen.findByText('Acesso negado.')).toBeTruthy();
    expect((await chave()).checked).toBe(false);
  });

  it('falha ao carregar: mostra o erro e não oferece o interruptor', async () => {
    get.mockRejectedValue(new Error('rede'));
    render(<MarketplaceVisibilidadeCard />);
    expect(await screen.findByText('Não foi possível carregar a visibilidade do marketplace.')).toBeTruthy();
    expect(screen.queryByRole('checkbox')).toBeNull();
  });
});
