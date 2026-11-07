import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DICTIONARIES, translate } from './i18n';
import { DNS_PROVIDERS, PROVEDORES_OBRIGATORIOS, nomeRelativoDoDominio } from './dnsProviders';

const idioma = vi.hoisted(() => ({ lang: 'pt' }));
const notify = vi.hoisted(() => vi.fn());
vi.mock('./LangContext', async () => {
  const { translate: tr } = await import('./i18n');
  return { useLang: () => ({ lang: idioma.lang, t: (k, p) => tr(idioma.lang, k, p), err: () => 'erro' }) };
});
vi.mock('./PanelContext', () => ({ usePanel: () => ({ notify }), BASE: (id) => `/api/v1/dropshipping/stores/${id}` }));

import DnsGuide, { DiagnosticoDaVerificacao } from './DnsGuide';

/** add-store-domain-dns-guide, 2.8. Formato real da API: `apontamento = { cname, ips, raiz_suportada, recomendado, observacao }`. */
const subdominio = (extra = {}) => ({
  id: 1, dominio: 'loja.exemplo.com.br', status: 'PENDENTE', expira_em: '2026-11-10T12:00:00.000Z',
  instrucoes: {
    zona: 'exemplo.com.br', raiz: false,
    txt: { nome: '_arpt-verify.loja.exemplo.com.br', nome_relativo: '_arpt-verify.loja', tipo: 'TXT', valor: 'a'.repeat(64) },
    apontamento: { cname: 'lojas.arpt.site', ips: [], raiz_suportada: false, recomendado: 'CNAME', observacao: 'x' },
  }, ...extra,
});
const raiz = (ips = []) => ({
  id: 2, dominio: 'exemplo.com.br', status: 'PENDENTE',
  instrucoes: {
    zona: 'exemplo.com.br', raiz: true,
    txt: { nome: '_arpt-verify.exemplo.com.br', nome_relativo: '_arpt-verify', tipo: 'TXT', valor: 'b'.repeat(64) },
    apontamento: { cname: 'lojas.arpt.site', ips, raiz_suportada: ips.length > 0, recomendado: ips.length ? 'A' : null, observacao: 'x' },
  },
});
const escolher = async (user, id) => {
  await user.click(screen.getByRole('combobox'));
  await user.click(await screen.findByTestId(`dns-provider-${id}`));
};

beforeEach(() => { vi.clearAllMocks(); idioma.lang = 'pt'; });
afterEach(cleanup);

