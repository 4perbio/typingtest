import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

describe('typing test interface', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts in Dracula with a 30-second test and a labelled passage input', async () => {
    const user = userEvent.setup();
    render(<App />);

    const pageTitle = screen.getByRole('heading', { name: /minimal online typing test/i, level: 1 });
    expect(pageTitle).toBeInTheDocument();
    expect(pageTitle.closest('header')).toHaveClass('visually-hidden');
    const input = screen.getByRole('textbox', { name: /type the passage/i });
    expect(input).toBeInTheDocument();
    expect(input.closest('.passage-wrap')).not.toBeNull();
    expect(screen.queryByRole('slider', { name: /test duration/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/time left/i)).not.toBeInTheDocument();
    const settingsButton = screen.getByRole('button', { name: /settings/i });
    expect(settingsButton).toHaveAttribute('aria-expanded', 'false');
    expect(settingsButton.querySelector('img')).toHaveAttribute('alt', '');
    expect(screen.queryByLabelText(/theme/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /settings/i }));
    expect(screen.getByLabelText(/theme/i)).toHaveValue('dracula');
    expect(screen.getByRole('slider', { name: /test duration/i })).toHaveValue('30');
    expect(screen.getByText('30 seconds')).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Word' })).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: /decorative document ribbon/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole('textbox', { name: /type the passage/i })).toHaveLength(1);
  });

  it('opens and dismisses appearance settings with the gear menu', async () => {
    const user = userEvent.setup();
    render(<App />);
    const settingsButton = screen.getByRole('button', { name: /settings/i });

    await user.click(settingsButton);
    expect(settingsButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('region', { name: /appearance/i })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(settingsButton).toHaveAttribute('aria-expanded', 'false');
    expect(settingsButton).toHaveFocus();

    await user.click(settingsButton);
    fireEvent.pointerDown(document.body);
    expect(settingsButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('describes the typing test accurately and provides dismissible feedback', async () => {
    const user = userEvent.setup();
    render(<App />);

    const sectionTitle = screen.getByRole('heading', {
      name: /simple typing test for fun and focused practice/i,
    });
    expect(sectionTitle).toHaveClass('visually-hidden');
    expect(screen.getByText(/choose a session from 0 to 60 seconds/i)).toBeInTheDocument();
    expect(screen.getByText(/does not record audio/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /give us feedback/i }))
      .toHaveAttribute('href', 'https://perezrubio.dev');
    await user.click(screen.getByRole('button', { name: /dismiss feedback/i }));
    expect(screen.queryByRole('link', { name: /give us feedback/i })).not.toBeInTheDocument();
  });

  it('focuses and types through the input overlaid on the passage surface', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /settings/i }));
    const input = screen.getByRole('textbox', { name: /type the passage/i });
    const passage = screen.getByRole('group', { name: /passage to type/i });

    await user.click(passage);
    expect(input).toHaveFocus();
    await user.keyboard('x ');

    expect(input).toHaveValue('x ');
    expect(passage.querySelectorAll('.target-word').length).toBeGreaterThan(0);
    const characters = Array.from(passage.querySelectorAll('.target-character'));
    expect(characters.findIndex((character) =>
      character.classList.contains('target-character--caret'),
    )).toBe(2);
  });

  it('starts only when accepted input arrives without showing live metrics', async () => {
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByRole('textbox', { name: /type the passage/i });

    await user.type(input, 'the ');

    expect(input).toHaveValue('the ');
    expect(screen.queryByText(/time left/i)).not.toBeInTheDocument();
    expect(screen.queryByText('WPM', { exact: true })).not.toBeInTheDocument();
    expect(screen.queryByText('Accuracy', { exact: true })).not.toBeInTheDocument();
    expect(screen.queryByText('Attempts', { exact: true })).not.toBeInTheDocument();
  });

  it('blocks paste and drop without counting pasted characters', async () => {
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByRole('textbox', { name: /type the passage/i });

    await user.click(input);
    await user.paste('pasted text');

    expect(input).toHaveValue('');
    expect(screen.queryByText(/attempts/i)).not.toBeInTheDocument();
  });

  it('marks common duration stops and snaps pointer adjustments to them', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /settings/i }));
    const slider = screen.getByRole('slider', { name: /test duration/i });

    expect(screen.getByText('Infinite')).toBeInTheDocument();
    expect(screen.getByText('15', { selector: '.duration-marks span' })).toBeInTheDocument();
    for (const [nearStop, stop] of [[14, 15], [29, 30], [44, 45]]) {
      fireEvent.pointerDown(slider);
      fireEvent.change(slider, { target: { value: String(nearStop) } });
      expect(slider).toHaveValue(String(stop));
      expect(screen.getByText(`${stop} seconds`)).toBeInTheDocument();
      fireEvent.pointerUp(slider);
    }
    expect(slider).toHaveAttribute('step', '1');
    fireEvent.change(slider, { target: { value: '29' } });

    expect(slider).toHaveValue('29');
    expect(screen.getByText('29 seconds')).toBeInTheDocument();
  });

  it('places Restart directly after the input and Enter restarts once with focus', async () => {
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByRole('textbox', { name: /type the passage/i });
    const restart = screen.getByRole('button', { name: /restart/i });
    const passage = screen.getByRole('group', { name: /passage to type/i })
      .querySelector('.target-passage')?.textContent;

    expect(input.compareDocumentPosition(restart) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await user.type(input, 't');
    await user.tab();
    expect(restart).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(input).toHaveFocus();
    expect(input).toHaveValue('');
    expect(screen.getByRole('group', { name: /passage to type/i })
      .querySelector('.target-passage')?.textContent).not.toBe(passage);
    expect(screen.queryByRole('textbox', { name: /type the passage/i })).toBeInTheDocument();
  });

  it('changes themes without losing active text, duration, or progress', async () => {
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByRole('textbox', { name: /type the passage/i });

    await user.click(screen.getByRole('button', { name: /settings/i }));
    fireEvent.change(screen.getByRole('slider', { name: /test duration/i }), {
      target: { value: '60' },
    });
    await user.type(input, 'the');
    const passage = screen.getByRole('group', { name: /passage to type/i })
      .querySelector('.target-passage')?.textContent;
    await user.click(screen.getByRole('button', { name: /settings/i }));
    await user.selectOptions(screen.getByLabelText(/theme/i), 'dracula');

    expect(screen.queryByRole('navigation', { name: /decorative document ribbon/i })).not.toBeInTheDocument();
    expect(input).toHaveValue('the');
    expect(screen.getByRole('group', { name: /passage to type/i })
      .querySelector('.target-passage')?.textContent).toBe(passage);
    expect(screen.getByRole('slider', { name: /test duration/i })).toHaveValue('60');
    expect(screen.getByRole('button', { name: /purple/i })).toBeInTheDocument();
  });

  it('keeps focus in appearance controls when themes change and restores per-theme accent', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /settings/i }));
    await user.selectOptions(screen.getByLabelText(/theme/i), 'dracula');
    await user.click(screen.getByRole('button', { name: /pink/i }));
    await user.selectOptions(screen.getByLabelText(/theme/i), 'catppuccin');
    await user.selectOptions(screen.getByLabelText(/theme/i), 'dracula');

    expect(screen.getByRole('button', { name: /pink/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText(/theme/i)).toHaveFocus();
  });

  it.each(['dracula', 'catppuccin', 'matrix', 'night-runner', 'vaporwave'])(
    'uses the minimal layout for %s',
    async (themeId) => {
      const user = userEvent.setup();
      render(<App />);
      await user.click(screen.getByRole('button', { name: /settings/i }));
      await user.selectOptions(screen.getByLabelText(/theme/i), themeId);

      expect(screen.queryByRole('navigation', { name: /decorative document ribbon/i })).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /minimal online typing test/i, level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /type the passage/i })).toBeInTheDocument();
    },
  );

  it('blurs only the passage when input focus moves to appearance controls', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /settings/i }));
    const input = screen.getByRole('textbox', { name: /type the passage/i });
    const passage = screen.getByRole('group', { name: /passage to type/i });

    await user.click(input);
    expect(passage).not.toHaveClass('passage-wrap--blurred');
    await user.click(screen.getByRole('button', { name: /settings/i }));
    expect(passage).toHaveClass('passage-wrap--blurred');
    await user.click(screen.getByLabelText(/theme/i));
    expect(input).not.toHaveFocus();
  });

  it('keeps appearance controls usable when localStorage is blocked', async () => {
    const user = userEvent.setup();
    const read = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });
    render(<App />);
    await user.click(screen.getByRole('button', { name: /settings/i }));
    const themeSelect = screen.getByLabelText(/theme/i);

    await user.selectOptions(themeSelect, 'matrix');

    expect(themeSelect).toHaveValue('matrix');
    expect(screen.getByRole('button', { name: /amber/i })).toBeInTheDocument();
    read.mockRestore();
    write.mockRestore();
  });

  it('restores valid appearance preferences after a fresh render', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await user.click(screen.getByRole('button', { name: /settings/i }));
    await user.selectOptions(screen.getByLabelText(/theme/i), 'matrix');
    await user.click(screen.getByRole('button', { name: /amber/i }));
    unmount();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /settings/i }));
    expect(screen.getByLabelText(/theme/i)).toHaveValue('matrix');
    expect(screen.getByRole('button', { name: /amber/i })).toHaveAttribute('aria-pressed', 'true');
  });
});
