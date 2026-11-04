# Wordtype

A client-only English typing practice app with five visual themes, named accents,
30/60/120-second tests, live WPM and accuracy, and keyboard-accessible restart.
Theme and accent choices are saved locally; typing text and results are not.

## Development

- `npm install` — install dependencies
- `npm run dev` — start Vite
- `npm run typecheck` — strict TypeScript validation
- `npm run lint` — ESLint
- `npm run test:coverage` — Vitest, React Testing Library, and coverage
- `npx playwright install chromium webkit` — install browser engines for E2E
- `npm run test:e2e` — desktop Chromium and iPhone-profile WebKit checks
- `npm run build` — production build

Set `VITE_SITE_URL` to the production origin when the public domain differs from
`https://wordtype.perezrubio.dev`; the value is used for canonical, social, and
structured-data URLs.

The mobile Playwright profile checks a narrow viewport and touch-oriented
browser emulation. It does not replace testing with a physical phone and its
native keyboard.
