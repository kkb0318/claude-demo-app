import { promises as fs } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { mkdir, mkdtemp, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

import type { AgentWorkspace } from '@domain/ports/agent-workspace.port';

// Directories to exclude from file listings (not from workspace copy)
const IGNORED_DIRECTORIES = new Set([
  'node_modules',  // Will be copied but not listed to agent
  '.git',
  '.next',
  'dist',
  'coverage'
]);

const INCLUDED_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.json',
  '.md',
  '.yaml',
  '.yml'
]);

export class FileSystemWorkspace implements AgentWorkspace {
  constructor(public readonly rootDir: string) { }

  async writeFile(path: string, content: string): Promise<void> {
    const absolutePath = this.resolveSafePath(path);
    await fs.mkdir(dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, content, 'utf8');
  }

  async readFile(path: string): Promise<string> {
    const absolutePath = this.resolveSafePath(path);
    return fs.readFile(absolutePath, 'utf8');
  }

  async listProjectFiles(): Promise<string[]> {
    const entries: string[] = [];
    await this.walkDirectory(this.rootDir, entries);
    return entries;
  }

  private async walkDirectory(current: string, acc: string[]): Promise<void> {
    const items = await fs.readdir(current, { withFileTypes: true });

    for (const item of items) {
      if (IGNORED_DIRECTORIES.has(item.name)) {
        continue;
      }

      const itemPath = join(current, item.name);
      if (item.isDirectory()) {
        await this.walkDirectory(itemPath, acc);
      } else if (item.isFile()) {
        const ext = this.getExtension(item.name);
        if (ext && INCLUDED_EXTENSIONS.has(ext)) {
          acc.push(relative(this.rootDir, itemPath));
        }
      }
    }
  }

  private getExtension(name: string): string | null {
    const index = name.lastIndexOf('.');
    if (index === -1) {
      return null;
    }

    return name.slice(index);
  }

  private resolveSafePath(path: string): string {
    const absolute = resolve(this.rootDir, path);
    if (!absolute.startsWith(resolve(this.rootDir))) {
      throw new Error(`Path ${path} resolves outside of workspace.`);
    }

    return absolute;
  }
}

export async function prepareWorkspace(): Promise<FileSystemWorkspace> {
  const root = await mkdtemp(join(tmpdir(), 'coding-agent-demo-'));
  await mkdir(root, { recursive: true });
  
  // Copy template project as base (excluding node_modules)
  // Navigate from sample/src/infrastructure/system/workspace.ts to codex-agent/template-project/my-app
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const templatePath = resolve(__dirname, '../../../../template-project/my-app');
  
  await cp(templatePath, root, { 
    recursive: true,
    filter: (src) => {
      // Exclude node_modules, .next, and other build artifacts
      const relativePath = relative(templatePath, src);
      
      // Allow the root directory itself
      if (relativePath === '') {
        return true;
      }
      
      // Exclude node_modules directory
      if (relativePath === 'node_modules' || relativePath.startsWith('node_modules/')) {
        return false;
      }
      
      // Exclude build artifacts
      if (relativePath.includes('.next') || relativePath.includes('dist') || relativePath.includes('coverage')) {
        return false;
      }
      
      // Exclude hidden files except .gitignore, .env.example, etc.
      if (relativePath.startsWith('.') && !relativePath.match(/^\.(gitignore|env\.example|eslintrc|prettierrc)/)) {
        return false;
      }
      
      return true;
    }
  });

  return new FileSystemWorkspace(root);
}

