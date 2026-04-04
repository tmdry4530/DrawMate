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
    .select(
      "role, display_name, headline, bio, sns_links, avatar_path, availability_status, is_profile_public, notify_new_message, notify_bookmark"
    )
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return response.notFound("프로필을 찾을 수 없습니다.");
  }

  const [
    { count: portfolioCount },
    { count: unreadNotificationCount },
    { data: conversationParticipants },
  ] = await Promise.all([
    supabase
      .from("portfolios")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id)
      .is("deleted_at", null),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null),
    supabase
      .from("conversation_participants")
      .select("last_read_at, conversations!inner(last_message_at)")
      .eq("user_id", user.id),
  ]);

  const camelProfile = toCamelCaseKeys(profile) as {
    role: string;
    displayName: string;
    headline: string | null;
    bio: string | null;
    snsLinks: string[] | null;
    avatarPath: string | null;
    availabilityStatus: string;
    isProfilePublic: boolean;
    notifyNewMessage: boolean;
    notifyBookmark: boolean;
  };
  const avatarUrl = camelProfile.avatarPath
    ? supabase.storage.from("profile-avatars").getPublicUrl(camelProfile.avatarPath).data.publicUrl
    : null;
  const unreadConversationCount = (conversationParticipants ?? []).reduce(
    (count, participant) => {
      const conversation = Array.isArray(participant.conversations)
        ? participant.conversations[0]
        : participant.conversations;
      const lastMessageAt = conversation?.last_message_at ?? null;
      const lastReadAt = participant.last_read_at ?? null;

      if (!lastMessageAt) return count;
      if (!lastReadAt || new Date(lastMessageAt) > new Date(lastReadAt)) {
        return count + 1;
      }
      return count;
    },
    0
  );

  return response.success({
    userId: user.id,
    profile: {
      role: camelProfile.role,
      displayName: camelProfile.displayName,
      headline: camelProfile.headline ?? null,
      bio: camelProfile.bio ?? null,
      snsLinks: camelProfile.snsLinks ?? [],
      avatarUrl,
      availabilityStatus: camelProfile.availabilityStatus,
      isProfilePublic: camelProfile.isProfilePublic,
      notifyNewMessage: camelProfile.notifyNewMessage,
      notifyBookmark: camelProfile.notifyBookmark,
    },
    counts: {
      portfolios: portfolioCount ?? 0,
      unreadNotifications: unreadNotificationCount ?? 0,
      unreadConversations: unreadConversationCount,
    },
  });
}
