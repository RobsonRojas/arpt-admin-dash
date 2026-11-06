import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DescricaoRecolhivel, { DescricaoRica, urlSegura } from './DescricaoProduto';

afterEach(cleanup);

/** add-rich-text-product-description, 4.3: o card do catálogo expande a descrição; HTML cru não é renderizado. */
describe('descrição no catálogo do dropshipper', () => {
  it('começa recolhida e expande formatada, sem asteriscos', async () => {
    const user = userEvent.setup();
    render(<DescricaoRecolhivel id="1" value={'**Cuba** rústica\n\n- item um\n- item dois'} />);
    expect(screen.queryByTestId('descricao-rica')).toBeNull();
    const botao = screen.getByRole('button', { name: 'Ver descrição' });
    expect(botao.getAttribute('aria-expanded')).toBe('false');
    await user.click(botao);
    const corpo = await screen.findByTestId('descricao-rica');
    expect(corpo.querySelector('strong')?.textContent).toBe('Cuba');
    expect(corpo.querySelectorAll('li')).toHaveLength(2);
    expect(corpo.textContent).not.toContain('*');
    expect(screen.getByRole('button', { name: 'Ocultar descrição' }).getAttribute('aria-expanded')).toBe('true');
  });

  it('produto sem descrição não mostra o botão', () => {
    const { container } = render(<DescricaoRecolhivel id="2" value="   " />);
    expect(container.textContent).toBe('');
  });

  it('HTML cru e imagens não são renderizados; link perigoso vira texto; link bom abre com rel seguro', () => {
    const { container } = render(<DescricaoRica value={'<script>window.x=1</script>\n\nolá <img src=x onerror=alert(1)> ![i](https://a.com/i.png) [ok](https://arpt.com.br) [mau](javascript:alert(1))'} />);
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(container.innerHTML).not.toContain('onerror');
    const links = container.querySelectorAll('a');
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute('rel')).toBe('noopener noreferrer');
    expect(container.textContent).toContain('mau');
  });

  it('só http, https e mailto são aceitos', () => {
    expect(urlSegura('https://a.com')).toBe('https://a.com');
    expect(urlSegura('javascript:alert(1)')).toBe('');
    expect(urlSegura('data:text/html,a')).toBe('');
  });

  it('quebra de linha simples é preservada', () => {
    const { container } = render(<DescricaoRica value={'linha 1\nlinha 2'} />);
    expect(container.querySelector('br')).not.toBeNull();
  });
});
