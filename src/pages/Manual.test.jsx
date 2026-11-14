import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Manual, Markdown } from './Manual';
import { AlertaPendencias } from '../components/AlertaPendencias';
import { LinkManual } from '../components/LinkManual';
import { carregarManual, carregarPendencias, indice, resumo, secaoDaRota } from '../manual/dados';

/** add-admin-ecosystem-manual (4.x): índice e busca, seção por URL, pendências completas, alerta, link por área e consistência do menu. */
const Local = () => <span data-testid="local">{useLocation().pathname}</span>;
const rotas = (inicial) => render(
    <MemoryRouter initialEntries={[inicial]}>
        <Routes><Route path="/manual" element={<Manual />} /><Route path="/manual/:secao" element={<Manual />} /><Route path="*" element={<><LinkManual /><AlertaPendencias /></>} /></Routes>
        <Local />
    </MemoryRouter>,
);

describe('consistência (3.3)', () => {
    const menu = [...readFileSync('src/components/Layout.jsx', 'utf8').matchAll(/path: '(\/[^']*)'/g)].map((m) => m[1]).filter((p) => p !== '/manual');
    it('toda entrada do menu tem seção no manual', () => {
        expect(menu.length).toBeGreaterThan(30);
        expect(menu.filter((p) => !secaoDaRota(p))).toEqual([]);
    });
    it('toda seção apontada existe no manual gerado e os ids de âncora são únicos por seção', async () => {
        const manual = await carregarManual();
        const ids = new Set(manual.secoes.map((s) => s.id));
        for (const s of Object.values(indice.areas)) expect(ids.has(s)).toBe(true);
        for (const s of manual.secoes) {
            const ancoras = [...s.markdown.matchAll(/\{#([\w-]+)\}/g)].map((m) => m[1]);
            expect(new Set(ancoras).size).toBe(ancoras.length);
        }
    });
    it('toda spec de origem aparece no manual', async () => {
        const manual = await carregarManual();
        expect(manual.secoes.flatMap((s) => s.specs).length).toBeGreaterThanOrEqual(200);
    });
});

describe('índice e busca (4.1)', () => {
    it('lista as seções por grupo; a busca acha o termo e o resultado leva à seção', async () => {
        rotas('/manual');
        expect(await screen.findByRole('heading', { name: 'Manual do ecossistema ARPT' })).toBeTruthy();
        expect(screen.getByText('Monitoramento e operação')).toBeTruthy();
        await userEvent.type(screen.getByLabelText('Buscar no manual'), 'domínio próprio');
        const res = await screen.findByTestId('resultados');
        await waitFor(() => expect(within(res).getAllByRole('button').length).toBeGreaterThan(0));
        await userEvent.click(within(res).getAllByRole('button')[0]);
        await waitFor(() => expect(screen.getByTestId('local').textContent).toMatch(/^\/manual\/[a-z-]+$/));
    });
    it('termo ausente mostra "Nada encontrado"', async () => {
        rotas('/manual');
        await userEvent.type(await screen.findByLabelText('Buscar no manual'), 'zzzxxqq');
        expect(await screen.findByText(/Nada encontrado/)).toBeTruthy();
    });
});

describe('seção por URL (4.2)', () => {
    it('abre a seção certa, com o texto da especificação', async () => {
        rotas('/manual/lojas');
        expect(await screen.findByRole('heading', { name: 'Lojas de dropshippers (vitrine)' })).toBeTruthy();
        expect(await screen.findByTestId('conteudo-secao')).toBeTruthy();
        expect(screen.getByText(/Specs de origem:/)).toBeTruthy();
    });
    it('seção inexistente mostra "não encontrada" com volta ao índice', async () => {
        rotas('/manual/nao-existe');
        expect(await screen.findByText(/não encontrada no manual/)).toBeTruthy();
        expect(screen.getByText('Voltar ao índice')).toBeTruthy();
    });
});

describe('pendências (4.3)', () => {
    it('nenhuma tarefa aberta fica de fora: tudo aparece, em ações manuais e tarefas de código', async () => {
        rotas('/manual/pendencias');
        await screen.findByTestId('resumo-pendencias');
        const dados = await carregarPendencias();
        expect(dados.itens.length).toBe(resumo.total);
        await waitFor(() => expect(screen.getAllByTestId('pendencia')).toHaveLength(resumo.total));
        expect(screen.getByRole('heading', { name: `Ações manuais (${resumo.manuais})` })).toBeTruthy();
        expect(screen.getByRole('heading', { name: `Tarefas de código abertas (${resumo.codigo})` })).toBeTruthy();
    });
    it('a seção de uma área mostra o aviso com as pendências dela', async () => {
        const area = Object.keys(resumo.porArea)[0];
        rotas(`/manual/${area}`);
        expect(await screen.findByText(new RegExp(`${resumo.porArea[area].total} pendência`))).toBeTruthy();
    });
});

describe('alerta e link por área', () => {
    it('o alerta mostra o total e as ações manuais e leva ao manual', async () => {
        rotas('/monitoring');
        const a = screen.getByTestId('alerta-pendencias');
        expect(a.textContent).toContain(`${resumo.total} pendências`);
        expect(a.textContent).toContain(`${resumo.manuais} ações manuais`);
        await userEvent.click(a);
        expect(screen.getByTestId('local').textContent).toBe('/manual/pendencias');
    });
    it('o link "Manual" da área abre a seção correspondente, mesmo em subrota', async () => {
        rotas('/monitoring');
        await userEvent.click(screen.getByTestId('link-manual'));
        expect(screen.getByTestId('local').textContent).toBe('/manual/monitoramento');
    });
    it('rota sem seção não mostra o link', () => {
        rotas('/rota-que-nao-existe');
        expect(screen.queryByTestId('link-manual')).toBeNull();
    });
});

describe('Markdown seguro (4.4)', () => {
    it('HTML cru é ignorado e link externo abre com rel seguro', () => {
        render(<MemoryRouter><Markdown texto={'<script>window.x=1</script><b>ruim</b>\n\n[site](https://exemplo.com)'} /></MemoryRouter>);
        expect(document.querySelector('script')).toBeNull();
        expect(screen.queryByText('ruim')).toBeNull();
        const a = screen.getByRole('link', { name: 'site' });
        expect(a.getAttribute('rel')).toBe('noopener noreferrer'); expect(a.getAttribute('target')).toBe('_blank');
    });
    it('título com {#id} vira âncora sem mostrar o marcador', () => {
        render(<MemoryRouter><Markdown texto={'## Titulo X {#meu-id}'} /></MemoryRouter>);
        const h = screen.getByRole('heading', { name: 'Titulo X' });
        expect(h.id).toBe('meu-id');
    });
});
