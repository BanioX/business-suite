import type { BadgePort, Device, HeldLock } from './ports';

/**
 * Keeping the screen on during a task (SE-09) and the number on the app icon (SE-10).
 *
 * The wake lock is held only while a task runs (a signature, a checklist being worked through,
 * the camera reading a code). The browser releases it when the page is hidden; while the task
 * still runs, it is asked for again once the page is seen again. When the task ends, it is
 * released. Where the browser has no Wake Lock API, nothing happens and the task works as well.
 */

/** The state of a wake lock for one task. */
export type WakeLockState = 'unsupported' | 'held' | 'waiting' | 'released';

export interface TaskWakeLock {
  /** `held` while the screen stays on; `waiting` while the page is hidden; `released` at the end. */
  state: () => WakeLockState;
  /** Ends the task: releases the lock and stops listening. Safe to call twice. */
  release: () => Promise<void>;
}

/**
 * Keeps the screen on for a task, as long as the page is seen; see the comment of the module.
 * Never throws: a refused request (low battery, a setting of the device) leaves the state
 * `waiting`, and the next time the page is seen it asks again. `onChange` hears every change of
 * the state.
 */
export function holdWakeLock(
  device: Device,
  onChange: (state: WakeLockState) => void = () => undefined,
): TaskWakeLock {
  const request = device.screen.requestWakeLock;
  if (request === undefined) {
    return { state: () => 'unsupported', release: () => Promise.resolve() };
  }
  let state: WakeLockState = 'waiting';
  let held: HeldLock | null = null;
  let ended = false;
  /** Counts requests: one that is overtaken by the end of the task or a hidden page gives up. */
  let attempt = 0;

  const set = (next: WakeLockState) => {
    if (next !== state) {
      state = next;
      onChange(next);
    }
  };

  const acquire = async () => {
    attempt += 1;
    const mine = attempt;
    try {
      const lock = await request();
      if (ended || mine !== attempt || !device.screen.visible()) {
        await lock.release().catch(() => undefined);
        return;
      }
      held = lock;
      lock.onRelease(() => {
        if (held === lock) {
          held = null;
          if (!ended) {
            set('waiting');
          }
        }
      });
      set('held');
    } catch {
      // Refused: the task goes on without; the next visible page asks again.
      if (!ended) {
        set('waiting');
      }
    }
  };

  const stopListening = device.screen.onVisibilityChange((visible) => {
    if (ended) {
      return;
    }
    if (visible) {
      if (held === null) {
        void acquire();
      }
    } else {
      // A hidden page keeps no lock: release it now rather than wait for the browser to.
      attempt += 1;
      const lock = held;
      held = null;
      set('waiting');
      void lock?.release().catch(() => undefined);
    }
  });

  if (device.screen.visible()) {
    void acquire();
  }

  return {
    state: () => state,
    release: async () => {
      if (ended) {
        return;
      }
      ended = true;
      attempt += 1;
      stopListening();
      const lock = held;
      held = null;
      set('released');
      await lock?.release().catch(() => undefined);
    },
  };
}

/**
 * Shows a number on the app icon of an installed app: the count of what needs the person's
 * action (decision S-26: no counter as a lure; never news, never what others did). Nothing at 0.
 * A quiet no-op where the browser has no Badging API or refuses (iOS without the permission for
 * notifications); never throws. Returns true if the browser took the number.
 */
export async function showActionCount(device: Device, count: number): Promise<boolean> {
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError('The number on the app icon is a whole number of at least 0');
  }
  const badge: BadgePort | undefined = device.badge;
  if (badge === undefined) {
    return false;
  }
  try {
    if (count > 0) {
      await badge.set(count);
    } else {
      await badge.clear();
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Copies a text to the clipboard (SE-11), after a tap: a code that was read, a reference to type
 * elsewhere. False where the browser gives no clipboard or refuses; never throws.
 */
export async function copyText(device: Device, text: string): Promise<boolean> {
  if (device.clipboard === undefined) {
    return false;
  }
  try {
    await device.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
