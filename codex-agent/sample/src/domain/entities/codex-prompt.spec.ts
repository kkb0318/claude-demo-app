import { describe, expect, it } from 'vitest';

import { CodexPrompt } from '@domain/entities/codex-prompt';

describe('CodexPrompt', () => {
  it('creates a prompt and trims whitespace', () => {
    const prompt = CodexPrompt.create('  do something cool  ');

    expect(prompt.value).toBe('do something cool');
    expect(prompt.toJSON()).toBe('do something cool');
  });

  it('throws when prompt is empty', () => {
    expect(() => CodexPrompt.create('   ')).toThrow(/must not be empty/);
  });
});
