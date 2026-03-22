import { createClient } from "@/lib/supabase/server-client";
import * as response from "@/lib/utils/api-response";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ portfolioId: string }> }
) {
  const { portfolioId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return response.unauthorized();
  }

  // 이미 북마크 되어있는지 확인 (멱등)
  const { data: existing } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", user.id)
    .eq("portfolio_id", portfolioId)
    .maybeSingle();

  if (existing) {
    return response.success({ bookmarked: true }, undefined, 200);
  }

  // 북마크 추가
  const { error: insertError } = await supabase
    .from("bookmarks")
    .insert({ user_id: user.id, portfolio_id: portfolioId });

  if (insertError) {
    return response.error("INTERNAL_ERROR", `북마크 추가 실패: ${insertError.message}`, 500);
  }

  return response.success({ bookmarked: true }, undefined, 201);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ portfolioId: string }> }
) {
  const { portfolioId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return response.unauthorized();
  }

  const { error: deleteError } = await supabase
    .from("bookmarks")
    .delete()
    .eq("user_id", user.id)
    .eq("portfolio_id", portfolioId);

  if (deleteError) {
    return response.error("INTERNAL_ERROR", `북마크 해제 실패: ${deleteError.message}`, 500);
  }

  return response.success({ bookmarked: false });
}
