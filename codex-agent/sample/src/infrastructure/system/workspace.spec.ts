import { describe, expect, it, afterEach } from 'vitest';
import { rm, access } from 'node:fs/promises';
import { join } from 'node:path';

import { prepareWorkspace, FileSystemWorkspace } from './workspace';

describe('Workspace', () => {
  let workspace: FileSystemWorkspace | undefined;

  afterEach(async () => {
    if (workspace) {
      await rm(workspace.rootDir, { recursive: true, force: true });
    }
  });

  it('prepareWorkspace creates a temporary directory with template project', async () => {
    workspace = await prepareWorkspace();
    
    expect(workspace.rootDir).toBeTruthy();
    
    // Verify template files were copied
    await expect(access(join(workspace.rootDir, 'package.json'))).resolves.toBeUndefined();
    await expect(access(join(workspace.rootDir, 'src'))).resolves.toBeUndefined();
    
    // Verify node_modules was excluded
    await expect(access(join(workspace.rootDir, 'node_modules'))).rejects.toThrow();
  });

  it('FileSystemWorkspace stores root directory', () => {
    const ws = new FileSystemWorkspace('/test/path');
    expect(ws.rootDir).toBe('/test/path');
  });
});
