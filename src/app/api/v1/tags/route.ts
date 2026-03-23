import { createClient } from "@/lib/supabase/server-client";
import * as response from "@/lib/utils/api-response";
import { toCamelCaseKeys } from "@/server/mappers/case-converter";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const activeOnlyParam = searchParams.get("activeOnly");
  const activeOnly = activeOnlyParam === null ? true : activeOnlyParam !== "false";

  const validCategories = ["field", "skill", "tool", "style"];
  if (category && !validCategories.includes(category)) {
    return response.validationError("유효하지 않은 카테고리입니다.");
  }

  const supabase = await createClient();

  let query = supabase
    .from("tags")
    .select("id, slug, name, category, sort_order, is_active")
    .order("sort_order", { ascending: true });

  if (category) {
    query = query.eq("category", category);
  }

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data: tags, error } = await query;

  if (error) {
    return response.error("INTERNAL_ERROR", "태그 목록을 불러오는데 실패했습니다.", 500);
  }

  return response.success(toCamelCaseKeys(tags ?? []));
}
