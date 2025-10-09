import { z } from 'zod';

/**
 * Request DTO for app generation
 */
export const GenerateAppRequestSchema = z.object({
  prompt: z
    .string()
    .min(1, 'Prompt is required')
    .max(4000, 'Prompt must be less than 4000 characters'),
  maxIterations: z.number().int().positive().max(20).optional().default(8)
});

export type GenerateAppRequest = z.infer<typeof GenerateAppRequestSchema>;

/**
 * Response DTO for app generation
 */
export interface GenerateAppResponse {
  success: boolean;
  message: string;
  workspaceId?: string;
  summary?: string;
  iterations?: number;
  error?: string;
}

/**
 * Error response DTO
 */
export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  details?: unknown;
}