describe('registros a criar', () => {
  it('subdomínio: TXT e CNAME em tabelas com tipo, nome e valor, e o destino do CNAME sempre visível', () => {
    render(<DnsGuide x={subdominio()} />);
    const txt = within(screen.getByTestId('dns-table-txt'));
    expect(txt.getByText('TXT')).toBeTruthy();
    expect(txt.getByTestId('dns-txt-nome').textContent).toBe('_arpt-verify.loja.exemplo.com.br');
    expect(txt.getByTestId('dns-txt-nome-relativo').textContent).toBe('_arpt-verify.loja');
    expect(txt.getByTestId('dns-txt-valor').textContent).toBe('a'.repeat(64));
    const ponto = within(screen.getByTestId('dns-table-point'));
    expect(ponto.getByText('CNAME')).toBeTruthy();
    expect(ponto.getByTestId('dns-point-destino').textContent).toBe('lojas.arpt.site'); // antes aparecia em branco
    expect(ponto.getByTestId('dns-point-nome').textContent).toBe('loja.exemplo.com.br');
    expect(ponto.getByTestId('dns-point-nome-relativo').textContent).toBe('loja');
  });

  it('explica os dois nomes, com a zona', () => {
    render(<DnsGuide x={subdominio()} />);
    expect(screen.getByTestId('dns-name-help').textContent).toContain('exemplo.com.br');
    // o rótulo aparece uma vez no TXT e outra no CNAME
    expect(screen.getAllByText(/Nome relativo à zona \(exemplo\.com\.br\)/)).toHaveLength(2);
  });

  it('copiar leva o valor completo para a área de transferência e confirma', async () => {
    const user = userEvent.setup(); // o setup instala a área de transferência de teste: o espião vem depois
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    render(<DnsGuide x={subdominio()} />);
    await user.click(screen.getByTestId('dns-txt-valor-copiar'));
    expect(writeText).toHaveBeenCalledWith('a'.repeat(64));
    expect(notify).toHaveBeenCalledWith('success', 'Copiado.');
  });

  it('se a cópia falhar, avisa para copiar à mão (o texto segue selecionável)', async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('negado'));
    render(<DnsGuide x={subdominio()} />);
    await user.click(screen.getByTestId('dns-txt-nome-copiar'));
    expect(notify).toHaveBeenCalledWith('warning', expect.stringContaining('copie à mão'));
    expect(screen.getByTestId('dns-txt-nome').textContent).toBe('_arpt-verify.loja.exemplo.com.br');
  });

  it('mostra o prazo de expiração do cadastro pendente e o aviso de propagação', () => {
    render(<DnsGuide x={subdominio()} />);
    expect(screen.getByTestId('dns-expires')).toBeTruthy();
    expect(screen.getByText(/alguns minutos a algumas horas/)).toBeTruthy();
  });

  it('resposta de uma API antiga (sem zona, raiz e nome relativo) não quebra e mostra o essencial', () => {
    const antiga = { id: 3, dominio: 'loja.exemplo.com.br', status: 'PENDENTE', instrucoes: {
      txt: { nome: '_arpt-verify.loja.exemplo.com.br', tipo: 'TXT', valor: 'c'.repeat(64) }, apontamento: { cname: 'lojas.arpt.site', ips: [], observacao: 'x' } } };
    render(<DnsGuide x={antiga} />);
    expect(screen.getByTestId('dns-txt-nome').textContent).toBe('_arpt-verify.loja.exemplo.com.br');
    expect(screen.queryByTestId('dns-txt-nome-relativo')).toBeNull();
    expect(screen.getByTestId('dns-point-destino').textContent).toBe('lojas.arpt.site');
  });
});

describe('domínio raiz', () => {
  it('com IP: orienta o registro A com o IP e cita ALIAS/ANAME como alternativa; não oferece CNAME', () => {
    render(<DnsGuide x={raiz(['203.0.113.10', '203.0.113.11'])} />);
    expect(screen.getByTestId('dns-point-a').textContent).toMatch(/CNAME não é permitido na raiz/);
    expect(screen.getByTestId('dns-point-a').textContent).toMatch(/ALIAS, ANAME/);
    const ponto = within(screen.getByTestId('dns-table-point'));
    expect(ponto.getByText('A')).toBeTruthy();
    expect(ponto.getAllByTestId('dns-point-ip').map((e) => e.textContent)).toEqual(['203.0.113.10', '203.0.113.11']);
    expect(screen.queryByTestId('dns-point-cname')).toBeNull();
    expect(screen.getByTestId('dns-txt-nome-relativo').textContent).toBe('_arpt-verify');
  });

  it('sem IP configurado: informa que a raiz não é suportada e recomenda www. ou loja., sem pedir uma configuração que não passa', () => {
    render(<DnsGuide x={raiz([])} />);
    const aviso = screen.getByTestId('dns-root-unsupported');
    expect(aviso.textContent).toContain('www.exemplo.com.br');
    expect(aviso.textContent).toContain('loja.exemplo.com.br');
    expect(screen.queryByTestId('dns-table-point')).toBeNull();
  });

  it('subdomínio com IP configurado continua recomendando o CNAME', () => {
    const x = subdominio();
    x.instrucoes.apontamento = { ...x.instrucoes.apontamento, ips: ['203.0.113.10'], raiz_suportada: true };
    render(<DnsGuide x={x} />);
    expect(screen.getByTestId('dns-point-cname')).toBeTruthy();
    expect(screen.queryByTestId('dns-point-a')).toBeNull();
  });
});

