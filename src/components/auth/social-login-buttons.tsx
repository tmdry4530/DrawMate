"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser-client";
import { toast } from "sonner";

const PROVIDERS = [
  {
    id: "google" as const,
    label: "Google로 계속하기",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
    ),
  },
  {
    id: "github" as const,
    label: "GitHub로 계속하기",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
      </svg>
    ),
  },
  {
    id: "kakao" as const,
    label: "Kakao로 계속하기",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.72 1.775 5.108 4.453 6.459l-.916 3.408a.427.427 0 0 0 .645.458l3.98-2.632c.6.085 1.215.13 1.838.13 5.523 0 10-3.463 10-7.823S17.523 3 12 3" />
      </svg>
    ),
  },
] as const;

type ProviderId = (typeof PROVIDERS)[number]["id"];

interface SocialLoginButtonsProps {
  nextPath?: string | null;
}

export function SocialLoginButtons({ nextPath }: SocialLoginButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<ProviderId | null>(null);

  async function handleSocialLogin(providerId: ProviderId) {
    setLoadingProvider(providerId);
    try {
      const supabase = createClient();
      const redirectTo = nextPath
        ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`
        : `${window.location.origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: providerId,
        options: { redirectTo },
      });
      if (error) throw error;
    } catch {
      toast.error("소셜 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.");
      setLoadingProvider(null);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {PROVIDERS.map((provider) => (
        <button
          key={provider.id}
          type="button"
          disabled={loadingProvider !== null}
          onClick={() => handleSocialLogin(provider.id)}
          className="flex items-center justify-center gap-3 py-4 border border-neutral-800 text-white hover:bg-neutral-900 disabled:opacity-50 uppercase tracking-wider text-sm font-bold"
        >
          {provider.icon}
          <span>
            {loadingProvider === provider.id ? "연결 중..." : provider.label}
          </span>
        </button>
      ))}
    </div>
  );
}
