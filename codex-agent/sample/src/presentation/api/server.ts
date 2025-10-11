import { createApp } from './app';

/**
 * Start the Express server
 * Entry point for the API server
 */
async function startServer() {
  try {
    // Create Express app (no dependencies needed)
    const app = createApp();

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
