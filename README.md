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

### Environment variables

No environment variables are required to install or run the app locally.
Optionally, set `VITE_SITE_URL` to the public site origin if it differs from
`https://wordtype.perezrubio.dev`. This value is used for canonical, social,
and structured-data URLs. For example, create a `.env` file in the project
root:

```dotenv
VITE_SITE_URL=https://example.com
```

The mobile Playwright profile checks a narrow viewport and touch-oriented
browser emulation. It does not replace testing with a physical phone and its
native keyboard.
