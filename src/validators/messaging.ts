import { z } from "zod";

// POST /api/v1/conversations/direct
export const createDirectConversationSchema = z.object({
  targetUserId: z.string().uuid("유효하지 않은 사용자 ID입니다."),
  initialMessage: z
    .object({
      body: z.string().min(1).max(2000).optional(),
      attachmentIds: z.array(z.string().uuid()).max(5).optional(),
    })
    .optional(),
  sourcePortfolioId: z.string().uuid().nullable().optional(),
});

// POST /api/v1/conversations/{conversationId}/messages
export const sendMessageSchema = z
  .object({
    body: z.string().min(1).max(2000).optional(),
    attachmentIds: z.array(z.string().uuid()).max(5).optional(),
  })
  .refine(
    (data) =>
      (data.body && data.body.trim().length > 0) ||
      (data.attachmentIds && data.attachmentIds.length > 0),
    { message: "body 또는 attachmentIds 중 하나는 필수입니다." }
  );

// GET /api/v1/conversations
export const conversationListSchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// GET /api/v1/conversations/{conversationId}/messages
export const messageListSchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(30),
});

// GET /api/v1/notifications
export const notificationListSchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  unreadOnly: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

export type CreateDirectConversationInput = z.infer<typeof createDirectConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
