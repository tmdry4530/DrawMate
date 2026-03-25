import { createClient } from "@/lib/supabase/server-client";
import * as response from "@/lib/utils/api-response";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return response.unauthorized();
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
    return response.error("FILE_TOO_LARGE", "파일 크기는 최대 5MB까지 허용됩니다.", 413);
  }

  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const filename = `${user.id}/avatar.${ext}`;

  // Remove old avatar files (different extensions)
  const { data: existingFiles } = await supabase.storage
    .from("profile-avatars")
    .list(user.id);

  if (existingFiles && existingFiles.length > 0) {
    const oldPaths = existingFiles.map((f) => `${user.id}/${f.name}`);
    await supabase.storage.from("profile-avatars").remove(oldPaths);
  }

  // Upload new avatar
  const { error: uploadError } = await supabase.storage
    .from("profile-avatars")
    .upload(filename, file, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return response.error("INTERNAL_ERROR", "아바타 업로드에 실패했습니다.", 500);
  }

  // Update profile with new avatar path
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_path: filename })
    .eq("id", user.id);

  if (updateError) {
    return response.error("INTERNAL_ERROR", "프로필 업데이트에 실패했습니다.", 500);
  }

  const { data: urlData } = supabase.storage
    .from("profile-avatars")
    .getPublicUrl(filename);

  return response.success({ avatarUrl: urlData.publicUrl });
}

export async function DELETE() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return response.unauthorized();
  }

  // Remove avatar files
  const { data: existingFiles } = await supabase.storage
    .from("profile-avatars")
    .list(user.id);

  if (existingFiles && existingFiles.length > 0) {
    const oldPaths = existingFiles.map((f) => `${user.id}/${f.name}`);
    await supabase.storage.from("profile-avatars").remove(oldPaths);
  }

  // Clear avatar path in profile
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_path: null })
    .eq("id", user.id);

  if (updateError) {
    return response.error("INTERNAL_ERROR", "프로필 업데이트에 실패했습니다.", 500);
  }

  return response.success({ deleted: true });
}
