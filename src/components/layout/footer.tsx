import Link from "next/link";

const footerLinks = [
  { href: "/explore", label: "포트폴리오 탐색" },
  { href: "/studio", label: "스튜디오" },
  { href: "/terms", label: "이용약관" },
  { href: "/privacy", label: "개인정보처리방침" },
  { href: "/contact", label: "문의" },
];

export function Footer() {
  return (
    <footer className="animate-fade-up bg-muted/20">
      {/* Gradient top border */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 md:flex-row md:items-end md:justify-between">
        <div className="max-w-md space-y-2.5">
          <p className="text-lg font-medium">
            <span>Draw</span><span className="font-bold gradient-text">Mate</span>
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            웹툰, 일러스트, 애니메이션 작업에 맞는 작가와 어시스턴트를 연결하고,
            포트폴리오 탐색부터 협업 문의까지 이어주는 플랫폼입니다.
          </p>
          <p className="text-xs text-muted-foreground/60">
            &copy; 2025 DrawMate. All rights reserved.
          </p>
        </div>

        <nav aria-label="푸터 메뉴" className="flex flex-wrap items-center gap-x-1 gap-y-2">
          {footerLinks.map((link, index) => (
            <span key={link.href} className="flex items-center">
              {index > 0 && (
                <span className="mr-1 text-border select-none" aria-hidden="true">·</span>
              )}
              <Link
                href={link.href}
                className="text-sm text-muted-foreground transition-all duration-200 hover:text-foreground relative after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-primary/50 after:transition-all after:duration-200 hover:after:w-full"
              >
                {link.label}
              </Link>
            </span>
          ))}
        </nav>
      </div>
    </footer>
  );
}
