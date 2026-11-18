import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { api } from '../../services/api';
import { WoodFunil } from './WoodFunil';

vi.mock('../../services/api', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));
beforeEach(() => { vi.clearAllMocks(); });
afterEach(cleanup);

const PASSOS = ['origem', 'especie', 'local', 'comprovante', 'peca', 'historia', 'revisao'];
const SIMPLES = ['copia', 'padrao_perfil', 'lote', 'leitura_documento', 'sugestao_especie', 'voz', 'lembrete'];
const dados = (passos = {}, uso = {}) => ({
    periodo: { dias: 30, de: '2026-10-20', ate: '2026-11-18' }, canal: 'todos',
    passos: PASSOS.map((passo) => ({ passo, entradas: 0, conclusoes: 0, abandonos: 0, taxa_abandono: null, ...(passos[passo] ?? {}) })),
    simplificacoes: SIMPLES.map((simplificacao) => ({ simplificacao, usos: uso[simplificacao] ?? 0 })),
});

describe('aba Funil', () => {
    it('mostra entradas, conclusões e taxa de abandono por passo, e o uso das simplificações', async () => {
        api.get.mockResolvedValue({ data: dados({ comprovante: { entradas: 50, conclusoes: 30, abandonos: 20, taxa_abandono: 40 } }, { copia: 12, voz: 3 }) });
        render(<WoodFunil />);
        const linha = await screen.findByTestId('passo-comprovante');
        expect(within(linha).getByText('50')).toBeTruthy();
        expect(within(linha).getByText('30')).toBeTruthy();
        expect(screen.getByTestId('taxa-comprovante').textContent).toBe('40%');
        expect(screen.getByTestId('taxa-origem').textContent).toBe('—');
        expect(within(screen.getByTestId('uso-copia')).getByText('12')).toBeTruthy();
        expect(within(screen.getByTestId('uso-voz')).getByText('3')).toBeTruthy();
        expect(api.get).toHaveBeenCalledWith('/api/v1/admin/wood/funnel', { params: { dias: 30 } });
    });

    it('sem eventos: avisa que ainda não há dados', async () => {
        api.get.mockResolvedValue({ data: dados() });
        render(<WoodFunil />);
        expect(await screen.findByTestId('sem-dados')).toBeTruthy();
        expect(screen.queryByTestId('pior-passo')).toBeNull();
    });

    it('destaca o pior passo só com amostra suficiente; amostra pequena leva asterisco', async () => {
        api.get.mockResolvedValue({ data: dados({ origem: { entradas: 3, conclusoes: 0, abandonos: 3, taxa_abandono: 100 }, peca: { entradas: 40, conclusoes: 30, abandonos: 10, taxa_abandono: 25 } }) });
        render(<WoodFunil />);
        expect((await screen.findByTestId('pior-passo')).textContent).toMatch(/Peça.*25%.*40 entradas/);
        expect(screen.getByTestId('taxa-origem').textContent).toBe('100% *');
        expect(screen.getByTestId('taxa-peca').textContent).toBe('25%');
    });

    it('erro de carga oferece tentar de novo', async () => {
        api.get.mockRejectedValueOnce(new Error('fora')).mockResolvedValueOnce({ data: dados() });
        render(<WoodFunil />);
        const botao = await screen.findByRole('button', { name: 'Tentar de novo' });
        botao.click();
        await waitFor(() => expect(screen.getByTestId('sem-dados')).toBeTruthy());
    });
});
