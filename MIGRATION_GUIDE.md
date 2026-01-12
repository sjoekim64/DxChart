# IndexedDB → 서버 사이드 마이그레이션 가이드

## 개요

현재 IndexedDB 기반 로컬 저장소를 서버 사이드 데이터베이스로 마이그레이션하는 방법을 설명합니다.

---

## 1단계: 데이터 추출

### 현재 IndexedDB에서 데이터 추출

```javascript
// 브라우저 콘솔에서 실행
async function exportAllData() {
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('PatientChartDB', 4);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  // 사용자 데이터 추출
  const users = await new Promise((resolve, reject) => {
    const transaction = db.transaction(['users'], 'readonly');
    const store = transaction.objectStore('users');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  // 차트 데이터 추출
  const charts = await new Promise((resolve, reject) => {
    const transaction = db.transaction(['patientCharts'], 'readonly');
    const store = transaction.objectStore('patientCharts');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  // 클리닉 정보 추출
  const clinicInfo = await new Promise((resolve, reject) => {
    const transaction = db.transaction(['clinicInfo'], 'readonly');
    const store = transaction.objectStore('clinicInfo');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  const exportData = {
    users,
    charts,
    clinicInfo,
    exportedAt: new Date().toISOString()
  };

  // JSON 파일로 다운로드
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dxchart-export-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);

  return exportData;
}

exportAllData().then(data => {
  console.log('✅ 데이터 추출 완료:', {
    users: data.users.length,
    charts: data.charts.length,
    clinicInfo: data.clinicInfo.length
  });
});
```

---

## 2단계: 데이터 변환

### Node.js 스크립트로 데이터 변환

```javascript
// migrate-data.js
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// 추출된 JSON 파일 읽기
const exportData = JSON.parse(fs.readFileSync('dxchart-export-2025-01-08.json', 'utf8'));

// 사용자 매핑 (기존 ID → 새 UUID)
const userMap = new Map();

// 사용자 변환
const users = exportData.users.map(user => {
  const newId = uuidv4();
  userMap.set(user.id, newId);
  
  return {
    id: newId,
    username: user.username,
    email: user.email || null,
    password_hash: user.passwordHash,
    clinic_name: user.clinicName,
    therapist_name: user.therapistName,
    therapist_license_no: user.therapistLicenseNo,
    is_approved: user.isApproved || false,
    approved_at: user.approvedAt || null,
    approved_by: user.approvedBy ? userMap.get(user.approvedBy) : null,
    created_at: user.createdAt,
    updated_at: user.updatedAt || user.createdAt
  };
});

// 환자 매핑
const patientMap = new Map();
const patients = [];
const patientKeyMap = new Map(); // (userId, fileNo) → patientId

// 차트에서 환자 정보 추출
exportData.charts.forEach(chart => {
  const chartData = JSON.parse(chart.chartData);
  const key = `${chart.userId}_${chart.fileNo}`;
  
  if (!patientKeyMap.has(key)) {
    const patientId = uuidv4();
    patientKeyMap.set(key, patientId);
    
    patients.push({
      id: patientId,
      user_id: userMap.get(chart.userId),
      file_no: chart.fileNo,
      name: chartData.name,
      dob: chartData.dob || null,
      sex: chartData.sex || null,
      address: chartData.address || null,
      phone: chartData.phone || null,
      occupation: chartData.occupation || null,
      created_at: chart.date,
      updated_at: chart.updatedAt || chart.createdAt
    });
    
    patientMap.set(chart.fileNo, patientId);
  }
});

// 차트 변환
const charts = exportData.charts.map(chart => {
  const chartData = JSON.parse(chart.chartData);
  const patientId = patientKeyMap.get(`${chart.userId}_${chart.fileNo}`);
  
  return {
    id: uuidv4(),
    patient_id: patientId,
    user_id: userMap.get(chart.userId),
    chart_type: chart.chartType,
    visit_date: chart.date,
    chart_data: chartData,
    file_no: chart.fileNo,
    patient_name: chartData.name,
    icd_codes: chartData.diagnosisAndTreatment?.icd || null,
    tcm_diagnosis: chartData.diagnosisAndTreatment?.tcmDiagnosis || null,
    patient_signature: chartData.patientSignature || null,
    patient_signature_date: chartData.patientSignatureDate || null,
    therapist_signature: chartData.therapistSignature || null,
    therapist_signature_date: chartData.therapistSignatureDate || null,
    approval_status: 'approved', // 기존 데이터는 모두 승인된 것으로 간주
    created_at: chart.createdAt,
    updated_at: chart.updatedAt || chart.createdAt
  };
});

// 클리닉 정보 변환
const clinicInfo = exportData.clinicInfo.map(info => ({
  id: uuidv4(),
  user_id: userMap.get(info.userId),
  clinic_name: info.clinicName,
  clinic_logo: info.clinicLogo || null,
  therapist_name: info.therapistName,
  therapist_license_no: info.therapistLicenseNo,
  updated_at: info.updatedAt || new Date().toISOString()
}));

// 변환된 데이터 저장
const migratedData = {
  users,
  patients,
  charts,
  clinicInfo,
  migratedAt: new Date().toISOString()
};

fs.writeFileSync('migrated-data.json', JSON.stringify(migratedData, null, 2));
console.log('✅ 데이터 변환 완료:', {
  users: users.length,
  patients: patients.length,
  charts: charts.length,
  clinicInfo: clinicInfo.length
});
```

