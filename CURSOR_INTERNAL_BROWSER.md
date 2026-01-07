# Cursor 내부 브라우저에서 프로그램 실행하기

## 🚀 빠른 시작

### 방법 1: Simple Browser 사용 (가장 간단)
1. `Ctrl+Shift+P` (또는 `Cmd+Shift+P` on Mac)를 누릅니다
2. "Simple Browser: Show" 입력하고 선택
3. `http://localhost:5173` 입력하고 Enter

### 방법 2: 포트 포워딩 사용
1. Cursor 하단 상태바에서 포트 5173을 찾습니다
2. 포트를 클릭하면 "Open in Browser" 옵션이 나타납니다
3. "Simple Browser" 또는 "Internal Browser" 선택

### 방법 3: 명령 팔레트에서 직접 열기
1. `Ctrl+Shift+P` 누르기
2. "Simple Browser: Show" 입력
3. URL에 `http://localhost:5173` 입력

## 📝 설정 완료

다음 설정이 적용되었습니다:
- ✅ Simple Browser가 기본 브라우저로 설정됨
- ✅ 포트 5173 자동 포워딩 활성화
- ✅ 서버 시작 시 자동으로 내부 브라우저 열기

## 💡 팁

- 개발 서버가 실행 중이면 Cursor 하단 상태바에 포트 번호가 표시됩니다
- 포트를 클릭하면 바로 내부 브라우저에서 열 수 있습니다
- `Ctrl+Shift+P` → "Simple Browser"로 언제든지 접근 가능합니다

## 🔄 서버 재시작

서버를 재시작하려면:
1. 터미널에서 `Ctrl+C`로 서버 중지
2. `npm run dev` 다시 실행
3. 또는 `F5` 키로 "Launch Dev Server" 실행




