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
    <footer className="border-t bg-muted/30">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-md space-y-2">
          <p className="text-lg font-semibold">DrawMate</p>
          <p className="text-sm text-muted-foreground">
            웹툰, 일러스트, 애니메이션 작업에 맞는 작가와 어시스턴트를 연결하고,
            포트폴리오 탐색부터 협업 문의까지 이어주는 플랫폼입니다.
          </p>
        </div>

        <nav aria-label="푸터 메뉴" className="flex flex-wrap gap-x-4 gap-y-2">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
