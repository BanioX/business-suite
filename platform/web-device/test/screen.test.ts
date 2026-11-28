import { describe, expect, it } from 'vitest';
import { copyText, holdWakeLock, showActionCount, type WakeLockState } from '../src/index';
import { createFakeDevice, fakeLock, type DeviceLog } from './fake-device';

/** Lets the promises that are already settled run their callbacks. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('holdWakeLock', () => {
  it('keeps the screen on during the task and releases it when the task ends', async () => {
    const device = createFakeDevice();
    const states: WakeLockState[] = [];
    const lock = holdWakeLock(device, (state) => states.push(state));
    await settle();
    expect(lock.state()).toBe('held');
    await lock.release();
    expect(lock.state()).toBe('released');
    expect(device.log).toEqual(['wakeLock:request', 'wakeLock:release']);
    expect(states).toEqual(['held', 'released']);
    await lock.release();
    expect(device.log).toHaveLength(2);
  });

  it('lets go when the page is hidden and asks again when it is seen, while the task runs', async () => {
    const device = createFakeDevice();
    const lock = holdWakeLock(device);
    await settle();
    device.setVisible(false);
    expect(lock.state()).toBe('waiting');
    expect(device.locks[0]?.released).toBe(true);
    device.setVisible(true);
    await settle();
    expect(lock.state()).toBe('held');
    expect(device.log).toEqual(['wakeLock:request', 'wakeLock:release', 'wakeLock:request']);
    await lock.release();
    device.setVisible(false);
    device.setVisible(true);
    await settle();
    expect(device.log.filter((entry) => entry === 'wakeLock:request')).toHaveLength(2);
  });

  it('waits when the browser releases the lock by itself, and asks again on the next visit', async () => {
    const device = createFakeDevice();
    const lock = holdWakeLock(device);
    await settle();
    device.locks[0]?.browserRelease();
    expect(lock.state()).toBe('waiting');
    device.setVisible(true);
    await settle();
    expect(lock.state()).toBe('held');
  });

  it('asks nothing while the page is hidden, and gives back a lock that came too late', async () => {
    const hidden = createFakeDevice({ visible: false });
    const lock = holdWakeLock(hidden);
    await settle();
    expect(lock.state()).toBe('waiting');
    expect(hidden.log).toEqual([]);

    let grant: (() => void) | undefined;
    const slowLog: DeviceLog = [];
    const late = fakeLock(slowLog);
    const slow = createFakeDevice({
      requestWakeLock: () =>
        new Promise((resolve) => {
          grant = () => {
            resolve(late);
          };
        }),
    });
    const task = holdWakeLock(slow);
    await task.release();
    grant?.();
    await settle();
    expect(task.state()).toBe('released');
    expect(slowLog).toEqual(['wakeLock:release']);
  });

  it('goes on without when the browser refuses', async () => {
    const device = createFakeDevice({
      requestWakeLock: () => Promise.reject(new Error('battery')),
    });
    const lock = holdWakeLock(device);
    await settle();
    expect(lock.state()).toBe('waiting');
  });

  it('does nothing where the browser has no Wake Lock API', async () => {
    const device = createFakeDevice({ requestWakeLock: undefined });
    const lock = holdWakeLock(device);
    expect(lock.state()).toBe('unsupported');
    await lock.release();
    expect(lock.state()).toBe('unsupported');
  });
});

describe('showActionCount', () => {
  it('shows what needs the person, and nothing at 0', async () => {
    const device = createFakeDevice();
    expect(await showActionCount(device, 3)).toBe(true);
    expect(await showActionCount(device, 0)).toBe(true);
    expect(device.log).toEqual(['badge:3', 'badge:clear']);
  });

  it('is quiet where the browser has no badge or refuses it', async () => {
    expect(await showActionCount(createFakeDevice({ badge: undefined }), 2)).toBe(false);
    const refusing = createFakeDevice({
      badge: {
        set: () => Promise.reject(new Error('no')),
        clear: () => Promise.reject(new Error('no')),
      },
    });
    expect(await showActionCount(refusing, 2)).toBe(false);
  });

  it('takes only whole numbers of at least 0', async () => {
    const device = createFakeDevice();
    await expect(showActionCount(device, -1)).rejects.toThrow(RangeError);
    await expect(showActionCount(device, 1.5)).rejects.toThrow(RangeError);
  });
});

describe('copyText', () => {
  it('writes the text to the clipboard, and says false where there is none or it refuses', async () => {
    const device = createFakeDevice();
    expect(await copyText(device, 'AUFTRAG-42')).toBe(true);
    expect(device.log).toEqual(['clipboard:AUFTRAG-42']);
    expect(await copyText(createFakeDevice({ clipboard: undefined }), 'x')).toBe(false);
    const refusing = createFakeDevice({
      clipboard: { writeText: () => Promise.reject(new Error('no')) },
    });
    expect(await copyText(refusing, 'x')).toBe(false);
  });
});
