// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SignalementsBlock from './SignalementsBlock';

vi.mock('@/hooks/settings/useSignalements', () => ({
  useSignalements: () => ({
    reports: [],
    loadingReports: false,
    loadError: '',
    submitting: false,
    submitSuccess: false,
    submitError: '',
    submitReport: vi.fn(),
  }),
}));

describe('SignalementsBlock', () => {
  it('retire la page concernée et affiche les deux slots de pièces jointes', () => {
    render(<SignalementsBlock />);

    expect(screen.queryByLabelText('Page concernée *')).not.toBeInTheDocument();
    expect(screen.getByLabelText('PDF (facultatif)')).toBeInTheDocument();
    expect(screen.getByLabelText("Image ou capture d'écran (facultatif)")).toBeInTheDocument();
  });
});
