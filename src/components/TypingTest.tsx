import { useEffect, useRef } from 'react';
import { useTypingTest, type TestDuration } from '../hooks/useTypingTest';

const DURATIONS: readonly TestDuration[] = [30, 60, 120];

interface TargetPassageProps {
  readonly passage: string;
  readonly input: string;
}

function TargetPassage({ passage, input }: TargetPassageProps) {
  const words = passage.match(/\s*\S+\s*|\s+/g) ?? [];
  let characterIndex = 0;

  return (
    <div className="target-passage">
      {words.map((word) => {
        const wordStart = characterIndex;
        characterIndex += word.length;
        return (
          <div className="target-word" key={wordStart}>
            {[...word].map((character, wordIndex) => {
              const index = wordStart + wordIndex;
              const typed = input[index];
              const stateClass = typed === undefined ? 'target-character--pending'
                : typed === character ? 'target-character--correct' : 'target-character--incorrect';
              const caretClass = index === input.length ? ' target-character--caret' : '';
              return (
                <span className={`target-character ${stateClass}${caretClass}`} key={`${index}-${character}`}>
                  {character}
                </span>
              );
            })}
          </div>
        );
      })}
      {input.length >= passage.length && <span className="end-caret" aria-hidden="true" />}
    </div>
  );
}

export function TypingTest() {
  const test = useTypingTest();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const passageRef = useRef<HTMLDivElement>(null);
  const composing = useRef(false);
  const passage = test.state.target;
  const metrics = test.metrics;

  useEffect(() => {
    if (!test.inputFocused) return;
    const caret = passageRef.current?.querySelector('.target-character--caret, .end-caret');
    caret?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }, [passage, test.inputFocused, test.state.input.length]);

  const restart = () => {
    test.restart();
    inputRef.current?.focus();
  };

  const applyTypedValue = (value: string) => {
    if (composing.current) return;
    if (value !== test.state.input && inputRef.current?.selectionStart !== value.length) return;
    test.handleInput(value);
  };

  const focusTyping = () => inputRef.current?.focus();

  return (
    <section className="typing-panel">
      <div className="duration-row" aria-label="Test duration">
        <span className="control-label">Duration</span>
        <div className="duration-options">
          {DURATIONS.map((duration) => (
            <button
              key={duration}
              type="button"
              aria-pressed={test.state.durationSeconds === duration}
              onClick={() => test.setDuration(duration)}
            >
              {duration} seconds
            </button>
          ))}
        </div>
      </div>

      <div className="metrics" aria-label="Typing metrics">
        <div className="metric">
          <span className="metric-label">Time left</span>
          <strong>{test.state.remainingSeconds}<small> s</small></strong>
        </div>
        <div className="metric">
          <span className="metric-label">WPM</span>
          <strong>{metrics.wpm}<small> wpm</small></strong>
        </div>
        <div className="metric">
          <span className="metric-label">Accuracy</span>
          <strong>{metrics.accuracy}<small>%</small></strong>
        </div>
        <div className="metric">
          <span className="metric-label">Attempts</span>
          <strong>{metrics.attempts}<small> chars</small></strong>
        </div>
      </div>

      <div
        ref={passageRef}
        className={`passage-wrap${test.shouldBlurPassage ? ' passage-wrap--blurred' : ''}`}
        role="group"
        onClick={focusTyping}
        aria-label="Passage to type"
      >
        <TargetPassage passage={passage} input={test.state.input} />
        {test.shouldBlurPassage && (
          <span className="focus-prompt">Focus the typing field to reveal your place</span>
        )}
        <label className="visually-hidden" htmlFor="typing-input">Type the passage</label>
        <textarea
          ref={inputRef}
          id="typing-input"
          className="typing-input"
          aria-describedby="typing-instructions"
          value={test.state.input}
          rows={2}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          inputMode="text"
          readOnly={test.state.status === 'finished'}
          onChange={(event) => applyTypedValue(event.currentTarget.value)}
          onCompositionStart={() => { composing.current = true; }}
          onCompositionEnd={(event) => {
            composing.current = false;
            applyTypedValue(event.currentTarget.value);
          }}
          onFocus={test.onInputFocus}
          onBlur={test.onInputBlur}
          onPaste={(event) => event.preventDefault()}
          onDrop={(event) => event.preventDefault()}
        />
      </div>

      <p className="typing-instructions" id="typing-instructions">
        Type the words as shown. Backspace corrects a character; pasted text is not counted.
      </p>
      <button className="restart-button" type="button" onClick={restart}>Restart</button>

      {test.state.status === 'finished' && (
        <div className="completion" role="status">
          <h2>Test complete</h2>
          <p>
            Final result: <strong>{metrics.wpm} WPM</strong> at{' '}
            <strong>{metrics.accuracy}% accuracy</strong>.
          </p>
        </div>
      )}
    </section>
  );
}
