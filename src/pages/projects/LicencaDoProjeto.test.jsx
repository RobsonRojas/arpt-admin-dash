import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '../../services/api';
import { LicencaDoProjeto } from './LicencaDoProjeto';

vi.mock('../../services/api', () => ({ api: { get: vi.fn(), put: vi.fn() } }));
beforeEach(() => { vi.clearAllMocks(); });
afterEach(cleanup);

describe('Licença do projeto', () => {
    it('marca o projeto como licenciado com número e validade', async () => {
        api.get.mockResolvedValue({ data: [{ id: 5, licenciado: false }] });
        api.put.mockResolvedValue({ data: { id: 5, licenciado: true, licenca_numero: 'LO-1', licenca_validade: '2027-05-01', selo_licenciado: { ativo: true, vencido: false, rotulo_pt: 'Licenciado' } } });
        render(<LicencaDoProjeto projectId={5} />);
        const salvar = await screen.findByRole('button', { name: 'Salvar licença' });
        await userEvent.click(screen.getByRole('checkbox', { name: 'Projeto licenciado' }));
        expect(salvar).toBeDisabled(); // sem número, não salva
        await userEvent.type(screen.getByLabelText(/Número da licença/), 'LO-1');
        await userEvent.type(screen.getByLabelText('Validade'), '2027-05-01');
        await userEvent.click(salvar);
        await waitFor(() => expect(api.put).toHaveBeenCalledWith('/admin/manejo/5/licenca', { licenciado: true, licenca_numero: 'LO-1', licenca_validade: '2027-05-01' }));
        expect(await screen.findByTestId('selo-licenciado')).toHaveTextContent('Licenciado');
    });

    it('mostra "Licença vencida" e remove o selo mandando só licenciado=false', async () => {
        api.get.mockResolvedValue({ data: [{ id: 5, licenciado: true, licenca_numero: 'LO-1', licenca_validade: '2020-01-01', selo_licenciado: { ativo: false, vencido: true, rotulo_pt: 'Licença vencida' } }] });
        api.put.mockResolvedValue({ data: { id: 5, licenciado: false, selo_licenciado: null } });
        render(<LicencaDoProjeto projectId={5} />);
        expect(await screen.findByTestId('selo-licenciado')).toHaveTextContent('Licença vencida');
        await userEvent.click(screen.getByRole('checkbox', { name: 'Projeto licenciado' }));
        await userEvent.click(screen.getByRole('button', { name: 'Salvar licença' }));
        await waitFor(() => expect(api.put).toHaveBeenCalledWith('/admin/manejo/5/licenca', { licenciado: false }));
        await waitFor(() => expect(screen.queryByTestId('selo-licenciado')).toBeNull());
    });

    it('mostra o erro do servidor quando salvar falha', async () => {
        api.get.mockResolvedValue({ data: [{ id: 5, licenciado: true, licenca_numero: 'X' }] });
        api.put.mockRejectedValue({ response: { data: { error: 'Sem permissão.' } } });
        render(<LicencaDoProjeto projectId={5} />);
        await userEvent.click(await screen.findByRole('button', { name: 'Salvar licença' }));
        expect(await screen.findByText('Sem permissão.')).toBeInTheDocument();
    });
});
