import { Router, type Request, type Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { generateOpenAPISchema } from '../openapi/schema';

/**
 * Convert OpenAPI object to YAML format
 */
function convertToYAML(obj: unknown, indent = 0): string {
  const spaces = '  '.repeat(indent);
  let yaml = '';

  if (obj === null) {
    return 'null';
  }

  if (typeof obj !== 'object') {
    if (typeof obj === 'string') {
      // Escape special characters and wrap in quotes if necessary
      if (obj.includes('\n') || obj.includes(':') || obj.includes('#')) {
        return `"${obj.replace(/"/g, '\\"')}"`;
      }
      return obj;
    }
    return String(obj);
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      return '[]';
    }
    obj.forEach((item) => {
      yaml += `\n${spaces}- ${convertToYAML(item, indent + 1)}`;
    });
    return yaml;
  }

  // Object
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (value === undefined) continue;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      yaml += `\n${spaces}${key}:`;
      yaml += convertToYAML(value, indent + 1);
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        yaml += `\n${spaces}${key}: []`;
      } else {
        yaml += `\n${spaces}${key}:`;
        yaml += convertToYAML(value, indent + 1);
      }
    } else {
      yaml += `\n${spaces}${key}: ${convertToYAML(value, indent)}`;
    }
  }

  return yaml;
}

/**
 * Routes for OpenAPI specification endpoints
 */
export function createOpenAPIRoutes(): Router {
  const router = Router();

  /**
   * GET /api/openapi.json
   * Get OpenAPI specification in JSON format
   */
  router.get('/openapi.json', (_req: Request, res: Response) => {
    try {
      const schema = generateOpenAPISchema();
      res.json(schema);
    } catch (error) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to generate OpenAPI schema',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/docs
   * Swagger UI Documentation Interface
   */
  router.use('/docs', swaggerUi.serve);
  router.get('/docs', swaggerUi.setup(undefined, {
    swaggerOptions: {
      url: '/api/openapi.json'
    }
  }));

  /**
   * GET /api/openapi.yaml
   * Get OpenAPI specification in YAML format
   */
  router.get('/openapi.yaml', (_req: Request, res: Response) => {
    try {
      const schema = generateOpenAPISchema();
      const yaml = convertToYAML(schema).trim();
      res.setHeader('Content-Type', 'text/yaml');
      res.send(yaml);
    } catch (error) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to generate OpenAPI schema',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
}
