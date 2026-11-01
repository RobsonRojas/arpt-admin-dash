import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '../services/api';
import { FilasTab, ServicosTab } from './Monitoring';
import { chaveParaBytes, NotificacoesMonitoramento } from '../components/NotificacoesMonitoramento';
import { duracaoDesde, duracaoSegundos, erroMotivo, resumoAcaoFila, situacaoFila } from '../utils/monitoring';

vi.mock('../services/api', () => ({ api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }));

/**
 * add-admin-service-monitoring, 8.1 a 8.3: estado dos serviços, reinício só com confirmação e motivo, filas com retry e limpeza
 * confirmados, e o botão de notificações no navegador.
 */
const BASE = '/api/v1/admin/monitoring';
const SERVICOS = {
    monitoramento_ligado: true, alertas_ligados: false,
    servicos: [
        { nome: 'manejo-api', estado: 'up', estado_desde: '2026-10-30T10:00:00Z', ultimo_erro: null, verificado_em: '2026-10-30T12:00:00Z', reiniciavel: false },
        { nome: 'email-worker', estado: 'down', estado_desde: '2026-10-30T11:50:00Z', ultimo_erro: 'container exited', verificado_em: '2026-10-30T12:00:00Z', reiniciavel: true },
    ],
};

beforeEach(() => { vi.clearAllMocks(); });
afterEach(cleanup);

describe('regras', () => {
    it('motivo de 10 a 200 caracteres, contando sem os espaços das pontas', () => {
        expect(erroMotivo('  curto   ')).toMatch(/pelo menos 10/);
        expect(erroMotivo('Fila parada há 20 min')).toBe('');
        expect(erroMotivo('x'.repeat(201))).toMatch(/no máximo 200/);
    });
    it('duração e resumo das ações', () => {
        const agora = new Date('2026-10-30T12:00:00Z').getTime();
        expect(duracaoDesde('2026-10-30T11:50:00Z', agora)).toBe('10 min');
        expect(duracaoDesde('2026-10-30T09:30:00Z', agora)).toBe('2 h 30 min');
        expect(duracaoDesde(null, agora)).toBe('—');
        expect(resumoAcaoFila({ reenfileirados: ['1', '2'], ignorados: 1, nao_encontrados: 0 }, 'retry')).toBe('2 reenfileirado(s); 1 ignorado(s) por não estarem mais no estado (ex.: em execução).');
        expect(resumoAcaoFila({ removidos: 3, ignorados: 0 }, 'clean')).toBe('3 removido(s).');
    });
    it('chave VAPID base64url vira bytes', () => {
        expect(Array.from(chaveParaBytes('AQID-_8'))).toEqual([1, 2, 3, 251, 255]);
    });
});

