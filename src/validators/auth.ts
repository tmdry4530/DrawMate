import { z } from "zod";

export const signUpSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(72),
  displayName: z.string().min(2).max(40).optional(),
  role: z.enum(["assistant", "recruiter"]).optional(),
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
