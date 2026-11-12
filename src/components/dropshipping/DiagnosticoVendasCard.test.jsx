import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('../../services/api', () => ({ api: { get } }));

import DiagnosticoVendasCard from './DiagnosticoVendasCard';

const base = (extra = {}) => ({
  loja: { id: 7, slug: 'acurui', nome: 'Acurui', status: 'ATIVA' }, vende: true, produtos_disponiveis: 3,
  motivos_loja: [], produtos_indisponiveis: [], sistema: { orders_enabled: true, frete_liberado: true }, ...extra,
});
const mostrar = (props = {}) => render(<MemoryRouter><DiagnosticoVendasCard storeId={7} nome="Acurui" {...props} /></MemoryRouter>);

beforeEach(() => { get.mockClear(); });
afterEach(cleanup);

/** add-admin-store-availability-diagnostics, 2.3. */
describe('diagnóstico de vendas da loja', () => {
  it('loja bloqueada: lista o motivo, quem resolve e o link para os Termos de Uso', async () => {
    get.mockResolvedValue({ data: base({
      vende: false, produtos_disponiveis: 0,
      motivos_loja: [{ code: 'TERMS_FREIGHT_CLAUSE_MISSING_PRODUTOR', mensagem: 'O termo vigente de PRODUTOR não tem a cláusula de frete.', responsavel: 'ADMIN', acao: { tipo: 'ABRIR_TERMOS', audience: 'PRODUTOR' }, bloqueia_venda: true }],
    }) });
    mostrar();
    expect(await screen.findByText('A loja não está vendendo agora.')).toBeTruthy();
    expect(screen.getByText(/não tem a cláusula de frete/)).toBeTruthy();
    expect(screen.getByText('Quem resolve: ARPT')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Abrir Termos de Uso/ }).getAttribute('href')).toBe('/terms-of-use');
    expect(get).toHaveBeenCalledWith('/api/v1/admin/dropshipping/stores/7/availability');
  });

  it('produtos indisponíveis: cada um com o motivo e o responsável', async () => {
    get.mockResolvedValue({ data: base({ produtos_indisponiveis: [
      { produto_id: 1, nome: 'Deck de ipê', code: 'SHIPPING_DATA_MISSING', mensagem: 'Faltam dados de frete do produto.', responsavel: 'PRODUTOR', acao: { tipo: 'AVISAR', quem: 'PRODUTOR' } },
      { produto_id: 2, nome: 'Piso', code: 'PRICE_BELOW_MINIMUM', mensagem: 'O preço de venda está abaixo do mínimo.', responsavel: 'DROPSHIPPER', acao: { tipo: 'AVISAR', quem: 'DROPSHIPPER' } },
    ] }) });
    mostrar();
    expect(await screen.findByText('Produtos indisponíveis (2)')).toBeTruthy();
    expect(screen.getByText('Deck de ipê')).toBeTruthy();
    expect(screen.getByText('Quem resolve: Produtor')).toBeTruthy();
    expect(screen.getByText('Quem resolve: Dropshipper')).toBeTruthy();
    expect(screen.getByText('Loja apta a vender (3 produto(s) disponível(is)).')).toBeTruthy();
  });

  it('tudo em ordem: indica que a loja está apta e não lista motivos', async () => {
    get.mockResolvedValue({ data: base() });
    mostrar();
    expect(await screen.findByText('Loja apta a vender (3 produto(s) disponível(is)).')).toBeTruthy();
    expect(screen.queryByText('Motivos da loja')).toBeNull();
    expect(screen.queryByText(/Produtos indisponíveis/)).toBeNull();
  });

  it('depois do aceite em nome, com motivo de sistema: diz que o aceite não garante a venda', async () => {
    get.mockResolvedValue({ data: base({
      vende: false, produtos_disponiveis: 0,
      motivos_loja: [{ code: 'ORDERS_DISABLED', mensagem: 'Os pedidos estão desligados.', responsavel: 'ADMIN', acao: { tipo: 'LIGAR_PEDIDOS' }, bloqueia_venda: true }],
    }) });
    mostrar({ aposAceite: true });
    expect(await screen.findByText(/o aceite não garante a venda/)).toBeTruthy();
  });

  it('depois do aceite em nome, sem motivos: confirma que a loja pode vender', async () => {
    get.mockResolvedValue({ data: base() });
    mostrar({ aposAceite: true });
    expect(await screen.findByText(/Aceite registrado. Pelo diagnóstico, a loja está apta a vender./)).toBeTruthy();
  });

  it('motivo que não bloqueia a venda aparece marcado como tal', async () => {
    get.mockResolvedValue({ data: base({ motivos_loja: [{ code: 'TERMS_OUTDATED', mensagem: 'O dono ainda não aceitou a versão vigente.', responsavel: 'DROPSHIPPER', acao: { tipo: 'ACEITE_EM_NOME', user_id: 'u1' }, bloqueia_venda: false }] }) });
    mostrar();
    expect(await screen.findByText('Não impede a venda')).toBeTruthy();
  });

  it('falha ao carregar: mostra o erro', async () => {
    // Thenable que rejeita: evita uma Promise rejeitada solta, que o vitest acusa como erro não tratado.
    const falha = Object.assign(new Error('falhou'), { response: { data: { error: 'Loja não encontrada.' } } });
    get.mockImplementation(() => ({ then: (_ok, rejeitar) => rejeitar(falha) }));
    mostrar();
    expect(await screen.findByText('Loja não encontrada.')).toBeTruthy();
  });
});
