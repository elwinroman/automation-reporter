import { z } from 'zod';
import { paginationSchema, dateRangeSchema, sortDirectionSchema } from './common.js';

export const generateInputSchema = z.object({
  version: z.string().min(1, 'Version is required'),
});

export const globalSummaryInputSchema = z.object({
  version: z.string().min(1),
  dateRange: dateRangeSchema,
});

export const categoriesInputSchema = z.object({
  version: z.string().min(1),
  category: z.string().optional(),
  sortBy: z.object({
    field: z.enum(['category', 'executionCount', 'passRate', 'totalTime']).default('category'),
    direction: sortDirectionSchema,
  }).default({ field: 'category', direction: 'asc' }),
});

export const productsInputSchema = z.object({
  version: z.string().min(1),
  category: z.string().optional(),
  minPassRate: z.number().min(0).max(100).optional(),
  maxPassRate: z.number().min(0).max(100).optional(),
  dateRange: dateRangeSchema,
  search: z.string().optional(),
  pagination: paginationSchema.default({ limit: 50, offset: 0 }),
  sortBy: z.object({
    field: z.enum(['product', 'category', 'executionCount', 'passRate']).default('product'),
    direction: sortDirectionSchema,
  }).default({ field: 'product', direction: 'asc' }),
});

export const testCasesInputSchema = z.object({
  version: z.string().min(1),
  statusType: z.enum(['flaky', 'always-passing', 'always-failing', 'all']).default('all'),
  product: z.string().optional(),
  minPassRate: z.number().min(0).max(100).optional(),
  maxPassRate: z.number().min(0).max(100).optional(),
  search: z.string().optional(),
  pagination: paginationSchema.default({ limit: 50, offset: 0 }),
  sortBy: z.object({
    field: z.enum([
      'testCaseName', 'executionCount', 'passCount', 'failCount',
      'passRate', 'avgTime', 'totalTime', 'minTime', 'maxTime',
    ]).default('executionCount'),
    direction: sortDirectionSchema,
  }).default({ field: 'executionCount', direction: 'desc' }),
});


export const productDetailInputSchema = z.object({
  version: z.string().min(1),
  product: z.string().min(1, 'Product name is required'),
});

export const flakyTestsInputSchema = z.object({
  version: z.string().min(1),
  maxPassRate: z.number().min(0).max(100).default(100),
  minPassRate: z.number().min(0).max(100).default(0),
  minExecutions: z.number().int().min(1).default(2),
  pagination: paginationSchema.default({ limit: 50, offset: 0 }),
  sortBy: z.object({
    field: z.enum(['testCaseName', 'passRate', 'executionCount', 'failCount']).default('passRate'),
    direction: sortDirectionSchema,
  }).default({ field: 'passRate', direction: 'asc' }),
});

export const slowestTestsInputSchema = z.object({
  version: z.string().min(1),
  topN: z.number().int().min(1).max(100).default(10),
  metric: z.enum(['avgTime', 'maxTime', 'totalTime']).default('avgTime'),
});

export const failureAnalysisInputSchema = z.object({
  version: z.string().min(1),
  minOccurrences: z.number().int().min(1).default(1),
  product: z.string().optional(),
  search: z.string().optional(),
  pagination: paginationSchema.default({ limit: 50, offset: 0 }),
});
