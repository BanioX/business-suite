import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PrintButton, ShareButton, type PrintPdf } from '../src/web/index';
import { createFakeDevice, IPHONE_AGENT } from './fake-device';
import { renderWithDevice, settle } from './render';

const blob = () => new Blob([new Uint8Array([37, 80, 68, 70])], { type: 'application/pdf' });
const installedIphone = () => createFakeDevice({ userAgent: IPHONE_AGENT, standalone: true });

function pdfOf(build: (() => Promise<Blob>) | undefined): PrintPdf {
  return { buildPdf: build, fileName: 'rapport.pdf', title: 'Rapport' };
}

describe('PrintButton', () => {
  it('opens the print dialog in a browser, without building a PDF', async () => {
    const build = vi.fn(() => Promise.resolve(blob()));
    const { device } = renderWithDevice(<PrintButton pdf={pdfOf(build)} />);
    await userEvent.click(screen.getByRole('button', { name: 'Drucken' }));
    expect((device as ReturnType<typeof createFakeDevice>).log).toEqual(['print']);
    expect(build).not.toHaveBeenCalled();
  });

  it('builds the PDF before the tap in the installed iPhone app and shares it on the tap', async () => {
    const device = installedIphone();
    const build = vi.fn(() => Promise.resolve(blob()));
    renderWithDevice(<PrintButton pdf={pdfOf(build)} />, device);
    const button = screen.getByRole('button', { name: 'Drucken' });
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.getAttribute('aria-description')).toContain('In Dateien sichern');
    await waitFor(() => {
      expect(button.getAttribute('aria-busy')).toBeNull();
    });
    await userEvent.click(button);
    await waitFor(() => {
      expect(device.log).toEqual(['share:rapport.pdf']);
    });
    expect(build).toHaveBeenCalledTimes(1);
  });

  it('turns while the data loads and takes no tap', async () => {
    const device = installedIphone();
    renderWithDevice(<PrintButton pdf={pdfOf(undefined)} />, device);
    await userEvent.click(screen.getByRole('button', { name: 'Drucken' }));
    expect(device.log).toEqual([]);
  });

  it('says calmly when the PDF could not be prepared, and builds it again on «Noch einmal»', async () => {
    const device = installedIphone();
    let calls = 0;
    const build = () => {
      calls += 1;
      return calls === 1 ? Promise.reject(new Error('no data')) : Promise.resolve(blob());
    };
    renderWithDevice(<PrintButton pdf={pdfOf(build)} />, device);
    const button = screen.getByRole('button', { name: 'Drucken' });
    await waitFor(() => {
      expect(button.getAttribute('aria-busy')).toBeNull();
    });
    await userEvent.click(button);
    expect(await screen.findByText(/liess sich nicht vorbereiten/)).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Noch einmal' }));
    await waitFor(() => {
      expect(calls).toBe(2);
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Drucken' }).getAttribute('aria-busy')).toBeNull();
    });
    await userEvent.click(screen.getByRole('button', { name: 'Drucken' }));
    await waitFor(() => {
      expect(device.log).toEqual(['share:rapport.pdf']);
    });
  });

  it('says what works when the PDF could be neither shared nor saved', async () => {
    const device = createFakeDevice({
      userAgent: IPHONE_AGENT,
      standalone: true,
      share: undefined,
      download: () => false,
    });
    renderWithDevice(<PrintButton pdf={pdfOf(() => Promise.resolve(blob()))} />, device);
    const button = screen.getByRole('button', { name: 'Drucken' });
    await waitFor(() => {
      expect(button.getAttribute('aria-busy')).toBeNull();
    });
    await userEvent.click(button);
    expect(await screen.findByText(/weder weitergeben noch sichern/)).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Verstanden' }));
    await waitFor(() => {
      expect(screen.queryByText(/weder weitergeben noch sichern/)).toBeNull();
    });
  });

  it('downloads the PDF where there is no print dialog, and says where it is', async () => {
    const device = createFakeDevice({ print: undefined, share: undefined });
    renderWithDevice(
      <PrintButton pdf={pdfOf(() => Promise.resolve(blob()))} label="Liste drucken" />,
      device,
    );
    const button = screen.getByRole('button', { name: 'Liste drucken' });
    await waitFor(() => {
      expect(button.getAttribute('aria-busy')).toBeNull();
    });
    await userEvent.click(button);
    expect(await screen.findByText(/bei deinen Downloads/)).toBeTruthy();
    expect(device.log).toEqual(['download:rapport.pdf']);
  });
});

describe('ShareButton', () => {
  const file = () => new File([blob()], 'sicherung.json', { type: 'application/json' });

  it('hands a ready file to the share sheet and tells how it went', async () => {
    const outcomes: string[] = [];
    const device = createFakeDevice();
    renderWithDevice(
      <ShareButton file={file()} onOutcome={(outcome) => outcomes.push(outcome)} />,
      device,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Teilen' }));
    await waitFor(() => {
      expect(outcomes).toEqual(['shared']);
    });
    expect(device.log).toEqual(['share:sicherung.json']);
  });

  it('turns while the file is made, and says where a downloaded file is', async () => {
    const device = createFakeDevice({ share: undefined });
    const { rerender } = renderWithDevice(<ShareButton file={null} label="Sichern" />, device);
    await userEvent.click(screen.getByRole('button', { name: 'Sichern' }));
    expect(device.log).toEqual([]);
    rerender(<ShareButton file={file()} label="Sichern" />);
    await userEvent.click(screen.getByRole('button', { name: 'Sichern' }));
    expect(await screen.findByText(/bei deinen Downloads/)).toBeTruthy();
  });

  it('says so when the file could not leave the app', async () => {
    const device = createFakeDevice({ share: undefined, download: () => false });
    renderWithDevice(<ShareButton file={file()} />, device);
    await act(async () => {
      screen.getByRole('button', { name: 'Teilen' }).click();
      await settle();
    });
    expect(await screen.findByText(/weder weitergeben noch sichern/)).toBeTruthy();
  });
});
