import { createClient } from "@/lib/supabase/server-client";
import * as response from "@/lib/utils/api-response";

async function syncBookmarkCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  portfolioId: string
) {
  const { count } = await supabase
    .from("bookmarks")
    .select("id", { count: "exact", head: true })
    .eq("portfolio_id", portfolioId);

  await supabase
    .from("portfolios")
    .update({ bookmark_count: count ?? 0 })
    .eq("id", portfolioId);
}

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

  const { error: rpcError } = await supabase.rpc("toggle_portfolio_bookmark", {
    p_portfolio_id: portfolioId,
    p_should_bookmark: true,
  });

  if (rpcError) {
    // Fallback for environments where RPC is not deployed yet
    if (rpcError.code === "42883") {
      const { error: insertError } = await supabase
        .from("bookmarks")
        .upsert(
          { user_id: user.id, portfolio_id: portfolioId },
          { onConflict: "user_id,portfolio_id", ignoreDuplicates: true }
        );

      if (insertError) {
        return response.error("INTERNAL_ERROR", "북마크 추가에 실패했습니다.", 500);
      }

      await syncBookmarkCount(supabase, portfolioId);
      return response.success({ bookmarked: true }, undefined, 201);
    }

    return response.error("INTERNAL_ERROR", "북마크 추가에 실패했습니다.", 500);
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

  const { error: rpcError } = await supabase.rpc("toggle_portfolio_bookmark", {
    p_portfolio_id: portfolioId,
    p_should_bookmark: false,
  });

  if (rpcError) {
    if (rpcError.code === "42883") {
      const { error: deleteError } = await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", user.id)
        .eq("portfolio_id", portfolioId);

      if (deleteError) {
        return response.error("INTERNAL_ERROR", "북마크 해제에 실패했습니다.", 500);
      }

      await syncBookmarkCount(supabase, portfolioId);
      return response.success({ bookmarked: false });
    }

    return response.error("INTERNAL_ERROR", "북마크 해제에 실패했습니다.", 500);
  }

  return response.success({ bookmarked: false });
}
