import indice from './gerado/indice.json';
import resumo from './gerado/resumo-pendencias.json';

/** Dados leves do manual (carregados com o painel). O texto completo e a lista de pendências vêm sob demanda. */
export { indice, resumo };
export const carregarManual = () => import('./gerado/manual.json').then((m) => m.default ?? m);
export const carregarPendencias = () => import('./gerado/pendencias.json').then((m) => m.default ?? m);

/** Mesma regra do gerador (scripts/gerar-manual.mjs) para os identificadores de âncora. */
export const slug = (t) => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** Seção do manual da rota atual (`/projects/12` usa a de `/projects`); `null` se a área não tem seção. */
export const secaoDaRota = (pathname) => {
    if (indice.areas[pathname]) return indice.areas[pathname];
    const base = `/${pathname.split('/')[1] ?? ''}`;
    return indice.areas[base] ?? null;
};

export const tituloDaSecao = (id) => indice.secoes.find((s) => s.id === id)?.titulo ?? id;

const norm = (t) => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
/** Busca em memória: uma linha por seção, com o trecho em volta da primeira ocorrência. */
export function buscar(manual, termo) {
    const q = norm(termo).trim();
    if (q.length < 2) return [];
    const out = [];
    for (const s of manual.secoes) {
        const texto = `${s.titulo}\n${s.markdown}`;
        const t = norm(texto);
        const i = t.indexOf(q);
        if (i < 0) continue;
        const ini = Math.max(0, i - 60);
        const trecho = texto.slice(ini, i + q.length + 100).replace(/[#*`_>|]/g, '').replace(/\s+/g, ' ').trim();
        out.push({ id: s.id, titulo: s.titulo, trecho: `${ini > 0 ? '…' : ''}${trecho}…`, ocorrencias: t.split(q).length - 1 });
    }
    return out.sort((a, b) => b.ocorrencias - a.ocorrencias);
}
