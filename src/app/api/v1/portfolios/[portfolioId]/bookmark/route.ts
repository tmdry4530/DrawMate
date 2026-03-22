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

  const { data: portfolio, error: fetchError } = await supabase
    .from("portfolios")
    .select("id, status, visibility")
    .eq("id", portfolioId)
    .is("deleted_at", null)
    .single();

  if (fetchError || !portfolio) {
    return response.notFound("포트폴리오를 찾을 수 없습니다.");
  }

  // Upsert bookmark (idempotent)
  const { error: upsertError } = await supabase
    .from("portfolio_bookmarks")
    .upsert(
      { portfolio_id: portfolioId, user_id: user.id },
      { onConflict: "portfolio_id,user_id", ignoreDuplicates: true }
    );

  if (upsertError) {
    return response.error("INTERNAL_ERROR", "북마크 추가에 실패했습니다.", 500);
  }

  // Increment bookmark_count
  await supabase.rpc("increment_bookmark_count", { p_portfolio_id: portfolioId });

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

  const { data: bookmark, error: fetchError } = await supabase
    .from("portfolio_bookmarks")
    .select("id")
    .eq("portfolio_id", portfolioId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !bookmark) {
    return response.notFound("북마크를 찾을 수 없습니다.");
  }

  const { error: deleteError } = await supabase
    .from("portfolio_bookmarks")
    .delete()
    .eq("portfolio_id", portfolioId)
    .eq("user_id", user.id);

  if (deleteError) {
    return response.error("INTERNAL_ERROR", "북마크 삭제에 실패했습니다.", 500);
  }

  // Decrement bookmark_count
  await supabase.rpc("decrement_bookmark_count", { p_portfolio_id: portfolioId });

  return response.success({ bookmarked: false });
}
