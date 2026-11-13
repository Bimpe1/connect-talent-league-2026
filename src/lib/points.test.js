import { describe, it, expect } from 'vitest';
import { totalPoints, attendanceCount, teamAverage } from './points';

const p = (over = {}) => ({ wk1: 0, wk2: 0, wk3: 0, wk4: 0, attendance: {}, ...over });

describe('points', () => {
  it('counts weeks 3 and 4 (regression)', () => {
    expect(totalPoints(p({ wk3: 30, wk4: 40 }))).toBe(70);
  });
  it('adds 10 per attended session, ignoring "prep"', () => {
    const x = p({ wk1: 20, attendance: { prep: true, wk1: true, wk2: true } });
    expect(attendanceCount(x)).toBe(2);
    expect(totalPoints(x)).toBe(40);
  });
  it('handles missing fields', () => {
    expect(totalPoints({})).toBe(0);
  });
  it('averages per member, 0 for empty team', () => {
    expect(teamAverage([])).toBe(0);
    expect(teamAverage([p({ wk1: 10 }), p({ wk1: 21 })])).toBe(15.5);
  });
});
