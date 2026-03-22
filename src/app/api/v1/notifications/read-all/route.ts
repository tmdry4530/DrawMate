import { createClient } from "@/lib/supabase/server-client";
import * as response from "@/lib/utils/api-response";

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return response.unauthorized();
  }

  const readAt = new Date().toISOString();

  const { data, error: updateError } = await supabase
    .from("notifications")
    .update({ read_at: readAt })
    .eq("user_id", user.id)
    .is("read_at", null)
    .select("id");

  if (updateError) {
    return response.error("INTERNAL_ERROR", "전체 읽음 처리에 실패했습니다.", 500);
  }

  return response.success({ updatedCount: data?.length ?? 0 });
}
