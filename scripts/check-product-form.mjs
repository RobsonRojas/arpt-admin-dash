import assert from 'node:assert/strict';
import * as f from '../src/utils/productForm.js';

const api = (over = {}) => ({ id: 7, nome: 'Teak bench', info: 'English description', nome_pt: 'Banco de teca maciça', info_pt: 'Descrição em português',
    nome_en: 'Teak bench', info_en: 'English description', weight_grams: 5000, width_cm: 40, height_cm: 45, length_cm: 120, cep_origem: null, ...over });

// chave versionada do rascunho
assert.equal(f.draftKey(7), 'product_draft_v2_7'); assert.equal(f.draftKey(null), 'product_draft_v2_new'); assert.equal(f.draftKey(undefined), 'product_draft_v2_new');
assert.notEqual(f.draftKey(7), 'product_draft_7');

// carrega cada idioma do campo explícito, NUNCA de nome/info (que vêm traduzidos)
let form = f.formFromProduct(api());
assert.equal(form.nome, 'Banco de teca maciça'); assert.equal(form.info, 'Descrição em português');
assert.equal(form.nome_en, 'Teak bench'); assert.equal(form.info_en, 'English description');
assert.deepEqual(form.loaded, { pt: true, en: true });
form = f.formFromProduct(api({ nome: 'IGNORADO', info: 'IGNORADO' }));
assert.equal(form.nome, 'Banco de teca maciça'); assert.equal(form.info, 'Descrição em português');

// produto sem inglês: null é valor válido (carregado), vira campo vazio
form = f.formFromProduct(api({ nome_en: null, info_en: null }));
assert.deepEqual(form.loaded, { pt: true, en: true }); assert.equal(form.nome_en, ''); assert.equal(form.info_en, '');

// API antiga (sem os campos): nada é preenchido com nome/info e o idioma fica bloqueado
const old = { id: 7, nome: 'Teak bench', info: 'English description', weight_grams: 5000 };
form = f.formFromProduct(old);
assert.deepEqual(form.loaded, { pt: false, en: false });
assert.equal(form.nome, ''); assert.equal(form.info, ''); assert.equal(form.nome_en, ''); assert.equal(form.info_en, '');
assert.match(f.languageWarning(form.loaded), /bloqueados/);
assert.match(f.languageWarning({ pt: true, en: false }), /inglês/); assert.match(f.languageWarning({ pt: false, en: true }), /português/);
assert.equal(f.languageWarning({ pt: true, en: true }), null);
// só o português ausente
assert.deepEqual(f.loadedLanguages({ nome_en: 'x', info_en: 'y' }), { pt: false, en: true });
assert.deepEqual(f.loadedLanguages({ nome_pt: 'x' }), { pt: false, en: false }); // faltou info_pt: não conta
assert.deepEqual(f.loadedLanguages(null), { pt: false, en: false });

// dimensões carregadas; zero e ausente viram 0
form = f.formFromProduct(api());
assert.deepEqual([form.weight_grams, form.width_cm, form.height_cm, form.length_cm], [5000, 40, 45, 120]);
form = f.formFromProduct(api({ weight_grams: null, width_cm: undefined }));
assert.deepEqual([form.weight_grams, form.width_cm], [0, 0]);

// payload por idioma: só o que foi carregado, e o inglês nunca vai para o português
let r = f.buildProductTextAndShipping(f.formFromProduct(api()), { pt: true, en: true });
assert.deepEqual(Object.keys(r.payload).sort(), ['cep_origem', 'height_cm', 'info', 'info_en', 'length_cm', 'nome', 'nome_en', 'weight_grams', 'width_cm']);
assert.equal(r.payload.nome, 'Banco de teca maciça'); assert.equal(r.payload.nome_en, 'Teak bench');
// idioma não carregado NÃO vai no payload (nem apaga o inglês, nem troca o português)
r = f.buildProductTextAndShipping(f.formFromProduct(old), { pt: false, en: false });
for (const k of ['nome', 'info', 'nome_en', 'info_en']) assert.ok(!(k in r.payload), k);
assert.equal(r.payload.weight_grams, 5000); // as dimensões continuam salvando
r = f.buildTextPayload({ nome: 'Banco de teca maciça', info: 'x', nome_en: 'a', info_en: 'b' }, { pt: true, en: false });
assert.deepEqual(r.payload, { nome: 'Banco de teca maciça', info: 'x' });
r = f.buildTextPayload({ nome: 'ignorado', info: 'x', nome_en: 'Teak bench', info_en: 'b' }, { pt: false, en: true });
assert.deepEqual(r.payload, { nome_en: 'Teak bench', info_en: 'b' });

// o inglês de volta no payload não é o do português: o campo do português só sai do campo do português
form = f.formFromProduct(api()); form.nome_en = 'Novo inglês'; 
r = f.buildTextPayload(form, form.loaded); assert.equal(r.payload.nome, 'Banco de teca maciça'); assert.equal(r.payload.nome_en, 'Novo inglês');

// o nome em português curto é recusado (e não bloqueia quando o português não foi carregado)
assert.match(f.buildTextPayload({ nome: 'Curto', info: '' }, { pt: true, en: true }).error, /pelo menos 10/);
assert.match(f.buildTextPayload({ nome: '         x', info: '' }, { pt: true, en: false }).error, /pelo menos 10/); // espaços não contam
assert.equal(f.buildTextPayload({ nome: 'Curto' }, { pt: false, en: true }).error, undefined);
assert.equal(f.buildTextPayload({ nome: 'dez letras' }, { pt: true, en: false }).error, undefined); // 10 exatos
assert.match(f.buildTextPayload({ nome: undefined }, { pt: true, en: false }).error, /pelo menos 10/);

// dimensão negativa, decimal e texto: recusadas, nenhum payload
for (const bad of [{ weight_grams: '-1' }, { width_cm: '1.5' }, { height_cm: 'abc' }, { length_cm: '-5' }]) {
  r = f.buildProductTextAndShipping({ ...f.formFromProduct(api()), ...bad }, { pt: true, en: true });
  assert.ok(r.error, JSON.stringify(bad)); assert.equal(r.payload, undefined);
}
// zero é válido ("não informado")
r = f.buildProductTextAndShipping({ ...f.formFromProduct(api()), width_cm: '0' }, { pt: true, en: true });
assert.equal(r.error, undefined); assert.equal(r.payload.width_cm, 0);
// o erro do nome vence o do frete e nenhum payload sai
r = f.buildProductTextAndShipping({ nome: 'Curto', weight_grams: '-1' }, { pt: true, en: true });
assert.match(r.error, /nome/); assert.equal(r.payload, undefined);

console.log('check-product-form: ok');
