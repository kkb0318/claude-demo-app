import { createApp } from './app';
import { createCodexClient } from '@infrastructure/config/codex.config';
import { CodexThreadService } from '@infrastructure/adapters/codex-thread-service';
import { ShellCommandRunner } from '@infrastructure/system/command-runner';

/**
 * Start the Express server
 * Entry point for the API server
 */
async function startServer() {
  try {
    // Load configuration
    const client = createCodexClient();

    // Initialize dependencies (Dependency Injection)
    const threadRunner = new CodexThreadService(client);
    const ALLOWED_COMMANDS = [
      'npm install',
      'npm run dev',
      'npm run build',
      'npm run start',
      'npm run lint',
      'npm test'
    ];
    const commandRunner = new ShellCommandRunner(process.cwd(), ALLOWED_COMMANDS);

    // Create Express app
    const app = createApp(threadRunner, commandRunner);

    // Start server
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`🚀 Coding Agent API Server running on http://localhost:${PORT}`);
      console.log(`📝 API Documentation:`);
      console.log(`   - Health Check: GET http://localhost:${PORT}/api/health`);
      console.log(`   - Generate App: POST http://localhost:${PORT}/api/generate`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
void startServer();
