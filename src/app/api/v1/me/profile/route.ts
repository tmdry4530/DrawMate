import { createClient } from "@/lib/supabase/server-client";
import * as response from "@/lib/utils/api-response";
import { toCamelCaseKeys, toSnakeCaseKeys } from "@/server/mappers/case-converter";
import { profileUpdateSchema } from "@/validators/profile";

export async function PATCH(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return response.unauthorized();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return response.validationError("요청 본문이 올바른 JSON 형식이 아닙니다.");
  }

  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path.join(".");
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }
    return response.validationError("입력값이 올바르지 않습니다.", fieldErrors);
  }

  const snakeData = toSnakeCaseKeys<Record<string, unknown>>(parsed.data);

  const { data: updated, error: updateError } = await supabase
    .from("profiles")
    .update(snakeData)
    .eq("id", user.id)
    .select()
    .single();

  if (updateError || !updated) {
    return response.error("INTERNAL_ERROR", "프로필 업데이트에 실패했습니다.", 500);
  }

  return response.success(toCamelCaseKeys(updated));
}

export async function DELETE() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return response.unauthorized();
  }

  const { error: deleteError } = await supabase
    .from("profiles")
    .delete()
    .eq("id", user.id);

  if (deleteError) {
    return response.error("INTERNAL_ERROR", "프로필 삭제에 실패했습니다.", 500);
  }

  return response.success({ deleted: true });
}
