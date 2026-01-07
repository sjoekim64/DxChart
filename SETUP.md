# 설정 가이드 (Setup Guide)

## OpenAI API 키 설정

1. `.env.local` 파일을 프로젝트 루트에 생성하세요.

2. 다음 내용을 추가하세요:

```env
OPENAI_API_KEY=your_openai_api_key_here
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

**API 키 발급 방법:**
- https://platform.openai.com/api-keys 에서 API 키를 발급받으세요.
- 발급받은 키를 위의 `your_openai_api_key_here` 부분에 입력하세요.

3. 저장 후 앱을 재시작하세요.

## 중요 사항

⚠️ **보안 주의사항:**
- `.env.local` 파일은 `.gitignore`에 포함되어 있어 Git에 커밋되지 않습니다.
- API 키를 절대 공개 저장소에 업로드하지 마세요.
- 프로덕션 배포 시 환경 변수를 안전하게 설정하세요.

## 앱 실행

```bash
npm install
npm run dev
```

## 기능 확인

설정이 완료되면 다음 기능들이 작동합니다:
- ✅ Present Illness 자동 생성
- ✅ TCM 진단 자동 생성
- ✅ SOAP 노트 자동 생성

