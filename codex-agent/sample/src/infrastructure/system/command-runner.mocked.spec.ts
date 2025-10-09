import { describe, expect, it, vi } from 'vitest';

describe('ShellCommandRunner (mocked exec)', () => {
  it('defaults to exit code 1 when exec error lacks code', async () => {
    vi.resetModules();
    const execMock = vi.fn((_command: string, _options: unknown, callback: unknown) => {
      const cb = callback as ((error: unknown, stdout: string, stderr: string) => void) | undefined;
      cb?.(Object.assign(new Error('fail'), { stdout: undefined, stderr: undefined }), '', '');
      return {} as unknown;
    });

    vi.doMock('node:child_process', () => ({ exec: execMock }));

    const { ShellCommandRunner } = await import('./command-runner');
    const runner = new ShellCommandRunner(process.cwd(), ['fake']);
    const result = await runner.run('fake');

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('fail');

    vi.doUnmock('node:child_process');
    vi.resetModules();
  });
});
