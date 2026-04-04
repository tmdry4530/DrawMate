const sections = [
  {
    title: "서비스 이용",
    items: [
      "DrawMate는 작가와 어시스턴트를 연결하고 포트폴리오 탐색 및 메시지 기반 협업 문의를 돕는 서비스입니다.",
      "회원은 본인의 계정과 포트폴리오 정보를 최신 상태로 유지해야 합니다.",
      "서비스 운영 정책은 정식 운영 단계에서 추가 고지될 수 있습니다.",
    ],
  },
  {
    title: "콘텐츠 책임",
    items: [
      "포트폴리오 이미지, 소개글, 태그 등 업로드한 콘텐츠에 대한 책임은 작성자에게 있습니다.",
      "타인의 권리를 침해하거나 허위 사실을 포함한 콘텐츠는 삭제 또는 제재 대상이 될 수 있습니다.",
      "협업 조건과 결과물에 대한 최종 합의는 당사자 간 확인이 필요합니다.",
    ],
  },
  {
    title: "메시지 및 협업",
    items: [
      "메시지 기능은 포트폴리오 기반 협업 문의를 위한 용도로 제공됩니다.",
      "스팸, 괴롭힘, 사칭 등 부적절한 행위는 제한될 수 있습니다.",
      "작업 일정, 예산, 범위는 메시지에서 명확히 협의한 뒤 진행하는 것을 권장합니다.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="bg-black min-h-screen">
      <div className="mx-auto max-w-4xl py-10">
        <div className="border border-neutral-800 p-6 md:p-8">
          <p className="text-xs font-black uppercase tracking-widest text-neutral-400">이용약관</p>
          <h1 className="mt-2 text-3xl font-black uppercase tracking-tighter text-white">DrawMate 서비스 이용 안내</h1>
          <p className="mt-3 text-sm leading-6 text-neutral-400">
            이 문서는 현재 서비스 구조를 기준으로 정리한 기본 안내입니다. 정식 운영 전 사업자 정보,
            세부 정책, 법적 고지 문구는 별도로 보강되어야 합니다.
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
