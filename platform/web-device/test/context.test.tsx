import {
  catalogueTexts,
  DE_CH_OPENING_SIE_RULE,
  DE_CH_TEXT_RULES,
  textProblems,
} from '@onestrand/testing';
import { defineTranslation } from '@onestrand/i18n';
import { render, renderHook, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import {
  deviceMessages,
  DeviceProvider,
  ShareButton,
  useActionCount,
  useDevice,
  useDeviceTexts,
  useWakeLock,
} from '../src/web/index';
import { createFakeDevice, type FakeDevice } from './fake-device';

describe('the catalogue of the device', () => {
  it('follows the rules of de-CH', () => {
    expect(
      textProblems(deviceMessages, { rules: [...DE_CH_TEXT_RULES, DE_CH_OPENING_SIE_RULE] }),
    ).toEqual([]);
  });

  it('reads every text, also of its message functions', () => {
    const texts = catalogueTexts(deviceMessages).map((entry) => entry.text);
    expect(texts).toContain('Löschen');
    expect(texts).toContain('Gelesen: {}');
    expect(texts.length).toBeGreaterThan(40);
  });

  it('names a way that works in every problem of the camera', () => {
    const { camera } = deviceMessages;
    const problems = [
      camera.insecure,
      camera.unsupported,
      camera.denied,
      camera.missing,
      camera.busy,
      camera.failed,
    ];
    for (const text of problems) {
      expect(text).toMatch(/Foto|eintippen/);
    }
  });
});

describe('DeviceProvider', () => {
  it('hands the parts the device and the texts of another language, the rest in de-CH', () => {
    const device = createFakeDevice();
    const translation = defineTranslation(deviceMessages, { share: { share: 'Partilhar' } });
    render(
      <DeviceProvider device={device} translation={translation}>
        <ShareButton file={null} />
      </DeviceProvider>,
    );
    expect(screen.getByRole('button', { name: 'Partilhar' })).toBeTruthy();
  });

  it('speaks de-CH without a provider, and refuses to touch a device it was not given', () => {
    expect(renderHook(() => useDeviceTexts()).result.current.signature.clear).toBe('Löschen');
    expect(() => renderHook(() => useDevice())).toThrow(/DeviceProvider/);
  });
});

function withDevice(device: FakeDevice) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <DeviceProvider device={device}>{children}</DeviceProvider>;
  };
}

describe('useWakeLock', () => {
  it('holds the lock while active and lets it go when the task ends', async () => {
    const device = createFakeDevice();
    const { result, rerender } = renderHook(({ active }) => useWakeLock(active), {
      wrapper: withDevice(device),
      initialProps: { active: false },
    });
    expect(result.current).toBe('released');
    expect(device.log).toEqual([]);
    rerender({ active: true });
    expect(result.current).toBe('waiting');
    await waitFor(() => {
      expect(result.current).toBe('held');
    });
    rerender({ active: false });
    expect(result.current).toBe('released');
    expect(device.log).toEqual(['wakeLock:request', 'wakeLock:release']);
    rerender({ active: true });
    expect(result.current).toBe('waiting');
  });

  it('says unsupported where the browser has none', () => {
    const device = createFakeDevice({ requestWakeLock: undefined });
    const { result } = renderHook(() => useWakeLock(true), { wrapper: withDevice(device) });
    expect(result.current).toBe('unsupported');
  });
});

describe('useActionCount', () => {
  it('keeps the number on the app icon at what needs the person, nothing at 0', async () => {
    const device = createFakeDevice();
    const { rerender } = renderHook(
      ({ count }) => {
        useActionCount(count);
      },
      { wrapper: withDevice(device), initialProps: { count: 2 } },
    );
    rerender({ count: 0 });
    await waitFor(() => {
      expect(device.log).toEqual(['badge:2', 'badge:clear']);
    });
  });
});
