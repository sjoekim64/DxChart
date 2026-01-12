# DxChart - 개발팀 전달용 스토리보드

## 📋 프로젝트 개요

### 프로젝트명
**DxChart (쉬운한의차트)** - 한의원 환자 차트 디지털 관리 시스템

### 목표
- 한의원에서 환자 차트를 디지털로 작성, 관리, 저장하는 시스템
- AI 기반 진단 및 치료 계획 자동 생성
- 향후 대용량 데이터베이스, 결재 시스템, 모바일 앱으로 확장

### 현재 상태
- ✅ 프로토타입 완료 (IndexedDB 기반 로컬 저장)
- ✅ 기본 기능 구현 완료
- ⏳ 프로덕션 환경으로 전환 필요 (서버 사이드 DB, API 서버)

---

## 🏗️ 현재 시스템 아키텍처

### 기술 스택

#### Frontend
- **Framework**: React 19.1.1 + TypeScript
- **Build Tool**: Vite 6.2.0
- **Styling**: Tailwind CSS 4.1.13
- **State Management**: React Context API
- **PDF Generation**: html2pdf.js

#### Backend (현재)
- **Database**: IndexedDB (브라우저 로컬 저장)
- **Authentication**: 로컬 토큰 기반

#### External Services
- **AI**: OpenAI API (GPT-4o-mini)
- **Email**: EmailJS (선택사항)

### 현재 데이터 저장 구조

```
IndexedDB (PatientChartDB)
├── users (사용자 정보)
│   ├── id (string)
│   ├── username (string)
│   ├── passwordHash (string)
│   ├── clinicName (string)
│   ├── therapistName (string)
│   ├── therapistLicenseNo (string)
│   ├── isApproved (boolean)
│   └── createdAt (string)
│
├── patientCharts (환자 차트)
│   ├── id (number, auto-increment)
│   ├── fileNo (string)
│   ├── userId (string)
│   ├── chartType ('new' | 'follow-up')
│   ├── chartData (string, JSON)
│   ├── date (string)
│   ├── createdAt (string)
│   └── updatedAt (string)
│
└── clinicInfo (클리닉 정보)
    ├── id (number)
    ├── userId (string)
    ├── clinicName (string)
    ├── clinicLogo (string, Base64)
    ├── therapistName (string)
    ├── therapistLicenseNo (string)
    └── updatedAt (string)
```

---

## 📊 데이터 모델 상세

### PatientData (환자 차트 데이터)

