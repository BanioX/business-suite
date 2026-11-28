import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { PhotoField, PhotoViewer, type PhotoValue } from '../src/web/index';
import { createFakeDevice, fakeImage, type FakeDevice } from './fake-device';
import { renderWithDevice } from './render';

const picture = () => new File([new Uint8Array([1, 2, 3])], 'stelle.jpg', { type: 'image/jpeg' });

function Form({ start = null }: { start?: PhotoValue | null }) {
  const [value, setValue] = useState<PhotoValue | null>(start);
  return (
    <>
      <PhotoField
        label="Foto der Stelle"
        value={value}
        onChange={setValue}
        shrink={{ maxSide: 640 }}
      />
      <output data-testid="kept">
        {value === null ? 'none' : `${value.mediaType} ${String(value.bytes.length)}`}
      </output>
    </>
  );
}

function inputs(): HTMLInputElement[] {
  return [...document.querySelectorAll<HTMLInputElement>('input[type="file"]')];
}

describe('PhotoField', () => {
  it('offers the camera app and the files, each only on a tap, and names the field for screen readers', () => {
    renderWithDevice(<Form />);
    const [camera, files] = inputs();
    expect(camera?.getAttribute('capture')).toBe('environment');
    expect(files?.hasAttribute('capture')).toBe(false);
    expect(camera?.accept).toBe('image/*');
    expect(screen.getByText('Foto aufnehmen').parentElement?.textContent).toContain(
      ', Foto der Stelle',
    );
    expect(screen.getByText(/ohne Ort/)).toBeTruthy();
  });

  it('makes the photo small on the device, keeps the bytes and shows it', async () => {
    const device = createFakeDevice({ decode: () => Promise.resolve(fakeImage(4000, 3000)) });
    renderWithDevice(<Form />, device);
    const [camera] = inputs();
    if (camera === undefined) {
      throw new Error('no input');
    }
    await userEvent.upload(camera, picture());
    await waitFor(() => {
      expect(screen.getByTestId('kept').textContent).toMatch(/^image\/jpeg \d+$/);
    });
    expect([device.canvases[0]?.width, device.canvases[0]?.height]).toEqual([640, 480]);
    expect(screen.getByRole('button', { name: 'Foto der Stelle gross anzeigen' })).toBeTruthy();
    expect(device.log).toContain('preview:image/jpeg');
  });

  it('says so when the file is no picture, and the field stays empty', async () => {
    const device = createFakeDevice({ decode: () => Promise.reject(new Error('no picture')) });
    renderWithDevice(<Form />, device);
    const [, files] = inputs();
    if (files === undefined) {
      throw new Error('no input');
    }
    await userEvent.upload(files, picture());
    expect(await screen.findByText(/lässt sich nicht lesen/)).toBeTruthy();
    expect(screen.getByTestId('kept').textContent).toBe('none');
  });

  it('says so when the picture cannot be made small enough', async () => {
    const device = createFakeDevice({ canvas: { encode: () => new Uint8Array(700_000).fill(1) } });
    renderWithDevice(<Form />, device);
    const [, files] = inputs();
    if (files === undefined) {
      throw new Error('no input');
    }
    fireEvent.change(files, { target: { files: [picture()] } });
    expect(await screen.findByText(/nicht klein genug/)).toBeTruthy();
  });

  it('replaces and removes a photo, and frees the address of the old one', async () => {
    const device: FakeDevice = createFakeDevice();
    renderWithDevice(
      <Form start={{ bytes: new Uint8Array([9]), mediaType: 'image/jpeg' }} />,
      device,
    );
    expect(screen.getByText('Ersetzen')).toBeTruthy();
    expect(inputs()).toHaveLength(1);
    expect(inputs()[0]?.hasAttribute('capture')).toBe(false);
    await userEvent.click(screen.getByRole('button', { name: 'Entfernen, Foto der Stelle' }));
    expect(screen.getByTestId('kept').textContent).toBe('none');
    expect(device.log).toEqual(['preview:image/jpeg', 'release:blob:fake/1']);
  });

  it('opens the photo over the screen on a tap, and closes it again', async () => {
    renderWithDevice(<Form start={{ bytes: new Uint8Array([9]), mediaType: 'image/jpeg' }} />);
    await userEvent.click(screen.getByRole('button', { name: 'Foto der Stelle gross anzeigen' }));
    const dialog = screen.getByRole('dialog', { name: 'Foto der Stelle' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Schliessen' }));
    await userEvent.click(screen.getByRole('button', { name: 'Schliessen' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('PhotoViewer', () => {
  it('closes on Escape and on a tap beside the photo', async () => {
    function Viewer() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <PhotoViewer
            src="blob:fake/9"
            title="Schaden"
            open={open}
            onClose={() => {
              setOpen(false);
            }}
          />
          <output data-testid="open">{String(open)}</output>
        </>
      );
    }
    const { rerender } = renderWithDevice(<Viewer />);
    await userEvent.keyboard('{Escape}');
    expect(screen.getByTestId('open').textContent).toBe('false');
    rerender(<Viewer key="again" />);
    const dialog = screen.getByRole('dialog', { name: 'Schaden' });
    await userEvent.click(dialog);
    expect(screen.getByTestId('open').textContent).toBe('false');
  });

  it('closes on the cancel of the browser (Escape, the back gesture)', () => {
    let closed = 0;
    renderWithDevice(
      <PhotoViewer src="blob:fake/9" title="Schaden" open onClose={() => (closed += 1)} />,
    );
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
    expect(closed).toBe(1);
  });
});
