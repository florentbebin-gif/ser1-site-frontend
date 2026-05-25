// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SimModalShell } from '../SimModalShell';

function FocusRerenderHarness() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Ouvrir
      </button>
      {open ? (
        <SimModalShell
          title="Paramétrage"
          onClose={() => setOpen(false)}
          footer={<button type="button">Valider</button>}
        >
          <button type="button">Navigation</button>
          <input
            aria-label="Montant"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </SimModalShell>
      ) : null}
    </>
  );
}

describe('SimModalShell', () => {
  it('ne replace pas le focus au re-render parent', async () => {
    vi.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockReturnValue(document.body);
    render(<FocusRerenderHarness />);

    const opener = screen.getByRole('button', { name: 'Ouvrir' });
    opener.focus();
    fireEvent.click(opener);
    const input = screen.getByRole('textbox', { name: 'Montant' });
    input.focus();

    fireEvent.change(input, { target: { value: '12345' } });

    await waitFor(() => expect(input).toHaveFocus());
  });
});
