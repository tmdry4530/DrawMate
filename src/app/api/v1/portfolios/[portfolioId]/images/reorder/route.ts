import { createClient } from "@/lib/supabase/server-client";
import * as response from "@/lib/utils/api-response";
import { z } from "zod";

const reorderSchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1, "정렬할 이미지 ID 목록이 필요합니다."),
});

export async function PATCH(
  request: Request,
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
    .select("id, owner_id")
    .eq("id", portfolioId)
    .is("deleted_at", null)
    .single();

  if (fetchError || !portfolio) {
    return response.notFound("포트폴리오를 찾을 수 없습니다.");
  }

  if (portfolio.owner_id !== user.id) {
    return response.forbidden("이미지 순서 변경 권한이 없습니다.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return response.validationError("요청 본문이 올바른 JSON 형식이 아닙니다.");
  }

  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path.join(".");
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }
    return response.validationError("입력값이 올바르지 않습니다.", fieldErrors);
  }

  const { error: rpcError } = await supabase.rpc("reorder_portfolio_images", {
    p_id: portfolioId,
    ordered_ids: parsed.data.orderedIds,
  });

  if (rpcError) {
    return response.error("INTERNAL_ERROR", "이미지 순서 변경에 실패했습니다.", 500);
  }

  return response.success({ reordered: true });
}
