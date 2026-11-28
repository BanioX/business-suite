import { createHash } from 'node:crypto';
import type { IsoDateTime } from '@onestrand/core';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SignatureRecord } from '../src/index';
import { SignaturePad } from '../src/web/index';
import { createFakeDevice } from './fake-device';
import { renderWithDevice } from './render';

const AT = '2026-11-28T10:00:00.000Z' as IsoDateTime;
const DOCUMENT = createHash('sha256').update('rapport').digest('hex');

beforeEach(() => {
  // jsdom draws nothing and has no layout: the pad gets a box and a context that draws nowhere.
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => null);
  vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockImplementation(
    () =>
      ({
        left: 10,
        top: 20,
        width: 300,
        height: 160,
        x: 10,
        y: 20,
        right: 310,
        bottom: 180,
      }) as DOMRect,
  );
  HTMLCanvasElement.prototype.setPointerCapture = vi.fn();
});

function pad(onSign: (record: SignatureRecord) => void, signer?: string) {
  return renderWithDevice(
    <SignaturePad
      documentChecksum={DOCUMENT}
      now={() => AT}
      onSign={onSign}
      signer={signer}
      label="Rapport vom 28.11.2026"
    />,
    createFakeDevice(),
  );
}

function drawOn(canvas: HTMLElement) {
  fireEvent.pointerDown(canvas, { button: 0, pointerId: 1, clientX: 30, clientY: 40 });
  fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 60, clientY: 80 });
  fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 90.04, clientY: 50 });
  fireEvent.pointerUp(canvas, { pointerId: 1 });
  // A move without a pressed pointer draws nothing.
  fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 200, clientY: 100 });
}

describe('SignaturePad', () => {
  it('records the strokes, who, when and what, with the PNG and its checksum', async () => {
    const onSign = vi.fn();
    pad(onSign, 'Kundin Beispiel');
    const canvas = screen.getByRole('img', { name: 'Rapport vom 28.11.2026' });
    expect(canvas.className).toContain('touch-none');
    drawOn(canvas);
    await userEvent.click(screen.getByRole('button', { name: 'Übernehmen' }));
    await waitFor(() => {
      expect(onSign).toHaveBeenCalledTimes(1);
    });
    const [record] = onSign.mock.calls[0] as [SignatureRecord];
    expect(record).toMatchObject({
      method: 'drawn',
      signer: 'Kundin Beispiel',
      signedAt: AT,
      documentChecksum: DOCUMENT,
      strokes: {
        width: 300,
        height: 160,
        strokes: [
          [
            [20, 20],
            [50, 60],
            [80, 30],
          ],
        ],
      },
    });
    expect(record.method === 'drawn' && /^[0-9a-f]{64}$/.test(record.image.checksum)).toBe(true);
  });

  it('asks for the name and for a drawing before it records anything', async () => {
    const onSign = vi.fn();
    pad(onSign);
    await userEvent.click(screen.getByRole('button', { name: 'Übernehmen' }));
    expect(screen.getByRole('alert').textContent).toMatch(/Namen der Person/);
    await userEvent.type(
      screen.getByRole('textbox', { name: /Name der Person/ }),
      'Kundin Beispiel',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Übernehmen' }));
    expect(screen.getByRole('alert').textContent).toMatch(/noch keine Unterschrift/);
    expect(onSign).not.toHaveBeenCalled();
  });

  it('clears the pad on «Löschen», which is off while the pad is empty', async () => {
    pad(vi.fn(), 'Kundin Beispiel');
    const clear = screen.getByRole('button', { name: 'Löschen' });
    expect((clear as HTMLButtonElement).disabled).toBe(true);
    drawOn(screen.getByRole('img'));
    expect((clear as HTMLButtonElement).disabled).toBe(false);
    await userEvent.click(clear);
    expect((clear as HTMLButtonElement).disabled).toBe(true);
  });

  it('takes a typed name with the keyboard alone, and says it is a typed signature', async () => {
    const onSign = vi.fn();
    pad(onSign);
    await userEvent.tab();
    await userEvent.keyboard('Kundin Beispiel');
    await userEvent.click(screen.getByRole('button', { name: 'Namen eintippen statt zeichnen' }));
    expect(screen.getByText(/getippte Unterschrift/)).toBeTruthy();
    expect(screen.queryByRole('img')).toBeNull();
    screen.getByRole('button', { name: 'Übernehmen' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(onSign).toHaveBeenCalledWith({
      method: 'typed',
      signer: 'Kundin Beispiel',
      signedAt: AT,
      documentChecksum: DOCUMENT,
    });
    await userEvent.click(screen.getByRole('button', { name: 'Unterschrift zeichnen' }));
    expect(screen.getByRole('img')).toBeTruthy();
  });

  it('says it judges nothing about the law', () => {
    pad(vi.fn());
    expect(screen.getByText(/prüft nicht, ob das rechtlich genügt/)).toBeTruthy();
  });

  it('ignores a press with another button than the main one', async () => {
    const onSign = vi.fn();
    pad(onSign, 'Kundin Beispiel');
    fireEvent.pointerDown(screen.getByRole('img'), {
      button: 2,
      pointerId: 1,
      clientX: 30,
      clientY: 40,
    });
    await userEvent.click(screen.getByRole('button', { name: 'Übernehmen' }));
    expect(screen.getByRole('alert').textContent).toMatch(/noch keine Unterschrift/);
  });

  it('says so when the device cannot write the picture', async () => {
    const onSign = vi.fn();
    renderWithDevice(
      <SignaturePad
        documentChecksum={DOCUMENT}
        now={() => AT}
        onSign={onSign}
        signer="Kundin Beispiel"
      />,
      createFakeDevice({ canvas: { encode: () => null } }),
    );
    drawOn(screen.getByRole('img', { name: 'Unterschrift' }));
    await userEvent.click(screen.getByRole('button', { name: 'Übernehmen' }));
    expect(await screen.findByText(/liess sich nicht festhalten/)).toBeTruthy();
    expect(onSign).not.toHaveBeenCalled();
  });

  it('keeps the screen on while the pad is open', () => {
    const device = createFakeDevice();
    const { unmount } = renderWithDevice(
      <SignaturePad documentChecksum={DOCUMENT} now={() => AT} onSign={vi.fn()} />,
      device,
    );
    unmount();
    return waitFor(() => {
      expect(device.log).toEqual(['wakeLock:request', 'wakeLock:release']);
    });
  });
});
