export type TestStatus = 'ready' | 'running' | 'finished';
export type TestDuration = 30 | 60 | 120;

export interface TypingState {
  readonly target: string;
  readonly input: string;
  readonly attempts: number;
  readonly correctAttempts: number;
  readonly status: TestStatus;
  readonly durationSeconds: TestDuration;
  readonly startedAt: number | null;
  readonly deadline: number | null;
  readonly elapsedMs: number;
  readonly remainingSeconds: number;
}

export interface TypingMetrics {
  readonly wpm: number;
  readonly accuracy: number;
  readonly correctCharacters: number;
  readonly attempts: number;
}

export function createTypingState(target: string, durationSeconds: TestDuration): TypingState {
  return {
    target,
    input: '',
    attempts: 0,
    correctAttempts: 0,
    status: 'ready',
    durationSeconds,
    startedAt: null,
    deadline: null,
    elapsedMs: 0,
    remainingSeconds: durationSeconds,
  };
}

function isAppend(previous: string, next: string): boolean {
  return next.length > previous.length && next.startsWith(previous);
}

function isSingleBackspace(previous: string, next: string): boolean {
  return previous.length - next.length === 1 && previous.startsWith(next);
}

export function applyInput(state: TypingState, nextInput: string, now: number): TypingState {
  if (state.status === 'finished' || nextInput === state.input) return state;
  if (isSingleBackspace(state.input, nextInput)) return { ...state, input: nextInput };
  if (!isAppend(state.input, nextInput)) return state;

  const addedCharacters = nextInput.slice(state.input.length);
  const correctAdded = [...addedCharacters].filter((character, index) =>
    character === state.target[state.input.length + index],
  ).length;
  const startedAt = state.startedAt ?? now;
  const deadline = state.deadline ?? startedAt + state.durationSeconds * 1_000;

  return {
    ...state,
    input: nextInput,
    attempts: state.attempts + addedCharacters.length,
    correctAttempts: state.correctAttempts + correctAdded,
    status: 'running',
    startedAt,
    deadline,
  };
}

export function reconcileDeadline(state: TypingState, now: number): TypingState {
  if (state.status !== 'running' || state.startedAt === null || state.deadline === null) return state;
  if (now >= state.deadline) {
    return {
      ...state,
      status: 'finished',
      elapsedMs: state.durationSeconds * 1_000,
      remainingSeconds: 0,
    };
  }

  const elapsedMs = Math.max(state.elapsedMs, now - state.startedAt);
  const remainingSeconds = Math.ceil((state.deadline - now) / 1_000);
  return { ...state, elapsedMs, remainingSeconds };
}

function countCorrectCharacters(state: TypingState): number {
  let correctCharacters = 0;
  for (let index = 0; index < state.input.length; index += 1) {
    if (state.input[index] === state.target[index]) correctCharacters += 1;
  }
  return correctCharacters;
}

export function getMetrics(state: TypingState, now: number): TypingMetrics {
  const elapsedMs = state.status === 'running' && state.startedAt !== null
    ? Math.max(state.elapsedMs, now - state.startedAt)
    : state.elapsedMs;
  const correctCharacters = countCorrectCharacters(state);
  const elapsedMinutes = elapsedMs / 60_000;

  return {
    wpm: elapsedMinutes > 0 ? Math.round((correctCharacters / 5 / elapsedMinutes) * 10) / 10 : 0,
    accuracy: state.attempts > 0 ? Math.round((state.correctAttempts / state.attempts) * 100) : 0,
    correctCharacters,
    attempts: state.attempts,
  };
}
