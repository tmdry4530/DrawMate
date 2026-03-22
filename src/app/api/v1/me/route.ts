import { createClient } from "@/lib/supabase/server-client";
import * as response from "@/lib/utils/api-response";
import { toCamelCaseKeys } from "@/server/mappers/case-converter";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return response.unauthorized();
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, display_name, avatar_url, availability_status")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return response.notFound("프로필을 찾을 수 없습니다.");
  }

  const camelProfile = toCamelCaseKeys(profile) as {
    role: string;
    displayName: string;
    avatarUrl: string | null;
    availabilityStatus: string;
  };

  return response.success({
    userId: user.id,
    profile: camelProfile,
    counts: {
      portfolios: 0,
      unreadNotifications: 0,
      unreadConversations: 0,
    },
  });
}
