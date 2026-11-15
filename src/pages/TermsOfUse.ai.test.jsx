import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '../services/api';
import { getAiStatus } from '../services/gemini';
import { TermsOfUse } from './TermsOfUse';

vi.mock('../services/api', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));
vi.mock('../services/gemini', () => ({ getAiStatus: vi.fn() }));
vi.mock('@uiw/react-md-editor', () => {
    const Editor = ({ value, onChange }) => <textarea aria-label="editor" value={value} onChange={(e) => onChange(e.target.value)} />;
    Editor.Markdown = ({ source }) => <div>{source}</div>;
    return { default: Editor };
});

/** add-ai-terms-legal-assistant-and-translation (3.6): aplicar, recusar, desfazer, tradução, tradução desatualizada, IA desligada. */
const PT = 'O frete é do produtor.';
const REVISAO = {
    resumo: 'Há uma lacuna na devolução.',
    observacoes: [
        { trecho: 'O frete é do produtor.', tipo: 'LACUNA', gravidade: 'ALTA', explicacao: 'Falta dizer o que ocorre na devolução.', sugestao: 'O frete é do produtor e, em devolução, volta ao cliente.' },
        { trecho: 'trecho que não existe', tipo: 'RISCO', gravidade: 'BAIXA', explicacao: 'Exemplo.', sugestao: 'x' },
    ],
    texto_sugerido: 'TEXTO SUGERIDO INTEIRO',
};
const TRADUCAO = 'The shipping fee belongs to the producer.';

const chamadasPost = (url) => api.post.mock.calls.filter((c) => c[0] === url);
const editor = () => screen.getByLabelText('editor');

async function abrirEditor({ pt = PT, ia = { enabled: true } } = {}) {
    getAiStatus.mockResolvedValue(ia);
    api.get.mockResolvedValue({ data: { terms: [] } });
    render(<TermsOfUse />);
    await userEvent.click(await screen.findByRole('button', { name: 'Criar Nova Versão' }));
    if (pt) fireEvent.change(editor(), { target: { value: pt } });
}
const revisar = async () => {
    await userEvent.click(screen.getByRole('button', { name: 'Revisar com assistente jurídico' }));
    await screen.findByText('Há uma lacuna na devolução.');
};
const abaIngles = () => userEvent.click(screen.getByRole('tab', { name: /English/ }));
const abaPortugues = () => userEvent.click(screen.getByRole('tab', { name: 'Português' }));

beforeEach(() => {
    vi.clearAllMocks();
    api.post.mockImplementation(async (url) => {
        if (url === '/admin/ai/terms/review') return { data: REVISAO };
        if (url === '/admin/ai/terms/translate') return { data: { text: TRADUCAO } };
        return { data: {} };
    });
});
afterEach(cleanup);

describe('revisão com assistente jurídico', () => {
    it('envia só texto, público e marca do frete, e mostra resumo, observações e o aviso fixo', async () => {
        await abrirEditor();
        await revisar();
        expect(api.post).toHaveBeenCalledWith('/admin/ai/terms/review', { text: PT, audience: 'GERAL', contem_clausula_frete: false }, expect.objectContaining({ timeout: expect.any(Number) }));
        expect(screen.getByText('Lacuna')).toBeTruthy();
        expect(screen.getByText('Gravidade Alta')).toBeTruthy();
        expect(screen.getAllByText(/não substitui revisão de profissional habilitado/).length).toBeGreaterThan(0);
        expect(editor().value).toBe(PT);
    });

    it('aplicar uma observação altera o editor, não salva, e desfazer volta ao texto anterior', async () => {
        await abrirEditor();
        await revisar();
        await userEvent.click(within0('observacao-0', 'Aplicar'));
        expect(editor().value).toBe('O frete é do produtor e, em devolução, volta ao cliente.');
        expect(screen.getByRole('button', { name: 'Aplicada' })).toBeTruthy();
        expect(api.put).not.toHaveBeenCalled();
        expect(chamadasPost('/terms/admin')).toHaveLength(0);

        await userEvent.click(screen.getByRole('button', { name: 'Desfazer' }));
        expect(editor().value).toBe(PT);
        expect(within0('observacao-0', 'Aplicar')).toBeTruthy();
    });

    it('observação cujo trecho não está mais no texto não pode ser aplicada', async () => {
        await abrirEditor();
        await revisar();
        expect(within0('observacao-1', 'Aplicar').disabled).toBe(true);
        expect(screen.getByText(/Trecho não encontrado no texto atual/)).toBeTruthy();
    });

    it('recusar: fechar o painel sem aplicar mantém o texto', async () => {
        await abrirEditor();
        await revisar();
        await userEvent.click(screen.getByRole('button', { name: 'Fechar sem aplicar' }));
        expect(screen.queryByText('Há uma lacuna na devolução.')).toBeNull();
        expect(editor().value).toBe(PT);
        expect(api.put).not.toHaveBeenCalled();
    });

    it('usar o texto sugerido mostra a comparação e pode ser desfeito', async () => {
        await abrirEditor();
        await revisar();
        await userEvent.click(screen.getByRole('button', { name: /Comparar texto sugerido com o atual/ }));
        expect(screen.getByTestId('comparacao-atual').textContent).toBe(PT);
        expect(screen.getByTestId('comparacao-sugerido').textContent).toBe('TEXTO SUGERIDO INTEIRO');

        await userEvent.click(screen.getByRole('button', { name: 'Usar texto sugerido' }));
        expect(editor().value).toBe('TEXTO SUGERIDO INTEIRO');
        await userEvent.click(screen.getByRole('button', { name: 'Desfazer última sugestão da IA' }));
        expect(editor().value).toBe(PT);
    });
});