describe('orientações por provedor', () => {
  it('sem escolha: só a orientação geral, sem notas de provedor', () => {
    render(<DnsGuide x={subdominio()} />);
    expect(screen.queryByTestId('dns-provider-notes')).toBeNull();
  });

  it('Cloudflare: avisa do proxy desligado e do CNAME na raiz por flattening', async () => {
    const user = userEvent.setup();
    render(<DnsGuide x={subdominio()} />);
    await escolher(user, 'cloudflare');
    expect(screen.getByTestId('dns-cloudflare-proxy').textContent).toMatch(/proxy desligado/);
    expect(screen.getByTestId('dns-provider-notes').textContent).toMatch(/flattening/);
  });

  it('outros provedores não mostram o aviso do Cloudflare', async () => {
    const user = userEvent.setup();
    render(<DnsGuide x={subdominio()} />);
    await escolher(user, 'godaddy');
    expect(screen.queryByTestId('dns-cloudflare-proxy')).toBeNull();
    expect(screen.getByTestId('dns-provider-notes').textContent).toMatch(/Host/);
  });

  it('Route 53: o valor do TXT vai entre aspas; os demais, sem aspas', async () => {
    const user = userEvent.setup();
    render(<DnsGuide x={subdominio()} />);
    await escolher(user, 'route53');
    expect(screen.getByTestId('dns-provider-notes').textContent).toMatch(/entre aspas duplas/);
    await escolher(user, 'namecheap');
    expect(screen.getByTestId('dns-provider-notes').textContent).toMatch(/sem aspas/);
  });

  it('na raiz, cada provedor diz como escrever o nome da raiz', async () => {
    const user = userEvent.setup();
    render(<DnsGuide x={raiz(['203.0.113.10'])} />);
    await escolher(user, 'godaddy');
    expect(screen.getByTestId('dns-provider-notes').textContent).toMatch(/o nome é @/);
    await escolher(user, 'route53');
    expect(screen.getByTestId('dns-provider-notes').textContent).toMatch(/em branco/);
    await escolher(user, 'hostinger');
    expect(screen.getByTestId('dns-provider-notes').textContent).toMatch(/@ ou fica em branco/);
  });

  it('provedor não listado: orientação genérica com o significado de tipo, nome, valor e TTL', async () => {
    const user = userEvent.setup();
    render(<DnsGuide x={subdominio()} />);
    await escolher(user, 'outro');
    expect(screen.getByTestId('dns-provider-notes').textContent).toMatch(/tipo, nome \(ou "host"\), valor/);
  });

  it('provedor ainda não conferido diz que a orientação é geral', async () => {
    const user = userEvent.setup();
    render(<DnsGuide x={subdominio()} />);
    await escolher(user, 'hostinger');
    expect(screen.getByTestId('dns-provider-notes').textContent).toMatch(/Orientação geral/);
  });

  it('em inglês, o guia e as orientações aparecem em inglês', async () => {
    idioma.lang = 'en';
    const user = userEvent.setup();
    render(<DnsGuide x={subdominio()} />);
    expect(screen.getByText('How to set up your DNS')).toBeTruthy();
    await escolher(user, 'cloudflare');
    expect(screen.getByTestId('dns-cloudflare-proxy').textContent).toMatch(/proxy off/);
  });
});

