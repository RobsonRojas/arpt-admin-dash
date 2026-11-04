// Regras de tela das campanhas de crescimento (add-growth-campaigns-module). O servidor valida de novo; aqui é só para o erro aparecer
// antes do envio e para o painel mostrar só as ações que o estado permite.

export const ESTADOS = { rascunho: 'Rascunho', ativa: 'Ativa', pausada: 'Pausada', encerrada: 'Encerrada' };
export const COR_ESTADO = { rascunho: 'default', ativa: 'success', pausada: 'warning', encerrada: 'default' };
export const MOTIVOS_ENCERRAMENTO = { prazo: 'Prazo', meta: 'Meta atingida', manual: 'Manual' };
export const ALERTAS = {
    ritmo_abaixo_do_esperado: 'Ritmo abaixo do esperado para o tempo decorrido',
    orcamento_em_risco: 'Orçamento acima de 80% sem a meta proporcional',
};
export const METAS = { dropshipper_loja: 'Novos dropshippers com loja online', produtor_ativo: 'Novos produtores com produto ativo' };
export const ETAPAS = {
    alcance: 'Alcance', cadastro: 'Cadastro', email_verificado: 'E-mail verificado', ativacao: 'Loja ou produto ativo', primeira_venda: 'Primeira venda',
};

/** Ações que o estado permite. As demais ficam desabilitadas na tela. */
export const acoesPermitidas = (estado) => ({
    editar: estado === 'rascunho',
    activate: estado === 'rascunho',
    pause: estado === 'ativa',
    resume: estado === 'pausada',
    close: estado !== 'encerrada',
    duplicate: estado === 'encerrada',
});

const num = (v) => Number(String(v ?? '').replace(',', '.'));

/** Erros do formulário, por campo. Objeto vazio = pode enviar. `tipo` vem de `/tipos` (rótulo, incentivo, metas). */
export function errosCampanha(f, tipo) {
    const e = {};
    if (String(f.nome ?? '').trim().length < 3) e.nome = 'Informe um nome com ao menos 3 letras.';
    if (!f.tipo) e.tipo = 'Escolha o mecanismo.';
    const ini = new Date(f.inicio), fim = new Date(f.fim);
    if (!f.inicio || Number.isNaN(ini.getTime())) e.inicio = 'Informe o início.';
    if (!f.fim || Number.isNaN(fim.getTime())) e.fim = 'O prazo (data final) é obrigatório.';
    else if (!e.inicio && fim <= ini) e.fim = 'A data final deve ser posterior ao início.';
    const meta = num(f.metaValor);
    if (!String(f.metaValor ?? '').trim() || !Number.isInteger(meta) || meta <= 0) e.metaValor = 'A meta é obrigatória e deve ser um inteiro maior que zero.';
    if (tipo && !tipo.metas.includes(f.metaTipo)) e.metaTipo = 'Tipo de meta não aceito por este mecanismo.';
    if (tipo?.incentivo) {
        const p = f.parametros ?? {};
        if (!(num(p.passoPontos) > 0)) e['parametros.passoPontos'] = 'Informe o passo (pontos percentuais por indicado).';
        if (!(num(p.limiteComissaoTotal) > 0)) e['parametros.limiteComissaoTotal'] = 'O teto de comissão total por pessoa é obrigatório.';
        const meses = num(p.duracaoBonusMeses);
        if (!Number.isInteger(meses) || meses < 1 || meses > 60) e['parametros.duracaoBonusMeses'] = 'Informe a duração do bônus em meses (1 a 60).';
        if (String(p.orcamentoTotal ?? '').trim() && !(num(p.orcamentoTotal) > 0)) e['parametros.orcamentoTotal'] = 'O orçamento, se informado, deve ser maior que zero.';
    }
    return e;
}

/** Corpo do POST, no formato estrito do servidor (números como número, orçamento só se informado). */
export function corpoCampanha(f, tipo) {
    const parametros = {};
    if (tipo?.incentivo) {
        const p = f.parametros ?? {};
        parametros.passoPontos = num(p.passoPontos);
        parametros.limiteComissaoTotal = num(p.limiteComissaoTotal);
        parametros.duracaoBonusMeses = num(p.duracaoBonusMeses);
        if (String(p.orcamentoTotal ?? '').trim()) parametros.orcamentoTotal = num(p.orcamentoTotal);
    }
    return {
        nome: f.nome.trim(), tipo: f.tipo, inicio: new Date(f.inicio).toISOString(), fim: new Date(f.fim).toISOString(),
        metaTipo: f.metaTipo, metaValor: num(f.metaValor), parametros,
    };
}

/**
 * Prévia do custo máximo por indicador: bônus máximo em pontos percentuais (teto menos a comissão inicial), quantos passos isso exige e por
 * quantos meses cada um vale. `null` se os números ainda não bastam.
 */
export function previaCustoMaximo(parametros, comissaoInicial) {
    const passo = num(parametros?.passoPontos), teto = num(parametros?.limiteComissaoTotal), meses = num(parametros?.duracaoBonusMeses);
    if (!(passo > 0) || !(teto > 0) || !(meses > 0) || !Number.isFinite(Number(comissaoInicial))) return null;
    const bonus = Math.max(0, Math.round((teto - Number(comissaoInicial)) * 100) / 100);
    return { bonusMaximoPontos: bonus, passos: Math.ceil(bonus / passo), meses };
}

export const moeda = (v) => (v === null || v === undefined ? 'indisponível' : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
export const percentual = (v) => (v === null || v === undefined ? 'sem dado' : `${(Number(v) * 100).toFixed(1).replace('.', ',')}%`);

/** Campanha com incentivo não pode ser ativada com a chave de incentivo financeiro desligada. */
export const ativacaoBloqueada = (tipo, incentivosLigados) => !!tipo?.incentivo && !incentivosLigados;
