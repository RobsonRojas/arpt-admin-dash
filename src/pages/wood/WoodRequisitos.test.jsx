import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '../../services/api';
import { WoodRequisitos } from './WoodRequisitos';

vi.mock('../../services/api', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));
beforeEach(() => { vi.clearAllMocks(); });
afterEach(cleanup);

const esc = (x = {}) => ({ origens: [], especies: [], usos: [], destinos: [], ...x });
const v = (o) => ({ id: 1, numero: 1, situacao: 'PUBLICADA', vigencia: '2026-11-18', prazo_dias: 90, resumo: 'Versão inicial.', por_que: 'Ponto de partida.', escopo: esc(), regras: REGRAS, ...o });
const REGRAS = {
    esquema: 1, obrigatorios: ['tipo_origem', 'especies', 'local', 'uso_previsto', 'acabamento', 'embalagem', 'frete'],
    comprovantes: { MANEJO: ['AUTORIZACAO_MANEJO', 'DOF', 'NOTA_FISCAL'], ARVORE_CAIDA: ['LICENCA_ARVORE_CAIDA', 'DOF', 'DOF_ESPECIAL'], REAPROVEITAMENTO: ['DOF_ESPECIAL', 'NOTA_FISCAL', 'DECLARACAO_REAPROVEITAMENTO'] },
    licenca_obrigatoria: { ARVORE_CAIDA: 'LICENCA_ARVORE_CAIDA' }, reaproveitamento_sem_nota: { tipo: 'DECLARACAO_REAPROVEITAMENTO', min_fotos: 2, descricao_min: 20 },
    limites: { especies: 10, municipio: 120, comunidade: 160, descricao_local: 1000, autor_nome: 120, historia: 2000, tecnica: 1000, cuidados: 1000 }, usos_bloqueados: ['BRINQUEDO'],
};
const dados = (versoes) => ({ versoes, vigente: versoes.find((x) => x.situacao === 'PUBLICADA') });
const sobe = (versoes) => api.get.mockImplementation((url) => Promise.resolve({ data: url.endsWith('/species') ? { especies: [{ id: 7, nome_principal_pt: 'Cumaru', ativo: true }] } : dados(versoes) }));

