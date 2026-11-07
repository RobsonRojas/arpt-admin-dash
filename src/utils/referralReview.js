// Revisão das indicações (growth-referral-review-expiry): rótulos e preparo dos dados da seção do painel. Funções puras, sem React.

export const ESTADOS = [
  ['nao_qualificada', 'Abertas', 'Aguardam uma ação real do indicado (pedido, patrocínio ou produto com estoque).'],
  ['qualificada', 'Qualificadas', 'Ação real confirmada. Ficam como recompensa pendente, sem valor.'],
  ['bloqueada', 'Bloqueadas', 'Barradas pelo anti-fraude. O motivo fica registrado.'],
  ['expirada', 'Expiradas', 'Passaram do prazo de validade sem ação confirmada.'],
];

const MOTIVOS = {
  auto_indicacao: 'Auto-indicação',
  cpf_igual: 'CPF igual ao do indicador',
  email_igual: 'E-mail igual ao do indicador',
  dispositivo_igual: 'Dispositivo igual ao do indicador',
  email_nao_verificado: 'E-mail não verificado',
  gatilho_incorreto: 'Ação de outro tipo',
  sem_motivo: 'Sem motivo registrado',
};

/** Rótulo legível do motivo. Um motivo novo no servidor aparece como veio, em vez de sumir. */
export const rotuloMotivo = (motivo) => MOTIVOS[motivo] ?? String(motivo);

/** Inteiro para exibição; ausente ou inválido vira 0 (a contagem, ao contrário de uma taxa, nunca é "sem dado"). */
export const contagem = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

/** Total de indicações no período, somando todos os estados. */
export const totalIndicacoes = (porEstado) => Object.values(porEstado ?? {}).reduce((s, v) => s + contagem(v), 0);

/** Motivos de bloqueio em ordem do mais para o menos frequente (empate: ordem alfabética do rótulo). */
export function motivosOrdenados(bloqueadasPorMotivo) {
  return Object.entries(bloqueadasPorMotivo ?? {})
    .map(([motivo, n]) => ({ motivo, rotulo: rotuloMotivo(motivo), n: contagem(n) }))
    .sort((a, b) => b.n - a.n || a.rotulo.localeCompare(b.rotulo, 'pt-BR'));
}

/** "Auto-indicação: 2 · CPF igual: 1" para a linha de um indicador. */
export function resumoMotivos(porMotivo) {
  return motivosOrdenados(porMotivo).map((m) => `${m.rotulo}: ${m.n}`).join(' · ');
}

/** Início do identificador interno para a tabela (o identificador completo vai no `title`, para copiar). */
export const idCurto = (id) => (typeof id === 'string' && id.length > 8 ? `${id.slice(0, 8)}…` : String(id ?? ''));
