/**
 * Port interface for workspace file operations.
 * Represents the contract for managing files within the agent's workspace.
 */
export interface AgentWorkspace {
  writeFile(path: string, content: string): Promise<void>;
  readFile(path: string): Promise<string>;
  listProjectFiles(): Promise<string[]>;
  rootDir: string;
}
