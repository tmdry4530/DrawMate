import { createClient } from "@/lib/supabase/server-client";
import * as response from "@/lib/utils/api-response";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ portfolioId: string; imageId: string }> }
) {
  const { portfolioId, imageId } = await params;
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
    return response.forbidden("이미지 삭제 권한이 없습니다.");
  }

  const { data: image, error: imageFetchError } = await supabase
    .from("portfolio_images")
    .select("id, original_path, display_path, thumb_path")
    .eq("id", imageId)
    .eq("portfolio_id", portfolioId)
    .single();

  if (imageFetchError || !image) {
    return response.notFound("이미지를 찾을 수 없습니다.");
  }

  // Delete from storage (best effort)
  const publicPaths = [image.display_path, image.thumb_path, image.original_path]
    .filter((path): path is string => !!path);

  if (publicPaths.length > 0) {
    await supabase.storage.from("portfolio-public").remove([...new Set(publicPaths)]);
    await supabase.storage.from("portfolio-originals").remove([...new Set(publicPaths)]);
  }

  // Delete DB row
  const { error: deleteError } = await supabase
    .from("portfolio_images")
    .delete()
    .eq("id", imageId);

  if (deleteError) {
    return response.error("INTERNAL_ERROR", "이미지 삭제에 실패했습니다.", 500);
  }

  return response.success({ deleted: true });
}
