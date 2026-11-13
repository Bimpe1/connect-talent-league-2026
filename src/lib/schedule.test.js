import { describe, it, expect } from 'vitest';
import { challengeState, currentSlot, countdown, indexWindows, windowKey } from './schedule';

const win = (o = {}) => ({ weekNumber: 1, dayName: 'Monday', opensAt: 1000, closesAt: 2000, ungated: false, locked: false, ...o });

describe('challengeState', () => {
  it('is upcoming before opening, open inside, closed after', () => {
    expect(challengeState(win(), 999)).toBe('upcoming');
    expect(challengeState(win(), 1000)).toBe('open');
    expect(challengeState(win(), 2000)).toBe('open');
    expect(challengeState(win(), 2001)).toBe('closed');
  });
  it('ungated days are always open', () => {
    expect(challengeState(win({ ungated: true }), 5)).toBe('open');
    expect(challengeState(win({ ungated: true }), 9999)).toBe('open');
  });
  it('locked beats everything', () => {
    expect(challengeState(win({ locked: true, ungated: true }), 1500)).toBe('locked');
  });
  it('unknown window defaults to open', () => {
    expect(challengeState(undefined, 1)).toBe('open');
  });
});

describe('currentSlot', () => {
  const ws = Array.from({ length: 14 }, (_, i) => ({ weekNumber: Math.floor(i / 7) + 1, dayName: 'x', opensAt: i * 100 }));
  it('defaults to week 1 day 0 before anything opens', () => {
    expect(currentSlot(ws, -1)).toEqual({ week: 1, dayIndex: 0 });
  });
  it('picks the latest opened day', () => {
    expect(currentSlot(ws, 250)).toEqual({ week: 1, dayIndex: 2 });
    expect(currentSlot(ws, 750)).toEqual({ week: 2, dayIndex: 0 });
    expect(currentSlot(ws, 99999)).toEqual({ week: 2, dayIndex: 6 });
  });
});

describe('helpers', () => {
  it('formats countdowns', () => {
    expect(countdown(30 * 60000)).toBe('30m');
    expect(countdown(90 * 60000)).toBe('1h 30m');
    expect(countdown(26 * 3600000)).toBe('1d 2h');
    expect(countdown(-5)).toBe('0m');
  });
  it('indexes windows by week+day', () => {
    expect(indexWindows([win()])[windowKey(1, 'Monday')].opensAt).toBe(1000);
  });
});
