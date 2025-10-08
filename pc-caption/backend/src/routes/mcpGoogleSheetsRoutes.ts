import { Router } from 'express';
import { MCPGoogleSheetsAgent } from '../mcpGoogleSheetsAgent.js';
import logger from '../utils/logger.js';

const router = Router();

// MCP Google Sheets AI Agent インスタンス（シングルトン）
let mcpAgent: MCPGoogleSheetsAgent | null = null;

// Agent初期化
async function initializeMCPAgent(): Promise<MCPGoogleSheetsAgent | null> {
  if (mcpAgent) return mcpAgent;

  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    logger.warn('MCP Google Sheets AI Agent: Missing OPENAI_API_KEY environment variable');
    return null;
  }

  try {
    mcpAgent = new MCPGoogleSheetsAgent();
    logger.info('MCP Google Sheets AI Agent initialized successfully');
    return mcpAgent;
  } catch (error) {
    logger.error('Failed to initialize MCP Google Sheets AI Agent:', error);
    return null;
  }
}

// ヘルスチェック
router.get('/health', async (req, res) => {
  const isAvailable = !!mcpAgent || !!(await initializeMCPAgent());
  const openaiApiKey = !!process.env.OPENAI_API_KEY;
  const googleApplicationCredentials = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;

  res.json({
    success: true,
    data: {
      available: isAvailable,
      config: {
        openaiApiKey,
        googleApplicationCredentials,
        mcpEnabled: true
      }
    }
  });
});

// チャット機能（MCP対応）
router.post('/chat', async (req, res) => {
  try {
    const currentAgent = mcpAgent || await initializeMCPAgent();
    if (!currentAgent) {
      return res.status(503).json({
        success: false,
        error: 'MCP Google Sheets AI Agent not available'
      });
    }

    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    logger.info(`Processing MCP chat message: ${message}`);
    const response = await currentAgent.handleChatMessage(message);

    res.json({
      success: true,
      data: {
        response,
        mcpEnabled: true,
        sessionId: currentAgent.getSessionId()
      }
    });

  } catch (error) {
    logger.error('Error in MCP chat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process chat message with MCP'
    });
  }
});

// HITL承認/拒否エンドポイント
router.post('/approve', async (req, res) => {
  try {
    const currentAgent = mcpAgent || await initializeMCPAgent();
    if (!currentAgent) {
      return res.status(503).json({
        success: false,
        error: 'MCP Google Sheets AI Agent not available'
      });
    }

    const { approve } = req.body;

    if (typeof approve !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'approve field is required and must be boolean'
      });
    }

    logger.info(`Processing HITL approval: ${approve}`);
    const response = await currentAgent.handleApproval(approve);

    res.json({
      success: true,
      data: {
        response,
        approved: approve
      }
    });

  } catch (error) {
    logger.error('Error in HITL approval:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process approval'
    });
  }
});

// チャット履歴取得エンドポイント
router.get('/history', async (req, res) => {
  try {
    const currentAgent = mcpAgent || await initializeMCPAgent();
    if (!currentAgent) {
      return res.status(503).json({
        success: false,
        error: 'MCP Google Sheets AI Agent not available'
      });
    }

    console.log('Current agent type:', typeof currentAgent);
    console.log('Current agent methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(currentAgent)));
    console.log('Has getChatHistory method:', typeof currentAgent.getChatHistory);

    const history = currentAgent.getChatHistory();

    res.json({
      success: true,
      data: {
        history,
        sessionId: currentAgent.getSessionId()
      }
    });

  } catch (error) {
    logger.error('Error getting chat history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get chat history'
    });
  }
});

export default router;