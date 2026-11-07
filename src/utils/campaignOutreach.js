// Regras de tela da promoção de campanhas (add-campaign-adhesion-outreach). O servidor valida de novo; aqui é só para o erro aparecer
// antes do envio e para o painel mostrar só o que o estado permite.

export const PUBLICOS = { dropshipper: 'Dropshippers', produtor: 'Produtores', ambos: 'Dropshippers e produtores' };
export const SEGMENTOS = {
  dropshipper_sem_loja: { rotulo: 'Dropshipper sem loja', publico: 'dropshipper' },
  dropshipper_loja_sem_venda: { rotulo: 'Dropshipper com loja e sem venda', publico: 'dropshipper' },
  produtor_sem_produto_ativo: { rotulo: 'Produtor sem produto ativo', publico: 'produtor' },
};
export const CANAIS = { notificacao: 'Aviso na plataforma', email: 'E-mail' };
export const ESTADOS_ENVIO = {
  aguardando: 'Aguardando', enviando: 'Enviando', concluido: 'Concluído', interrompido: 'Interrompido pela campanha',
};
export const ETAPAS_PROMO = {
  alcancados: 'Alcançados', avisos_vistos: 'Avisos vistos', emails_enviados: 'E-mails enviados', adesoes: 'Adesões', novos_membros: 'Novos membros',
};

export const FORM_PROMOCAO_VAZIO = () => ({
  publico: 'dropshipper', segmento: '', titulo: '', resumo: '', corpo: '', lembreteDias: '5', incentivos: { selo: false, materiaisAntecipados: false, citaBonus: false },
});

export const formDaPromocao = (p) => (p ? {
  publico: p.publico, segmento: p.segmento ?? '', titulo: p.titulo, resumo: p.resumo, corpo: p.corpo, lembreteDias: String(p.lembrete_dias ?? 5),
  incentivos: { selo: !!p.incentivos?.selo, materiaisAntecipados: !!p.incentivos?.materiaisAntecipados, citaBonus: !!p.incentivos?.citaBonus },
} : FORM_PROMOCAO_VAZIO());

/** Segmentos que combinam com o público escolhido ("ambos" não aceita segmento). */
export const segmentosDoPublico = (publico) => Object.entries(SEGMENTOS).filter(([, s]) => s.publico === publico).map(([chave, s]) => ({ chave, rotulo: s.rotulo }));

/** Erros do formulário, por campo. `ctx.incentivoDoTipo` = a campanha concede bônus; `ctx.incentivosLigados` = chave financeira. */
export function errosPromocao(f, ctx = {}) {
  const e = {};
  if (!PUBLICOS[f.publico]) e.publico = 'Escolha o público.';
  if (f.segmento) {
    if (f.publico === 'ambos') e.segmento = 'Segmento só vale para um público (dropshipper ou produtor).';
    else if (SEGMENTOS[f.segmento]?.publico !== f.publico) e.segmento = 'O segmento não combina com o público escolhido.';
  }
  if (String(f.titulo ?? '').trim().length < 3) e.titulo = 'Informe um título.';
  if (String(f.resumo ?? '').trim().length < 3) e.resumo = 'Informe um resumo.';
  if (String(f.corpo ?? '').trim().length < 10) e.corpo = 'Escreva o texto da promoção.';
  const dias = Number(f.lembreteDias);
  if (!Number.isInteger(dias) || dias < 1 || dias > 30) e.lembreteDias = 'Informe de 1 a 30 dias.';
  if (f.incentivos?.citaBonus) {
    if (!ctx.incentivoDoTipo) e['incentivos.citaBonus'] = 'Esta campanha não concede bônus de comissão.';
    else if (!ctx.incentivosLigados) e['incentivos.citaBonus'] = 'A chave de incentivo financeiro está desligada; a promoção não pode citar o bônus.';
  }
  return e;
}

/** Corpo do PUT, no formato estrito do servidor. */
export const corpoPromocao = (f) => ({
  publico: f.publico, segmento: f.segmento || null, titulo: f.titulo.trim(), resumo: f.resumo.trim(), corpo: f.corpo.trim(),
  lembreteDias: Number(f.lembreteDias), incentivos: { selo: !!f.incentivos.selo, materiaisAntecipados: !!f.incentivos.materiaisAntecipados, citaBonus: !!f.incentivos.citaBonus },
});

/**
 * Por que o botão de LIGAR o canal está desabilitado (texto para o administrador), ou `null` se pode ligar. Desligar nunca é bloqueado.
 * `previa` traz só contagens; `chaves` vem da configuração do sistema.
 */
export function motivoCanalBloqueado(canal, { campanhaEstado, chaves, previa, citaBonus }) {
  if (campanhaEstado !== 'ativa') return 'Só é possível ligar um canal com a campanha ativa.';
  if (!chaves?.[canal]) return `O canal “${CANAIS[canal]}” está desligado na configuração do sistema.`;
  if (citaBonus && !chaves.incentivosFinanceiros) return 'A promoção cita o bônus e a chave de incentivo financeiro está desligada.';
  if (!previa || previa.publico === 0) return 'O público escolhido não tem nenhuma pessoa.';
  // E-mail com zero consentimentos é permitido: o envio só alcança quem consentiu, e a prévia já mostra o número.
  return null;
}

/** Estado do envio mostrado no painel, derivado das contagens (sem lista de pessoas). */
export function estadoDoEnvio({ campanhaEstado, canais, envio, previa }) {
  const algumLigado = !!(canais?.email || canais?.notificacao);
  if (!algumLigado && !(envio?.enviados > 0)) return 'aguardando';
  if (algumLigado && campanhaEstado !== 'ativa') return 'interrompido';
  if (canais?.email && campanhaEstado === 'ativa') {
    const feito = envio?.enviados > 0 && envio?.pendentes === 0 && (previa ? envio.enviados + (envio.cancelados ?? 0) >= previa.publico : false);
    return feito ? 'concluido' : 'enviando';
  }
  return algumLigado ? 'concluido' : 'interrompido';
}
