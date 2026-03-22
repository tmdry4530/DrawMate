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

  const { data: bookmarked, error: toggleError } = await supabase.rpc("toggle_portfolio_bookmark", {
    p_portfolio_id: portfolioId,
    p_should_bookmark: true,
  });
  if (toggleError) {
    return response.error("INTERNAL_ERROR", "북마크 추가에 실패했습니다.", 500);
  }

  return response.success({ bookmarked: bookmarked ?? true }, undefined, 201);
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

  const { error: toggleError } = await supabase.rpc("toggle_portfolio_bookmark", {
    p_portfolio_id: portfolioId,
    p_should_bookmark: false,
  });
  if (toggleError) {
    return response.error("INTERNAL_ERROR", "북마크 카운트 갱신에 실패했습니다.", 500);
  }

  return response.success({ bookmarked: false });
}
