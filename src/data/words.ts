const COMMON_WORDS = [
  'about', 'after', 'again', 'always', 'around', 'because', 'before', 'between',
  'bright', 'bring', 'change', 'clear', 'close', 'could', 'create', 'different',
  'early', 'every', 'example', 'first', 'follow', 'found', 'friend', 'great',
  'group', 'happen', 'happy', 'important', 'keep', 'large', 'learn', 'leave',
  'light', 'little', 'might', 'move', 'never', 'often', 'other', 'people',
  'place', 'point', 'public', 'right', 'small', 'something', 'sound', 'start',
  'still', 'story', 'strong', 'their', 'there', 'these', 'thing', 'think',
  'through', 'together', 'under', 'until', 'water', 'where', 'which', 'world',
  'write', 'young', 'calm', 'steady', 'useful', 'simple', 'careful', 'today',
  'window', 'garden', 'morning', 'paper', 'quiet', 'typing', 'practice', 'words',
];

export function generatePassage(previous = ''): string {
  const words = Array.from({ length: 48 }, () =>
    COMMON_WORDS[Math.floor(Math.random() * COMMON_WORDS.length)] ?? 'practice',
  );
  const passage = words.join(' ');
  return passage === previous ? `${passage} today` : passage;
}
