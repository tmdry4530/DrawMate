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
    <footer className="bg-black border-t border-neutral-800">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 md:px-12 py-10 md:flex-row md:items-end md:justify-between">
        <div className="max-w-md space-y-2.5">
          <p className="text-lg font-black uppercase tracking-tighter text-white">
            DRAWMATE.
          </p>
          <p className="text-sm text-neutral-500 leading-relaxed">
            웹툰, 일러스트, 애니메이션 작업에 맞는 작가와 어시스턴트를 연결하고,
            포트폴리오 탐색부터 협업 문의까지 이어주는 플랫폼입니다.
          </p>
          <p className="text-xs text-neutral-700 uppercase tracking-widest">
            &copy; 2025 DRAWMATE. ALL RIGHTS RESERVED.
          </p>
        </div>

        <nav aria-label="푸터 메뉴" className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-neutral-500 hover:text-white uppercase tracking-wider"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
