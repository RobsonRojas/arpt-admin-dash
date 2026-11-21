/** Regras puras da tela de cupons (add-store-discount-coupons). O servidor valida de novo; aqui só se evita ida e volta com dado óbvio. */

export const TIPOS = { PERCENTUAL: 'Percentual (%)', FIXO: 'Valor fixo (R$)' };
export const CODIGO_RE = /^[A-Z0-9_-]{8,32}$/;

export const moeda = (cents) => (Number(cents || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const percentual = (bps) => `${(Number(bps) / 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
export const descricaoValor = (c) => (c.tipo === 'PERCENTUAL' ? percentual(c.valor) : moeda(c.valor));

const paraInput = (v) => (v ? new Date(v).toISOString().slice(0, 16) : '');
const hojeInput = (dias = 0) => new Date(Date.now() + dias * 86400000).toISOString().slice(0, 16);
const decimal = (s) => Number(String(s ?? '').replace(',', '.'));

export const formVazio = () => ({ codigo: '', tipo: 'PERCENTUAL', valor: '', validoDe: hojeInput(), validoAte: hojeInput(30), quantidadeTotal: '', valorMinimo: '', lojas: [] });

export const formDoCupom = (c, lojasPorId = new Map()) => ({
  id: c.id, codigo: c.codigo, tipo: c.tipo, jaUsado: !!c.jaUsado,
  valor: String(c.valor / 100), // bps -> %, centavos -> R$
  validoDe: paraInput(c.validoDe), validoAte: paraInput(c.validoAte), quantidadeTotal: String(c.quantidadeTotal),
  valorMinimo: c.valorMinimoCents ? String(c.valorMinimoCents / 100) : '',
  lojas: c.lojaIds.map((id) => lojasPorId.get(id) ?? { id, nome: `Loja #${id}` }),
});

/** Estado do cupom para a lista: pausado vence tudo; depois validade e saldo. */
export function estadoDoCupom(c, agora = Date.now()) {
  if (!c.ativo) return { rotulo: 'Pausado', cor: 'warning' };
  if (new Date(c.validoAte).getTime() <= agora) return { rotulo: 'Vencido', cor: 'default' };
  if (new Date(c.validoDe).getTime() > agora) return { rotulo: 'Agendado', cor: 'info' };
  if (c.saldo <= 0) return { rotulo: 'Esgotado', cor: 'default' };
  return { rotulo: 'Ativo', cor: 'success' };
}

/** Erros por campo. Em cupom já usado, código, tipo e valor ficam travados e não são validados. */
export function errosCupom(f) {
  const e = {};
  if (!f.id || !f.jaUsado) {
    if (!CODIGO_RE.test(String(f.codigo || '').trim().toUpperCase())) e.codigo = 'Use de 8 a 32 caracteres: letras, números, - ou _.';
    const v = decimal(f.valor);
    if (!Number.isFinite(v) || v <= 0) e.valor = 'Informe um valor maior que zero.';
    else if (f.tipo === 'PERCENTUAL' && (v < 1 || v > 99)) e.valor = 'Percentual entre 1% e 99%.';
  }
  if (!f.validoDe) e.validoDe = 'Informe o início.';
  if (!f.validoAte) e.validoAte = 'Informe o fim.';
  else if (f.validoDe && new Date(f.validoAte) <= new Date(f.validoDe)) e.validoAte = 'O fim deve ser posterior ao início.';
  const q = Number(f.quantidadeTotal);
  if (!Number.isInteger(q) || q < 1) e.quantidadeTotal = 'Quantidade de pelo menos 1.';
  if (f.valorMinimo !== '' && !(decimal(f.valorMinimo) >= 0)) e.valorMinimo = 'Valor mínimo inválido.';
  if (!f.lojas?.length) e.lojas = 'Escolha ao menos uma loja.';
  return e;
}

/** Corpo da API: percentual em pontos-base, valores em centavos inteiros. Cupom já usado não reenvia código, tipo nem valor. */
export function corpoCupom(f) {
  const base = {
    validoDe: new Date(f.validoDe).toISOString(), validoAte: new Date(f.validoAte).toISOString(),
    quantidadeTotal: Number(f.quantidadeTotal),
    valorMinimoCents: f.valorMinimo === '' ? null : Math.round(decimal(f.valorMinimo) * 100),
    lojaIds: f.lojas.map((l) => l.id),
  };
  if (f.id && f.jaUsado) return base;
  return { ...base, codigo: String(f.codigo).trim().toUpperCase(), tipo: f.tipo, valor: Math.round(decimal(f.valor) * 100) };
}

export const STATUS_USO = { RESERVADO: 'Reservado', CONSUMIDO: 'Consumido', LIBERADO: 'Liberado' };
