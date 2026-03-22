import { z } from "zod";

export const createPortfolioSchema = z.object({
  title: z.string().min(2, "제목은 최소 2자 이상이어야 합니다.").max(80, "제목은 최대 80자까지 입력 가능합니다.").optional(),
  summary: z.string().min(10, "요약은 최소 10자 이상이어야 합니다.").max(300, "요약은 최대 300자까지 입력 가능합니다.").optional(),
  description: z.string().max(5000, "설명은 최대 5000자까지 입력 가능합니다.").optional(),
  templateId: z.string().uuid("유효하지 않은 템플릿 ID입니다.").optional(),
  startingPriceKrw: z.number().int().min(0, "시작 가격은 0 이상이어야 합니다.").optional(),
  durationDays: z.number().int().min(1, "기간은 최소 1일이어야 합니다.").max(365, "기간은 최대 365일까지 설정 가능합니다.").optional(),
  visibility: z.enum(["public", "unlisted"]).optional(),
  templateCustomization: z
    .object({
      themePreset: z.string().optional(),
      coverMode: z.string().optional(),
      sectionVisibility: z.record(z.string(), z.boolean()).optional(),
    })
    .optional(),
});

export const updatePortfolioSchema = z.object({
  title: z.string().min(2).max(80).optional(),
  summary: z.string().min(10).max(300).optional(),
  description: z.string().max(5000).optional(),
  templateId: z.string().uuid().optional(),
  startingPriceKrw: z.number().int().min(0).optional(),
  durationDays: z.number().int().min(1).max(365).optional(),
  visibility: z.enum(["public", "unlisted"]).optional(),
  templateCustomization: z
    .object({
      themePreset: z.string().optional(),
      coverMode: z.string().optional(),
      sectionVisibility: z.record(z.string(), z.boolean()).optional(),
    })
    .optional(),
  tagIds: z
    .array(z.string().uuid("유효하지 않은 태그 ID입니다."))
    .max(23, "태그는 최대 23개까지 선택 가능합니다.")
    .optional(),
});

export type CreatePortfolioInput = z.infer<typeof createPortfolioSchema>;
export type UpdatePortfolioInput = z.infer<typeof updatePortfolioSchema>;
