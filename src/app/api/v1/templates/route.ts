import { createClient } from "@/lib/supabase/server-client";
import * as response from "@/lib/utils/api-response";
import { toCamelCaseKeys } from "@/server/mappers/case-converter";

export async function GET() {
  const supabase = await createClient();

  const { data: templates, error } = await supabase
    .from("portfolio_templates")
    .select("id, code, name, description, preview_image_path, layout_schema, sort_order, is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    return response.error("INTERNAL_ERROR", "템플릿 목록을 불러오는데 실패했습니다.", 500);
  }

  const templatesWithUrls = (templates ?? []).map((template) => {
    const camel = toCamelCaseKeys(template) as Record<string, unknown>;
    if (template.preview_image_path) {
      const { data: urlData } = supabase.storage
        .from("system-template-assets")
        .getPublicUrl(template.preview_image_path as string);
      camel.previewImageUrl = urlData.publicUrl;
    } else {
      camel.previewImageUrl = null;
    }
    delete camel.previewImagePath;
    return camel;
  });

  return response.success(templatesWithUrls);
}
