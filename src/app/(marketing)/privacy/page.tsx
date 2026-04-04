const sections = [
  {
    title: "수집하는 정보",
    items: [
      "계정 생성 및 로그인에 필요한 이메일 등 인증 정보",
      "프로필, 포트폴리오, 태그, 이미지, 소개글 등 사용자가 직접 입력한 정보",
      "메시지, 알림, 북마크 등 서비스 이용 과정에서 생성되는 활동 정보",
    ],
  },
  {
    title: "이용 목적",
    items: [
      "회원 식별, 포트폴리오 탐색, 메시지 전달, 알림 제공",
      "협업 매칭 품질 개선과 기본적인 서비스 운영",
      "오류 대응, 남용 방지, 보안 점검 등 안정적인 서비스 제공",
    ],
  },
  {
    title: "보관 및 관리",
    items: [
      "개인정보와 콘텐츠는 서비스 제공에 필요한 범위에서 저장됩니다.",
      "정식 운영 단계에서는 보관 기간, 파기 절차, 위탁 현황을 별도 고지해야 합니다.",
      "사업자 정보와 공식 문의 채널이 확정되면 본 문서도 함께 업데이트되어야 합니다.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="bg-black min-h-screen">
      <div className="mx-auto max-w-4xl py-10">
        <div className="border border-neutral-800 p-6 md:p-8">
          <p className="text-xs font-black uppercase tracking-widest text-neutral-400">개인정보처리방침</p>
          <h1 className="mt-2 text-3xl font-black uppercase tracking-tighter text-white">DrawMate 개인정보 안내</h1>
          <p className="mt-3 text-sm leading-6 text-neutral-400">
            현재 서비스에 노출되는 개인정보 관련 핵심 항목을 정리한 초안입니다. 정식 배포 전에는
            법적 검토를 거친 최종 문구와 사업자 정보를 반드시 반영해야 합니다.
          </p>

          <div className="mt-8 space-y-8">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-lg font-black uppercase tracking-tighter text-white">{section.title}</h2>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-400">
                  {section.items.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