describe('serviços', () => {
    it('mostra estado, erro e quem pode ser reiniciado; avisa que está em observação', async () => {
        api.get.mockResolvedValue({ data: SERVICOS });
        render(<ServicosTab />);
        const linha = await screen.findByTestId('servico-email-worker');
        expect(linha).toHaveTextContent('Fora do ar');
        expect(linha).toHaveTextContent('container exited');
        expect(within(screen.getByTestId('servico-manejo-api')).getByText('Não reiniciável pelo painel')).toBeInTheDocument();
        expect(screen.getByText(/Em observação/)).toBeInTheDocument();
        expect(api.get).toHaveBeenCalledWith(`${BASE}/services`);
        expect(api.post).not.toHaveBeenCalled();
    });

    it('reiniciar exige motivo válido; cancelar não chama o servidor; confirmar manda confirm e o motivo', async () => {
        api.get.mockResolvedValue({ data: SERVICOS });
        api.post.mockResolvedValue({ data: { reiniciado: true } });
        render(<ServicosTab />);
        await userEvent.click(within(await screen.findByTestId('servico-email-worker')).getByRole('button', { name: 'Reiniciar' }));
        let dialogo = screen.getByRole('dialog');
        const confirmar = within(dialogo).getByRole('button', { name: 'Reiniciar' });
        expect(confirmar).toBeDisabled();
        await userEvent.type(within(dialogo).getByLabelText(/Motivo/), 'curto');
        expect(confirmar).toBeDisabled();
        await userEvent.click(within(dialogo).getByRole('button', { name: 'Cancelar' }));
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        expect(api.post).not.toHaveBeenCalled();

        await userEvent.click(within(screen.getByTestId('servico-email-worker')).getByRole('button', { name: 'Reiniciar' }));
        dialogo = screen.getByRole('dialog');
        await userEvent.type(within(dialogo).getByLabelText(/Motivo/), '  Fila de e-mails parada  ');
        await userEvent.click(within(dialogo).getByRole('button', { name: 'Reiniciar' }));
        expect(api.post).toHaveBeenCalledWith(`${BASE}/containers/email-worker/restart`, { confirm: true, motivo: 'Fila de e-mails parada' });
        expect(await screen.findByText(/Reinício de email-worker pedido/)).toBeInTheDocument();
    });

    it('recusa do servidor (limite de 2 min) aparece com a mensagem dele', async () => {
        api.get.mockResolvedValue({ data: SERVICOS });
        api.post.mockRejectedValue({ response: { status: 429, data: { error: 'Este container foi reiniciado há menos de 2 minutos.' } } });
        render(<ServicosTab />);
        await userEvent.click(within(await screen.findByTestId('servico-email-worker')).getByRole('button', { name: 'Reiniciar' }));
        await userEvent.type(within(screen.getByRole('dialog')).getByLabelText(/Motivo/), 'Fila de e-mails parada');
        await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Reiniciar' }));
        expect(await screen.findByText('Este container foi reiniciado há menos de 2 minutos.')).toBeInTheDocument();
    });

    it('monitoramento desligado: avisa e o reinício fica indisponível', async () => {
        api.get.mockResolvedValue({ data: { ...SERVICOS, monitoramento_ligado: false } });
        render(<ServicosTab />);
        expect(await screen.findByText(/Monitoramento desligado/)).toBeInTheDocument();
        expect(within(screen.getByTestId('servico-email-worker')).getByRole('button', { name: 'Reiniciar' })).toBeDisabled();
    });
});

describe('filas', () => {
    const FILAS = { filas: [{ nome: 'emailQueue', contagens: { waiting: 0, active: 1, completed: 5, failed: 2, delayed: 0 } }, { nome: 'blockchainQueue', contagens: { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 } }] };
    const JOBS = { total: 2, jobs: [{ id: '11', nome: 'sendEmail', motivo: 'SMTP fora', tentativas: 3, data: '2026-10-30T11:00:00Z' }, { id: '12', nome: 'sendEmail', motivo: 'SMTP fora', tentativas: 3, data: '2026-10-30T11:01:00Z' }] };
    const servidor = () => api.get.mockImplementation((url) => Promise.resolve({ data: url.endsWith('/queues') ? FILAS : JOBS }));

    it('lista as contagens e os falhos da primeira fila, com motivo e tentativas', async () => {
        servidor();
        render(<FilasTab />);
        expect(await screen.findByTestId('fila-emailQueue')).toHaveTextContent('2');
        expect(await screen.findAllByText('SMTP fora')).toHaveLength(2);
        expect(api.get).toHaveBeenCalledWith(`${BASE}/queues/emailQueue/jobs`, { params: { estado: 'failed', pagina: 1, tamanho: 20 } });
    });

    it('reenfileirar os selecionados pede confirmação e mostra o resultado', async () => {
        servidor();
        api.post.mockResolvedValue({ data: { reenfileirados: ['11'], ignorados: 1, nao_encontrados: 0 } });
        render(<FilasTab />);
        await screen.findAllByText('SMTP fora');
        await userEvent.click(screen.getByLabelText('Selecionar job 11'));
        await userEvent.click(screen.getByLabelText('Selecionar job 12'));
        await userEvent.click(screen.getByRole('button', { name: /Reenfileirar selecionados \(2\)/ }));
        expect(api.post).not.toHaveBeenCalled();
        await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar' }));
        expect(api.post).toHaveBeenCalledWith(`${BASE}/queues/emailQueue/retry`, { confirm: true, ids: ['11', '12'] });
        expect(await screen.findByText(/1 reenfileirado\(s\); 1 ignorado\(s\)/)).toBeInTheDocument();
    });

    it('limpar todos os falhos: cancelar não chama o servidor; confirmar manda o estado, sem ids', async () => {
        servidor();
        api.post.mockResolvedValue({ data: { removidos: 2, ignorados: 0, nao_encontrados: 0 } });
        render(<FilasTab />);
        await screen.findAllByText('SMTP fora');
        await userEvent.click(screen.getByRole('button', { name: 'Limpar todos os falhos' }));
        expect(within(screen.getByRole('dialog')).getByText(/Jobs em execução nunca são removidos/)).toBeInTheDocument();
        await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }));
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        expect(api.post).not.toHaveBeenCalled();
        await userEvent.click(screen.getByRole('button', { name: 'Limpar todos os falhos' }));
        await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar' }));
        expect(api.post).toHaveBeenCalledWith(`${BASE}/queues/emailQueue/clean`, { confirm: true, estado: 'failed' });
    });
});

