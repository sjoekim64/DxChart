# Netlify 배포 가이드

## 🚀 Netlify 배포 단계

### 1. GitHub에 코드 푸시 (필수)

```bash
# 현재 디렉토리에서
git add .
git commit -m "Netlify 배포 준비"
git push origin main
```

### 2. Netlify 계정 생성 및 프로젝트 연결

1. **Netlify 접속**: https://www.netlify.com
2. **GitHub 계정으로 로그인**
3. **"Add new site" → "Import an existing project"** 클릭
4. **GitHub 저장소 선택**
5. **빌드 설정** (자동으로 감지되지만 확인):
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Base directory**: (비워두기)

### 3. 환경 변수 설정

Netlify 대시보드에서:
1. **Site settings** → **Environment variables** 클릭
2. 다음 변수 추가:

```
VITE_OPENAI_API_KEY=sk-proj-your-api-key-here
EMAILJS_SERVICE_ID=your_emailjs_service_id
EMAILJS_TEMPLATE_ID=your_emailjs_template_id
EMAILJS_PUBLIC_KEY=your_emailjs_public_key
```

### 4. 배포 확인

- 배포가 완료되면 `https://your-site-name.netlify.app` 주소로 접근 가능
- **Site settings** → **Change site name**에서 사이트 이름 변경 가능

## 🔧 IndexedDB 문제 해결 (Vercel에서 발생했던 문제)

Vercel에서 로그인할 때마다 비밀번호를 바꿔야 하는 문제는 IndexedDB 저장 방식 때문일 수 있습니다. 

### 해결 방법:

1. **브라우저 캐시 확인**
   - 브라우저 개발자 도구 → Application → Storage → Clear site data
   - IndexedDB가 제대로 저장되는지 확인

2. **HTTPS 사용 확인**
   - IndexedDB는 HTTPS에서 더 안정적으로 동작합니다
   - Netlify는 자동으로 HTTPS를 제공합니다

3. **브라우저별 확인**
   - Chrome, Safari, Firefox에서 각각 테스트
   - 일부 브라우저는 IndexedDB를 다르게 처리할 수 있습니다

## 📝 배포 후 확인 사항

1. ✅ 로그인/로그아웃이 정상 작동하는지
2. ✅ 환자 차트가 저장되고 불러와지는지
3. ✅ AI 기능이 작동하는지 (API 키 확인)
4. ✅ PDF 다운로드가 작동하는지

## 🔄 배포 업데이트

코드를 수정한 후:

```bash
git add .
git commit -m "업데이트 내용"
git push origin main
```

Netlify가 자동으로 재배포합니다.

## 🆘 문제 해결

### 빌드 실패 시:
- Netlify 대시보드 → **Deploys** → **Deploy log** 확인
- 환경 변수가 제대로 설정되었는지 확인

### IndexedDB 문제 지속 시:
- 브라우저 개발자 도구 → Console에서 에러 확인
- Application → IndexedDB에서 데이터 확인
- 필요시 데이터베이스 버전 업그레이드 고려
