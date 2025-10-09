import { z } from 'zod';

const CodexCompletionSchema = z.object({
  text: z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, {
      message: 'Completion text must not be empty'
    }),
  finishReason: z.string().optional()
});

export type CodexCompletionProps = z.infer<typeof CodexCompletionSchema>;

/**
 * CodexCompletion represents a sanitized completion result returned by the Codex service.
 */
export class CodexCompletion {
  private constructor(private readonly props: CodexCompletionProps) {}

  static create(props: CodexCompletionProps): CodexCompletion {
    const parsed = CodexCompletionSchema.parse(props);
    return new CodexCompletion(parsed);
  }

  get text(): string {
    return this.props.text;
  }

  get finishReason(): string | undefined {
    return this.props.finishReason;
  }

  toJSON(): CodexCompletionProps {
    return { ...this.props };
  }
}
