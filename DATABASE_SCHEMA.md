# DxChart 데이터베이스 스키마

## 데이터베이스 선택

**권장**: PostgreSQL 14+ (JSONB 지원, 확장성)

**대안**: MySQL 8+ (JSON 지원)

---

## 테이블 구조

### 1. users (사용자)

```sql
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
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_approved ON users(is_approved);
```

### 2. patients (환자)

```sql
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_no VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  dob DATE,
  sex CHAR(1) CHECK (sex IN ('M', 'F', '')),
  address TEXT,
  phone VARCHAR(20),
  occupation VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, file_no)
);

CREATE INDEX idx_patients_user_id ON patients(user_id);
CREATE INDEX idx_patients_file_no ON patients(file_no);
CREATE INDEX idx_patients_name ON patients(name);
CREATE INDEX idx_patients_user_file ON patients(user_id, file_no);
```

### 3. charts (차트)

```sql
CREATE TABLE charts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chart_type VARCHAR(20) NOT NULL CHECK (chart_type IN ('new', 'follow-up')),
  visit_date DATE NOT NULL,
  
  -- 전체 차트 데이터 (JSONB)
  chart_data JSONB NOT NULL,
  
  -- 검색 및 인덱싱을 위한 주요 필드 (중복 저장)
  file_no VARCHAR(50) NOT NULL,
  patient_name VARCHAR(255) NOT NULL,
  icd_codes TEXT, -- 세미콜론으로 구분
  tcm_diagnosis TEXT,
  
  -- 서명 (Base64 또는 S3 URL)
  patient_signature TEXT,
  patient_signature_date DATE,
  therapist_signature TEXT,
  therapist_signature_date DATE,
  
  -- 결재 상태
  approval_status VARCHAR(20) DEFAULT 'draft' CHECK (approval_status IN ('draft', 'submitted', 'approved', 'rejected')),
  submitted_at TIMESTAMP,
  approved_at TIMESTAMP,
  approved_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_charts_user_id ON charts(user_id);
CREATE INDEX idx_charts_patient_id ON charts(patient_id);
CREATE INDEX idx_charts_visit_date ON charts(visit_date);
CREATE INDEX idx_charts_file_no ON charts(file_no);
CREATE INDEX idx_charts_patient_name ON charts(patient_name);
CREATE INDEX idx_charts_approval_status ON charts(approval_status);
CREATE INDEX idx_charts_user_visit ON charts(user_id, visit_date DESC);

-- JSONB 인덱스 (GIN)
CREATE INDEX idx_charts_chart_data_gin ON charts USING GIN (chart_data);
CREATE INDEX idx_charts_chart_data_file_no ON charts USING GIN ((chart_data->>'fileNo'));
CREATE INDEX idx_charts_chart_data_name ON charts USING GIN ((chart_data->>'name'));
```

### 4. approvals (결재)

```sql
CREATE TABLE approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chart_id UUID NOT NULL REFERENCES charts(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES users(id),
  submitted_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revised')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_comment TEXT,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_approvals_chart_id ON approvals(chart_id);
CREATE INDEX idx_approvals_status ON approvals(status);
CREATE INDEX idx_approvals_submitted_by ON approvals(submitted_by);
CREATE INDEX idx_approvals_reviewed_by ON approvals(reviewed_by);
```

### 5. approval_history (결재 히스토리)

```sql
CREATE TABLE approval_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_id UUID NOT NULL REFERENCES approvals(id) ON DELETE CASCADE,
  action VARCHAR(20) NOT NULL CHECK (action IN ('submitted', 'approved', 'rejected', 'revised')),
  performed_by UUID NOT NULL REFERENCES users(id),
  performed_at TIMESTAMP DEFAULT NOW(),
  comment TEXT,
  previous_status VARCHAR(20),
  new_status VARCHAR(20)
);

CREATE INDEX idx_approval_history_approval_id ON approval_history(approval_id);
CREATE INDEX idx_approval_history_performed_by ON approval_history(performed_by);
CREATE INDEX idx_approval_history_performed_at ON approval_history(performed_at DESC);
```

### 6. clinic_info (클리닉 정보)

```sql
CREATE TABLE clinic_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  clinic_name VARCHAR(255) NOT NULL,
  clinic_logo TEXT, -- Base64 또는 S3 URL
  therapist_name VARCHAR(255) NOT NULL,
  therapist_license_no VARCHAR(50) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_clinic_info_user_id ON clinic_info(user_id);
```

### 7. notifications (알림)

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'approval_request', 'approval_result', 'login_alert', etc.
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  related_id UUID, -- 관련 차트 ID, 결재 ID 등
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

### 8. audit_logs (감사 로그)

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL, -- 'create_chart', 'update_chart', 'delete_chart', 'login', etc.
  resource_type VARCHAR(50), -- 'chart', 'patient', 'user', etc.
  resource_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

---

## 뷰 (Views)

### 1. 차트 요약 뷰

```sql
CREATE VIEW chart_summary AS
SELECT 
  c.id,
  c.patient_id,
  c.user_id,
  c.file_no,
  c.patient_name,
  c.chart_type,
  c.visit_date,
  c.icd_codes,
  c.tcm_diagnosis,
  c.approval_status,
  c.created_at,
  c.updated_at,
  p.dob,
  p.sex,
  p.phone,
  u.clinic_name,
  u.therapist_name
FROM charts c
JOIN patients p ON c.patient_id = p.id
JOIN users u ON c.user_id = u.id;
```

### 2. 결재 대기 목록 뷰

```sql
CREATE VIEW pending_approvals AS
SELECT 
  a.id as approval_id,
  a.chart_id,
  a.submitted_at,
  a.review_comment,
  c.file_no,
  c.patient_name,
  c.visit_date,
  c.icd_codes,
  u1.therapist_name as submitted_by_name,
  u1.clinic_name as submitted_clinic
FROM approvals a
JOIN charts c ON a.chart_id = c.id
JOIN users u1 ON a.submitted_by = u1.id
WHERE a.status = 'pending'
ORDER BY a.submitted_at ASC;
```

---

## 트리거 (Triggers)

### 1. updated_at 자동 업데이트

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_charts_updated_at BEFORE UPDATE ON charts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_approvals_updated_at BEFORE UPDATE ON approvals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. 결재 히스토리 자동 기록

```sql
CREATE OR REPLACE FUNCTION log_approval_history()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO approval_history (
      approval_id,
      action,
      performed_by,
      previous_status,
      new_status,
      comment
    ) VALUES (
      NEW.id,
      NEW.status,
      NEW.reviewed_by,
      OLD.status,
      NEW.status,
      NEW.review_comment
    );
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER approval_history_trigger
  AFTER UPDATE ON approvals
  FOR EACH ROW
  EXECUTE FUNCTION log_approval_history();
```

---

## 마이그레이션 전략

### IndexedDB → PostgreSQL 마이그레이션

1. **데이터 추출**
   - IndexedDB에서 모든 데이터를 JSON으로 추출
   - 사용자, 환자, 차트 데이터 분리

2. **데이터 변환**
   - JSON 데이터를 PostgreSQL 스키마에 맞게 변환
   - 관계 설정 (user_id, patient_id)

3. **데이터 임포트**
   - 배치 처리로 데이터 임포트
   - 무결성 검증

4. **검증**
   - 데이터 일치성 확인
   - 통계 비교

---

## 백업 전략

### 자동 백업
- 일일 전체 백업
- 주간 증분 백업
- 월간 아카이브

### 백업 저장소
- AWS S3 또는 클라우드 스토리지
- 암호화 저장

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025-01-08
