import { describe, expect, it } from 'vitest';
import {
  applyInput,
  createTypingState,
  getMetrics,
  reconcileDeadline,
} from './typing';

describe('typing score and state helpers', () => {
  it('starts on the first accepted character and scores matching spaces', () => {
    const ready = createTypingState('hi there', 30);
    const started = applyInput(ready, 'h', 1_000);
    const progressed = applyInput(started, 'hi ', 2_000);

    expect(ready.status).toBe('ready');
    expect(started.deadline).toBe(31_000);
    expect(progressed.input).toBe('hi ');
    expect(getMetrics(progressed, 2_000)).toEqual({
      wpm: 36,
      accuracy: 100,
      correctCharacters: 3,
      attempts: 3,
    });
  });

  it('retains incorrect attempt history after correction', () => {
    const started = applyInput(createTypingState('cat', 30), 'x', 1_000);
    const corrected = applyInput(started, '', 2_000);
    const typed = applyInput(corrected, 'c', 3_000);
    const metrics = getMetrics(typed, 3_000);

    expect(metrics.correctCharacters).toBe(1);
    expect(metrics.attempts).toBe(2);
    expect(metrics.accuracy).toBe(50);
  });

  it('does not count backspace and rejects non-prefix edits', () => {
    const started = applyInput(createTypingState('abc', 30), 'a', 1_000);
    const deleted = applyInput(started, '', 2_000);

    expect(deleted.attempts).toBe(1);
    expect(applyInput(started, 'xa', 2_000)).toEqual(started);
  });

  it('guards empty input and zero elapsed time', () => {
    expect(getMetrics(createTypingState('abc', 30), 0)).toEqual({
      wpm: 0,
      accuracy: 0,
      correctCharacters: 0,
      attempts: 0,
    });
  });

  it('freezes at the deadline and rejects later input', () => {
    const started = applyInput(createTypingState('abc', 30), 'a', 1_000);
    const finished = reconcileDeadline(started, 31_000);

    expect(finished.status).toBe('finished');
    expect(finished.remainingSeconds).toBe(0);
    expect(applyInput(finished, 'ab', 32_000)).toEqual(finished);
  });

  it('keeps elapsed time monotonic before expiry', () => {
    const started = applyInput(createTypingState('abc', 30), 'a', 1_000);
    const reconciled = reconcileDeadline(started, 2_250);

    expect(reconciled.elapsedMs).toBe(1_250);
    expect(reconciled.remainingSeconds).toBe(29);
  });
});
