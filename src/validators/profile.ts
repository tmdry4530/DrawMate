import { z } from "zod";

export const profileUpdateSchema = z.object({
  role: z.enum(["assistant", "recruiter"]).optional(),
  displayName: z
    .string()
    .min(2, "이름은 최소 2자 이상이어야 합니다.")
    .max(40, "이름은 최대 40자까지 입력 가능합니다.")
    .optional(),
  headline: z
    .string()
    .max(80, "한 줄 소개는 최대 80자까지 입력 가능합니다.")
    .optional(),
  bio: z
    .string()
    .max(500, "자기소개는 최대 500자까지 입력 가능합니다.")
    .optional(),
  snsLinks: z
    .array(z.string().url("올바른 URL 형식이 아닙니다."))
    .max(5, "SNS 링크는 최대 5개까지 등록 가능합니다.")
    .optional(),
  availabilityStatus: z
    .enum(["open", "busy", "unavailable"])
    .optional(),
  availableHours: z
    .object({})
    .passthrough()
    .optional(),
  isProfilePublic: z.boolean().optional(),
  notifyNewMessage: z.boolean().optional(),
  notifyBookmark: z.boolean().optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
