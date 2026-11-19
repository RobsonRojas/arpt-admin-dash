import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '../../services/api';
import { OrigemDosDados, WoodDeclaration } from './WoodDeclaration';
import { SpeciesForm, WoodSpecies, AVISO_BLOQUEIO } from './WoodSpecies';
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
        await userEvent.click(await screen.findByRole('combobox', { name: 'Espécie' }));
        await userEvent.click(await screen.findByRole('option', { name: /Cumaru/ }));
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

describe('Espécies: foto e crédito', () => {
    const base = { id: 4, nome_cientifico: 'Dipteryx odorata', nome_principal_pt: 'Cumaru', nomes_populares: ['Cumaru'], situacao: 'PERMITIDA', ativo: true };

    it('sem foto não pede crédito; com foto mostra a prévia e os campos de crédito', async () => {
        render(<SpeciesForm inicial={base} onSaved={() => {}} onClose={() => {}} />);
        expect(screen.queryByTestId('foto-credito')).toBeNull();
        cleanup(); // o formulário guarda o estado inicial: uma nova tela, não uma nova renderização
        render(<SpeciesForm inicial={{ ...base, foto_url: 'https://arpt.test/c.jpg', foto_autor: 'Maria', foto_licenca: 'CC BY 4.0' }} onSaved={() => {}} onClose={() => {}} />);
        expect(await screen.findByTestId('foto-credito')).toBeTruthy();
        expect(screen.getByLabelText('Autor da foto').value).toBe('Maria');
        expect(screen.getByLabelText('Licença da foto').value).toBe('CC BY 4.0');
        expect(screen.getByAltText('Prévia da foto')).toBeTruthy();
    });

    it('envia o crédito e o "conferida" junto da foto', async () => {
        api.patch.mockResolvedValue({ data: {} });
        render(<SpeciesForm inicial={{ ...base, foto_url: 'https://arpt.test/c.jpg' }} onSaved={() => {}} onClose={() => {}} />);
        await userEvent.type(await screen.findByLabelText('Autor da foto'), ' Maria Souza ');
        await userEvent.type(screen.getByLabelText('Licença da foto'), 'CC BY 4.0');
        await userEvent.type(screen.getByLabelText('Página da imagem na origem'), 'https://commons.wikimedia.org/wiki/File:C.jpg');
        await userEvent.click(screen.getByRole('checkbox', { name: /Foto conferida pelo especialista/ }));
        await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
        await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/api/v1/admin/wood/species/4', expect.objectContaining({
            foto_url: 'https://arpt.test/c.jpg', foto_autor: 'Maria Souza', foto_licenca: 'CC BY 4.0', foto_fonte_url: 'https://commons.wikimedia.org/wiki/File:C.jpg', foto_conferida: true,
        })));
    });

    it('sem foto, o crédito vai vazio (null) e conferida falso', async () => {
        api.patch.mockResolvedValue({ data: {} });
        render(<SpeciesForm inicial={base} onSaved={() => {}} onClose={() => {}} />);
        await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
        await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/api/v1/admin/wood/species/4', expect.objectContaining({ foto_url: null, foto_autor: null, foto_licenca: null, foto_fonte_url: null, foto_conferida: false })));
    });

    it('trocar a URL da foto limpa o crédito e a conferência; voltar à URL original os restaura', async () => {
        const inicial = { ...base, foto_url: 'https://arpt.test/c.jpg', foto_autor: 'Maria', foto_licenca: 'CC BY 4.0', foto_fonte_url: 'https://commons.wikimedia.org/wiki/File:C.jpg', foto_conferida: true };
        render(<SpeciesForm inicial={inicial} onSaved={() => {}} onClose={() => {}} />);
        const campo = await screen.findByLabelText('Foto (URL)');
        await userEvent.type(campo, 'x');
        expect(screen.getByLabelText('Autor da foto').value).toBe('');
        expect(screen.getByLabelText('Licença da foto').value).toBe('');
        expect(screen.getByLabelText('Página da imagem na origem').value).toBe('');
        expect(screen.getByRole('checkbox', { name: /Foto conferida pelo especialista/ }).checked).toBe(false);
        await userEvent.type(campo, '{backspace}');
        expect(screen.getByLabelText('Autor da foto').value).toBe('Maria');
        expect(screen.getByLabelText('Licença da foto').value).toBe('CC BY 4.0');
        expect(screen.getByRole('checkbox', { name: /Foto conferida pelo especialista/ }).checked).toBe(true);
    });

    it('foto nova: o crédito digitado depois da troca é enviado e a conferência vai como falsa', async () => {
        api.patch.mockResolvedValue({ data: {} });
        render(<SpeciesForm inicial={{ ...base, foto_url: 'https://arpt.test/c.jpg', foto_autor: 'Maria', foto_licenca: 'CC BY 4.0', foto_conferida: true }} onSaved={() => {}} onClose={() => {}} />);
        const campo = await screen.findByLabelText('Foto (URL)');
        await userEvent.clear(campo);
        await userEvent.type(campo, 'https://arpt.test/nova.jpg');
        await userEvent.type(screen.getByLabelText('Autor da foto'), 'João');
        await userEvent.type(screen.getByLabelText('Licença da foto'), 'CC0');
        await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
        await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/api/v1/admin/wood/species/4', expect.objectContaining({
            foto_url: 'https://arpt.test/nova.jpg', foto_autor: 'João', foto_licenca: 'CC0', foto_fonte_url: null, foto_conferida: false,
        })));
    });
});

