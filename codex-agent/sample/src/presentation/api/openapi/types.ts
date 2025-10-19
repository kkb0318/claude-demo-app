/**
 * Types for OpenAPI route metadata
 */

import type { z } from 'zod';

/**
 * OpenAPI route metadata
 */
export interface OpenAPIRouteMetadata {
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  path: string;
  summary: string;
  description?: string;
  tags?: string[];
  requestSchema?: z.ZodType;
  responseSchema?: z.ZodType;
  errorSchemas?: Record<number, z.ZodType>;
}

/**
 * Collection of OpenAPI route metadata
 */
export const openAPIRoutes: OpenAPIRouteMetadata[] = [];

/**
 * Register a route with OpenAPI metadata
 */
export function registerOpenAPIRoute(metadata: OpenAPIRouteMetadata): void {
  openAPIRoutes.push(metadata);
}