describe('aba Requisitos', () => {
    it('lista as versões com o escopo e mostra a vigente', async () => {
        sobe([v({ id: 2, numero: 2, resumo: 'Novo comprovante.', escopo: esc({ especies: [7], origens: ['MANEJO'] }) }), v()]);
        render(<WoodRequisitos />);
        expect((await screen.findByTestId('vigente')).textContent).toMatch(/versão 2/);
        const linha = screen.getByTestId('versao-2');
        expect(within(linha).getByText(/espécie: Cumaru/)).toBeTruthy();
        expect(within(linha).getByText(/origem: Manejo florestal/)).toBeTruthy();
        expect(within(screen.getByTestId('versao-1')).getByText('todas as declarações')).toBeTruthy();
    });

    it('só o rascunho tem Editar e Publicar; a publicada não tem como editar', async () => {
        sobe([v({ id: 3, numero: null, situacao: 'RASCUNHO' }), v({ id: 2, numero: 2 }), v()]);
        render(<WoodRequisitos />);
        const rasc = await screen.findByTestId('versao-3');
        expect(within(rasc).getByRole('button', { name: 'Editar' })).toBeTruthy();
        expect(within(rasc).getByRole('button', { name: 'Publicar' })).toBeTruthy();
        expect(within(screen.getByTestId('versao-2')).queryByRole('button', { name: 'Editar' })).toBeNull();
        expect(within(screen.getByTestId('versao-1')).queryAllByRole('button')).toHaveLength(0);
        expect(within(screen.getByTestId('versao-2')).queryByRole('button', { name: 'Publicar' })).toBeNull();
    });

    it('publicar pede confirmação avisando que é imutável', async () => {
        sobe([v({ id: 3, numero: null, situacao: 'RASCUNHO' }), v()]);
        api.post.mockResolvedValue({ data: {} });
        const user = userEvent.setup({ delay: null });
        render(<WoodRequisitos />);
        await user.click(within(await screen.findByTestId('versao-3')).getByRole('button', { name: 'Publicar' }));
        expect(await screen.findByText(/não pode mais ser editada/)).toBeTruthy();
        expect(api.post).not.toHaveBeenCalled();
        await user.click(screen.getByRole('button', { name: 'Publicar' }));
        await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/v1/admin/wood/requirements/3/publish'));
    });

    it('cria rascunho com o escopo e os países em maiúsculas/lista', async () => {
        sobe([v()]);
        api.post.mockResolvedValue({ data: {} });
        const user = userEvent.setup({ delay: null });
        render(<WoodRequisitos />);
        await user.click(await screen.findByRole('button', { name: 'Nova versão' }));
        await user.type(screen.getByTestId('f-vigencia'), '2026-12-01');
        await user.type(screen.getByTestId('f-resumo'), 'Passa a exigir comprovante novo.');
        await user.type(screen.getByTestId('f-porque'), 'Mudança na regra de transporte.');
        await user.type(screen.getByLabelText(/Países de destino/), 'de, fr');
        await user.click(screen.getByRole('button', { name: 'Salvar rascunho' }));
        await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/v1/admin/wood/requirements', {
            vigencia: '2026-12-01', prazo_dias: 90, resumo: 'Passa a exigir comprovante novo.', por_que: 'Mudança na regra de transporte.',
            escopo: { origens: [], especies: [], usos: [], destinos: ['de', 'fr'] }, regras: REGRAS,
        }));
    });

    it('mostra o erro do servidor ao salvar', async () => {
        sobe([v()]);
        api.post.mockRejectedValue({ response: { data: { code: 'VALIDATION_ERROR', error: 'x', detalhes: [{ mensagem: 'Diga o que mudou, com pelo menos 10 letras.' }] } } });
        const user = userEvent.setup({ delay: null });
        render(<WoodRequisitos />);
        await user.click(await screen.findByRole('button', { name: 'Nova versão' }));
        await user.click(screen.getByRole('button', { name: 'Salvar rascunho' }));
        expect(await screen.findByText(/Diga o que mudou/)).toBeTruthy();
    });

    const rollout = (extra = {}) => ({ versao: { id: 2, numero: 2 }, aplicacao: null, pendentes: 1, em_atualizacao: 0, requer_atualizacao: 0, atualizadas: 0, bloqueariam: 1, lista: [{ declaracao_id: 9, produto: 'Cuia de cumaru', situacao: 'PENDENTE' }], limite: 200, ...extra });
    const abre = (versoes, resposta) => api.get.mockImplementation((url) => Promise.resolve({ data: url.endsWith('/rollout') ? resposta : url.endsWith('/impact') ? { produtos: 3, produtores: 2, alocacoes_ativas: 1, destinos_nao_restringem: false } : url.endsWith('/species') ? { especies: [] } : dados(versoes) }));

    it('acompanha uma versão: contagens e quem é quem', async () => {
        abre([v({ id: 2, numero: 2 }), v()], rollout({ atualizadas: 4 }));
        const user = userEvent.setup({ delay: null });
        render(<WoodRequisitos />);
        await user.click(await screen.findByRole('button', { name: 'Acompanhar' }));
        const caixa = await screen.findByTestId('acompanhamento');
        expect(within(screen.getByTestId('num-pendentes')).getByText('1')).toBeTruthy();
        expect(within(screen.getByTestId('num-atualizadas')).getByText('4')).toBeTruthy();
        expect(caixa.textContent).toMatch(/Cuia de cumaru · aguardando/);
        expect(screen.getByTestId('situacao-aplicacao').textContent).toBe('Ainda não aplicada');
        expect(api.get).toHaveBeenCalledWith('/api/v1/admin/wood/requirements/2/rollout');
    });

    it('aplicar mostra a prévia de impacto antes e só envia ao confirmar; teste é o padrão', async () => {
        abre([v({ id: 2, numero: 2 }), v()], rollout());
        api.post.mockResolvedValue({ data: { aplicacao: {}, marcadas: 0, avisados: 1 } });
        const user = userEvent.setup({ delay: null });
        render(<WoodRequisitos />);
        await user.click(await screen.findByRole('button', { name: 'Aplicar' }));
        const previa = await screen.findByTestId('previa');
        expect(previa.textContent).toMatch(/afeta 3 produto\(s\) de 2 produtor\(es\), com 1 alocação/);
        expect(api.post).not.toHaveBeenCalled();
        await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Aplicar' }));
        await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/v1/admin/wood/requirements/2/apply', { politica: 'AVISO_PRAZO', modo: 'TESTE' }));
    });

    it('imediata pede justificativa e a envia; mensagem do servidor aparece quando falta permissão', async () => {
        abre([v({ id: 2, numero: 2 }), v()], rollout());
        api.post.mockRejectedValue({ response: { data: { code: 'FORBIDDEN_POLICY', error: 'A política imediata exige uma permissão específica, que você não tem.' } } });
        const user = userEvent.setup({ delay: null });
        render(<WoodRequisitos />);
        await user.click(await screen.findByRole('button', { name: 'Aplicar' }));
        await screen.findByTestId('previa');
        fireEvent.mouseDown(within(screen.getByRole('dialog')).getByText(/^Aviso e prazo:/)); // abre a lista da política, como o clique do usuário
        await user.click(await screen.findByRole('option', { name: /Imediata/ }));
        await user.type(screen.getByTestId('f-justificativa'), 'Nova proibição publicada.');
        await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Aplicar' }));
        await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/v1/admin/wood/requirements/2/apply', { politica: 'IMEDIATA', modo: 'TESTE', justificativa: 'Nova proibição publicada.' }));
        expect(await screen.findByText(/exige uma permissão específica/)).toBeTruthy();
    });

    it('em teste mostra quantas seriam bloqueadas e deixa passar a valer', async () => {
        const ap = { politica: 'AVISO_PRAZO', modo: 'TESTE', prazo_fim: '2026-12-31' };
        abre([v({ id: 2, numero: 2 }), v()], rollout({ aplicacao: ap, bloqueariam: 5 }));
        api.post.mockResolvedValue({ data: {} });
        const user = userEvent.setup({ delay: null });
        render(<WoodRequisitos />);
        await user.click(await screen.findByRole('button', { name: 'Acompanhar' }));
        expect((await screen.findByTestId('bloqueariam')).textContent).toMatch(/5.*ficariam bloqueadas. Nenhuma foi bloqueada/);
        expect(screen.getByTestId('situacao-aplicacao').textContent).toMatch(/em teste/);
        await user.click(screen.getByRole('button', { name: 'Passar a valer' }));
        await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/v1/admin/wood/requirements/2/activate', {}));
    });

    it('valendo: sem o botão de passar a valer e sem o aviso de teste', async () => {
        abre([v({ id: 2, numero: 2 }), v()], rollout({ aplicacao: { politica: 'IMEDIATA', modo: 'ATIVO', prazo_fim: null } }));
        const user = userEvent.setup({ delay: null });
        render(<WoodRequisitos />);
        await user.click(await screen.findByRole('button', { name: 'Acompanhar' }));
        await screen.findByTestId('acompanhamento');
        expect(screen.queryByRole('button', { name: 'Passar a valer' })).toBeNull();
        expect(screen.queryByTestId('bloqueariam')).toBeNull();
        expect(screen.getByTestId('situacao-aplicacao').textContent).toMatch(/Imediata · valendo/);
    });

    it('versão que ainda não entrou em vigor não tem o botão Aplicar', async () => {
        sobe([v({ id: 2, numero: 2, vigencia: '2099-01-01' }), v()]);
        render(<WoodRequisitos />);
        const linha = await screen.findByTestId('versao-2');
        expect(within(linha).queryByRole('button', { name: 'Aplicar' })).toBeNull();
        expect(within(linha).getByRole('button', { name: 'Acompanhar' })).toBeTruthy();
    });

    describe('regras da versão', () => {
        const abrirNova = async (user) => {
            sobe([v()]); api.post.mockResolvedValue({ data: {} });
            render(<WoodRequisitos />);
            await user.click(await screen.findByRole('button', { name: 'Nova versão' }));
            await user.type(screen.getByTestId('f-vigencia'), '2026-12-01');
            await user.type(screen.getByTestId('f-resumo'), 'Passa a exigir a técnica da peça.');
            await user.type(screen.getByTestId('f-porque'), 'Pedido do órgão ambiental.');
            await user.click(screen.getByText(/Regras desta versão/));
        };
        const enviado = () => api.post.mock.calls[0][1].regras;

        it('uma nova versão parte das regras em vigor; salvar sem mexer envia o mesmo instantâneo', async () => {
            const user = userEvent.setup({ delay: null });
            await abrirNova(user);
            expect(screen.getByTestId('obrig-frete').checked).toBe(true);
            expect(screen.getByTestId('obrig-tecnica').checked).toBe(false);
            await user.click(screen.getByRole('button', { name: 'Salvar rascunho' }));
            await waitFor(() => expect(api.post).toHaveBeenCalled());
            expect(enviado()).toEqual(REGRAS);
        });

        it('marcar um campo como obrigatório e apertar um limite entram no instantâneo', async () => {
            const user = userEvent.setup({ delay: null });
            await abrirNova(user);
            await user.click(screen.getByTestId('obrig-tecnica'));
            await user.click(screen.getByTestId('obrig-acabamento')); // desmarca um que era obrigatório
            fireEvent.change(screen.getByTestId('lim-historia'), { target: { value: '500' } });
            await user.click(screen.getByRole('button', { name: 'Salvar rascunho' }));
            await waitFor(() => expect(api.post).toHaveBeenCalled());
            expect(enviado().obrigatorios).toEqual(['tipo_origem', 'especies', 'local', 'uso_previsto', 'embalagem', 'frete', 'tecnica']);
            expect(enviado().limites.historia).toBe(500);
            expect(enviado().comprovantes).toEqual(REGRAS.comprovantes);
        });

        it('mostra os documentos aceitos de cada origem e os usos bloqueados', async () => {
            const user = userEvent.setup({ delay: null });
            await abrirNova(user);
            expect(screen.getByTestId('comp-MANEJO')).toBeTruthy();
            expect(screen.getByTestId('comp-ARVORE_CAIDA')).toBeTruthy();
            expect(screen.getByTestId('comp-REAPROVEITAMENTO')).toBeTruthy();
            expect(screen.getByTestId('usos-bloqueados')).toBeTruthy();
            expect(screen.getByText('Brinquedo')).toBeTruthy();
        });

        it('editar um rascunho carrega as regras dele; versão sem regras (antiga) cai nas vigentes', async () => {
            sobe([v({ id: 3, numero: null, situacao: 'RASCUNHO', regras: { ...REGRAS, obrigatorios: [...REGRAS.obrigatorios, 'cuidados'] } }), v()]);
            const user = userEvent.setup({ delay: null });
            render(<WoodRequisitos />);
            await user.click(within(await screen.findByTestId('versao-3')).getByRole('button', { name: 'Editar' }));
            await user.click(screen.getByText(/Regras desta versão/));
            expect(screen.getByTestId('obrig-cuidados').checked).toBe(true);
        });
    });
});
