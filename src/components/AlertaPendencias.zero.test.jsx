import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../manual/gerado/resumo-pendencias.json', () => ({ default: { total: 0, manuais: 0, codigo: 0, porArea: {} } }));
import { AlertaPendencias } from './AlertaPendencias';

describe('alerta de pendências sem nenhuma pendência', () => {
    it('não aparece', () => {
        render(<MemoryRouter><AlertaPendencias /></MemoryRouter>);
        expect(screen.queryByTestId('alerta-pendencias')).toBeNull();
    });
});
