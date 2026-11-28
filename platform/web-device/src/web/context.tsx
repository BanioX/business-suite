import { resolveCatalogue, type Translation } from '@onestrand/i18n';
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Device } from '../ports';
import { deviceMessages, type DeviceMessages } from './messages';

interface DeviceSettings {
  device: Device | undefined;
  texts: DeviceMessages;
}

const DeviceContext = createContext<DeviceSettings>({ device: undefined, texts: deviceMessages });

export interface DeviceProviderProps {
  /** The device of the app: `createBrowserDevice()` once when the app starts; a fake in a test. */
  device: Device;
  /** The texts of the device in the language of the person; a missing key falls back to de-CH. */
  translation?: Translation<DeviceMessages> | undefined;
  children: ReactNode;
}

/**
 * Hands the visible parts of the device the device itself and their texts. Mounted once by the
 * shell, inside `UiProvider` of `@onestrand/ui`. The parts never build a device of their own: what
 * they touch, a test can replace.
 */
export function DeviceProvider({ device, translation, children }: DeviceProviderProps) {
  const texts = useMemo(() => resolveCatalogue(deviceMessages, translation), [translation]);
  const value = useMemo(() => ({ device, texts }), [device, texts]);
  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
}

/** The device from `DeviceProvider`. Throws without one: a part of the device needs its port. */
export function useDevice(): Device {
  const { device } = useContext(DeviceContext);
  if (device === undefined) {
    throw new Error(
      'A part of the device needs its port: wrap the page in <DeviceProvider device={…}>.',
    );
  }
  return device;
}

/** The texts of the device in the language `DeviceProvider` was given; de-CH without one. */
export function useDeviceTexts(): DeviceMessages {
  return useContext(DeviceContext).texts;
}
