import { useCallback, useEffect, useRef, useState } from 'react';
import {
  applyInput,
  createTypingState,
  getMetrics,
  reconcileDeadline,
  type TestDuration,
  type TypingState,
} from '../lib/typing';
import { generatePassage } from '../data/words';

export type { TestDuration } from '../lib/typing';
type TextFactory = (previousText?: string) => string;

interface UseTypingTestOptions {
  readonly initialText?: string;
  readonly textFactory?: TextFactory;
}

function monotonicNow(): number {
  return performance.now();
}

export function useTypingTest({ initialText, textFactory = generatePassage }: UseTypingTestOptions = {}) {
  const [state, setState] = useState<TypingState>(() =>
    createTypingState(initialText ?? textFactory(), 30),
  );
  const [inputFocused, setInputFocused] = useState(false);
  const [windowFocused, setWindowFocused] = useState(true);
  const [documentVisible, setDocumentVisible] = useState(() => !document.hidden);
  const latestState = useRef(state);

  useEffect(() => {
    latestState.current = state;
  }, [state]);

  const reconcile = useCallback((now = monotonicNow()) => {
    setState((current) => reconcileDeadline(current, now));
  }, []);

  const handleInput = useCallback((nextInput: string) => {
    const now = monotonicNow();
    setState((current) => {
      const needsMoreText = nextInput.length > current.input.length
        && nextInput.length >= current.target.length - 24;
      if (!needsMoreText || current.status === 'finished') {
        return applyInput(reconcileDeadline(current, now), nextInput, now);
      }

      const extension = textFactory(current.target);
      const nextTarget = extension === current.target ? generatePassage(current.target) : extension;
      const expanded = { ...current, target: `${current.target} ${nextTarget}` };
      return applyInput(reconcileDeadline(expanded, now), nextInput, now);
    });
  }, [textFactory]);

  const makeNewState = useCallback((durationSeconds: TestDuration) => {
    const previousText = latestState.current.target;
    const generated = textFactory(previousText);
    const nextText = generated === previousText ? generatePassage(previousText) : generated;
    return createTypingState(nextText, durationSeconds);
  }, [textFactory]);

  const restart = useCallback(() => {
    setState(makeNewState(latestState.current.durationSeconds));
  }, [makeNewState]);

  const setDuration = useCallback((durationSeconds: TestDuration) => {
    if (![30, 60, 120].includes(durationSeconds)) return;
    setState(makeNewState(durationSeconds));
  }, [makeNewState]);

  useEffect(() => {
    if (state.status !== 'running') return undefined;
    const timerId = window.setInterval(() => reconcile(), 200);
    return () => window.clearInterval(timerId);
  }, [state.status, reconcile]);

  useEffect(() => {
    const onVisibilityChange = () => {
      setDocumentVisible(!document.hidden);
      reconcile();
    };
    const onWindowBlur = () => {
      setWindowFocused(false);
      reconcile();
    };
    const onWindowFocus = () => {
      setWindowFocused(true);
      reconcile();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onWindowBlur);
    window.addEventListener('focus', onWindowFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onWindowBlur);
      window.removeEventListener('focus', onWindowFocus);
    };
  }, [reconcile]);

  const onInputFocus = useCallback(() => setInputFocused(true), []);
  const onInputBlur = useCallback(() => setInputFocused(false), []);
  const metrics = getMetrics(state, monotonicNow());

  return {
    state,
    metrics,
    inputFocused,
    windowFocused,
    documentVisible,
    shouldBlurPassage: !inputFocused || !windowFocused || !documentVisible,
    handleInput,
    onInputFocus,
    onInputBlur,
    restart,
    setDuration,
  };
}
