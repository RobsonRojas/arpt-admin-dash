import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '../../services/api';
import { WoodDeclaration } from './WoodDeclaration';
import { SpeciesForm, AVISO_BLOQUEIO } from './WoodSpecies';
import { SupportContact } from './WoodHelp';
import { DocumentDecision } from './DocumentDecision';

vi.mock('../../services/api', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));

beforeEach(() => { vi.clearAllMocks(); });
afterEach(cleanup);

const detalhe = (over = {}, especies) => ({
    declaracao: { id: 7, produto_id: 3, situacao: 'EM_ANALISE', tipo_origem: 'MANEJO', sem_comprovante_fiscal: false, especie_a_confirmar: false, ponto_lat: -3.1, ponto_lng: -60, ...over },
    produto: { id: 3, nome: 'Tábua' }, produtor: { first_name: 'Ana' },
    especies: especies ?? [{ especie_id: 1, nome: 'Ipê', nome_cientifico: 'Handroanthus', situacao: 'PERMITIDA' }],
    documentos: [], pendencias: [], historico: [],
});

describe('Decisão da declaração', () => {
    it('recusar exige motivo: sem texto não chama a API', async () => {
        api.get.mockResolvedValue({ data: detalhe() });
        render(<WoodDeclaration id={7} onBack={() => {}} />);
        await userEvent.click(await screen.findByRole('button', { name: 'Recusar' }));
        await userEvent.click(screen.getAllByRole('button', { name: 'Recusar' }).pop());
        await screen.findByText(/mínimo 3 caracteres/);
        expect(api.post).not.toHaveBeenCalled();
        await userEvent.type(screen.getByLabelText('Motivo'), 'Documento ilegível');
        api.post.mockResolvedValue({ data: {} });
        await userEvent.click(screen.getAllByRole('button', { name: 'Recusar' }).pop());
        await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/v1/admin/wood/declarations/7/decision', { decisao: 'RECUSAR', motivo: 'Documento ilegível' }));
    });

    it('espécie a confirmar: não aprova sem escolher e envia especie_ids depois', async () => {
        api.get.mockImplementation((url) => Promise.resolve({ data: url.endsWith('/species')
            ? { especies: [{ id: 5, ativo: true, situacao: 'PERMITIDA', nome_principal_pt: 'Cumaru', nome_cientifico: 'Dipteryx' }] }
            : detalhe({ especie_a_confirmar: true }, [{ especie_id: null }]) }));
        render(<WoodDeclaration id={7} onBack={() => {}} />);
        await userEvent.click(await screen.findByRole('button', { name: 'Aprovar' }));
        await screen.findByText(/Escolha a espécie antes de aprovar/);
        expect(api.post).not.toHaveBeenCalled();
        api.post.mockResolvedValue({ data: {} });
        await userEvent.click(await screen.findByLabelText(/Cumaru/));
        await userEvent.click(screen.getByRole('button', { name: 'Aprovar' }));
        await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/v1/admin/wood/declarations/7/decision', { decisao: 'APROVAR', especie_ids: [5] }));
    });

    it('mostra DOCUMENT_NOT_APPROVED em linguagem clara', async () => {
        api.get.mockResolvedValue({ data: detalhe() });
        api.post.mockRejectedValue({ response: { data: { code: 'DOCUMENT_NOT_APPROVED', error: 'x' } } });
        render(<WoodDeclaration id={7} onBack={() => {}} />);
        await userEvent.click(await screen.findByRole('button', { name: 'Aprovar' }));
        await screen.findByText(/Aprove antes o documento comprovante/);
    });
});

describe('Documento', () => {
    it('recusa de documento exige motivo', async () => {
        render(<DocumentDecision documentoId={4} versao={2} />);
        await userEvent.click(screen.getByRole('button', { name: 'Recusar' }));
        await userEvent.click(screen.getAllByRole('button', { name: 'Recusar' }).pop());
        expect(api.post).not.toHaveBeenCalled();
    });
});

describe('Espécies', () => {
    it('bloquear avisa e só salva depois da confirmação', async () => {
        api.patch.mockResolvedValue({ data: {} });
        const onSaved = vi.fn();
        render(<SpeciesForm inicial={{ id: 2, nome_cientifico: 'Swietenia', nome_principal_pt: 'Mogno', nomes_populares: ['Mogno'], situacao: 'PERMITIDA', ativo: true }} onSaved={onSaved} onClose={() => {}} />);
        await userEvent.click(screen.getByLabelText('Situação'));
        await userEvent.click(await screen.findByRole('option', { name: 'Bloqueada' }));
        await userEvent.type(await screen.findByLabelText('Motivo do bloqueio'), 'Proibida');
        await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
        await screen.findByText(new RegExp(AVISO_BLOQUEIO.slice(0, 30)));
        expect(api.patch).not.toHaveBeenCalled();
        await userEvent.click(screen.getByRole('button', { name: 'Confirmar bloqueio' }));
        await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/api/v1/admin/wood/species/2', expect.objectContaining({ situacao: 'BLOQUEADA', motivo_bloqueio: 'Proibida' })));
    });

    it('exige pelo menos um nome popular', async () => {
        render(<SpeciesForm onSaved={() => {}} onClose={() => {}} />);
        await userEvent.type(screen.getByLabelText('Nome científico'), 'Handroanthus');
        await userEvent.type(screen.getByLabelText('Nome principal (pt)'), 'Ipê');
        await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
        await screen.findByText('Informe pelo menos um nome popular.');
        expect(api.post).not.toHaveBeenCalled();
    });
});

describe('WhatsApp de apoio', () => {
    it('número inválido não vai ao servidor', async () => {
        api.get.mockResolvedValue({ data: { whatsapp: '5592981125724' } });
        render(<SupportContact />);
        const campo = await screen.findByLabelText(/Número de WhatsApp/);
        await waitFor(() => expect(campo.value).toBe('5592981125724'));
        await userEvent.clear(campo); await userEvent.type(campo, '1234');
        await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
        await screen.findByText('Informe um número de WhatsApp válido, com DDD.');
        expect(api.put).not.toHaveBeenCalled();
    });

    it('número válido é salvo', async () => {
        api.get.mockResolvedValue({ data: { whatsapp: '5592981125724' } });
        api.put.mockResolvedValue({ data: { whatsapp: '5592999990000' } });
        render(<SupportContact />);
        const campo = await screen.findByLabelText(/Número de WhatsApp/);
        await waitFor(() => expect(campo.value).toBe('5592981125724'));
        await userEvent.clear(campo); await userEvent.type(campo, '(92) 99999-0000');
        await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
        await waitFor(() => expect(api.put).toHaveBeenCalledWith('/api/v1/admin/wood/help/support-contact', { whatsapp: '(92) 99999-0000' }));
    });
});
