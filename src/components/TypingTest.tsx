import { useEffect, useRef, useState } from 'react';
import { useTypingTest, type TestDuration } from '../hooks/useTypingTest';

interface TypingTestProps {
  readonly durationSeconds: TestDuration;
}

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

export function TypingTest({ durationSeconds }: TypingTestProps) {
  const test = useTypingTest();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const passageRef = useRef<HTMLDivElement>(null);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);
  const composing = useRef(false);
  const isFinished = test.state.status === 'finished';
  const previousFinished = useRef(false);
  const [modeKey, setModeKey] = useState(0);
  const passage = test.state.target;
  const metrics = test.metrics;
  const currentDuration = test.state.durationSeconds;
  const setTestDuration = test.setDuration;

  useEffect(() => {
    if (durationSeconds !== currentDuration) {
      setTestDuration(durationSeconds);
    }
  }, [currentDuration, durationSeconds, setTestDuration]);

  useEffect(() => {
    if (previousFinished.current !== isFinished) {
      previousFinished.current = isFinished;
      setModeKey((key) => key + 1);
    }
  }, [isFinished]);

  useEffect(() => {
    if (isFinished) {
      resultsHeadingRef.current?.focus();
    } else if (modeKey > 0) {
      inputRef.current?.focus();
    }
  }, [isFinished, modeKey]);

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
      <div key={modeKey} className="typing-mode">
        {isFinished ? (
          <div className="results-view" role="status">
            <h2 ref={resultsHeadingRef} tabIndex={-1}>Test complete</h2>
            <div className="result-metrics" role="group" aria-label="Final results">
              <div className="result-metric">
                <span>WPM</span>
                <strong>{metrics.wpm}</strong>
              </div>
              <div className="result-metric">
                <span>Accuracy</span>
                <strong>{metrics.accuracy}%</strong>
              </div>
              <div className="result-metric">
                <span>Duration</span>
                <strong>{test.state.durationSeconds}s</strong>
              </div>
            </div>
            <button className="restart-button" type="button" onClick={restart}>Restart</button>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </section>
  );
}
