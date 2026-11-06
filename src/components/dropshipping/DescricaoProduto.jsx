import React, { useState } from 'react';
import { Box, Button, Collapse } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

/** Só http, https e mailto viram link; `javascript:`, `data:` e o resto ficam como texto. */
export const urlSegura = (url) => (/^(https?:|mailto:)/i.test(String(url).trim()) ? url : '');

const COMPONENTES = {
  a: ({ href, children }) => (href ? <a href={href} target="_blank" rel="noopener noreferrer">{children}</a> : <>{children}</>),
  h1: ({ children }) => <h4>{children}</h4>,
  h2: ({ children }) => <h4>{children}</h4>,
  h3: ({ children }) => <h5>{children}</h5>,
};

/** Descrição do produto (Markdown) formatada. HTML cru não é renderizado; imagens e código ficam de fora; quebras simples são preservadas. */
export function DescricaoRica({ value }) {
  if (!value || !String(value).trim()) return null;
  return (
    <Box
      data-testid="descricao-rica"
      sx={{ overflowWrap: 'anywhere', fontSize: '0.875rem', '& p': { m: '0.4rem 0' }, '& ul, & ol': { pl: 3, m: '0.4rem 0' }, '& blockquote': { m: '0.5rem 0', pl: 1.5, borderLeft: '3px solid', borderColor: 'divider', fontStyle: 'italic' }, '& h4, & h5': { m: '0.6rem 0 0.3rem' } }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        skipHtml
        disallowedElements={['img', 'code', 'pre']}
        unwrapDisallowed
        urlTransform={urlSegura}
        components={COMPONENTES}
      >
        {String(value)}
      </ReactMarkdown>
    </Box>
  );
}

/** "Ver descrição" recolhível por produto, para não alongar a lista do catálogo. Sem descrição, não mostra nada. */
export default function DescricaoRecolhivel({ value, id }) {
  const [aberta, setAberta] = useState(false);
  if (!value || !String(value).trim()) return null;
  const regiao = `descricao-${id}`;
  return (
    <Box sx={{ mt: 0.5 }}>
      <Button
        size="small"
        sx={{ textTransform: 'none', p: 0, minHeight: 32 }}
        aria-expanded={aberta}
        aria-controls={regiao}
        onClick={() => setAberta((v) => !v)}
      >
        {aberta ? 'Ocultar descrição' : 'Ver descrição'}
      </Button>
      <Collapse in={aberta} unmountOnExit>
        <Box id={regiao}><DescricaoRica value={value} /></Box>
      </Collapse>
    </Box>
  );
}
