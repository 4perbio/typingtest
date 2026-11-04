import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';

const DEFAULT_SITE_URL = 'https://wordtype.perezrubio.dev';

export default defineConfig(({ mode }) => {
  const siteUrl = new URL(
    loadEnv(mode, process.cwd(), 'VITE_').VITE_SITE_URL || DEFAULT_SITE_URL,
  ).origin;

  return {
    plugins: [
      react(),
      {
        name: 'wordtype-seo-site-url',
        transformIndexHtml(html) {
          return html.replace(/__SITE_URL__/g, siteUrl);
        },
      },
    ],
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      coverage: {
        provider: 'v8',
        include: ['src/lib/typing.ts', 'src/hooks/useTypingTest.ts'],
        thresholds: { lines: 80, branches: 80 },
      },
    },
  };
});
