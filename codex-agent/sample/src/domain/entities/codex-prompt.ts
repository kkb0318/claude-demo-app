import { z } from 'zod';

const promptSchema = z
  .string({ required_error: 'prompt is required' })
  .trim()
  .min(1, 'prompt must not be empty')
  .max(4000, 'prompt exceeds supported token length');

export class CodexPrompt {
  private constructor(private readonly raw: string) {}

  static create(value: string): CodexPrompt {
    const parsed = promptSchema.parse(value);
    return new CodexPrompt(parsed);
  }

  get value(): string {
    return this.raw;
  }

  toJSON(): string {
    return this.raw;
  }
}
