# 🚀 빠른 배포 가이드 (5분 안에 배포하기)

## Vercel로 배포하기 (가장 간단!)

### 1단계: GitHub에 코드 업로드 (2분)

터미널에서 실행:

```bash
# Git 초기화 (처음 한 번만)
git init
git add .
git commit -m "Ready for deployment"

# GitHub에 새 저장소 생성 후 (github.com에서)
git remote add origin https://github.com/yourusername/patient-chart-system.git
git branch -M main
git push -u origin main
```

### 2단계: Vercel에 배포 (3분)

1. **https://vercel.com** 접속
2. "Sign Up" → GitHub로 로그인
3. "Add New Project" 클릭
4. 방금 만든 GitHub 저장소 선택
5. 설정 확인:
   - Framework: **Vite** (자동 감지됨)
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. "Deploy" 클릭!

### 3단계: 환경 변수 설정 (선택사항)

AI 기능이나 이메일 알림을 사용하려면:

1. Vercel 대시보드 → 프로젝트 선택
2. Settings → Environment Variables
3. 다음 변수 추가:
   ```
   VITE_OPENAI_API_KEY=your_key_here
   EMAILJS_SERVICE_ID=your_id_here
   EMAILJS_TEMPLATE_ID=your_id_here
   EMAILJS_PUBLIC_KEY=your_key_here
   ```
4. "Redeploy" 클릭

### 완료! 🎉

배포 후 받은 URL (예: `https://patient-chart.vercel.app`)을 다른 사람들에게 공유하세요!

---

## ⚠️ 중요 참고사항

### 현재 시스템의 데이터 저장 방식

- **IndexedDB 사용**: 각 사용자의 브라우저에 데이터 저장
- **장점**: 서버 비용 없음, 빠른 속도
- **주의**: 
  - 브라우저 데이터 삭제 시 모든 데이터 사라짐
  - 다른 기기/브라우저에서는 데이터 접근 불가
  - 각 사용자는 자신의 브라우저에서만 데이터 확인 가능

### 사용자 안내

사용자들에게 다음을 안내하세요:
- 같은 브라우저에서만 데이터가 유지됩니다
- 브라우저 데이터를 삭제하지 마세요
- 중요한 데이터는 PDF로 다운로드하여 백업하세요

---

## 🔄 업데이트 배포

코드를 수정한 후:

```bash
git add .
git commit -m "Update features"
git push
```

Vercel이 자동으로 새 버전을 배포합니다!

