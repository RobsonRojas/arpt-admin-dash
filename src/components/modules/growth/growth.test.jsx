import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '../../../services/api';
import { ResponsaveisTab } from './ResponsaveisTab';
import { CertificacoesTab } from './CertificacoesTab';
import { MuralTab } from './MuralTab';

vi.mock('../../../services/api', () => ({ api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }));

const escritas = () => api.post.mock.calls.length + api.delete.mock.calls.length;

beforeEach(() => { vi.clearAllMocks(); });

describe('donos e responsáveis', () => {
    const DONOS = {
        proprietario: { user_id: 'p-1', nome: 'Paula Proprietária' },
        responsaveis: [{ user_id: 'r-1', nome: 'Rui Responsável', created_at: '2026-10-01T00:00:00Z' }],
    };

    it('lista o proprietário e os responsáveis sem escrever nada ao abrir', async () => {
        api.get.mockResolvedValue({ data: DONOS });
        render(<ResponsaveisTab projectId={7} />);
        expect(await screen.findByTestId('proprietario')).toHaveTextContent('Paula Proprietária');
        expect(screen.getByText('Rui Responsável')).toBeInTheDocument();
        expect(api.get).toHaveBeenCalledWith('/admin/projetos/7/responsaveis');
        expect(escritas()).toBe(0);
    });

    it('vincula o usuário escolhido na busca', async () => {
        api.get.mockImplementation((url) => Promise.resolve({ data: url === '/user/search' ? [{ id: 'u-9', first_name: 'Nina', email: 'n@x.br' }] : DONOS }));
        api.post.mockResolvedValue({ data: { ok: true } });
        render(<ResponsaveisTab projectId={7} />);
        await userEvent.type(await screen.findByLabelText(/Buscar usuário/), 'Ni');
        await userEvent.click(await screen.findByText('Nina (n@x.br)'));
        await userEvent.click(screen.getByRole('button', { name: 'Vincular' }));
        expect(api.post).toHaveBeenCalledWith('/admin/projetos/7/responsaveis', { user_id: 'u-9' });
    });

    it('mostra a recusa do servidor para usuário inexistente', async () => {
        api.get.mockImplementation((url) => Promise.resolve({ data: url === '/user/search' ? [{ id: 'u-x', first_name: 'Fantasma' }] : DONOS }));
        api.post.mockRejectedValue({ response: { status: 422, data: { message: 'Usuário não encontrado.' } } });
        render(<ResponsaveisTab projectId={7} />);
        await userEvent.type(await screen.findByLabelText(/Buscar usuário/), 'Fa');
        await userEvent.click(await screen.findByText('Fantasma'));
        await userEvent.click(screen.getByRole('button', { name: 'Vincular' }));
        expect(await screen.findByText('Usuário não encontrado.')).toBeInTheDocument();
    });

    it('desvincular pede confirmação; cancelar não chama o servidor', async () => {
        api.get.mockResolvedValue({ data: DONOS });
        api.delete.mockResolvedValue({ data: { ok: true } });
        render(<ResponsaveisTab projectId={7} />);
        await userEvent.click(await screen.findByRole('button', { name: 'Desvincular' }));
        await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }));
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        expect(api.delete).not.toHaveBeenCalled();
        await userEvent.click(screen.getByRole('button', { name: 'Desvincular' }));
        await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Desvincular' }));
        expect(api.delete).toHaveBeenCalledWith('/admin/projetos/7/responsaveis/r-1');
    });
});