describe('Origem dos dados na análise', () => {
    const prov = {
        tipo_origem: { fonte: 'digitado', confirmado: true },
        embalagem: { fonte: 'copiado', confirmado: false },
        acabamento: { fonte: 'ia_leitura', confirmado: true },
        autor_nome: { fonte: 'padrao_perfil', confirmado: false },
    };

    it('mostra como cada campo foi preenchido e se foi confirmado', () => {
        render(<OrigemDosDados proveniencia={prov} />);
        expect(screen.getByTestId('fonte-tipo_origem').textContent).toBe('Tipo de origem: Digitado pelo produtor');
        expect(screen.getByTestId('fonte-embalagem').textContent).toBe('Embalagem: Copiado de outra peça · a confirmar');
        expect(screen.getByTestId('fonte-acabamento').textContent).toBe('Acabamento: Lido por IA · confirmado');
        expect(screen.getByTestId('fonte-autor_nome').textContent).toBe('Nome de quem fez: Padrão do perfil · a confirmar');
    });

    it('avisa quantos não foram digitados e quantos ainda não foram confirmados', () => {
        render(<OrigemDosDados proveniencia={prov} />);
        expect(screen.getByText(/3 campo\(s\) não foram digitados pelo produtor/)).toBeTruthy();
        expect(screen.getByText(/2 ainda NÃO foram confirmados por ele/)).toBeTruthy();
    });

    it('tudo confirmado: avisa que o produtor confirmou; só digitado: sem alerta; sem marcas: nada na tela', () => {
        render(<OrigemDosDados proveniencia={{ acabamento: { fonte: 'ia_leitura', confirmado: true } }} />);
        expect(screen.getByText(/Todos foram confirmados por ele/)).toBeTruthy();
        cleanup();
        render(<OrigemDosDados proveniencia={{ tipo_origem: { fonte: 'digitado', confirmado: true } }} />);
        expect(screen.queryByText(/não foram digitados/)).toBeNull();
        cleanup();
        const { container } = render(<OrigemDosDados proveniencia={{}} />);
        expect(container.innerHTML).toBe('');
        cleanup();
        expect(render(<OrigemDosDados />).container.innerHTML).toBe('');
    });

    it('ignora campo e fonte desconhecidos sem quebrar a tela', () => {
        render(<OrigemDosDados proveniencia={{ campo_novo: { fonte: 'digitado' }, embalagem: { fonte: 'fonte_nova', confirmado: false } }} />);
        expect(screen.getByTestId('fonte-embalagem').textContent).toMatch(/fonte_nova/);
        expect(screen.queryByTestId('fonte-campo_novo')).toBeNull();
    });
});

describe('documento lido por IA na análise', () => {
    it('mostra quais campos do documento foram lidos por IA e confirmados; sem IA, não mostra nada', async () => {
        const det = detalhe();
        det.documentos = [
            { id: 11, tipo: 'DOF', numero: '1', orgao_emissor: 'X', validade: '2099-01-01', situacao: 'EM_ANALISE', versoes: [], proveniencia: { numero: { fonte: 'ia_leitura', confirmado: true }, validade: { fonte: 'ia_leitura', confirmado: true }, orgao_emissor: { fonte: 'digitado', confirmado: true } } },
            { id: 12, tipo: 'NOTA_FISCAL', numero: '2', situacao: 'EM_ANALISE', versoes: [], proveniencia: { numero: { fonte: 'digitado', confirmado: true } } },
        ];
        api.get.mockResolvedValue({ data: det });
        render(<WoodDeclaration id={7} onBack={() => {}} />);
        expect((await screen.findByTestId('doc-ia-11')).textContent).toBe('Lido por IA e confirmado pelo produtor: número, validade');
        expect(screen.queryByTestId('doc-ia-12')).toBeNull();
    });
});

describe('Lista de espécies (paginada)', () => {
    const resp = (extra = {}) => ({ data: { especies: [{ id: 1, ativo: true, situacao: 'PERMITIDA', nome_principal_pt: 'Macucu', nome_cientifico: 'Aldina heterophylla', nomes_populares: ['Macucu'] }], total: 120, pagina: 1, por_pagina: 50, ativas: 120, ...extra } });

    it('pede a primeira página, mostra o total e busca no servidor ao digitar', async () => {
        api.get.mockImplementation((url) => Promise.resolve(url.endsWith('/requests') ? { data: { pedidos: [] } } : resp()));
        render(<WoodSpecies />);
        await screen.findByText('Aldina heterophylla');
        expect(api.get).toHaveBeenCalledWith('/api/v1/admin/wood/species', { params: { q: undefined, pagina: 1, por_pagina: 50 } });
        expect(screen.getByText(/120 espécie\(s\) · 120 ativa\(s\) no total/)).toBeTruthy();
        await userEvent.type(screen.getByLabelText('Buscar espécie'), 'macucu');
        await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/v1/admin/wood/species', { params: { q: 'macucu', pagina: 1, por_pagina: 50 } }));
    });

    it('avisa quando não há nenhuma espécie ativa', async () => {
        api.get.mockImplementation((url) => Promise.resolve(url.endsWith('/requests') ? { data: { pedidos: [] } } : resp({ especies: [], total: 0, ativas: 0 })));
        render(<WoodSpecies />);
        expect(await screen.findByText(/Não há nenhuma espécie ativa/)).toBeTruthy();
        expect(screen.getByText('Nenhuma espécie cadastrada.')).toBeTruthy();
    });

    it('com espécies ativas não mostra o aviso', async () => {
        api.get.mockImplementation((url) => Promise.resolve(url.endsWith('/requests') ? { data: { pedidos: [] } } : resp()));
        render(<WoodSpecies />);
        await screen.findByText('Aldina heterophylla');
        expect(screen.queryByText(/Não há nenhuma espécie ativa/)).toBeNull();
    });
});
