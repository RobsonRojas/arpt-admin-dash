import assert from 'node:assert/strict';
import { buildOfferPayload, leadTimeLabel, offerFormFromProduct, modoLabel } from '../src/utils/offer.js';
// pronta entrega
assert.deepEqual(buildOfferPayload({ modo_oferta: 'PRONTA_ENTREGA', estoque: '5', prazo_despacho_dias: '2', capacidade_semanal: '' }).payload, { modo_oferta: 'PRONTA_ENTREGA', estoque: 5, prazo_despacho_dias: 2 });
assert.ok(buildOfferPayload({ modo_oferta: 'PRONTA_ENTREGA', estoque: '', prazo_despacho_dias: '2' }).error);
assert.ok(buildOfferPayload({ modo_oferta: 'PRONTA_ENTREGA', estoque: '1.5', prazo_despacho_dias: '2' }).error);
assert.ok(buildOfferPayload({ modo_oferta: 'PRONTA_ENTREGA', estoque: '-1', prazo_despacho_dias: '2' }).error);
// estoque 0 é válido
assert.equal(buildOfferPayload({ modo_oferta: 'PRONTA_ENTREGA', estoque: '0', prazo_despacho_dias: '0' }).payload.estoque, 0);
// encomenda
assert.deepEqual(buildOfferPayload({ modo_oferta: 'ENCOMENDA', prazo_producao_dias_min: '20', prazo_producao_dias_max: '30', prazo_despacho_dias: '', limite_fila: '4', capacidade_semanal: '' }).payload,
  { modo_oferta: 'ENCOMENDA', prazo_producao_dias_min: 20, prazo_producao_dias_max: 30, limite_fila: 4 });
assert.ok(buildOfferPayload({ modo_oferta: 'ENCOMENDA', prazo_producao_dias_min: '30', prazo_producao_dias_max: '20' }).error);
assert.ok(buildOfferPayload({ modo_oferta: 'ENCOMENDA', prazo_producao_dias_min: '', prazo_producao_dias_max: '20' }).error);
// nunca envia null nem prazo_entrega_meses
const p = buildOfferPayload({ modo_oferta: 'ENCOMENDA', prazo_producao_dias_min: '1', prazo_producao_dias_max: '2' }).payload;
assert.ok(!Object.values(p).includes(null) && !('prazo_entrega_meses' in p));
// formulário a partir do produto
assert.equal(offerFormFromProduct(null).modo_oferta, 'ENCOMENDA');
assert.equal(offerFormFromProduct({ modo_oferta: null, prazo_producao_dias_min: 60, prazo_producao_dias_max: 60 }).prazo_producao_dias_min, 60);
assert.equal(offerFormFromProduct({ modo_oferta: 'PRONTA_ENTREGA', estoque: 0 }).estoque, 0);
// rótulos
assert.equal(leadTimeLabel({ prazo_estimado_dias: { min: 22, max: 32 } }), '22 a 32 dias');
assert.equal(leadTimeLabel({ prazo_estimado_dias: { min: 3, max: 3 } }), '3 dias');
assert.equal(leadTimeLabel({ modo_oferta: 'ENCOMENDA', prazo_producao_dias_min: 20, prazo_producao_dias_max: 30, prazo_despacho_dias: 2 }), '22 a 32 dias');
assert.equal(leadTimeLabel({ modo_oferta: 'ENCOMENDA', prazo_producao_dias_min: 60, prazo_producao_dias_max: 60 }), '60 dias');
assert.equal(leadTimeLabel({ prazo_estimado_dias: { min: 0, max: 0 } }), '—');
assert.equal(leadTimeLabel(null), '—');
assert.equal(modoLabel('PRONTA_ENTREGA'), 'Pronta entrega');
console.log('offer.js: todas as verificações passaram');
