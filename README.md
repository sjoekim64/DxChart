# DxChart - Patient Chart System

쉬운한의차트 - 환자 차트 관리 시스템

## 개요

이 애플리케이션은 한의원에서 환자 차트를 디지털로 관리할 수 있는 시스템입니다.

## 주요 기능

- 환자 정보 관리
- 차트 작성 및 관리 (신규/재방문)
- PDF 다운로드
- AI 기반 진단 및 치료 계획 생성
- 사용자 프로필 관리
- 관리자 대시보드

## 로컬 실행 방법

**필수사항:** Node.js 18 이상

1. 의존성 설치:
   ```bash
   npm install
   ```

2. 환경 변수 설정:
   `.env.local` 파일에 다음 변수 설정:
   ```
   VITE_OPENAI_API_KEY=your_openai_api_key
   EMAILJS_SERVICE_ID=your_emailjs_service_id
   EMAILJS_TEMPLATE_ID=your_emailjs_template_id
   EMAILJS_PUBLIC_KEY=your_emailjs_public_key
   ```

3. 애플리케이션 실행:
   ```bash
   npm run dev
   ```

## 배포

웹에 배포하여 어디서든 접근 가능하도록 설정할 수 있습니다.

자세한 배포 가이드는 다음 파일을 참고하세요:
- `QUICK_DEPLOY.md` - 빠른 배포 가이드 (5분)
- `DEPLOYMENT_GUIDE.md` - 상세한 배포 가이드

### 빠른 배포 (Vercel)

1. GitHub에 코드 푸시
2. https://vercel.com 에서 프로젝트 import
3. 환경 변수 설정
4. 배포 완료!

## 관리자 계정

- Username: `admin`
- Password: `joe007007`

관리자로 로그인하면 사용자 승인 및 관리가 가능합니다.

## 기술 스택

- React + TypeScript
- Vite
- Tailwind CSS
- IndexedDB (로컬 데이터베이스)
- OpenAI API

## 라이선스

Private
