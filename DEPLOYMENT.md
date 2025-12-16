# 배포 가이드 (Deployment Guide)

## 웹 배포 준비

### 1. 환경 변수 설정

`.env.local` 파일에 다음 변수들을 설정하세요:

```env
GEMINI_API_KEY=your_gemini_api_key_here
VITE_GEMINI_API_KEY=your_gemini_api_key_here
EMAILJS_SERVICE_ID=your_emailjs_service_id
EMAILJS_TEMPLATE_ID=your_emailjs_template_id
EMAILJS_PUBLIC_KEY=your_emailjs_public_key
```

### 2. 프로덕션 빌드

```bash
npm run build
```

빌드된 파일은 `dist` 폴더에 생성됩니다.

### 3. 웹 서버 배포

#### Vercel 배포 (권장)
1. Vercel 계정 생성 및 로그인
2. 프로젝트를 GitHub에 푸시
3. Vercel에서 프로젝트 import
4. 환경 변수 설정 (Vercel 대시보드에서)
5. 배포

#### Netlify 배포
1. Netlify 계정 생성 및 로그인
2. 프로젝트를 GitHub에 푸시
3. Netlify에서 프로젝트 import
4. Build command: `npm run build`
5. Publish directory: `dist`
6. 환경 변수 설정 (Netlify 대시보드에서)
7. 배포

#### 일반 웹 서버 배포
1. `npm run build` 실행
2. `dist` 폴더의 모든 파일을 웹 서버의 public 디렉토리에 업로드
3. 웹 서버가 SPA 라우팅을 지원하도록 설정 (모든 경로를 index.html로 리다이렉트)

### 4. 태블릿 최적화 확인

- iPad 및 Android 태블릿에서 테스트
- 터치 이벤트가 정상 작동하는지 확인
- 반응형 디자인이 올바르게 표시되는지 확인
- IndexedDB가 정상 작동하는지 확인 (로컬 저장소)

### 5. 보안 체크리스트

- [ ] API 키가 환경 변수로 설정되어 있는지 확인
- [ ] `.env.local` 파일이 `.gitignore`에 포함되어 있는지 확인
- [ ] 프로덕션 빌드에 하드코딩된 API 키가 없는지 확인
- [ ] HTTPS를 사용하는지 확인 (프로덕션 환경)

### 6. 성능 최적화

- 빌드 후 파일 크기 확인
- 불필요한 의존성 제거
- 이미지 최적화 (필요시)
- 코드 스플리팅 고려 (필요시)

## 문제 해결

### IndexedDB 오류
- 브라우저가 IndexedDB를 지원하는지 확인
- HTTPS 또는 localhost에서 실행 중인지 확인

### API 키 오류
- 환경 변수가 올바르게 설정되었는지 확인
- Vite 환경 변수는 `VITE_` 접두사가 필요할 수 있음

### 빌드 오류
- Node.js 버전 확인 (권장: 18 이상)
- `node_modules` 삭제 후 `npm install` 재실행





