import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useTypingTest } from './useTypingTest';

describe('useTypingTest timing lifecycle', () => {
  afterEach(() => vi.useRealTimers());

  it('does not start until first accepted input and expires on its deadline', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useTypingTest({ initialText: 'abc' }));

    expect(result.current.state.status).toBe('ready');
    act(() => result.current.handleInput('a'));
    expect(result.current.state.status).toBe('running');
    act(() => vi.advanceTimersByTime(30_000));
    expect(result.current.state.status).toBe('finished');
    expect(result.current.state.remainingSeconds).toBe(0);
    act(() => result.current.handleInput('ab'));
    expect(result.current.state.input).toBe('a');
  });

  it('resets with a new passage on duration change and restart', () => {
    const { result } = renderHook(() => useTypingTest({ initialText: 'first', textFactory: () => 'second' }));

    act(() => result.current.handleInput('f'));
    act(() => result.current.setDuration(60));
    expect(result.current.state.status).toBe('ready');
    expect(result.current.state.durationSeconds).toBe(60);
    expect(result.current.state.input).toBe('');
    expect(result.current.state.target).toBe('second');
    act(() => result.current.restart());
    expect(result.current.state.target).not.toBe('second');
    expect(result.current.state.durationSeconds).toBe(60);
  });

  it('keeps timing while input is blurred and tracks browser focus', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useTypingTest({ initialText: 'abc' }));

    act(() => result.current.handleInput('a'));
    act(() => result.current.onInputFocus());
    act(() => window.dispatchEvent(new Event('blur')));
    expect(result.current.windowFocused).toBe(false);
    expect(result.current.shouldBlurPassage).toBe(true);
    act(() => vi.advanceTimersByTime(30_000));
    expect(result.current.state.status).toBe('finished');
  });

  it('extends the passage before the current target runs out', () => {
    const { result } = renderHook(() => useTypingTest({
      initialText: 'abc',
      textFactory: () => 'next words',
    }));

    act(() => result.current.handleInput('abc'));

    expect(result.current.state.target).toBe('abc next words');
    expect(result.current.state.input).toBe('abc');
  });
});