describe('notificações no navegador', () => {
    const subscribe = vi.fn();
    const getSubscription = vi.fn();
    beforeEach(() => {
        subscribe.mockReset(); getSubscription.mockReset();
        Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: { ready: Promise.resolve({ pushManager: { subscribe, getSubscription } }) } });
        window.PushManager = function PushManager() {};
        window.Notification = { permission: 'default', requestPermission: vi.fn(async () => 'granted') };
    });

    it('sem chave no servidor: avisa que está desligado e não oferece o botão', async () => {
        api.get.mockResolvedValue({ data: { publicKey: null } });
        render(<NotificacoesMonitoramento />);
        expect(await screen.findByText(/desligadas no servidor/)).toBeInTheDocument();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('ativar pede permissão, assina com a chave do servidor e envia endpoint e chaves', async () => {
        api.get.mockResolvedValue({ data: { publicKey: 'AQID' } });
        api.post.mockResolvedValue({ data: { ok: true } });
        getSubscription.mockResolvedValue(null);
        subscribe.mockResolvedValue({ toJSON: () => ({ endpoint: 'https://push.example/x', keys: { p256dh: 'P', auth: 'A' } }) });
        render(<NotificacoesMonitoramento />);
        await userEvent.click(await screen.findByRole('button', { name: 'Receber alertas neste navegador' }));
        expect(window.Notification.requestPermission).toHaveBeenCalled();
        expect(subscribe.mock.calls[0][0].userVisibleOnly).toBe(true);
        expect(Array.from(subscribe.mock.calls[0][0].applicationServerKey)).toEqual([1, 2, 3]);
        expect(api.post).toHaveBeenCalledWith(`${BASE}/push/subscriptions`, { endpoint: 'https://push.example/x', keys: { p256dh: 'P', auth: 'A' } });
        expect(await screen.findByText(/ativos neste navegador/)).toBeInTheDocument();
    });

    it('permissão negada: não assina nem envia nada', async () => {
        api.get.mockResolvedValue({ data: { publicKey: 'AQID' } });
        getSubscription.mockResolvedValue(null);
        window.Notification.requestPermission = vi.fn(async () => 'denied');
        render(<NotificacoesMonitoramento />);
        await userEvent.click(await screen.findByRole('button', { name: 'Receber alertas neste navegador' }));
        expect(await screen.findByText(/bloqueadas/)).toBeInTheDocument();
        expect(subscribe).not.toHaveBeenCalled();
        expect(api.post).not.toHaveBeenCalled();
    });

    it('desativar remove no servidor e cancela no navegador', async () => {
        const unsubscribe = vi.fn(async () => true);
        api.get.mockResolvedValue({ data: { publicKey: 'AQID' } });
        api.delete.mockResolvedValue({ data: { removida: true } });
        getSubscription.mockResolvedValue({ endpoint: 'https://push.example/x', unsubscribe });
        render(<NotificacoesMonitoramento />);
        await userEvent.click(await screen.findByRole('button', { name: 'Desativar' }));
        expect(api.delete).toHaveBeenCalledWith(`${BASE}/push/subscriptions`, { data: { endpoint: 'https://push.example/x' } });
        expect(unsubscribe).toHaveBeenCalled();
        expect(await screen.findByRole('button', { name: 'Receber alertas neste navegador' })).toBeInTheDocument();
    });
});

