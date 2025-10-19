import { z } from 'zod';

/**
 * Request schema for destroying infrastructure
 */
export const DestroyInfrastructureRequestSchema = z.object({
  bucketName: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'bucketName must contain only lowercase letters, numbers, and hyphens'),
  awsRegion: z
    .string()
    .regex(/^[a-z]{2}-[a-z]+-\d{1}$/, 'awsRegion must be a valid AWS region format (e.g., ap-northeast-1)'),
  workspaceDir: z.string().min(1, 'workspaceDir is required'),
  awsProfile: z.string().default('agent-galaxy').optional()
});

export type DestroyInfrastructureRequest = z.infer<typeof DestroyInfrastructureRequestSchema>;

/**
 * Response schema for destroying infrastructure
 */
export const DestroyInfrastructureResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  bucketName: z.string().optional(),
  region: z.string().optional()
});

export type DestroyInfrastructureResponse = z.infer<typeof DestroyInfrastructureResponseSchema>;

/**
 * Legacy DTO for destroying infrastructure (for backward compatibility)
 * @deprecated Use DestroyInfrastructureRequest type instead
 */
export class DestroyInfrastructureDto {
  bucketName!: string;
  awsRegion!: string;
  workspaceDir!: string;
  awsProfile: string = 'agent-galaxy';

  validate(): string[] {
    const result = DestroyInfrastructureRequestSchema.safeParse(this);
    if (result.success) {
      return [];
    }
    return result.error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
  }
}
