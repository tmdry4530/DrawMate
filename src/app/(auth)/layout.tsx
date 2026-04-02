import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left decorative panel - hidden on mobile */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary to-primary-container">
        {/* Subtle grain overlay */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E\")" }} />

        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-white/10 blur-3xl animate-float" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-white/10 blur-3xl animate-float" style={{ animationDelay: "2s" }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <Link href="/" className="font-headline font-black italic text-white text-3xl tracking-tight">
            DrawMate
          </Link>

          {/* Tagline */}
          <div className="space-y-6 max-w-sm">
            <h2 className="font-headline text-4xl font-extrabold text-white leading-tight">
              작가와 클라이언트를<br />
              연결하는 공간
            </h2>
            <p className="text-white/70 text-lg leading-relaxed">
              포트폴리오를 공유하고, 협업 파트너를 찾아보세요.
            </p>

            {/* Decorative art card grid */}
            <div className="grid grid-cols-3 gap-3 pt-4">
              {/* Card 1 */}
              <div className="aspect-square rounded-xl bg-white/20 backdrop-blur-sm rotate-2 overflow-hidden shadow-lg">
                <div className="w-full h-full bg-gradient-to-br from-white/30 to-white/5 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              {/* Card 2 */}
              <div className="aspect-square rounded-xl bg-white/20 backdrop-blur-sm -rotate-1 overflow-hidden shadow-lg translate-y-2">
                <div className="w-full h-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
              </div>
              {/* Card 3 */}
              <div className="aspect-square rounded-xl bg-white/20 backdrop-blur-sm rotate-3 overflow-hidden shadow-lg">
                <div className="w-full h-full bg-gradient-to-br from-white/25 to-white/5 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
              </div>
              {/* Card 4 */}
              <div className="aspect-square rounded-xl bg-white/20 backdrop-blur-sm -rotate-2 overflow-hidden shadow-lg -translate-y-1">
                <div className="w-full h-full bg-gradient-to-br from-white/15 to-white/5 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              </div>
              {/* Card 5 */}
              <div className="aspect-square rounded-xl bg-white/20 backdrop-blur-sm rotate-1 overflow-hidden shadow-lg translate-y-1">
                <div className="w-full h-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              {/* Card 6 */}
              <div className="aspect-square rounded-xl bg-white/20 backdrop-blur-sm -rotate-3 overflow-hidden shadow-lg">
                <div className="w-full h-full bg-gradient-to-br from-white/30 to-white/5 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <p className="text-white/40 text-xs">
            &copy; 2025 DrawMate. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full md:w-1/2 flex-col items-center justify-center px-6 py-12 bg-card relative">
        {/* Mobile logo */}
        <Link
          href="/"
          className="mb-10 font-headline font-black italic text-primary text-2xl tracking-tight md:hidden"
        >
          DrawMate
        </Link>

        <div className="w-full max-w-md animate-fade-up">
          {children}
        </div>
      </div>
    </div>
  );
}