---

## 3단계: 데이터베이스 임포트

### PostgreSQL 임포트 스크립트

```javascript
// import-to-db.js
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function importData() {
  const migratedData = JSON.parse(fs.readFileSync('migrated-data.json', 'utf8'));
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 사용자 임포트
    for (const user of migratedData.users) {
      await client.query(`
        INSERT INTO users (
          id, username, email, password_hash, clinic_name, 
          therapist_name, therapist_license_no, is_approved, 
          approved_at, approved_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO NOTHING
      `, [
        user.id, user.username, user.email, user.password_hash,
        user.clinic_name, user.therapist_name, user.therapist_license_no,
        user.is_approved, user.approved_at, user.approved_by,
        user.created_at, user.updated_at
      ]);
    }
    
    // 환자 임포트
    for (const patient of migratedData.patients) {
      await client.query(`
        INSERT INTO patients (
          id, user_id, file_no, name, dob, sex, 
          address, phone, occupation, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (user_id, file_no) DO UPDATE
        SET name = EXCLUDED.name, updated_at = EXCLUDED.updated_at
      `, [
        patient.id, patient.user_id, patient.file_no, patient.name,
        patient.dob, patient.sex, patient.address, patient.phone,
        patient.occupation, patient.created_at, patient.updated_at
      ]);
    }
    
    // 차트 임포트
    for (const chart of migratedData.charts) {
      await client.query(`
        INSERT INTO charts (
          id, patient_id, user_id, chart_type, visit_date,
          chart_data, file_no, patient_name, icd_codes, tcm_diagnosis,
          patient_signature, patient_signature_date,
          therapist_signature, therapist_signature_date,
          approval_status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      `, [
        chart.id, chart.patient_id, chart.user_id, chart.chart_type,
        chart.visit_date, JSON.stringify(chart.chart_data), chart.file_no,
        chart.patient_name, chart.icd_codes, chart.tcm_diagnosis,
        chart.patient_signature, chart.patient_signature_date,
        chart.therapist_signature, chart.therapist_signature_date,
        chart.approval_status, chart.created_at, chart.updated_at
      ]);
    }
    
    // 클리닉 정보 임포트
    for (const info of migratedData.clinicInfo) {
      await client.query(`
        INSERT INTO clinic_info (
          id, user_id, clinic_name, clinic_logo,
          therapist_name, therapist_license_no, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (user_id) DO UPDATE
        SET clinic_name = EXCLUDED.clinic_name,
            clinic_logo = EXCLUDED.clinic_logo,
            updated_at = EXCLUDED.updated_at
      `, [
        info.id, info.user_id, info.clinic_name, info.clinic_logo,
        info.therapist_name, info.therapist_license_no, info.updated_at
      ]);
    }
    
    await client.query('COMMIT');
    console.log('✅ 데이터 임포트 완료');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 임포트 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

importData()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
```

---

## 4단계: 프론트엔드 마이그레이션

### API 클라이언트 생성

```typescript
// lib/apiClient.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API 요청 실패');
    }

    return response.json();
  }

  // 환자 API
  async getPatients(params?: { page?: number; limit?: number; search?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    
    return this.request(`/patients?${query.toString()}`);
  }

  async createPatient(patientData: any) {
    return this.request('/patients', {
      method: 'POST',
      body: JSON.stringify(patientData),
    });
  }

  // 차트 API
  async getCharts(params?: { patientId?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.patientId) query.append('patientId', params.patientId);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    
    return this.request(`/charts?${query.toString()}`);
  }

  async createChart(chartData: any) {
    return this.request('/charts', {
      method: 'POST',
      body: JSON.stringify(chartData),
    });
  }

  async updateChart(id: string, chartData: any) {
    return this.request(`/charts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(chartData),
    });
  }

  async deleteChart(id: string) {
    return this.request(`/charts/${id}`, {
      method: 'DELETE',
    });
  }

  // AI API
  async generateHPI(data: any) {
    return this.request('/ai/generate-hpi', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateDiagnosis(data: any) {
    return this.request('/ai/generate-diagnosis', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateICD(data: any) {
    return this.request('/ai/generate-icd', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();
```

### 기존 IndexedDB 코드를 API 호출로 교체

```typescript
// App.tsx 수정 예시
// 기존: const charts = await database.getPatientCharts(user.id);
// 변경: const charts = await apiClient.getCharts({ userId: user.id });
```

---

## 검증

### 데이터 일치성 확인

```sql
-- 사용자 수 확인
SELECT COUNT(*) FROM users;

-- 환자 수 확인
SELECT COUNT(*) FROM patients;

-- 차트 수 확인
SELECT COUNT(*) FROM charts;

-- 사용자별 차트 수
SELECT 
  u.username,
  u.clinic_name,
  COUNT(c.id) as chart_count
FROM users u
LEFT JOIN charts c ON u.id = c.user_id
GROUP BY u.id, u.username, u.clinic_name
ORDER BY chart_count DESC;
```

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025-01-08
