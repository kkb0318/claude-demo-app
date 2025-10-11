import { dirname, join, relative, resolve } from 'node:path';
import { mkdir, mkdtemp, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

/**
 * Represents a workspace directory for the Codex agent.
 * Simplified to only track the root directory path.
 * Codex SDK handles all file operations directly.
 */
export class FileSystemWorkspace {
  constructor(public readonly rootDir: string) { }
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