describe('certificação de carbono', () => {
    const CERT = { id: 3, padrao: 'VCS', registro_numero: 'R-1', entidade: 'Verra', quantidade_tco2e: 10, vigencia_inicio: '2026-01-01', vigencia_fim: '2026-12-31', revogada_em: null, relatorios_publicados: 2 };

    it('formulário inválido mostra o erro e não registra nada', async () => {
        api.get.mockResolvedValue({ data: { certificacoes: [] } });
        render(<CertificacoesTab projectId={7} />);
        await screen.findByText('Nenhuma certificação registrada.');
        await userEvent.type(screen.getByLabelText('Padrão'), 'VCS');
        await userEvent.type(screen.getByLabelText('Número de registro'), 'R-1');
        await userEvent.type(screen.getByLabelText('Entidade emissora'), 'Verra');
        await userEvent.type(screen.getByLabelText('Quantidade (tCO₂e)'), '0');
        await userEvent.type(screen.getByLabelText('Início da vigência'), '2026-06-01');
        await userEvent.type(screen.getByLabelText('Fim da vigência'), '2026-01-01');
        await userEvent.click(screen.getByRole('button', { name: 'Registrar' }));
        expect(screen.getByText('A quantidade precisa ser maior que zero.')).toBeInTheDocument();
        expect(screen.getByText('A vigência termina antes de começar.')).toBeInTheDocument();
        expect(api.post).not.toHaveBeenCalled();
    });

    it('registra a certificação válida no formato do servidor', async () => {
        api.get.mockResolvedValue({ data: { certificacoes: [] } });
        api.post.mockResolvedValue({ data: { id: 4 } });
        render(<CertificacoesTab projectId={7} />);
        await screen.findByText('Nenhuma certificação registrada.');
        await userEvent.type(screen.getByLabelText('Padrão'), 'VCS');
        await userEvent.type(screen.getByLabelText('Número de registro'), 'R-1');
        await userEvent.type(screen.getByLabelText('Entidade emissora'), 'Verra');
        await userEvent.type(screen.getByLabelText('Quantidade (tCO₂e)'), '12,5');
        await userEvent.type(screen.getByLabelText('Início da vigência'), '2026-01-01');
        await userEvent.type(screen.getByLabelText('Fim da vigência'), '2026-12-31');
        await userEvent.click(screen.getByRole('button', { name: 'Registrar' }));
        expect(api.post).toHaveBeenCalledWith('/admin/projetos/7/certificacoes-carbono', {
            padrao: 'VCS', registro_numero: 'R-1', entidade: 'Verra', quantidade_tco2e: 12.5, vigencia_inicio: '2026-01-01', vigencia_fim: '2026-12-31',
        });
    });

    it('antes de revogar mostra quantos relatórios serão despublicados e só revoga ao confirmar', async () => {
        api.get.mockResolvedValue({ data: { certificacoes: [CERT] } });
        api.delete.mockResolvedValue({ data: { revogada: true, despublicados: 2 } });
        render(<CertificacoesTab projectId={7} />);
        await userEvent.click(await screen.findByRole('button', { name: 'Revogar' }));
        expect(screen.getByTestId('aviso-revogacao')).toHaveTextContent('2 relatórios de impacto publicados serão despublicados');
        expect(api.delete).not.toHaveBeenCalled();
        await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Revogar' }));
        expect(api.delete).toHaveBeenCalledWith('/admin/projetos/7/certificacoes-carbono/3');
        expect(await screen.findByText(/2 relatório\(s\) despublicado\(s\)/)).toBeInTheDocument();
    });

    it('certificação revogada não oferece revogar de novo', async () => {
        api.get.mockResolvedValue({ data: { certificacoes: [{ ...CERT, revogada_em: '2026-10-02T00:00:00Z' }] } });
        render(<CertificacoesTab projectId={7} />);
        await screen.findByText(/Revogada em/);
        expect(screen.queryByRole('button', { name: 'Revogar' })).not.toBeInTheDocument();
    });
});

describe('mural de apoiadores', () => {
    it('lista nome e logo, sem valor, e-mail nem CPF, e não escreve ao abrir', async () => {
        api.get.mockResolvedValue({ data: { reconhecimentos: [
            { patrocinio: 11, modo: 'NOME', nome_exibicao: 'Ana Apoiadora', logo_url: null, atualizado_em: '2026-10-01T00:00:00Z', valor: 999, email: 'ana@x.br', cpf: '12345678900' },
            { patrocinio: 12, modo: 'LOGO', nome_exibicao: null, logo_url: 'https://cdn.x/logo.png', atualizado_em: '2026-10-02T00:00:00Z' },
        ] } });
        const { container } = render(<MuralTab projectId={7} />);
        expect(await screen.findByText('Ana Apoiadora')).toBeInTheDocument();
        expect(screen.getByAltText('Logo exibida no mural')).toHaveAttribute('src', 'https://cdn.x/logo.png');
        expect(api.get).toHaveBeenCalledWith('/admin/reconhecimento/projeto/7');
        expect(container.textContent).not.toMatch(/999|ana@x\.br|12345678900/);
        expect(escritas()).toBe(0);
    });

    it('remover pede confirmação e recarrega a lista', async () => {
        api.get.mockResolvedValueOnce({ data: { reconhecimentos: [{ patrocinio: 11, modo: 'NOME', nome_exibicao: 'Nome impróprio', atualizado_em: null }] } })
            .mockResolvedValueOnce({ data: { reconhecimentos: [] } });
        api.delete.mockResolvedValue({ data: { removido: true } });
        render(<MuralTab projectId={7} />);
        await userEvent.click(await screen.findByRole('button', { name: 'Remover' }));
        expect(api.delete).not.toHaveBeenCalled();
        await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Remover' }));
        expect(api.delete).toHaveBeenCalledWith('/admin/reconhecimento/11');
        await waitFor(() => expect(screen.queryByText('Nome impróprio')).not.toBeInTheDocument());
        expect(screen.getByText(/^Removido do mural/)).toBeInTheDocument();
    });
});
