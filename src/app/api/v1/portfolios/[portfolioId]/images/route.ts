import { createClient } from "@/lib/supabase/server-client";
import { createAdminClient } from "@/lib/supabase/admin-client";
import * as response from "@/lib/utils/api-response";
import { toCamelCaseKeys } from "@/server/mappers/case-converter";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_IMAGES_PER_PORTFOLIO = 20;
const UNIQUE_CONSTRAINT_ERROR_CODE = "23505";
const EMPTY_RESULT_ERROR_CODE = "PGRST116";
const MAX_INSERT_RETRIES = 3;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ portfolioId: string }> }
) {
  const { portfolioId } = await params;
  const supabase = await createClient();
  const adminSupabase = createAdminClient();
  const dataClient = adminSupabase ?? supabase;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return response.unauthorized();
  }

  const { data: portfolio, error: fetchError } = await dataClient
    .from("portfolios")
    .select("id, owner_id")
    .eq("id", portfolioId)
    .is("deleted_at", null)
    .single();

  if (fetchError || !portfolio) {
    return response.notFound("포트폴리오를 찾을 수 없습니다.");
  }

  if (portfolio.owner_id !== user.id) {
    return response.forbidden("이미지 업로드 권한이 없습니다.");
  }

  // Check current image count
  const { count: imageCount, error: imageCountError } = await dataClient
    .from("portfolio_images")
    .select("id", { count: "exact", head: true })
    .eq("portfolio_id", portfolioId);

  if (imageCountError) {
    return response.error("INTERNAL_ERROR", "이미지 개수 확인에 실패했습니다.", 500);
  }

  if ((imageCount ?? 0) >= MAX_IMAGES_PER_PORTFOLIO) {
    return response.error(
      "UNPROCESSABLE_ENTITY",
      `이미지는 최대 ${MAX_IMAGES_PER_PORTFOLIO}개까지 업로드 가능합니다.`,
      422
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return response.validationError("멀티파트 폼 데이터를 파싱할 수 없습니다.");
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return response.validationError("파일이 없습니다.");
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return response.error(
      "FILE_TYPE_NOT_ALLOWED",
      "JPEG, PNG, WebP 형식의 이미지만 업로드 가능합니다.",
      415
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return response.error("FILE_TOO_LARGE", "파일 크기는 최대 10MB까지 허용됩니다.", 413);
  }

  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const filename = `${user.id}/${portfolioId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await dataClient.storage
    .from("portfolio-public")
    .upload(filename, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return response.error("INTERNAL_ERROR", "이미지 업로드에 실패했습니다.", 500);
  }

  const { data: urlData } = dataClient.storage.from("portfolio-public").getPublicUrl(filename);

  let imageRow: Record<string, unknown> | null = null;

  for (let attempt = 0; attempt < MAX_INSERT_RETRIES; attempt += 1) {
    const { data: lastImage, error: sortError } = await supabase
      .from("portfolio_images")
      .select("sort_order")
      .eq("portfolio_id", portfolioId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sortError && sortError.code !== EMPTY_RESULT_ERROR_CODE) {
      await dataClient.storage.from("portfolio-public").remove([filename]);
      return response.error("INTERNAL_ERROR", "이미지 순서 계산에 실패했습니다.", 500);
    }

    const sortOrder = ((lastImage?.sort_order as number | undefined) ?? -1) + 1;
    const shouldSetCover = (imageCount ?? 0) === 0 && attempt === 0;

    const { data: insertedRow, error: insertError } = await supabase
      .from("portfolio_images")
      .insert({
        portfolio_id: portfolioId,
        original_path: filename,
        display_path: filename,
        sort_order: sortOrder,
        is_cover: shouldSetCover,
      })
      .select("id, original_path, display_path, thumb_path, sort_order, is_cover, created_at")
      .single();

    if (!insertError && insertedRow) {
      imageRow = insertedRow as Record<string, unknown>;
      break;
    }

    if (insertError?.code === UNIQUE_CONSTRAINT_ERROR_CODE) {
      continue;
    }

    await dataClient.storage.from("portfolio-public").remove([filename]);
    return response.error("INTERNAL_ERROR", "이미지 정보 저장에 실패했습니다.", 500);
  }

  if (!imageRow) {
    await dataClient.storage.from("portfolio-public").remove([filename]);
    return response.error("INTERNAL_ERROR", "이미지 저장 충돌이 발생했습니다. 다시 시도해 주세요.", 500);
  }

  const camelImage = toCamelCaseKeys(imageRow) as Record<string, unknown>;

  return response.success(
    {
      ...camelImage,
      url: urlData.publicUrl,
    },
    undefined,
    201
  );
}
