import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server-client";
import * as res from "@/lib/utils/api-response";
import { signInSchema } from "@/validators/auth";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return res.error("VALIDATION_ERROR", "Invalid JSON body", 400);
  }

  const parsed = signInSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    }
    return res.validationError("Validation failed", fieldErrors);
  }

  const { email, password } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return res.error("AUTH_INVALID", "이메일 또는 비밀번호가 올바르지 않습니다.", 401);
  }

  const { user, session } = data;

  // Check onboarding: fetch profile role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return res.success({
    userId: user.id,
    email: user.email,
    accessToken: session.access_token,
    expiresAt: session.expires_at,
    onboardingRequired: !profile?.role,
  });
}
