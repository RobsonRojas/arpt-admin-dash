import { describe, expect, it } from 'vitest';
import { avisoRevogacao, corpoCertificacao, dataValida, errosCertificacao, escolhasDoMural } from './growthAdmin';

const OK = { padrao: 'VCS', registro_numero: 'R-1', entidade: 'Verra', quantidade_tco2e: '12,5', vigencia_inicio: '2026-01-01', vigencia_fim: '2026-12-31' };

describe('certificação', () => {
    it('aceita a certificação válida e manda a quantidade como número', () => {
        expect(errosCertificacao(OK)).toEqual({});
        expect(corpoCertificacao(OK).quantidade_tco2e).toBe(12.5);
    });

    it.each([['0'], ['-3'], [''], ['abc']])('recusa quantidade %s', (q) => {
        expect(errosCertificacao({ ...OK, quantidade_tco2e: q }).quantidade_tco2e).toBeTruthy();
    });

    it('recusa data impossível e vigência que termina antes de começar', () => {
        expect(dataValida('2026-02-31')).toBe(false);
        expect(errosCertificacao({ ...OK, vigencia_inicio: '2026-02-31' }).vigencia_inicio).toBeTruthy();
        expect(errosCertificacao({ ...OK, vigencia_fim: '2025-12-31' }).vigencia_fim).toMatch(/antes de começar/);
    });

    it('avisa quantos relatórios a revogação despublica', () => {
        expect(avisoRevogacao(0)).toMatch(/Nenhum/);
        expect(avisoRevogacao(1)).toMatch(/^1 relatório/);
        expect(avisoRevogacao(3)).toMatch(/^3 relatórios/);
    });
});

describe('mural', () => {
    it('lista só quem escolheu aparecer, e só o que o mural mostra', () => {
        const r = escolhasDoMural([
            { patrocinio: 1, modo: 'NOME', nome_exibicao: 'Ana', logo_url: null, atualizado_em: 'x', valor: 100, email: 'a@b.c', cpf: '1' },
            { patrocinio: 2, modo: 'LOGO', nome_exibicao: null, logo_url: 'https://l.png', atualizado_em: 'y' },
            { patrocinio: 3, modo: 'ANONIMO', nome_exibicao: null, logo_url: null },
        ]);
        expect(r.map((x) => x.patrocinio)).toEqual([1, 2]);
        expect(Object.keys(r[0]).sort()).toEqual(['atualizado_em', 'logo_url', 'modo', 'nome_exibicao', 'patrocinio']);
    });
});
