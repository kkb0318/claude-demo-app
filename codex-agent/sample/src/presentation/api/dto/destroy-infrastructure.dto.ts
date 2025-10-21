import { z } from 'zod';

/**
 * Request schema for destroying infrastructure
 * awsRegion is fixed to 'ap-northeast-1'
 * awsProfile is fixed to 'agent-galaxy'
 */
export const DestroyInfrastructureRequestSchema = z.object({
  bucketName: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'bucketName must contain only lowercase letters, numbers, and hyphens'),
  workspaceDir: z.string().min(1, 'workspaceDir is required')
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
  workspaceDir!: string;

  validate(): string[] {
    const result = DestroyInfrastructureRequestSchema.safeParse(this);
    if (result.success) {
      return [];
    }
    return result.error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
  }
}