describe('diagnóstico depois de verificar', () => {
  const ins = subdominio().instrucoes;
  it('só TXT ausente: diz que falta o TXT e lembra de conferir o nome nas duas formas', () => {
    render(<DiagnosticoDaVerificacao resultado={{ verificado: false, faltando: ['TXT'], inconclusivo: false }} instrucoes={ins} />);
    expect(screen.getByTestId('diag-txt').textContent).toMatch(/duas formas/);
    expect(screen.queryByTestId('diag-point')).toBeNull();
    expect(screen.queryByTestId('diag-propagation')).toBeNull();
  });
  it('só apontamento ausente: cita o destino', () => {
    render(<DiagnosticoDaVerificacao resultado={{ verificado: false, faltando: ['APONTAMENTO'], inconclusivo: false }} instrucoes={ins} />);
    expect(screen.getByTestId('diag-point').textContent).toContain('lojas.arpt.site');
    expect(screen.queryByTestId('diag-txt')).toBeNull();
  });
  it('nenhum dos dois logo depois de cadastrar: acrescenta o aviso de propagação', () => {
    render(<DiagnosticoDaVerificacao resultado={{ verificado: false, faltando: ['TXT', 'APONTAMENTO'], inconclusivo: false }} instrucoes={ins} />);
    expect(screen.getByTestId('diag-txt')).toBeTruthy();
    expect(screen.getByTestId('diag-point')).toBeTruthy();
    expect(screen.getByTestId('diag-propagation').textContent).toMatch(/minutos a algumas horas/);
  });
  it('consulta inconclusiva: não acusa o dono (não diz que o registro está errado)', () => {
    render(<DiagnosticoDaVerificacao resultado={{ verificado: false, faltando: ['TXT', 'APONTAMENTO'], inconclusivo: true }} instrucoes={ins} />);
    expect(screen.getByTestId('diag-inconclusive').textContent).toMatch(/não quer dizer que o registro está errado/);
    expect(screen.queryByTestId('diag-txt')).toBeNull();
    expect(screen.queryByTestId('diag-point')).toBeNull();
  });
  it('verificado ou sem resultado: não mostra nada', () => {
    const { container, rerender } = render(<DiagnosticoDaVerificacao resultado={{ verificado: true, faltando: [] }} instrucoes={ins} />);
    expect(container.firstChild).toBeNull();
    rerender(<DiagnosticoDaVerificacao resultado={undefined} instrucoes={ins} />);
    expect(container.firstChild).toBeNull();
  });
});

describe('dados dos provedores', () => {
  it('a lista cobre os provedores exigidos pela spec, mais "outro", sem repetir', () => {
    const ids = DNS_PROVIDERS.map((p) => p.id);
    for (const id of PROVEDORES_OBRIGATORIOS) expect(ids).toContain(id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('todo provedor tem o nome, e toda chave do guia existe nos dois idiomas', () => {
    for (const lang of ['pt', 'en']) for (const p of DNS_PROVIDERS) expect(translate(lang, `dnsg_prov_${p.id}`)).not.toBe(`dnsg_prov_${p.id}`);
    const chaves = (l) => Object.keys(DICTIONARIES[l]).filter((k) => k.startsWith('dnsg_')).sort();
    expect(chaves('pt')).toEqual(chaves('en'));
    expect(chaves('pt').length).toBeGreaterThan(40);
  });
  it('as notas de provedor que existem estão nos dois idiomas', () => {
    for (const p of DNS_PROVIDERS) {
      const k = `dnsg_prov_${p.id}_nota`;
      expect(k in DICTIONARIES.pt).toBe(k in DICTIONARIES.en);
    }
  });
  it('nenhuma orientação promete caminho de menu (as telas dos provedores mudam)', () => {
    for (const lang of ['pt', 'en']) for (const k of Object.keys(DICTIONARIES[lang]).filter((x) => /^dnsg_prov_.*_nota$/.test(x))) expect(DICTIONARIES[lang][k]).not.toMatch(/→|>>|Menu >|Settings >|Configurações >/);
  });
  it('nomeRelativoDoDominio: subdomínio, raiz, vários níveis e zona que não casa', () => {
    expect(nomeRelativoDoDominio('loja.exemplo.com.br', 'exemplo.com.br')).toBe('loja');
    expect(nomeRelativoDoDominio('a.b.exemplo.com.br', 'exemplo.com.br')).toBe('a.b');
    expect(nomeRelativoDoDominio('exemplo.com.br', 'exemplo.com.br')).toBe('');
    expect(nomeRelativoDoDominio('loja.outro.com', 'exemplo.com.br')).toBe('');
    expect(nomeRelativoDoDominio('loja.exemplo.com.br', '')).toBe('');
  });
});
