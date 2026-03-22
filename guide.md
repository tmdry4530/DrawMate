# macOS 초기 세팅 + OpenClaw 완전 제어 가이드

> **작성일**: 2026.03.22  
> **최신 OpenClaw 안정 버전**: v2026.3.13  
> **대상**: Apple Silicon Mac (M1/M2/M3/M4), macOS 12 Monterey 이상

---

## ⚠️ 보안 경고 (반드시 읽기)

OpenClaw는 셸 명령 실행, 파일 읽기/쓰기, 메시지 전송, 웹 브라우징 등 **시스템 전체에 대한 광범위한 권한**으로 동작합니다. 개인 데이터(iCloud, 비밀번호, 사진 등)가 동기화된 **메인 머신에는 설치를 권장하지 않습니다.** 전용 기기(Mac Mini 등)나 별도 사용자 계정 사용을 강력 권장합니다.

---

## Phase 1: macOS 기본 세팅

### 1-1. macOS 업데이트

시스템 설정 → 일반 → 소프트웨어 업데이트에서 최신 버전으로 업데이트합니다.

### 1-2. Xcode Command Line Tools 설치

터미널을 열고 다음을 실행합니다:

```bash
xcode-select --install
```

팝업이 뜨면 "설치"를 클릭합니다. 이 도구는 Git, Make, Clang 등 개발에 필요한 기본 도구를 포함합니다.

### 1-3. Homebrew 설치

macOS용 패키지 매니저입니다:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

설치 후 PATH에 추가합니다 (Apple Silicon 기준):

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
source ~/.zshrc
```

확인:

```bash
brew --version
```

---

## Phase 2: iTerm2 설치 및 설정

### 2-1. iTerm2 설치

```bash
brew install --cask iterm2
```

### 2-2. iTerm2 기본 설정 (권장)

iTerm2를 열고 `Cmd + ,`로 설정 진입:

- **Appearance → Theme**: Minimal (깔끔한 UI)
- **Profiles → Colors**: Solarized Dark 또는 원하는 테마
- **Profiles → Text → Font**: MesloLGS NF 또는 Hack Nerd Font (후술)
- **Profiles → Terminal → Scrollback lines**: Unlimited 체크
- **Profiles → Keys → Key Mappings**: Natural Text Editing 프리셋 적용

### 2-3. Oh My Zsh 설치 (선택)

```bash
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

### 2-4. Nerd Font 설치 (터미널 아이콘 지원)

```bash
brew install --cask font-meslo-lg-nerd-font
```

iTerm2 → Profiles → Text → Font에서 `MesloLGS NF`로 변경합니다.

---

## Phase 3: Node.js 설치

OpenClaw는 **Node.js 22 이상** (권장 24)을 요구합니다.

### 방법 A: Homebrew (간편)

```bash
brew install node@22
```

### 방법 B: nvm (버전 관리 가능, 권장)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.zshrc
nvm install 22
nvm use 22
nvm alias default 22
```

확인:

```bash
node -v   # v22.x.x 이상이어야 함
npm -v
```

---

## Phase 4: OpenClaw 설치

### 4-1. 원라인 설치 (가장 빠른 방법)

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

이 스크립트는 OS를 감지하고, Node.js가 없으면 설치하고, OpenClaw CLI를 글로벌로 설치합니다.

### 4-2. npm 수동 설치 (대안)

```bash
npm install -g openclaw@latest
```

Apple Silicon에서 sharp 패키지 문제가 생기면:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

### 4-3. pnpm 설치 (대안)

```bash
pnpm add -g openclaw@latest
pnpm approve-builds -g   # 빌드 스크립트 승인
```

### 4-4. 설치 확인

```bash
openclaw --version
```

`command not found` 에러가 나면:

```bash
# npm 글로벌 바이너리 경로 확인
npm prefix -g

