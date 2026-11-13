import { describe, it, expect } from 'vitest';
import { evaluateRubric } from './scoring';

describe('evaluateRubric', () => {
  it('gives 0 for empty text', () => {
    expect(evaluateRubric('   ').total).toBe(0);
  });
  it('gives only attempt points for plain text', () => {
    const r = evaluateRubric('I did it');
    expect(r).toMatchObject({ attempt: 5, reason: 0, evidence: 0, conclusion: 0, total: 5 });
  });
  it('awards each rubric part independently', () => {
    const r = evaluateRubric('I chose blue because it is clear. I tested it with my buddy. Next time I will use bigger text.');
    expect(r).toMatchObject({ attempt: 5, reason: 5, evidence: 5, conclusion: 5, total: 20 });
  });
  it('matches whole words only ("also" is not "so")', () => {
    expect(evaluateRubric('also sort of').reason).toBe(0);
  });
  it('never exceeds 20', () => {
    expect(evaluateRubric('because tested next').total).toBeLessThanOrEqual(20);
  });
});
