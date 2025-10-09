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
        'config/**',
        '.eslintrc.cjs',
        '**/*.spec.ts',
        '**/*.test.ts'
      ],
      thresholds: {
        statements: 90,
        branches: 85,
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
      '@presentation': resolveFromRoot('src/presentation'),
      '@shared': resolveFromRoot('src/shared')
    }
  }
});
