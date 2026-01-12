# 배포 전 백업 가이드

## 방법 1: Git 태그로 백업 (권장)

현재 상태를 Git 태그로 저장하면 언제든지 돌아올 수 있습니다.

```bash
# 1. 현재 변경사항 커밋
git add .
git commit -m "배포 전 백업: 현재 작업 상태 저장"

# 2. 백업 태그 생성
git tag -a backup-before-deploy-$(Get-Date -Format "yyyyMMdd") -m "배포 전 백업 태그"

# 3. 태그 확인
git tag

# 4. 나중에 이 상태로 돌아오려면
git checkout backup-before-deploy-20250108
```

## 방법 2: 수동 폴더 복사

1. 상위 폴더로 이동
2. `all-comp-patient-chart-input-backup` 폴더 생성
3. 다음 폴더/파일만 복사:
   - `src/` (있다면)
   - `components/`
   - `contexts/`
   - `lib/`
   - `types/`
   - `hooks/`
   - `public/`
   - `*.ts`, `*.tsx`, `*.json`, `*.md` 파일들
   - `.git/` (Git 히스토리)
   - `vite.config.ts`, `tsconfig.json`, `tailwind.config.js` 등 설정 파일

4. 제외할 것:
   - `node_modules/`
   - `dist/`
   - `dist-electron/`
   - `.env.local`
   - `.netlify/`

## 방법 3: Git 브랜치로 백업

```bash
# 현재 상태를 새 브랜치로 저장
git checkout -b backup-before-deploy-$(Get-Date -Format "yyyyMMdd")
git add .
git commit -m "배포 전 백업"
git checkout main  # 원래 브랜치로 돌아가기

# 나중에 이 브랜치로 돌아오려면
git checkout backup-before-deploy-20250108
```

## 배포 후 원래 상태로 돌아오기

### Git 태그 사용한 경우:
```bash
git checkout backup-before-deploy-20250108
```

### Git 브랜치 사용한 경우:
```bash
git checkout backup-before-deploy-20250108
```

### 수동 복사한 경우:
1. `all-comp-patient-chart-input-backup` 폴더의 내용을 원래 폴더로 복사
2. `npm install` 실행하여 의존성 재설치
