import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const { post } = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock('../../services/api', () => ({ api: { post } }));

import TransferDialog from './TransferDialog';

const previa = { simulado: true, lojas: [{ loja_id: 1, nome: 'Loja A', status: 'ATIVA', produtos: 2, pedidos_em_aberto: 1, repasses_pendentes: 0 }], avisos: ['Aviso de repasse'] };
const montar = (props = {}) => render(
  <TransferDialog open modo="lojas" titulo="Transferir" endpoint="/x/transfer" itemIds={[1]} resumoItens="Loja A"
    carregarDestinos={async () => [{ id: 'u2', label: 'Beta (b@x.com)' }]} onClose={vi.fn()} onDone={vi.fn()} {...props} />,
);
const preencher = async () => {
  const campo = await screen.findByLabelText(/Destino/);
  fireEvent.mouseDown(campo);
  fireEvent.click(await screen.findByText('Beta (b@x.com)'));
  fireEvent.change(screen.getByLabelText(/Motivo/), { target: { value: 'Saída do dropshipper' } });
};

beforeEach(() => { post.mockReset(); });
afterEach(cleanup);

/** add-transfer-dropshipper-store-and-producer-products, 4.4. */
describe('diálogo de transferência', () => {
  it('pede a prévia (simular) e só aplica depois da confirmação', async () => {
    post.mockResolvedValueOnce({ data: previa }).mockResolvedValueOnce({ data: { ...previa, simulado: false } });
    const onDone = vi.fn();
    montar({ onDone });
    await preencher();
    fireEvent.click(screen.getByText('Ver prévia'));
    expect(await screen.findByText('Aviso de repasse')).toBeTruthy();
    expect(post).toHaveBeenCalledWith('/x/transfer', expect.objectContaining({ destino_user_id: 'u2', loja_ids: [1], simular: true }));
    fireEvent.click(screen.getByText('Confirmar transferência'));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(post).toHaveBeenLastCalledWith('/x/transfer', expect.objectContaining({ simular: false }));
  });

  it('não chama a API sem destino ou motivo', async () => {
    montar();
    fireEvent.click(await screen.findByText('Ver prévia'));
    expect(await screen.findByText(/Escolha o destino/)).toBeTruthy();
    expect(post).not.toHaveBeenCalled();
  });

  it('erro da API é exibido e o diálogo continua aberto', async () => {
    post.mockRejectedValueOnce({ response: { data: { error: 'O destino ultrapassaria o limite de 1 lojas.' } } });
    const onClose = vi.fn();
    montar({ onClose });
    await preencher();
    fireEvent.click(screen.getByText('Ver prévia'));
    expect(await screen.findByText(/ultrapassaria o limite/)).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });
});
