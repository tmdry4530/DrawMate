import { z } from "zod";

export const uuidSchema = z.string().uuid();
export const cursorSchema = z.string().min(1).optional();
export const paginationSchema = z.object({
  cursor: cursorSchema,
  limit: z.coerce.number().int().min(1).max(48).default(24),
});
