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
export const GenerateAppResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  workspaceId: z.string().optional(),
  summary: z.string().optional(),
  iterations: z.number().optional(),
  cloudfrontUrl: z.string().optional(),
  cloudfrontDistributionId: z.string().optional(),
  s3BucketName: z.string().optional(),
  error: z.string().optional()
});

export type GenerateAppResponse = z.infer<typeof GenerateAppResponseSchema>;

/**
 * Error response DTO
 */
export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number(),
  details: z.unknown().optional()
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
