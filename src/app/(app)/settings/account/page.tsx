export default function AccountSettingsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl py-8 space-y-4 px-4">
      <div className="border border-neutral-800 bg-[#131313]">
        <div className="border-b border-neutral-800 px-6 py-4">
          <h2 className="font-black uppercase tracking-tighter text-white">계정 설정</h2>
        </div>
        <div className="px-6 py-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-neutral-400">이메일 변경</label>
            <input
              placeholder="현재 이메일 주소"
              type="email"
              disabled
              className="w-full bg-transparent border-b-2 border-neutral-800 outline-none py-3 text-neutral-600 placeholder:text-neutral-700 cursor-not-allowed text-sm"
            />
            <p className="text-xs text-neutral-600">준비 중</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-neutral-400">비밀번호 변경</label>
            <input
              placeholder="새 비밀번호"
              type="password"
              disabled
              className="w-full bg-transparent border-b-2 border-neutral-800 outline-none py-3 text-neutral-600 placeholder:text-neutral-700 cursor-not-allowed text-sm"
            />
            <p className="text-xs text-neutral-600">준비 중</p>
          </div>
        </div>
      </div>

      <div className="border border-neutral-800 bg-[#131313]">
        <div className="border-b border-neutral-800 px-6 py-4">
          <h2 className="font-black uppercase tracking-tighter text-white">계정 삭제</h2>
        </div>
        <div className="px-6 py-6 space-y-4">
          <p className="text-sm leading-6 text-neutral-400">
            현재 계정 삭제는 비활성화되어 있습니다. 기존 구현은 프로필 레코드만 제거하는 방식이어서
            인증 계정 및 연관 데이터의 정합성을 깨뜨릴 수 있어 노출을 중단했습니다.
          </p>
          <div className="rounded-none border border-neutral-800 bg-black/40 px-4 py-3 text-xs text-neutral-500">
            계정 삭제가 필요하면 운영 지원 채널을 통해 요청해주세요.
          </div>
        </div>
      </div>
    </div>
  );
}
