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

## Cloudflare deployment

The Wrangler config deploys the built `dist` directory as static assets and
serves the SPA entry point for unknown paths. Wrangler is installed with the
project dependencies, so deploy with:

- `npm run deploy:production` — Worker `wordtype`
- `npm run deploy:develop` — Worker `wordtype-develop`

For Cloudflare Workers Builds, create two Worker projects connected to this
repository. Set each Worker's production branch and deploy command in its
Cloudflare dashboard settings:

| Worker project | Production branch | Build command | Deploy command |
| --- | --- | --- | --- |
| `wordtype` | `main` | `npm run build` | `npm run deploy:production` |
| `wordtype-develop` | `develop` | `npm run build` | `npm run deploy:develop` |

Each project must be connected to the matching Worker name. Do not run
`npm run deploy:develop` from the `wordtype` project's build: Workers Builds
enforces the name of the Worker connected to that build. If preview builds are
enabled, use `npx wrangler preview --env production` or
`npx wrangler preview --env develop` as the respective Preview command.

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
