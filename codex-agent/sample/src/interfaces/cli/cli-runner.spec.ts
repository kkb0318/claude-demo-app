import { describe, expect, it, vi } from 'vitest';

import { CodexCompletion } from '@domain/entities/codex-completion';

import { buildHelpMessage, parseCliArgs, runCli } from './cli-runner';

describe('parseCliArgs', () => {
  it('parses flags and positional prompt', () => {
    const parsed = parseCliArgs([
      '--thread=thread-1',
      'write code'
    ]);

    expect(parsed).toEqual({
      prompt: 'write code',
      threadId: 'thread-1',
      helpRequested: false
    });
  });
});

describe('runCli', () => {
  const createUseCase = () => {
    return {
      execute: vi.fn().mockResolvedValue({
        completion: CodexCompletion.create({ text: 'result' }),
        threadId: 'thread-xyz',
        usage: null
      })
    } as unknown as import('@application/use-cases/generate-codex-completion.use-case').GenerateCodexCompletionUseCase;
  };

  it('prints help message when requested', async () => {
    const logs: string[] = [];
    const useCase = createUseCase();

    const exitCode = await runCli({
      args: ['--help'],
      useCase,
      stdout: (message) => logs.push(message),
      stderr: () => void 0
    });

    expect(exitCode).toBe(0);
    expect(logs[0]).toBe(buildHelpMessage());
    expect(useCase.execute).not.toHaveBeenCalled();
  });

  it('returns error when prompt is missing', async () => {
    const errors: string[] = [];
    const exitCode = await runCli({
      args: [],
      useCase: createUseCase(),
      stdout: () => void 0,
      stderr: (message) => errors.push(message)
    });

    expect(exitCode).toBe(1);
    expect(errors[0]).toMatch(/prompt is required/);
  });

  it('executes use case and prints completion', async () => {
    const stdout: string[] = [];
    const useCase = createUseCase();

    const exitCode = await runCli({
      args: ['--prompt=do something'],
      useCase,
      stdout: (message) => stdout.push(message),
      stderr: () => void 0
    });

    expect(exitCode).toBe(0);
    expect(stdout.join('\n')).toContain('result');
    expect(stdout.join('\n')).toContain('thread-xyz');
    expect(useCase.execute).toHaveBeenCalledWith({
      prompt: 'do something',
      threadId: undefined
    });
  });

  it('handles errors from use case', async () => {
    const stderr: string[] = [];
    const useCase = {
      execute: vi.fn().mockRejectedValue(new Error('boom'))
    } as unknown as import('@application/use-cases/generate-codex-completion.use-case').GenerateCodexCompletionUseCase;

    const exitCode = await runCli({
      args: ['prompt'],
      useCase,
      stdout: () => void 0,
      stderr: (message) => stderr.push(message)
    });

    expect(exitCode).toBe(1);
    expect(stderr[0]).toMatch(/boom/);
  });
});
