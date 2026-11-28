import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QR_FORMAT, type CodeDetectorPort } from '../src/index';
import { QrReaderPanel } from '../src/web/index';
import { createFakeDevice, fakeCamera, fakeCodes, fakeStream } from './fake-device';
import { renderWithDevice } from './render';

const CODE = 'AUFTRAG-42';
const picture = () => new File([new Uint8Array([1])], 'code.png', { type: 'image/png' });

beforeEach(() => {
  // jsdom plays no video.
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
});

/** A reader of the browser that finds the code from the given read on. */
function codesFrom(read: number): CodeDetectorPort & { reads: number } {
  const codes = {
    reads: 0,
    formats: () => Promise.resolve([QR_FORMAT]),
    detect: () => {
      codes.reads += 1;
      return Promise.resolve(codes.reads >= read ? [{ rawValue: CODE, format: QR_FORMAT }] : []);
    },
  };
  return codes;
}

describe('QrReaderPanel', () => {
  it('opens no camera before the tap, and always offers a photo and the typed code', () => {
    const camera = fakeCamera(() => Promise.resolve(fakeStream()));
    renderWithDevice(<QrReaderPanel onCode={vi.fn()} />, createFakeDevice({ camera }));
    expect(camera.asked).toEqual([]);
    expect(screen.getByRole('button', { name: 'Kamera öffnen' })).toBeTruthy();
    expect(screen.getByText('Foto des Codes wählen')).toBeTruthy();
    expect(screen.getByRole('textbox', { name: 'Code eintippen' })).toBeTruthy();
    expect(document.querySelector('input[type="file"]')?.hasAttribute('capture')).toBe(false);
  });

  it('reads the code with the camera after a tap, keeps the screen on, then stops both', async () => {
    const stream = fakeStream();
    const camera = fakeCamera(() => Promise.resolve(stream));
    const device = createFakeDevice({ camera, codes: codesFrom(2) });
    const onCode = vi.fn();
    renderWithDevice(<QrReaderPanel onCode={onCode} />, device);
    await userEvent.click(screen.getByRole('button', { name: 'Kamera öffnen' }));
    await waitFor(() => {
      expect(onCode).toHaveBeenCalledWith(CODE);
    });
    expect(camera.asked).toHaveLength(1);
    expect(stream.track.stopped).toBe(true);
    expect(device.log).toEqual(['wakeLock:request', 'wakeLock:release']);
    expect(screen.getByText(`Gelesen: ${CODE}`)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Kamera öffnen' })).toBeTruthy();
  });

  it.each([
    ['NotAllowedError', /gesperrt/],
    ['NotFoundError', /keine Kamera zu finden/],
    ['NotReadableError', /besetzt/],
    ['UnknownError', /liess sich nicht öffnen/],
  ])('explains %s and names the ways that work', async (name, text) => {
    const camera = fakeCamera(() => Promise.reject(new DOMException('no', name)));
    renderWithDevice(<QrReaderPanel onCode={vi.fn()} />, createFakeDevice({ camera }));
    await userEvent.click(screen.getByRole('button', { name: 'Kamera öffnen' }));
    const notice = await screen.findByText(text);
    expect(notice.textContent).toMatch(/Foto|eintippen/);
    expect(screen.getByRole('textbox', { name: 'Code eintippen' })).toBeTruthy();
  });

  it('asks nothing on a page that is not secure, nor where the browser has no camera', async () => {
    const camera = fakeCamera(() => Promise.resolve(fakeStream()));
    const { unmount } = renderWithDevice(
      <QrReaderPanel onCode={vi.fn()} />,
      createFakeDevice({ camera, secureContext: false }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Kamera öffnen' }));
    expect(await screen.findByText(/sicheren Verbindung/)).toBeTruthy();
    expect(camera.asked).toEqual([]);
    unmount();
    renderWithDevice(<QrReaderPanel onCode={vi.fn()} />, createFakeDevice({ camera: undefined }));
    await userEvent.click(screen.getByRole('button', { name: 'Kamera öffnen' }));
    expect(await screen.findByText(/gibt keine Kamera frei/)).toBeTruthy();
  });

  it('stops the camera on «Kamera schliessen» and when the page goes', async () => {
    const first = fakeStream();
    const camera = fakeCamera(() => Promise.resolve(first));
    const device = createFakeDevice({ camera, codes: codesFrom(1_000) });
    const { unmount } = renderWithDevice(<QrReaderPanel onCode={vi.fn()} />, device);
    await userEvent.click(screen.getByRole('button', { name: 'Kamera öffnen' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Kamera schliessen' }));
    expect(first.track.stopped).toBe(true);
    expect(device.log).toEqual(['wakeLock:request', 'wakeLock:release']);
    await userEvent.click(screen.getByRole('button', { name: 'Kamera öffnen' }));
    await screen.findByRole('button', { name: 'Kamera schliessen' });
    unmount();
    expect(device.log.filter((entry) => entry === 'wakeLock:release')).toHaveLength(2);
  });

  it('reads a code from a photo, and says when the photo holds none', async () => {
    const onCode = vi.fn();
    const device = createFakeDevice({
      codes: fakeCodes([QR_FORMAT], [{ rawValue: CODE, format: QR_FORMAT }]),
    });
    renderWithDevice(<QrReaderPanel onCode={onCode} />, device);
    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    if (input === null) {
      throw new Error('no input');
    }
    await userEvent.upload(input, picture());
    await waitFor(() => {
      expect(onCode).toHaveBeenCalledWith(CODE);
    });

    const none = createFakeDevice({ codes: fakeCodes([QR_FORMAT]) });
    const empty = renderWithDevice(<QrReaderPanel onCode={vi.fn()} />, none);
    const other = empty.container.querySelector<HTMLInputElement>('input[type="file"]');
    if (other === null) {
      throw new Error('no input');
    }
    await userEvent.upload(other, picture());
    expect(await screen.findByText(/kein Code zu lesen/)).toBeTruthy();
  });

  it('takes a typed code, trimmed, and nothing for an empty field', async () => {
    const onCode = vi.fn();
    renderWithDevice(<QrReaderPanel onCode={onCode} typedLabel="Nummer des Auftrags" />);
    await userEvent.click(screen.getByRole('button', { name: 'Übernehmen' }));
    expect(onCode).not.toHaveBeenCalled();
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Nummer des Auftrags' }),
      `  ${CODE} `,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Übernehmen' }));
    expect(onCode).toHaveBeenCalledWith(CODE);
  });

  it('says the camera failed when the picture cannot be shown', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() =>
      Promise.reject(new DOMException('no', 'NotAllowedError')),
    );
    const stream = fakeStream();
    const camera = fakeCamera(() => Promise.resolve(stream));
    renderWithDevice(<QrReaderPanel onCode={vi.fn()} />, createFakeDevice({ camera }));
    await userEvent.click(screen.getByRole('button', { name: 'Kamera öffnen' }));
    expect(await screen.findByText(/liess sich nicht öffnen/)).toBeTruthy();
    expect(stream.track.stopped).toBe(true);
  });

  it('says before any tap that the camera is refused, and still opens nothing', async () => {
    const camera = fakeCamera(() => Promise.resolve(fakeStream()), [], 'denied');
    renderWithDevice(<QrReaderPanel onCode={vi.fn()} />, createFakeDevice({ camera }));
    expect(await screen.findByText(/gesperrt/)).toBeTruthy();
    expect(camera.asked).toEqual([]);
  });
});
