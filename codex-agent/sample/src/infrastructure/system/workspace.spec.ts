import { describe, expect, it, afterEach, beforeEach } from 'vitest';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { FileSystemWorkspace } from './workspace';

let rootDir: string;
let workspace: FileSystemWorkspace;

describe('FileSystemWorkspace', () => {
  beforeEach(async () => {
    rootDir = await mkdtemp(join(tmpdir(), 'workspace-test-'));
    workspace = new FileSystemWorkspace(rootDir);
  });

  afterEach(async () => {
    await rm(rootDir, { recursive: true, force: true });
  });

  it('writes and reads files relative to root', async () => {
    await workspace.writeFile('src/example.ts', 'export const value = 1;');
    const content = await workspace.readFile('src/example.ts');
    expect(content).toBe('export const value = 1;');
  });

  it('lists project files excluding ignored directories', async () => {
    await mkdir(join(rootDir, 'src'), { recursive: true });
    await writeFile(join(rootDir, 'src', 'index.ts'), '// noop');
    await mkdir(join(rootDir, 'node_modules'), { recursive: true });
    await writeFile(join(rootDir, 'node_modules', 'ignored.js'), 'console.log("ignore")');

    const files = await workspace.listProjectFiles();

    expect(files).toContain('src/index.ts');
    expect(files).not.toContain('node_modules/ignored.js');
  });

  it('rejects paths that traverse outside the workspace', async () => {
    await expect(workspace.writeFile('../outside.txt', 'bad')).rejects.toThrow(/outside of workspace/);
  });
});