# PATH에 추가 (~/.zshrc에 넣기)
export PATH="$(npm prefix -g)/bin:$PATH"
source ~/.zshrc
```

---

## Phase 5: OpenClaw 온보딩 (초기 설정)

### 5-1. 온보딩 위저드 실행

```bash
openclaw onboard --install-daemon
```

`--install-daemon` 플래그가 핵심입니다. 이 플래그는 macOS의 launchd 데몬으로 OpenClaw를 등록하여 **재부팅 후에도 자동으로 시작**됩니다.

### 5-2. 온보딩에서 설정할 항목들

위저드가 순서대로 물어봅니다:

**a) 리스크 동의**  
"I understand this is powerful and inherently risky" → Yes

**b) Gateway 방식**  
"Local" 선택 (이 Mac에서 직접 실행)

**c) LLM 프로바이더 선택**

- Anthropic (Claude) — 권장 (프롬프트 인젝션 저항성이 높음)
- OpenAI (GPT)
- Google (Gemini)
- 로컬 모델 (Ollama)

**d) API 키 입력**  
Anthropic 선택 시: https://console.anthropic.com 에서 API 키 발급 후 붙여넣기

**e) 모델 선택**  
`~/.openclaw/openclaw.json` 에서 설정 가능:

```json
{
  "agent": {
    "model": "anthropic/claude-opus-4-6"
  }
}
```

**f) 채널 설정 (메시징 앱 연동)**  
Telegram, WhatsApp, Discord, Slack, iMessage 등 선택 가능. 나중에 추가 가능하므로 스킵해도 됩니다.

**g) 스킬 설치**  
나중에 설치 가능. 처음에는 스킵하고 필요할 때 추가하는 것이 안전합니다.

**h) 셸 자동완성**  
Yes → 터미널에서 openclaw 명령어 자동완성 활성화

---

## Phase 6: macOS 권한 설정 (완전 제어를 위한 핵심)

OpenClaw가 컴퓨터를 완전히 제어하려면 macOS의 보안 권한을 부여해야 합니다.

### 6-1. 전체 디스크 접근 권한

**시스템 설정 → 개인정보 및 보안 → 전체 디스크 접근 권한**

다음 항목들을 추가합니다:

- **iTerm2** (또는 사용하는 터미널 앱)
- OpenClaw가 데몬으로 실행되는 경우 해당 프로세스도 추가

### 6-2. 접근성 권한

**시스템 설정 → 개인정보 및 보안 → 손쉬운 사용**

- iTerm2 추가
- OpenClaw 메뉴 바 앱 추가 (설치한 경우)

### 6-3. 파일 및 폴더 접근 권한

macOS는 Desktop, Documents, Downloads 폴더에 대해 별도 권한을 요구합니다. 터미널이나 백그라운드 프로세스에서 이 폴더에 접근하면 권한 프롬프트가 뜹니다. "허용"을 클릭하세요.

또는, 파일을 OpenClaw 워크스페이스로 옮겨서 사용하면 폴더별 권한 부여를 피할 수 있습니다:

```bash
# 워크스페이스 기본 경로
~/.openclaw/workspace/
```

### 6-4. 마이크 권한 (음성 웨이크 사용 시)

**시스템 설정 → 개인정보 및 보안 → 마이크**

- OpenClaw 메뉴 바 앱 추가

### 6-5. 알림 권한

**시스템 설정 → 알림**

- OpenClaw 앱의 알림을 허용

---

## Phase 7: OpenClaw 실행 및 확인

### 7-1. Gateway 상태 확인

```bash
openclaw status
```

### 7-2. 헬스 체크

```bash
openclaw doctor
```

자동으로 설정 문제를 감지합니다.

### 7-3. Control UI (웹 대시보드) 열기

```bash
openclaw dashboard
```

브라우저에서 `http://127.0.0.1:18789/` 로 접속됩니다. 여기서 바로 채팅, 설정 관리, 스킬 관리가 가능합니다.

### 7-4. 로그 확인

```bash
openclaw logs --follow
```

---

## Phase 8: 채널 연결

### Telegram 연결

