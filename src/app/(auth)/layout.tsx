import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left decorative panel - hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden mesh-gradient">
        {/* Grain overlay */}
        <div className="grain-overlay absolute inset-0" />

        {/* Dot grid */}
        <div className="absolute inset-0 dot-grid opacity-40" />

        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/10 blur-3xl animate-float" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-blue-500/10 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-2/3 left-1/3 w-32 h-32 rounded-full bg-violet-400/10 blur-3xl animate-float" style={{ animationDelay: "4s" }} />

        {/* Spinning ring decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-primary/10 animate-spin-slow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full border border-primary/5 animate-spin-slow" style={{ animationDirection: "reverse" }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link href="/" className="text-2xl font-light tracking-tight text-foreground">
            Draw<span className="font-bold gradient-text">Mate</span>
          </Link>

          <div className="space-y-6 max-w-md">
            <h1 className="text-4xl font-bold tracking-tight leading-tight text-foreground">
              완벽한{" "}
              <span className="gradient-text">작업 파트너</span>를<br />
              찾아보세요
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              웹툰, 일러스트, 애니메이션 분야의 작가와 어시스턴트가 모여
              포트폴리오를 공유하고 협업을 시작하는 공간입니다.
            </p>
            <div className="flex gap-8 pt-2">
              <div>
                <p className="text-2xl font-bold text-foreground">1,200+</p>
                <p className="text-sm text-muted-foreground">활성 작가</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">3,800+</p>
                <p className="text-sm text-muted-foreground">포트폴리오</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">890+</p>
                <p className="text-sm text-muted-foreground">협업 성사</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            &copy; 2025 DrawMate. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center px-6 py-12 relative">
        {/* Mobile logo */}
        <Link
          href="/"
          className="mb-10 text-2xl font-light tracking-tight text-foreground lg:hidden"
        >
          Draw<span className="font-bold gradient-text">Mate</span>
        </Link>

        {/* Subtle background for form side */}
        <div className="absolute inset-0 dot-grid opacity-20 pointer-events-none" />

        <div className="relative z-10 w-full max-w-[420px] animate-fade-up">
          {children}
        </div>
      </div>
    </div>
  );
}
