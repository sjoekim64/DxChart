# OpenAI API 키 설정 가이드

## ⚠️ 중요: 이 파일을 반드시 읽고 따라하세요!

## 1단계: .env.local 파일 생성

프로젝트 루트 디렉토리(`all-comp-patient-chart-input`)에 `.env.local` 파일을 생성하세요.

**파일 위치:**
```
all-comp-patient-chart-input/
  ├── .env.local  ← 여기에 생성!
  ├── package.json
  ├── vite.config.ts
  └── ...
```

## 2단계: API 키 입력

`.env.local` 파일에 다음 내용을 정확히 입력하세요:

```env
VITE_OPENAI_API_KEY=sk-proj-your-api-key-here
```

**⚠️ 주의사항:**
- `VITE_` 접두사가 반드시 있어야 합니다!
- 등호(`=`) 앞뒤에 공백이 없어야 합니다!
- 따옴표나 따옴표 없이 그냥 입력하세요!

## 3단계: 개발 서버 재시작

**중요:** 환경 변수 파일을 수정한 후에는 반드시 개발 서버를 완전히 종료하고 다시 시작해야 합니다!

### Windows에서:
1. 현재 실행 중인 개발 서버를 완전히 종료하세요 (Ctrl+C)
2. 터미널을 닫고 새로 열어주세요
3. 다음 명령 실행:
   ```cmd
   npm run dev
   ```

### 또는:
1. 작업 관리자에서 `node.exe` 프로세스를 모두 종료
2. 새 터미널에서 `npm run dev` 실행

## 4단계: 확인

브라우저 콘솔(F12)을 열고 다음을 확인하세요:
- `🔍 API 키 확인:` 메시지가 나타나야 합니다
- `키존재여부: true`가 표시되어야 합니다

## 문제 해결

### "API 키를 찾을 수 없습니다" 오류가 계속 나타나는 경우:

1. **파일 이름 확인**
   - 파일 이름이 정확히 `.env.local`인지 확인 (앞에 점이 있어야 함)
   - `.env.local.txt` 같은 확장자가 붙지 않았는지 확인

2. **파일 위치 확인**
   - 프로젝트 루트에 있는지 확인 (package.json과 같은 폴더)

3. **내용 확인**
   - `VITE_OPENAI_API_KEY=` 뒤에 API 키가 있는지 확인
   - 줄바꿈이나 공백이 없는지 확인

4. **서버 재시작**
   - 개발 서버를 완전히 종료하고 다시 시작

5. **캐시 삭제**
   ```cmd
   npm run dev -- --force
   ```

## API 키 형식

올바른 API 키는 `sk-proj-` 또는 `sk-`로 시작합니다.

예시:
- ✅ `sk-proj-Utxsl8NJc9uJGmkLs5WrK90hpbuL-...`
- ❌ `OPENAI_API_KEY=sk-proj-...` (변수명 포함하면 안됨)
- ❌ `"sk-proj-..."` (따옴표 없이)

## 추가 정보

- `.env.local` 파일은 Git에 커밋되지 않습니다 (보안상 안전)
- API 키는 절대 공개하지 마세요
- 프로덕션 배포 시에도 환경 변수를 설정해야 합니다
