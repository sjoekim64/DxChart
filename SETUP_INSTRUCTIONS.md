# 다른 컴퓨터에서 프로젝트 실행하기

## 🚀 빠른 시작 가이드

### 1. 프로젝트 클론
```bash
git clone https://github.com/sjoekim64/patient-chart.git
cd patient-chart
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정 (선택사항)
`.env.local` 파일을 생성하고 다음 내용을 추가:
```env
# Gemini AI API Key (AI 기능을 위해 필요)
GEMINI_API_KEY=your_gemini_api_key_here

# EmailJS Configuration (이메일 알림을 위해 필요)
EMAILJS_SERVICE_ID=your_emailjs_service_id
EMAILJS_TEMPLATE_ID=your_emailjs_template_id
EMAILJS_PUBLIC_KEY=your_emailjs_public_key
```

### 4. 개발 서버 실행
```bash
npm run dev
```

### 5. 브라우저에서 확인
`http://localhost:5173`에서 애플리케이션을 확인할 수 있습니다.

## 🧪 테스트 계정

**로그인 정보:**
- 사용자명: `sjoekim`
- 비밀번호: `Joe007007`

## 📋 샘플 데이터

로그인하면 자동으로 다음 샘플 데이터가 생성됩니다:

### 신규환자 샘플
- **CH-12345**: Jane Doe (요통, 두통)

### 재방문 환자 샘플
- **CH-67890**: John Smith (목/어깨 통증 - 40% 개선)
- **CH-54321**: Sarah Johnson (요통 - 70% 개선)
- **CH-98765**: Michael Chen (불면증/불안 - 60% 개선)

## 🏗️ 빌드 및 배포

### 로컬 빌드
```bash
npm run build
```

### Netlify 배포
1. GitHub 저장소를 Netlify에 연결
2. 빌드 설정:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. 환경 변수 설정 (Netlify 대시보드에서)

## 🔧 주요 기능

- ✅ 환자 차트 작성 및 관리
- ✅ AI 기반 진단 및 치료 계획 생성
- ✅ SOAP 리포트 생성
- ✅ 인쇄 기능
- ✅ 이메일 알림 (EmailJS)
- ✅ 반응형 디자인
- ✅ IndexedDB 기반 로컬 저장소

## 📁 프로젝트 구조

```
patient-chart/
├── components/          # React 컴포넌트
├── contexts/           # React 컨텍스트
├── hooks/              # 커스텀 훅
├── lib/                # 유틸리티 라이브러리
├── types/              # TypeScript 타입 정의
├── dist/               # 빌드된 파일들
├── netlify.toml        # Netlify 배포 설정
└── README.md           # 상세 문서
```

## 🆘 문제 해결

### 빌드 오류
```bash
# 의존성 재설치
rm -rf node_modules package-lock.json
npm install
```

### 환경 변수 오류
- `.env.local` 파일이 올바른 위치에 있는지 확인
- 환경 변수 이름이 정확한지 확인

### 데이터베이스 초기화
- 브라우저 개발자 도구에서 IndexedDB를 초기화할 수 있습니다
- 또는 시크릿 모드에서 새로 시작

## 📞 지원

문제가 발생하면 GitHub Issues에 문의하세요.
