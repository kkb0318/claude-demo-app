import { describe, expect, it } from 'vitest';

import { ShellCommandRunner } from './command-runner';

describe('ShellCommandRunner', () => {
  it('returns a copy of the allow list', () => {
    const runner = new ShellCommandRunner(process.cwd(), ['pnpm test']);
    const commands = runner.allowedCommands();
    expect(commands).toEqual(['pnpm test']);
    commands.push('pnpm lint');
    expect(runner.allowedCommands()).toEqual(['pnpm test']);
  });

  it('captures successful command output', async () => {
    const runner = new ShellCommandRunner(process.cwd(), ['node -e "process.exit(0)"']);
    const result = await runner.run('node -e "process.exit(0)"');
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');
  });

  it('captures non-zero exit codes', async () => {
    const runner = new ShellCommandRunner(process.cwd(), ['node -e "process.exit(2)"']);
    const result = await runner.run('node -e "process.exit(2)"');
    expect(result.exitCode).toBe(2);
  });
});