```typescript
interface PatientData {
  // 기본 정보
  chartType: 'new' | 'follow-up';
  patientType?: 'cash' | 'insurance' | 'pi' | 'worker-comp';
  clinicName: string;
  clinicLogo: string; // Base64
  fileNo: string;
  name: string;
  date: string;
  address: string;
  phone: string;
  occupation: string;
  dob: string;
  age: string;
  sex: 'M' | 'F' | '';
  
  // Vital Signs
  heightFt: string;
  heightIn: string;
  weight: string;
  temp: string;
  bpSystolic: string;
  bpDiastolic: string;
  heartRate: string;
  heartRhythm: string;
  lungRate: string;
  lungSound: string;
  
  // Chief Complaint (주소)
  chiefComplaint: {
    selectedComplaints: string[];
    otherComplaint: string;
    location: string;
    locationDetails: string[];
    onsetValue: string;
    onsetUnit: 'days' | 'weeks' | 'months' | 'years' | '';
    provocation: string[];
    palliation: string[];
    quality: string[];
    regionRadiation: string;
    severityScore: string;
    severityDescription: 'Minimal' | 'Slight' | 'Moderate' | 'Severe' | '';
    frequency: 'Occasional' | 'Intermittent' | 'Frequent' | 'Constant' | '';
    timing: string;
    possibleCause: string[];
    remark: string;
    presentIllness: string; // AI 생성 가능
    westernMedicalDiagnosis: string;
  };
  
  // Medical History (과거력)
  medicalHistory: {
    pastMedicalHistory: string[];
    medication: string[];
    familyHistory: string[];
    allergy: string[];
  };
  
  // Review of Systems (전신증상)
  reviewOfSystems: {
    coldHot: { sensation: 'cold' | 'hot' | 'normal' | ''; parts: string[] };
    sleep: { hours: string; quality: string[]; issues: string[] };
    sweat: { present: 'yes' | 'no' | ''; time: 'night' | 'day' | 'all time' | ''; parts: string[] };
    eye: { symptoms: string[] };
    mouthTongue: { symptoms: string; taste: string };
    throatNose: { symptoms: string[]; mucusColor: string[] };
    edema: { present: 'yes' | 'no' | ''; parts: string[] };
    drink: { thirsty: string; preference: string; amount: string };
    digestion: { symptoms: string[] };
    appetiteEnergy: { appetite: string; energy: string };
    stool: { frequencyValue: string; frequencyUnit: string; form: string; color: string; symptoms: string[] };
    urine: { frequencyDay: string; frequencyNight: string; amount: string; color: string; symptoms: string[] };
    menstruation: { cycle: string; duration: string; amount: string; color: string; symptoms: string[] };
    libido: { level: string };
  };
  
  // Tongue Diagnosis (설진)
  tongue: {
    body: {
      color: string;
      colorModifiers: string[];
      shape: string;
      shapeModifiers: string[];
      location: string;
      locationComments: string;
    };
    coating: {
      color: string;
      quality: string[];
      thickness: string;
      distribution: string;
      notes: string;
    };
  };
  
  // Pulse Diagnosis (맥진)
  pulse: {
    overall: string[];
    left: { cun: string[]; guan: string[]; chi: string[] };
    right: { cun: string[]; guan: string[]; chi: string[] };
    notes: string;
  };
  
  // Range of Motion (관절 가동범위)
  rangeOfMotion: {
    [jointName: string]: {
      flexion?: string;
      extension?: string;
      abduction?: string;
      adduction?: string;
      internalRotation?: string;
      externalRotation?: string;
      notes?: string;
    };
  };
  
  // Diagnosis & Treatment (진단 및 치료)
  diagnosisAndTreatment: {
    icd: string; // ICD-10 코드 (AI 생성 가능)
    tcmDiagnosis: string; // 한의학 진단 (AI 생성 가능)
    etiology: string; // 병인
    eightPrinciples: {
      exterior: boolean;
      interior: boolean;
      cold: boolean;
      heat: boolean;
      deficiency: boolean;
      excess: boolean;
      yin: boolean;
      yang: boolean;
    };
    treatmentPrinciple: string; // 치료 원칙
    acupuncturePoints: string; // 경혈
    acupunctureMethod: 'TCM Body' | 'Saam' | 'Master Tung' | 'Five Element' | 'Trigger Point' | 'Other';
    herbalTreatment: string; // 한약 처방
    otherTreatments: {
      selectedTreatments: string[];
      otherTreatmentText: string;
    };
    cpt: string; // CPT 코드
  };
  
  // Response to Care (치료 반응)
  respondToCare?: {
    improvement: string;
    worsening: string;
    unchanged: string;
    notes: string;
  };
  
  // Signatures (서명)
  patientSignature?: string; // Base64 이미지
  patientSignatureDate?: string;
  therapistSignature?: string; // Base64 이미지
  therapistSignatureDate?: string;
}
```

---

## 🎯 주요 기능

### 1. 사용자 관리
- ✅ 회원가입 (한의사 정보 입력)
- ✅ 로그인/로그아웃
- ✅ 관리자 승인 시스템
- ✅ 프로필 관리

### 2. 환자 차트 관리
- ✅ 신규 환자 차트 작성
- ✅ 재방문 환자 차트 작성
- ✅ 차트 수정/삭제
- ✅ 차트 검색 (파일번호, 이름)
- ✅ 차트 목록 조회

### 3. AI 기능
- ✅ Present Illness (현병력) 자동 생성
- ✅ TCM Diagnosis (한의학 진단) 자동 생성
- ✅ ICD-10 코드 자동 생성 (각 chief complaint마다)
- ✅ 영어 텍스트 개선 및 번역
- ✅ 근육명 한영 변환

### 4. PDF 기능
- ✅ 차트 PDF 다운로드
- ✅ 인쇄 최적화 레이아웃

### 5. 관리자 기능
- ✅ 사용자 승인/거부
- ✅ 사용자 목록 조회
- ✅ 알림 설정 (이메일/SMS)

---

## 🚀 향후 확장 계획

### Phase 1: 서버 사이드 전환 (우선순위: 높음)

#### 1.1 백엔드 API 서버 구축
- **기술 스택 제안**: Node.js + Express / Python + FastAPI
- **데이터베이스**: PostgreSQL 또는 MySQL
- **인증**: JWT 토큰 기반
- **파일 저장**: AWS S3 또는 클라우드 스토리지 (서명 이미지, PDF)

