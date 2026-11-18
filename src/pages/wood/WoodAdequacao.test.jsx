import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '../../services/api';
import { WoodAdequacao } from './WoodAdequacao';

vi.mock('../../services/api', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));
beforeEach(() => { vi.clearAllMocks(); });
afterEach(cleanup);

const CAUSAS = ['APROVADA_VALIDA', 'SEM_DECLARACAO', 'RASCUNHO', 'EM_ANALISE', 'CORRECAO', 'RECUSADA', 'ESPECIE_A_CONFIRMAR', 'ESPECIE_BLOQUEADA', 'APROVACAO_VENCIDA', 'SEM_COMPROVANTE_VALIDO'];
const dados = (extra = {}) => ({
    configuracao: { modo: 'warn', dias_de_adequacao: 30, bloqueio_desde: null },
    resumo: { produtos_de_madeira: 10, com_origem_aprovada: 4, ficariam_fora_de_venda: 6, dos_quais_publicados: 3, alocacoes_ativas_afetadas: 5, produtores_afetados: 2, percentual_adequado: 40 },
    por_causa: CAUSAS.map((causa, i) => ({ causa, total: i === 0 ? 4 : i === 2 ? 4 : i === 3 ? 2 : 0, explicacao: `explicação de ${causa}` })),
    por_produtor: [{ produtor: 'p1', nome: 'Ana Silva', produtos: 4, publicados: 3, lojas_afetadas: 5 }],
    itens: [{ produto_id: 7, nome: 'Cuia de cumaru', produtor: 'p1', produtor_nome: 'Ana Silva', causa: 'RASCUNHO', publicado: true, lojas_ativas: 2, situacao_declaracao: 'RASCUNHO', criado_em: '2026-01-01' }],
    itens_total: 1, gerado_em: '2026-11-18T12:00:00Z', ...extra,
});

describe('aba Adequação', () => {
    it('mostra o modo, os números e as causas (sem a causa "aprovada")', async () => {
        api.get.mockResolvedValue({ data: dados() });
        render(<WoodAdequacao />);
        expect((await screen.findByTestId('modo')).textContent).toBe('Aviso: mede, não bloqueia');
        expect(within(screen.getByTestId('num-Ficariam fora de venda')).getByText('6')).toBeTruthy();
        expect(within(screen.getByTestId('num-Já publicados')).getByText('3')).toBeTruthy();
        expect(within(screen.getByTestId('num-Adequado')).getByText('40%')).toBeTruthy();
        expect(screen.getByTestId('causa-RASCUNHO')).toBeTruthy();
        expect(screen.queryByTestId('causa-APROVADA_VALIDA')).toBeNull();
        expect(screen.getByText('explicação de RASCUNHO')).toBeTruthy();
        expect(screen.getAllByText('Ana Silva', { selector: 'td' })).toHaveLength(2); // na tabela por produtor e na de produtos
    });

    it('avisa que ignora o prazo de adequação e mostra o prazo configurado', async () => {
        api.get.mockResolvedValue({ data: dados({ configuracao: { modo: 'block', dias_de_adequacao: 45, bloqueio_desde: '2026-12-01' } }) });
        render(<WoodAdequacao />);
        expect((await screen.findByTestId('modo')).textContent).toBe('Bloqueio ligado');
        expect(screen.getByText(/sem considerar o prazo de adequação/)).toBeTruthy();
        expect(screen.getByText(/45 dias \(bloqueio desde 2026-12-01\)/)).toBeTruthy();
    });

    it('tocar numa causa filtra pelo servidor; tocar de novo limpa', async () => {
        api.get.mockResolvedValue({ data: dados() });
        const user = userEvent.setup({ delay: null });
        render(<WoodAdequacao />);
        await user.click(await screen.findByTestId('causa-EM_ANALISE'));
        await waitFor(() => expect(api.get).toHaveBeenLastCalledWith('/api/v1/admin/wood/adequacao', { params: { limite: 200, causa: 'EM_ANALISE' } }));
        await user.click(screen.getByTestId('causa-EM_ANALISE'));
        await waitFor(() => expect(api.get).toHaveBeenLastCalledWith('/api/v1/admin/wood/adequacao', { params: { limite: 200 } }));
    });

    it('"só os já publicados" pede publicados=true', async () => {
        api.get.mockResolvedValue({ data: dados() });
        const user = userEvent.setup({ delay: null });
        render(<WoodAdequacao />);
        await user.click(await screen.findByRole('checkbox', { name: 'Só os já publicados' }));
        await waitFor(() => expect(api.get).toHaveBeenLastCalledWith('/api/v1/admin/wood/adequacao', { params: { limite: 200, publicados: true } }));
    });

    it('sem nada afetado mostra as mensagens vazias e o aviso de lista cortada só quando corta', async () => {
        api.get.mockResolvedValue({ data: dados({ itens: [], itens_total: 0, por_produtor: [], resumo: { produtos_de_madeira: 0, com_origem_aprovada: 0, ficariam_fora_de_venda: 0, dos_quais_publicados: 0, alocacoes_ativas_afetadas: 0, produtores_afetados: 0, percentual_adequado: null } }) });
        render(<WoodAdequacao />);
        expect(await screen.findByText('Nenhum produtor afetado.')).toBeTruthy();
        expect(screen.getByText('Nenhum produto neste filtro.')).toBeTruthy();
        expect(within(screen.getByTestId('num-Adequado')).getByText('—')).toBeTruthy();
        cleanup();
        api.get.mockResolvedValue({ data: dados({ itens_total: 450 }) });
        render(<WoodAdequacao />);
        expect(await screen.findByText(/Mostrando 1 de 450/)).toBeTruthy();
    });

    it('erro do servidor mostra a mensagem e permite tentar de novo', async () => {
        api.get.mockRejectedValueOnce({ response: { data: { error: 'Falhou.' } } });
        const user = userEvent.setup({ delay: null });
        render(<WoodAdequacao />);
        expect(await screen.findByText('Falhou.')).toBeTruthy();
        api.get.mockResolvedValue({ data: dados() });
        await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));
        expect(await screen.findByTestId('modo')).toBeTruthy();
    });
});
