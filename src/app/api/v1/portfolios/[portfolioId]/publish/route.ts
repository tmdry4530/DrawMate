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
    // RPC 비즈니스 검증 에러를 사용자 친화적 메시지로 변환
    const validationMessages: Record<string, string> = {
      requires_at_least_one_image: "최소 1장의 이미지가 필요합니다.",
      requires_at_least_one_field_tag: "최소 1개의 분야 태그를 선택해주세요.",
      requires_profile_display_name: "프로필에 이름을 먼저 입력해주세요.",
      requires_profile_role: "프로필에서 역할을 먼저 설정해주세요.",
    };
    const userMessage = validationMessages[rpcError.message] ?? `발행에 실패했습니다: ${rpcError.message}`;
    const statusCode = rpcError.code === "P0001" ? 422 : 500;
    return response.error("UNPROCESSABLE_ENTITY", userMessage, statusCode);
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