#### 1.2 데이터베이스 설계
```sql
-- 사용자 테이블
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  clinic_name VARCHAR(255) NOT NULL,
  therapist_name VARCHAR(255) NOT NULL,
  therapist_license_no VARCHAR(50) NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  approved_at TIMESTAMP,
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 환자 테이블
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  file_no VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  dob DATE,
  sex CHAR(1),
  address TEXT,
  phone VARCHAR(20),
  occupation VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, file_no)
);

-- 차트 테이블
CREATE TABLE charts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  chart_type VARCHAR(20) NOT NULL, -- 'new' or 'follow-up'
  visit_date DATE NOT NULL,
  chart_data JSONB NOT NULL, -- 전체 PatientData JSON
  icd_codes TEXT, -- 세미콜론으로 구분된 ICD 코드들
  tcm_diagnosis TEXT,
  patient_signature TEXT, -- Base64 또는 S3 URL
  patient_signature_date DATE,
  therapist_signature TEXT,
  therapist_signature_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_charts_user_id ON charts(user_id);
CREATE INDEX idx_charts_patient_id ON charts(patient_id);
CREATE INDEX idx_charts_visit_date ON charts(visit_date);
CREATE INDEX idx_charts_file_no ON charts USING GIN ((chart_data->>'fileNo'));
CREATE INDEX idx_charts_name ON charts USING GIN ((chart_data->>'name'));
```

#### 1.3 API 엔드포인트 설계
```
# 인증
POST   /api/auth/register          # 회원가입
POST   /api/auth/login             # 로그인
POST   /api/auth/refresh           # 토큰 갱신
POST   /api/auth/logout            # 로그아웃

# 사용자
GET    /api/users/me               # 내 정보 조회
PUT    /api/users/me              # 내 정보 수정
GET    /api/users                  # 사용자 목록 (관리자)
PUT    /api/users/:id/approve      # 사용자 승인 (관리자)

# 환자
GET    /api/patients               # 환자 목록
POST   /api/patients               # 환자 생성
GET    /api/patients/:id            # 환자 상세
PUT    /api/patients/:id            # 환자 수정
DELETE /api/patients/:id           # 환자 삭제
GET    /api/patients/search         # 환자 검색

# 차트
GET    /api/charts                 # 차트 목록
POST   /api/charts                 # 차트 생성
GET    /api/charts/:id              # 차트 상세
PUT    /api/charts/:id              # 차트 수정
DELETE /api/charts/:id              # 차트 삭제
GET    /api/patients/:id/charts     # 환자의 모든 차트

# AI 기능
POST   /api/ai/generate-hpi        # Present Illness 생성
POST   /api/ai/generate-diagnosis   # TCM Diagnosis 생성
POST   /api/ai/generate-icd         # ICD 코드 생성
POST   /api/ai/improve-text         # 텍스트 개선

# 파일
POST   /api/files/upload            # 파일 업로드 (서명, PDF)
GET    /api/files/:id               # 파일 다운로드
```

### Phase 2: 결재 시스템 (우선순위: 중간)

#### 2.1 결재 워크플로우
```
차트 작성 → 제출 → 관리자 검토 → 승인/반려 → 최종 저장
```

#### 2.2 데이터베이스 추가
```sql
-- 결재 테이블
CREATE TABLE approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chart_id UUID REFERENCES charts(id) ON DELETE CASCADE,
  submitted_by UUID REFERENCES users(id),
  submitted_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_comment TEXT,
  version INTEGER DEFAULT 1
);

-- 결재 히스토리
CREATE TABLE approval_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_id UUID REFERENCES approvals(id) ON DELETE CASCADE,
  action VARCHAR(20), -- 'submitted', 'approved', 'rejected', 'revised'
  performed_by UUID REFERENCES users(id),
  performed_at TIMESTAMP DEFAULT NOW(),
  comment TEXT
);
```

#### 2.3 기능
- 차트 제출 기능
- 관리자 대시보드에서 대기 중인 차트 목록
- 승인/반려 처리
- 반려 시 코멘트 및 수정 요청
- 결재 히스토리 조회

### Phase 3: 모바일 앱 (우선순위: 낮음)

