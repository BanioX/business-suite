import { localDate } from '@onestrand/core';
import { ToastProvider, UiProvider } from '@onestrand/ui';
import { render, type RenderResult } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { Device } from '../src/index';
import { DeviceProvider } from '../src/web/index';
import { createFakeDevice } from './fake-device';

/** Renders a part of the device as the shell mounts it: kit, toasts and the device around it. */
export function renderWithDevice(
  node: ReactNode,
  device: Device = createFakeDevice(),
): RenderResult & { device: Device } {
  const wrap = (child: ReactNode) => (
    <UiProvider today={localDate('2026-11-28')}>
      <ToastProvider>
        <DeviceProvider device={device}>{child}</DeviceProvider>
      </ToastProvider>
    </UiProvider>
  );
  const result = render(wrap(node));
  return {
    ...result,
    device,
    rerender: (next: ReactNode) => {
      result.rerender(wrap(next));
    },
  };
}

/** Lets the promises that are already settled run their callbacks. */
export const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
