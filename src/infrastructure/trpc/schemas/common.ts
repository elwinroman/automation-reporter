import { z } from 'zod';

/** Schema de paginacion reutilizable. Limit max 500, default 50. */
export const paginationSchema = z.object({
  limit: z.number().int().min(1).max(500).default(50),
  offset: z.number().int().min(0).default(0),
});

export const sortDirectionSchema = z.enum(['asc', 'desc']).default('asc');

/** Filtro de rango de fechas ISO 8601. Ambos extremos son opcionales. */
export const dateRangeSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
}).optional();

export type { PaginatedResult } from '../../../application/utils/ReportQueries.js';
