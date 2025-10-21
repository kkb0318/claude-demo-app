/**
 * OpenAPI 3.0 Schema Generator using @anatine/zod-openapi
 * Automatically generates OpenAPI specification from route metadata
 */

import { generateSchema } from '@anatine/zod-openapi';
import { z } from 'zod';
import type {
  OpenAPIObject,
  SchemaObject,
  PathItemObject,
  OperationObject
} from 'openapi3-ts/oas30';
import { openAPIRoutes } from './types';

/**
 * Helper function to convert Zod schema to OpenAPI SchemaObject
 * Converts type arrays (OpenAPI 3.1) to strings (OpenAPI 3.0)
 */
function toOpenAPISchema(zodSchema: z.ZodType): SchemaObject {
  const schema = generateSchema(zodSchema) as SchemaObject;
  return normalizeTypeFields(schema);
}

/**
 * Recursively normalize type fields from arrays to strings for OpenAPI 3.0 compatibility
 */
function normalizeTypeFields(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(normalizeTypeFields);
  }

  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === 'type' && Array.isArray(value) && value.length === 1) {
      // Convert single-element type array to string
      result[key] = value[0];
    } else if (typeof value === 'object') {
      result[key] = normalizeTypeFields(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Generate complete OpenAPI specification from registered routes
 */
export function generateOpenAPISchema(): OpenAPIObject {
  const paths: Record<string, PathItemObject> = {};

  // Generate paths from registered routes
  for (const route of openAPIRoutes) {
    if (!paths[route.path]) {
      paths[route.path] = {};
    }

    const operation: OperationObject = {
      summary: route.summary,
      tags: route.tags || [],
      responses: {}
    };

    if (route.description) {
      operation.description = route.description;
    }

    // Add request body if requestSchema is provided
    if (route.requestSchema) {
      operation.requestBody = {
        required: true,
        content: {
          'application/json': {
            schema: toOpenAPISchema(route.requestSchema)
          }
        }
      };
    }

    // Success response
    if (route.responseSchema) {
      operation.responses['200'] = {
        description: 'Successful response',
        content: {
          'application/json': {
            schema: toOpenAPISchema(route.responseSchema)
          }
        }
      };
    }

    // Error responses
    if (route.errorSchemas) {
      for (const [statusCode, errorSchema] of Object.entries(route.errorSchemas)) {
        const description =
          statusCode === '400'
            ? 'Invalid request (validation error)'
            : statusCode === '500'
              ? 'Internal server error'
              : 'Error response';

        operation.responses[statusCode] = {
          description,
          content: {
            'application/json': {
              schema: toOpenAPISchema(errorSchema)
            }
          }
        };
      }
    }

    paths[route.path][route.method] = operation;
  }

  const document: OpenAPIObject = {
    openapi: '3.0.0',
    info: {
      title: 'Coding Agent API',
      version: '1.0.0',
      description:
        'AI-powered code generation API using OpenAI Codex SDK. Generate applications from natural language prompts and manage AWS infrastructure.'
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      },
      {
        url: 'http://localhost:{port}',
        description: 'Custom port server',
        variables: {
          port: {
            default: '3001',
            description: 'API server port'
          }
        }
      }
    ],
    paths
  };

  return document;
}
