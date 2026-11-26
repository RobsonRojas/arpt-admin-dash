import { describe, expect, it } from 'vitest';
import { FORM_PRODUTO_INICIAL, mensagemDeErro, montarCorpoDoProduto, nomeCompleto } from './adminProducers';

const valido = { ...FORM_PRODUTO_INICIAL, nome: 'Tábua de ipê curada', info: 'Descrição', preco: '120', modo_oferta: 'PRONTA_ENTREGA', estoque: '5', prazo_despacho_dias: '3', foto_url: 'https://x.test/a.jpg' };

describe('montarCorpoDoProduto', () => {
    it('monta o corpo sem campos reservados do administrador', () => {
        const { payload, error } = montarCorpoDoProduto(valido);
        expect(error).toBeUndefined();
        expect(payload).toMatchObject({ nome: 'Tábua de ipê curada', preco: 120, modo_oferta: 'PRONTA_ENTREGA', estoque: 5, prazo_despacho_dias: 3 });
        for (const f of ['is_ativo', 'produtor_user_id', 'is_physical_reward', 'execucao_teste_id', 'carbon_stored_kg']) expect(payload).not.toHaveProperty(f);
        expect(payload.fotos[0].alt.length).toBeGreaterThanOrEqual(10);
    });
    it.each([
        [{ nome: 'curto' }, /nome/i],
        [{ info: '  ' }, /descrição/i],
        [{ preco: '0' }, /preço/i],
        [{ estoque: '' }, /estoque/i],
        [{ weight_grams: '1.5' }, /inteiro/i],
    ])('recusa %j', (alt, msg) => {
        expect(montarCorpoDoProduto({ ...valido, ...alt }).error).toMatch(msg);
    });
    it('sem foto envia lista vazia', () => {
        expect(montarCorpoDoProduto({ ...valido, foto_url: '' }).payload.fotos).toEqual([]);
    });
});

describe('mensagemDeErro', () => {
    it('traduz códigos conhecidos', () => {
        expect(mensagemDeErro({ response: { data: { code: 'ALREADY_IMPORTED' } } })).toMatch(/já foi importado/);
        expect(mensagemDeErro({ response: { data: { code: 'EMAIL_IN_USE' } } })).toMatch(/e-mail/i);
    });
    it('usa detalhes de validação, depois o texto do servidor, depois o padrão', () => {
        expect(mensagemDeErro({ response: { data: { detalhes: [{ campo: 'preco', mensagem: 'inválido' }] } } })).toBe('preco: inválido');
        expect(mensagemDeErro({ response: { data: { error: 'Falhou' } } })).toBe('Falhou');
        expect(mensagemDeErro({}, 'Padrão')).toBe('Padrão');
    });
});

describe('nomeCompleto', () => {
    it('prefere nome, depois nome e sobrenome, depois e-mail', () => {
        expect(nomeCompleto({ nome: 'Ana Souza' })).toBe('Ana Souza');
        expect(nomeCompleto({ first_name: 'Ana', last_name: 'Souza' })).toBe('Ana Souza');
        expect(nomeCompleto({ email: 'a@b.c' })).toBe('a@b.c');
    });
});
