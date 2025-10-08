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
    return mcpAgent;
  } catch (error) {
    logger.error('Failed to initialize MCP Google Sheets AI Agent:', error);
    return null;
  }
}

// チャット処理エンドポイント
router.post('/chat', async (req, res) => {
  try {
    const currentAgent = mcpAgent || await initializeMCPAgent();
    if (!currentAgent) {
      return res.status(503).json({
        success: false,
        error: 'Google Sheets AI Agent not available. Check environment variables.'
      });
    }

    const { message } = req.body;
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const response = await currentAgent.handleChatMessage(message);
    
    res.json({
      success: true,
      response: response
    });

  } catch (error) {
    logger.error('Error in /chat endpoint:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// 承認エンドポイント
router.post('/approve', async (req, res) => {
  try {
    const currentAgent = mcpAgent || await initializeMCPAgent();
    if (!currentAgent) {
      return res.status(503).json({
        success: false,
        error: 'Google Sheets AI Agent not available'
      });
    }

    const response = await currentAgent.handleApproval(true);
    
    res.json({
      success: true,
      response: response
    });

  } catch (error) {
    logger.error('Error in /approve endpoint:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// 拒否エンドポイント
router.post('/reject', async (req, res) => {
  try {
    const currentAgent = mcpAgent || await initializeMCPAgent();
    if (!currentAgent) {
      return res.status(503).json({
        success: false,
        error: 'Google Sheets AI Agent not available'
      });
    }

    const response = await currentAgent.handleApproval(false);
    
    res.json({
      success: true,
      response: response
    });

  } catch (error) {
    logger.error('Error in /reject endpoint:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// MCP接続診断エンドポイント
router.get('/diagnostic', async (req, res) => {
  try {
    const currentAgent = mcpAgent || await initializeMCPAgent();
    if (!currentAgent) {
      return res.status(503).json({
        success: false,
        error: 'Google Sheets AI Agent not available'
      });
    }

    const diagnosticResult = await currentAgent.diagnosticMCPConnection();
    
    res.json({
      success: true,
      diagnostic: diagnosticResult
    });

  } catch (error) {
    logger.error('Error in /diagnostic endpoint:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// ステータス確認エンドポイント
router.get('/status', async (req, res) => {
  try {
    const currentAgent = mcpAgent || await initializeMCPAgent();
    
    res.json({
      success: true,
      status: currentAgent ? 'ready' : 'not available',
      agent: !!currentAgent
    });

  } catch (error) {
    logger.error('Error in /status endpoint:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export default router;