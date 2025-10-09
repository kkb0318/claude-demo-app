import { describe, expect, it } from 'vitest';

import { CodexCompletion } from '@domain/entities/codex-completion';

describe('CodexCompletion', () => {
  it('creates a completion with trimmed text', () => {
    const completion = CodexCompletion.create({
      text: '  hello world  ',
      finishReason: 'stop'
    });

    expect(completion.text).toBe('hello world');
    expect(completion.finishReason).toBe('stop');
    expect(completion.toJSON()).toEqual({ text: 'hello world', finishReason: 'stop' });
  });

  it('throws when completion text is empty', () => {
    expect(() =>
      CodexCompletion.create({
        text: '   ',
        finishReason: undefined
      })
    ).toThrow(/must not be empty/);
  });
});
