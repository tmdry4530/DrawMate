import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server-client";
import * as res from "@/lib/utils/api-response";
import { signUpSchema } from "@/validators/auth";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return res.error("VALIDATION_ERROR", "Invalid JSON body", 400);
  }

  const parsed = signUpSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    }
    return res.validationError("Validation failed", fieldErrors);
  }

  const { email, password, displayName, role } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        role,
      },
    },
  });

  if (error) {
    if (error.code === "user_already_exists" || error.status === 422) {
      return res.error("CONFLICT", "이미 사용 중인 이메일입니다.", 409);
    }
    return res.error("INTERNAL_ERROR", error.message, 500);
  }

  const user = data.user;
  return res.success(
    {
      userId: user?.id,
      email: user?.email,
      emailVerificationRequired: !user?.confirmed_at,
    },
    undefined,
    201
  );
}