/** isolate-dropshipping-maintenance-jobs, 3.3: a tabela de filas mostra a espera mais antiga e destaca fila parada ou lenta. */
describe('situação das filas', () => {
    const fila = (espera, active = 0, waiting = 1) => ({ espera_mais_antiga_segundos: espera, contagens: { waiting, active, failed: 0, delayed: 0, completed: 0 } });

    it('sem job esperando não há espera; espera curta é normal', () => {
        expect(situacaoFila(fila(null, 0, 0))).toMatchObject({ nivel: 'ok', espera: null });
        expect(situacaoFila({ contagens: {} })).toMatchObject({ nivel: 'ok', espera: null }); // API antiga, sem o campo
        expect(situacaoFila(fila(120))).toMatchObject({ nivel: 'ok', rotulo: 'Normal', espera: 120 });
    });

    it('espera acima do limite e NENHUM job em execução = parada; com job em execução = lenta; o limite vem do servidor', () => {
        expect(situacaoFila(fila(1200, 0))).toMatchObject({ nivel: 'error', rotulo: 'Parada' });
        expect(situacaoFila(fila(1200, 2))).toMatchObject({ nivel: 'warning', rotulo: 'Lenta' });
        expect(situacaoFila(fila(899, 0)).nivel).toBe('ok');
        expect(situacaoFila(fila(900, 0)).nivel).toBe('error'); // no limite já vale
        expect(situacaoFila(fila(1200, 0), 3600).nivel).toBe('ok'); // QUEUE_STALE_MINUTES=60
    });

    it('duração em segundos legível; inválido vira traço', () => {
        expect(duracaoSegundos(30)).toBe('menos de 1 min');
        expect(duracaoSegundos(600)).toBe('10 min');
        expect(duracaoSegundos(9000)).toBe('2 h 30 min');
        for (const v of [null, undefined, -5, 'abc']) expect(duracaoSegundos(v)).toBe('—');
    });

    it('a tabela mostra a espera de cada fila e o selo só onde há problema, usando o limite que o servidor mandou', async () => {
        const dados = { limite_parada_segundos: 600, filas: [
            { nome: 'emailQueue', espera_mais_antiga_segundos: null, contagens: { waiting: 0, active: 0, failed: 0, delayed: 0, completed: 0 } },
            { nome: 'dropshipping-critical', espera_mais_antiga_segundos: 720, contagens: { waiting: 4, active: 0, failed: 0, delayed: 0, completed: 9 } },
            { nome: 'dropshipping-network', espera_mais_antiga_segundos: 700, contagens: { waiting: 1, active: 1, failed: 0, delayed: 0, completed: 0 } },
            { nome: 'dropshipping-housekeeping', espera_mais_antiga_segundos: 120, contagens: { waiting: 1, active: 0, failed: 0, delayed: 0, completed: 0 } },
        ] };
        api.get.mockImplementation((url) => Promise.resolve({ data: url.endsWith('/queues') ? dados : { total: 0, jobs: [] } }));
        render(<FilasTab />);
        await screen.findByTestId('fila-emailQueue');
        const celula = (nome) => document.querySelector(`[data-fila-espera="${nome}"]`);
        expect(celula('emailQueue').textContent).toBe('—');
        expect(celula('dropshipping-critical').textContent).toMatch(/12 min.*Parada/);
        expect(celula('dropshipping-critical').querySelector('[data-fila-situacao="error"]')).not.toBeNull();
        expect(celula('dropshipping-network').querySelector('[data-fila-situacao="warning"]')).not.toBeNull();
        expect(celula('dropshipping-housekeeping').textContent).toMatch(/2 min/);
        expect(celula('dropshipping-housekeeping').querySelector('[data-fila-situacao]')).toBeNull();
    });
});