1. @BotFather 에서 새 봇 생성, 토큰 복사
2. `openclaw channels login telegram` 실행
3. 토큰 붙여넣기
4. Telegram에서 봇에게 메시지 전송 → 페어링 코드 승인

### iMessage 연결 (macOS 전용)

```bash
openclaw channels login imessage
```

macOS 업데이트 후에는 다시 실행해야 할 수 있습니다.

### Discord 연결

1. Discord Developer Portal에서 애플리케이션 생성
2. Message Content Intent 활성화
3. 봇을 서버에 초대
4. `openclaw channels login discord`

---

## Phase 9: 보안 강화 (필수)

### 9-1. 보안 감사 실행

```bash
openclaw security audit --deep
openclaw security audit --fix
```

### 9-2. 워크스페이스 파일 권한 잠금

```bash
chmod 700 ~/.openclaw
chmod 600 ~/.openclaw/openclaw.json
```

### 9-3. exec 승인 모드 활성화

`~/.openclaw/openclaw.json` 에서:

```json
{
  "exec": {
    "ask": "on"
  }
}
```

이렇게 하면 위험한 셸 명령 실행 전에 승인을 요구합니다.

### 9-4. Control UI 외부 노출 금지

Control UI는 관리자 인터페이스입니다. 절대로 공개 인터넷에 노출하지 마세요. localhost에서만 접근하거나, Tailscale 또는 SSH 터널을 사용하세요.

### 9-5. Gateway 바인딩 주소

`openclaw.json`에서 gateway 설정을 `127.0.0.1`로 바인딩:

```json
{
  "gateway": {
    "host": "127.0.0.1",
    "port": 18789
  }
}
```

---

## Phase 10: 유지보수 명령어 모음

```bash
# 업데이트
openclaw update --channel stable

# Gateway 재시작 (설정 변경 후)
openclaw restart

# 스킬 설치
openclaw skills install <스킬이름>

# 에이전트에게 메시지 보내기
openclaw agent --message "안녕"

# 버전 확인
openclaw --version

# 포트 충돌 확인
lsof -i :18789
```

---

## Phase 11: OpenClaw 메뉴 바 앱 설치 (선택)

GitHub Releases에서 macOS용 `.dmg` 파일을 다운로드하여 설치합니다. 메뉴 바 앱은 채팅, 음성 웨이크, Gateway 상태 확인을 제공합니다.

기능:

- 메뉴 바에서 바로 채팅
- 음성 웨이크 기능
- Gateway 연결 상태 표시
- 빠른 설정 접근

---

## 트러블슈팅

| 증상                          | 해결                                                           |
| ----------------------------- | -------------------------------------------------------------- |
| `openclaw: command not found` | `npm prefix -g` 확인 후 PATH에 추가, 터미널 재시작             |
| Gateway 응답 없음             | `openclaw gateway restart` + API 키 확인                       |
| 포트 충돌                     | `lsof -i :18789` 으로 프로세스 확인 후 종료                    |
| 파일 접근 권한 거부           | 시스템 설정에서 전체 디스크 접근 권한 부여                     |
| sharp 설치 실패               | `SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest` |
| 데몬이 부팅 시 시작 안 됨     | `openclaw onboard --install-daemon` 재실행                     |
| iMessage 동작 안 함           | `openclaw channels login imessage` 재실행                      |
| SQLITE_CANTOPEN (데몬)        | v2026.2.19+ 로 업데이트 (TMPDIR 포워딩 수정 포함)              |

---

## 권장 설정 요약

```
macOS: 최신 버전
Xcode CLI Tools: ✅
Homebrew: ✅
iTerm2: ✅ + Nerd Font
Node.js: v22+ (nvm 권장)
OpenClaw: v2026.3.13 (latest stable)
데몬: launchd로 등록 (--install-daemon)
모델: anthropic/claude-opus-4-6
Gateway: 127.0.0.1:18789
exec.ask: "on"
워크스페이스 권한: 700/600
```
