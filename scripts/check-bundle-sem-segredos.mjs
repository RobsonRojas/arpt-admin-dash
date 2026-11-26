// Falha se o bundle (dist/) contiver chave Google (AIza...) ou o segredo antigo do arpt-ai.
// Uso: node scripts/check-bundle-sem-segredos.mjs [pasta]   (padrão: dist). Rodar depois de `vite build`.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const PADROES = [
    { nome: 'chave Google (AIza...)', re: /AIza[0-9A-Za-z_-]{35}/ },
    { nome: 'segredo antigo do arpt-ai', re: /arpt_ai_secret_token_(seguro_)?123456/ },
];
// O manual e as pendências do painel são gerados de documentos e citam o valor revogado em texto; não é uso do segredo.
const IGNORA_SEGREDO_ANTIGO = /(^|[\\/])(manual|pendencias|indice)-[^\\/]*\.js$/;
// A chave pública do Firebase também começa com AIza, mas é identificador do app (não segredo) e fica no bundle por desenho.
function chaveFirebase() {
    if (process.env.VITE_FIREBASE_API_KEY) return process.env.VITE_FIREBASE_API_KEY;
    for (const f of ['.env.production', '.env.local', '.env']) {
        if (!existsSync(f)) continue;
        const m = readFileSync(f, 'utf8').match(/^VITE_FIREBASE_API_KEY=(.+)$/m);
        if (m) return m[1].trim().replace(/^['"]|['"]$/g, '');
    }
    return '';
}
const PERMITIDAS = [chaveFirebase()].filter(Boolean);

export function varrer(pasta) {
    const achados = [];
    const andar = (dir) => {
        for (const nome of readdirSync(dir)) {
            const p = join(dir, nome);
            if (statSync(p).isDirectory()) { andar(p); continue; }
            if (!/\.(js|mjs|css|html|map|json)$/.test(nome)) continue;
            const txt = readFileSync(p, 'utf8');
            for (const { nome: padrao, re } of PADROES) {
                if (padrao.startsWith('segredo antigo') && IGNORA_SEGREDO_ANTIGO.test(p)) continue;
                const g = new RegExp(re.source, 'g');
                for (const m of txt.matchAll(g)) {
                    if (PERMITIDAS.includes(m[0])) continue;
                    achados.push({ arquivo: p, padrao });
                    break;
                }
            }
        }
    };
    andar(pasta);
    return achados;
}

if (import.meta.url === `file://${process.argv[1]}`) {
    const pasta = process.argv[2] || 'dist';
    if (!existsSync(pasta)) { console.error(`Pasta ${pasta} não existe. Rode "npm run build" antes.`); process.exit(2); }
    const achados = varrer(pasta);
    if (achados.length) {
        for (const a of achados) console.error(`✗ ${a.padrao} em ${a.arquivo}`);
        process.exit(1);
    }
    console.log(`✓ ${pasta} sem chave Google nem segredo do arpt-ai`);
}
