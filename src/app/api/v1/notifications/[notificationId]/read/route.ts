import { createClient } from "@/lib/supabase/server-client";
import * as response from "@/lib/utils/api-response";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  const { notificationId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return response.unauthorized();
  }

  const { data: notification, error: fetchError } = await supabase
    .from("notifications")
    .select("id, user_id, read_at")
    .eq("id", notificationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError || !notification) {
    return response.notFound("알림을 찾을 수 없습니다.");
  }

  if (notification.read_at) {
    // Already read — return current read_at
    return response.success({
      notificationId: notification.id,
      readAt: notification.read_at,
    });
  }

  const readAt = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("notifications")
    .update({ read_at: readAt })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (updateError) {
    return response.error("INTERNAL_ERROR", "알림 읽음 처리에 실패했습니다.", 500);
  }

  return response.success({ notificationId, readAt });
}