describe('tradução do português', () => {
    it('português vazio: botão desabilitado com a explicação', async () => {
        await abrirEditor({ pt: '' });
        await abaIngles();
        expect(screen.getByRole('button', { name: 'Traduzir do português' }).disabled).toBe(true);
        expect(screen.getByText('Escreva o texto em português para poder traduzir.')).toBeTruthy();
    });

    it('traduz para a aba ENGLISH como texto editável, sem salvar sozinho', async () => {
        await abrirEditor();
        await abaIngles();
        await userEvent.click(screen.getByRole('button', { name: 'Traduzir do português' }));
        await waitFor(() => expect(editor().value).toBe(TRADUCAO));
        expect(api.post).toHaveBeenCalledWith('/admin/ai/terms/translate', { text: PT, audience: 'GERAL' }, expect.anything());
        expect(api.put).not.toHaveBeenCalled();
        expect(chamadasPost('/terms/admin')).toHaveLength(0);

        fireEvent.change(editor(), { target: { value: `${TRADUCAO} (edited)` } });
        expect(editor().value).toBe(`${TRADUCAO} (edited)`);
    });

    it('desfazer a tradução devolve o inglês anterior', async () => {
        await abrirEditor();
        await abaIngles();
        fireEvent.change(editor(), { target: { value: 'my english' } });
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        await userEvent.click(screen.getByRole('button', { name: 'Traduzir do português' }));
        await waitFor(() => expect(editor().value).toBe(TRADUCAO));
        await userEvent.click(screen.getByRole('button', { name: 'Desfazer última sugestão da IA' }));
        expect(editor().value).toBe('my english');
    });

    it('com inglês já escrito, pede confirmação e não traduz se o administrador recusar', async () => {
        await abrirEditor();
        await abaIngles();
        fireEvent.change(editor(), { target: { value: 'my english' } });
        vi.spyOn(window, 'confirm').mockReturnValue(false);
        await userEvent.click(screen.getByRole('button', { name: 'Traduzir do português' }));
        expect(chamadasPost('/admin/ai/terms/translate')).toHaveLength(0);
        expect(editor().value).toBe('my english');
    });

    it('português alterado depois da tradução: avisa que pode estar desatualizada e oferece traduzir de novo', async () => {
        await abrirEditor();
        await abaIngles();
        await userEvent.click(screen.getByRole('button', { name: 'Traduzir do português' }));
        await waitFor(() => expect(editor().value).toBe(TRADUCAO));
        expect(screen.queryByText(/A tradução pode estar desatualizada/)).toBeNull();

        await abaPortugues();
        fireEvent.change(editor(), { target: { value: `${PT} Nova cláusula.` } });
        await abaIngles();
        expect(screen.getByText(/A tradução pode estar desatualizada/)).toBeTruthy();

        vi.spyOn(window, 'confirm').mockReturnValue(true);
        await userEvent.click(screen.getByRole('button', { name: 'Traduzir de novo' }));
        await waitFor(() => expect(chamadasPost('/admin/ai/terms/translate')).toHaveLength(2));
        await waitFor(() => expect(screen.queryByText(/A tradução pode estar desatualizada/)).toBeNull());
    });
});

describe('IA desligada, limite e falhas', () => {
    it('IA desligada: botões desabilitados com a explicação e o rascunho segue editável', async () => {
        await abrirEditor({ ia: { enabled: false } });
        expect(await screen.findByText(/O assistente de IA está desligado/)).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Revisar com assistente jurídico' }).disabled).toBe(true);
        await abaIngles();
        expect(screen.getByRole('button', { name: 'Traduzir do português' }).disabled).toBe(true);
        fireEvent.change(editor(), { target: { value: 'escrito à mão' } });
        expect(editor().value).toBe('escrito à mão');
        expect(screen.getByRole('button', { name: 'Salvar Rascunho' }).disabled).toBe(false);
        expect(api.post).not.toHaveBeenCalled();
    });

    it('503 do servidor desliga os botões e mantém o texto digitado', async () => {
        api.post.mockRejectedValueOnce({ response: { status: 503, data: { error: 'A IA está desligada no momento. Escreva o texto à mão.' } } });
        await abrirEditor();
        await userEvent.click(screen.getByRole('button', { name: 'Revisar com assistente jurídico' }));
        await screen.findByText('A IA está desligada no momento. Escreva o texto à mão.');
        expect(screen.getByRole('button', { name: 'Revisar com assistente jurídico' }).disabled).toBe(true);
        expect(editor().value).toBe(PT);
    });

    it('429: informa quando tentar de novo; falha genérica mantém o texto', async () => {
        api.post.mockRejectedValueOnce({ response: { status: 429, data: { error: 'x', retryAfterSeconds: 42 } } });
        await abrirEditor();
        await userEvent.click(screen.getByRole('button', { name: 'Revisar com assistente jurídico' }));
        await screen.findByText('Muitas chamadas ao assistente. Tente de novo em 42 s.');

        api.post.mockRejectedValueOnce({ response: { status: 502, data: { error: 'A IA devolveu uma resposta fora do formato. Tente de novo.' } } });
        await userEvent.click(screen.getByRole('button', { name: 'Revisar com assistente jurídico' }));
        await screen.findByText('A IA devolveu uma resposta fora do formato. Tente de novo.');
        expect(editor().value).toBe(PT);
    });
});

/** Botão dentro de uma observação. */
function within0(testId, nome) {
    const caixa = screen.getByTestId(testId);
    return Array.from(caixa.querySelectorAll('button')).find((b) => b.textContent === nome);
}
