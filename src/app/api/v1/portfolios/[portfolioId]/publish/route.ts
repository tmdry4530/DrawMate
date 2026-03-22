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
    .select("id, owner_id, status")
    .eq("id", portfolioId)
    .is("deleted_at", null)
    .single();

  if (fetchError || !portfolio) {
    return response.notFound("포트폴리오를 찾을 수 없습니다.");
  }

  if (portfolio.owner_id !== user.id) {
    return response.forbidden("발행 권한이 없습니다.");
  }

  const { error: rpcError } = await supabase.rpc("publish_portfolio", {
    p_id: portfolioId,
  });

  if (rpcError) {
    return response.error("INTERNAL_ERROR", "포트폴리오 발행에 실패했습니다.", 500);
  }

  const { data: updated } = await supabase
    .from("portfolios")
    .select("status, published_at")
    .eq("id", portfolioId)
    .maybeSingle();

  return response.success({
    portfolioId,
    status: updated?.status ?? "published",
    publishedAt: updated?.published_at ?? new Date().toISOString(),
  });
}
