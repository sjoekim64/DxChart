# 웹 배포 가이드 - 누구나 사용할 수 있도록 배포하기

이 가이드는 Patient Chart System을 웹에 배포하여 어디서든 접근할 수 있도록 하는 방법을 안내합니다.

## 🚀 빠른 배포 방법 (3가지 옵션)

### 옵션 1: Vercel 배포 (가장 추천 ⭐)

**장점**: 가장 간단하고 빠름, 자동 HTTPS, 무료 플랜 제공

#### 단계별 가이드:

1. **GitHub에 코드 업로드**
   ```bash
   # Git 저장소 초기화 (아직 안 했다면)
   git init
   git add .
   git commit -m "Initial commit"
   
   # GitHub에 새 저장소 생성 후
   git remote add origin https://github.com/yourusername/patient-chart-system.git
   git push -u origin main
   ```

2. **Vercel 계정 생성**
   - https://vercel.com 접속
   - GitHub 계정으로 로그인

3. **프로젝트 배포**
   - Vercel 대시보드에서 "Add New Project" 클릭
   - GitHub 저장소 선택
   - 프로젝트 설정:
     - **Framework Preset**: Vite
     - **Root Directory**: `./` (기본값)
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
   - "Deploy" 클릭

4. **환경 변수 설정** (Vercel 대시보드에서)
   - Settings → Environment Variables
   - 다음 변수 추가:
     ```
     VITE_OPENAI_API_KEY=your_openai_api_key
     EMAILJS_SERVICE_ID=your_emailjs_service_id
     EMAILJS_TEMPLATE_ID=your_emailjs_template_id
     EMAILJS_PUBLIC_KEY=your_emailjs_public_key
     ```

5. **완료!**
   - 배포 후 `https://your-project-name.vercel.app` 주소로 접근 가능
   - 이 주소를 다른 사람들에게 공유하면 됩니다!

---

### 옵션 2: Netlify 배포

**장점**: 이미 설정 파일이 있음, 무료 플랜 제공

#### 단계별 가이드:

1. **GitHub에 코드 업로드** (옵션 1과 동일)

2. **Netlify 계정 생성**
   - https://www.netlify.com 접속
   - GitHub 계정으로 로그인

3. **프로젝트 배포**
   - "Add new site" → "Import an existing project"
   - GitHub 저장소 선택
   - 빌드 설정 (자동으로 감지됨):
     - **Build command**: `npm run build`
     - **Publish directory**: `dist`

4. **환경 변수 설정** (Netlify 대시보드에서)
   - Site settings → Environment variables
   - 다음 변수 추가:
     ```
     VITE_OPENAI_API_KEY=your_openai_api_key
     EMAILJS_SERVICE_ID=your_emailjs_service_id
     EMAILJS_TEMPLATE_ID=your_emailjs_template_id
     EMAILJS_PUBLIC_KEY=your_emailjs_public_key
     ```

5. **완료!**
   - 배포 후 `https://your-project-name.netlify.app` 주소로 접근 가능

---

### 옵션 3: GitHub Pages 배포

**장점**: 완전 무료, GitHub과 통합

#### 단계별 가이드:

1. **GitHub에 코드 업로드**

2. **GitHub Actions 설정**
   - `.github/workflows/deploy.yml` 파일 생성:
   ```yaml
   name: Deploy to GitHub Pages
   
   on:
     push:
       branches: [ main ]
   
   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: '20'
         - run: npm ci
         - run: npm run build
         - uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./dist
   ```

3. **GitHub 저장소 설정**
   - Settings → Pages
   - Source: GitHub Actions 선택

4. **환경 변수 설정**
   - Settings → Secrets and variables → Actions
   - 필요한 환경 변수 추가

5. **완료!**
   - 배포 후 `https://yourusername.github.io/patient-chart-system` 주소로 접근 가능

---

## 📋 배포 전 체크리스트

### 필수 확인 사항:

- [ ] `.env.local` 파일이 `.gitignore`에 포함되어 있는지 확인
- [ ] API 키가 코드에 하드코딩되어 있지 않은지 확인
- [ ] `npm run build` 명령이 정상 작동하는지 확인
- [ ] 빌드된 `dist` 폴더가 생성되는지 확인

### 환경 변수 준비:

다음 정보를 준비하세요:
- OpenAI API Key (AI 기능 사용 시)
- EmailJS 설정 (이메일 알림 사용 시)
  - Service ID
  - Template ID
  - Public Key

---

## 🔧 로컬에서 빌드 테스트

배포 전에 로컬에서 빌드가 정상 작동하는지 확인:

```bash
# 의존성 설치
npm install

# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

`npm run preview`를 실행하면 `http://localhost:4173`에서 빌드된 결과를 확인할 수 있습니다.

---

## 🌐 배포 후 확인 사항

1. **기본 기능 테스트**
   - 로그인/회원가입
   - 환자 차트 생성
   - PDF 다운로드

2. **IndexedDB 확인**
   - 브라우저 개발자 도구 → Application → IndexedDB
   - 데이터가 정상 저장되는지 확인

3. **반응형 디자인 확인**
   - 모바일, 태블릿, 데스크톱에서 테스트

4. **HTTPS 확인**
   - 모든 주요 배포 플랫폼은 자동으로 HTTPS 제공

---

## 🔐 보안 고려사항

### 현재 구조의 특징:

- **IndexedDB 사용**: 각 사용자의 브라우저에 데이터가 저장됩니다
- **장점**: 서버 비용 없음, 개인정보 보호
- **주의사항**: 
  - 사용자가 브라우저 데이터를 삭제하면 모든 데이터가 사라집니다
  - 다른 기기에서 접속하면 데이터를 볼 수 없습니다
  - 브라우저별로 독립적인 데이터베이스입니다

### 향후 개선 가능 사항:

서버 기반 데이터베이스로 전환하면:
- 모든 기기에서 동일한 데이터 접근 가능
- 데이터 백업 및 복구 가능
- 다중 사용자 협업 가능

---

## 📞 문제 해결

### 빌드 오류
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 환경 변수 오류
- Vercel/Netlify 대시보드에서 환경 변수가 올바르게 설정되었는지 확인
- 변수명에 `VITE_` 접두사가 필요한지 확인

### IndexedDB 오류
- HTTPS 또는 localhost에서만 작동합니다
- 배포 플랫폼은 자동으로 HTTPS를 제공하므로 문제 없습니다

---

## 🎉 배포 완료 후

배포가 완료되면:
1. 배포된 URL을 다른 사람들에게 공유
2. 사용자들이 회원가입 후 사용 시작
3. 관리자는 `admin` / `joe007007`로 로그인하여 사용자 승인

**추천 배포 플랫폼**: Vercel (가장 간단하고 빠름)

