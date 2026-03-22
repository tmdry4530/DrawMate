import { createClient } from "@/lib/supabase/server-client";
import * as response from "@/lib/utils/api-response";
import { toCamelCaseKeys } from "@/server/mappers/case-converter";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  if (!UUID_REGEX.test(userId)) {
    return response.validationError("유효하지 않은 사용자 ID 형식입니다.");
  }

  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id, role, display_name, avatar_path, headline, bio, sns_links, availability_status, is_profile_public, created_at"
    )
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    return response.notFound("사용자를 찾을 수 없습니다.");
  }

  if (!profile.is_profile_public) {
    return response.forbidden("비공개 프로필입니다.");
  }

  const { count: portfolioCount } = await supabase
    .from("portfolios")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId)
    .eq("status", "published");

  const camelProfile = toCamelCaseKeys(profile) as Record<string, unknown>;
  const avatarPath = camelProfile.avatarPath as string | null;
  const avatarUrl = avatarPath
    ? supabase.storage.from("profile-avatars").getPublicUrl(avatarPath).data.publicUrl
    : null;

  return response.success({
    ...camelProfile,
    avatarUrl,
    counts: {
      portfolios: portfolioCount ?? 0,
    },
  });
}
