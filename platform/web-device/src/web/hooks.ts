import { useEffect, useState } from 'react';
import { holdWakeLock, showActionCount, type WakeLockState } from '../screen';
import { useDevice } from './context';

/**
 * Keeps the screen on while `active` is true and the page is seen (SE-09): during a signature, a
 * checklist being worked through, the camera reading a code. Released when `active` turns false,
 * when the page is hidden and when the component goes. Returns the state for a quiet word on the
 * page, if it wants one; where the browser has no Wake Lock API it is `unsupported`.
 */
export function useWakeLock(active: boolean): WakeLockState {
  const device = useDevice();
  const supported = device.screen.requestWakeLock !== undefined;
  const [state, setState] = useState<WakeLockState>('waiting');
  useEffect(() => {
    if (!active || !supported) {
      return;
    }
    const lock = holdWakeLock(device, setState);
    return () => {
      void lock.release();
    };
  }, [device, active, supported]);
  if (!active) {
    return 'released';
  }
  if (!supported) {
    return 'unsupported';
  }
  // A lock of an earlier task was released; this one waits for its own.
  return state === 'released' ? 'waiting' : state;
}

/**
 * Keeps the number on the app icon at `count` (SE-10): what needs the person's action, nothing at
 * 0 (decision S-26: no counter as a lure). The shell calls it once with the count of «Heute»; a
 * quiet no-op where the browser has no badge.
 */
export function useActionCount(count: number): void {
  const device = useDevice();
  useEffect(() => {
    void showActionCount(device, count);
  }, [device, count]);
}
