import { z } from 'zod';

export const ToolSchema = z.object({
  id: z.string().or(z.number()),
  title: z.string().min(2),
  url: z.string().url(),
  description: z.string().min(10),
  category: z.string(),
  source: z.enum(['awesome_osint', 'free_for_dev', 'community']),
  pricing: z.enum(['Open Source', 'Gratuit', 'Freemium', 'Payant']).optional().default('Gratuit'),
  isCli: z.boolean().optional().default(false),
  needsApiKey: z.boolean().optional().default(false),
  tags: z.array(z.string()).optional().default([]),
});

export type Tool = z.infer<typeof ToolSchema>;
