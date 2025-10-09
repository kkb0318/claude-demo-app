import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

const resolveFromRoot = (segment: string) =>
  resolve(new URL('.', import.meta.url).pathname, segment);

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts', 'tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'src/interfaces/cli/index.ts',
        'config/**',
        '.eslintrc.cjs'
      ],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90
      }
    }
  },
  resolve: {
    alias: {
      '@domain': resolveFromRoot('src/domain'),
      '@application': resolveFromRoot('src/application'),
      '@infrastructure': resolveFromRoot('src/infrastructure'),
      '@interfaces': resolveFromRoot('src/interfaces'),
      '@shared': resolveFromRoot('src/shared')
    }
  }
});