#### 3.1 기술 스택 제안
- **React Native** 또는 **Flutter**
- **Expo** (React Native의 경우, 빠른 개발)

#### 3.2 주요 기능
- 모바일 최적화된 차트 작성 UI
- 오프라인 모드 지원 (로컬 저장 후 동기화)
- 카메라를 통한 서명 캡처
- 푸시 알림 (결재 상태, 알림 등)

#### 3.3 API 확장
- 모바일 앱용 인증 (OAuth2)
- 오프라인 동기화 API
- 푸시 알림 서버

---

## 🔐 보안 요구사항

### 인증 및 권한
- JWT 토큰 기반 인증
- 역할 기반 접근 제어 (RBAC)
  - Admin: 모든 권한
  - Therapist: 자신의 차트만 접근
- 토큰 만료 및 갱신

### 데이터 보안
- 비밀번호 해싱 (bcrypt, Argon2)
- HTTPS 필수
- 민감 정보 암호화 (환자 정보)
- SQL Injection 방지 (Prepared Statements)
- XSS 방지 (입력 검증 및 이스케이프)

### 규정 준수
- HIPAA 준수 (의료 정보 보호)
- GDPR 준수 (유럽 사용자)
- 개인정보보호법 준수 (한국)

---

## 📱 UI/UX 개선 사항

### 현재 UI 구조
```
App.tsx
├── AuthWrapper (로그인/회원가입)
├── AdminRoute (관리자 대시보드)
└── PatientChartApp
    ├── PatientList (차트 목록)
    ├── PatientForm (차트 작성/수정)
    ├── PrintableView (차트 보기/인쇄)
    └── ProfileManagement (프로필 관리)
```

### 개선 제안
- 반응형 디자인 강화 (모바일 최적화)
- 다크 모드 지원
- 접근성 개선 (WCAG 2.1 AA 준수)
- 로딩 상태 개선
- 에러 처리 개선

---

## 🧪 테스트 전략

### 단위 테스트
- React 컴포넌트 테스트 (Jest + React Testing Library)
- API 엔드포인트 테스트
- 유틸리티 함수 테스트

### 통합 테스트
- API 통합 테스트
- 데이터베이스 통합 테스트

### E2E 테스트
- Playwright 또는 Cypress
- 주요 사용자 플로우 테스트

---

## 📈 성능 최적화

### 현재 이슈
- IndexedDB는 로컬 저장에만 적합
- 대용량 데이터 처리 불가
- 동시 사용자 지원 불가

### 개선 방안
- 서버 사이드 페이징
- 데이터 캐싱 (Redis)
- CDN 사용 (정적 파일)
- 이미지 최적화 (서명, 로고)
- API 응답 최적화

---

## 📝 개발 로드맵

### 1단계: 백엔드 구축 (4-6주)
- [ ] API 서버 설정
- [ ] 데이터베이스 설계 및 구축
- [ ] 인증 시스템 구현
- [ ] 기본 CRUD API 구현
- [ ] AI 기능 API 구현

### 2단계: 프론트엔드 마이그레이션 (3-4주)
- [ ] API 클라이언트 구현
- [ ] IndexedDB → 서버 API 전환
- [ ] 에러 처리 개선
- [ ] 로딩 상태 개선

### 3단계: 결재 시스템 (3-4주)
- [ ] 결재 워크플로우 구현
- [ ] 관리자 대시보드 확장
- [ ] 알림 시스템 구현

### 4단계: 테스트 및 배포 (2-3주)
- [ ] 테스트 작성
- [ ] 성능 최적화
- [ ] 프로덕션 배포
- [ ] 모니터링 설정

### 5단계: 모바일 앱 (추후)
- [ ] 모바일 앱 개발
- [ ] 오프라인 동기화
- [ ] 푸시 알림

---

## 🔧 개발 환경 설정

### 필수 요구사항
- Node.js 18+
- PostgreSQL 14+ 또는 MySQL 8+
- Redis (캐싱용, 선택사항)

### 환경 변수
```env
# 데이터베이스
DATABASE_URL=postgresql://user:password@localhost:5432/dxchart
REDIS_URL=redis://localhost:6379

# 인증
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# OpenAI
OPENAI_API_KEY=sk-proj-...

# 파일 저장
AWS_S3_BUCKET=dxchart-files
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# 이메일
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
```

---

## 📞 문의 및 지원

프로젝트 관련 문의사항은 개발팀에 전달해주세요.

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025-01-08
