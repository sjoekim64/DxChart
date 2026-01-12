# DxChart API 명세서

## 기본 정보

- **Base URL**: `https://api.dxchart.com/v1` (예시)
- **인증 방식**: JWT Bearer Token
- **Content-Type**: `application/json`

## 인증

### 헤더
```
Authorization: Bearer <token>
Content-Type: application/json
```

---

## 인증 API

### 1. 회원가입
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "username": "therapist01",
  "email": "therapist@example.com",
  "password": "securePassword123",
  "clinicName": "Wellness Clinic",
  "therapistName": "Dr. Kim",
  "therapistLicenseNo": "LIC12345"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "therapist01",
      "email": "therapist@example.com",
      "clinicName": "Wellness Clinic",
      "therapistName": "Dr. Kim",
      "isApproved": false
    },
    "token": "jwt-token"
  }
}
```

### 2. 로그인
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "username": "therapist01",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "therapist01",
      "clinicName": "Wellness Clinic",
      "therapistName": "Dr. Kim",
      "isApproved": true
    },
    "token": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

### 3. 토큰 갱신
```http
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "refresh-token"
}
```

---

## 환자 API

### 1. 환자 목록 조회
```http
GET /api/patients?page=1&limit=20&search=keyword
```

**Query Parameters:**
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 20)
- `search`: 검색어 (파일번호 또는 이름)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "patients": [
      {
        "id": "uuid",
        "fileNo": "100101",
        "name": "John Doe",
        "dob": "1980-01-01",
        "sex": "M",
        "phone": "010-1234-5678",
        "lastVisitDate": "2025-01-08",
        "totalCharts": 5
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### 2. 환자 생성
```http
POST /api/patients
```

**Request Body:**
```json
{
  "fileNo": "100101",
  "name": "John Doe",
  "dob": "1980-01-01",
  "sex": "M",
  "address": "123 Main St",
  "phone": "010-1234-5678",
  "occupation": "Engineer"
}
```

### 3. 환자 상세 조회
```http
GET /api/patients/:id
```

### 4. 환자 수정
```http
PUT /api/patients/:id
```

### 5. 환자 삭제
```http
DELETE /api/patients/:id
```

---

## 차트 API

### 1. 차트 목록 조회
```http
GET /api/charts?patientId=uuid&page=1&limit=20
```

**Query Parameters:**
- `patientId`: 환자 ID (선택)
- `page`: 페이지 번호
- `limit`: 페이지당 항목 수
- `startDate`: 시작 날짜 (YYYY-MM-DD)
- `endDate`: 종료 날짜 (YYYY-MM-DD)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "charts": [
      {
        "id": "uuid",
        "patientId": "uuid",
        "fileNo": "100101",
        "patientName": "John Doe",
        "chartType": "new",
        "visitDate": "2025-01-08",
        "icdCodes": "M54.2(cervicalgia); M25.51(pain in shoulder)",
        "tcmDiagnosis": "Neck and shoulder pain",
        "createdAt": "2025-01-08T10:00:00Z",
        "updatedAt": "2025-01-08T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50
    }
  }
}
```

### 2. 차트 생성
```http
POST /api/charts
```

**Request Body:**
```json
{
  "patientId": "uuid",
  "chartType": "new",
  "visitDate": "2025-01-08",
  "chartData": {
    // 전체 PatientData 객체
  },
  "icdCodes": "M54.2(cervicalgia); M25.51(pain in shoulder)",
  "tcmDiagnosis": "Neck and shoulder pain"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "patientId": "uuid",
    "chartType": "new",
    "visitDate": "2025-01-08",
    "createdAt": "2025-01-08T10:00:00Z"
  }
}
```

### 3. 차트 상세 조회
```http
GET /api/charts/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "patientId": "uuid",
    "fileNo": "100101",
    "patientName": "John Doe",
    "chartType": "new",
    "visitDate": "2025-01-08",
    "chartData": {
      // 전체 PatientData 객체
    },
    "icdCodes": "M54.2(cervicalgia); M25.51(pain in shoulder)",
    "tcmDiagnosis": "Neck and shoulder pain",
    "patientSignature": "data:image/png;base64,...",
    "patientSignatureDate": "2025-01-08",
    "therapistSignature": "data:image/png;base64,...",
    "therapistSignatureDate": "2025-01-08",
    "createdAt": "2025-01-08T10:00:00Z",
    "updatedAt": "2025-01-08T10:00:00Z"
  }
}
```

### 4. 차트 수정
```http
PUT /api/charts/:id
```

### 5. 차트 삭제
```http
DELETE /api/charts/:id
```

### 6. 환자의 모든 차트 조회
```http
GET /api/patients/:id/charts
```

---

## AI API

### 1. Present Illness 생성
```http
POST /api/ai/generate-hpi
```

**Request Body:**
```json
{
  "age": "45",
  "sex": "M",
  "chiefComplaints": ["neck", "shoulder"],
  "location": "bilateral",
  "onset": "2 weeks ago",
  "severity": "Moderate",
  "previousCharts": [] // 선택사항
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "presentIllness": "A 45-year-old male presents with bilateral neck and shoulder pain that began approximately 2 weeks ago..."
  }
}
```

### 2. TCM Diagnosis 생성
```http
POST /api/ai/generate-diagnosis
```

**Request Body:**
```json
{
  "chiefComplaint": {
    "selectedComplaints": ["neck", "shoulder"],
    "presentIllness": "..."
  },
  "tongue": {
    "body": { "color": "pale", "shape": "swollen" },
    "coating": { "color": "white", "thickness": "thin" }
  },
  "pulse": {
    "overall": ["weak", "slow"]
  },
  "reviewOfSystems": {
    "coldHot": { "sensation": "cold" },
    "appetiteEnergy": { "appetite": "bad", "energy": "low" }
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "tcmDiagnosis": "Qi and Blood Deficiency with Cold",
    "etiology": "Chronic overwork and insufficient rest",
    "eightPrinciples": {
      "interior": true,
      "cold": true,
      "deficiency": true,
      "yin": true
    },
    "treatmentPrinciple": "Tonify Qi and Blood, Warm the Interior",
    "acupuncturePoints": "LI4, LI11, GB20, GB21, ST36, SP6",
    "herbalTreatment": "Dang Gui Bu Xue Tang"
  }
}
```

### 3. ICD 코드 생성
```http
POST /api/ai/generate-icd
```

**Request Body:**
```json
{
  "chiefComplaints": ["neck", "shoulder", "sciatica", "back pain"],
  "location": "bilateral"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "icdCodes": [
      "M54.2(cervicalgia)",
      "M25.51(pain in shoulder)",
      "M54.3(sciatica)",
      "M54.5(low back pain)"
    ],
    "combined": "M54.2(cervicalgia); M25.51(pain in shoulder); M54.3(sciatica); M54.5(low back pain)"
  }
}
```

### 4. 텍스트 개선
```http
POST /api/ai/improve-text
```

**Request Body:**
```json
{
  "text": "환자가 목과 어깨가 아프다고 함",
  "fieldType": "presentIllness"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "improvedText": "The patient reports neck and shoulder pain."
  }
}
```

---

## 결재 API (Phase 2)

### 1. 차트 제출
```http
POST /api/charts/:id/submit
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "approvalId": "uuid",
    "status": "pending",
    "submittedAt": "2025-01-08T10:00:00Z"
  }
}
```

### 2. 결재 목록 조회 (관리자)
```http
GET /api/approvals?status=pending&page=1&limit=20
```

### 3. 결재 승인/반려
```http
PUT /api/approvals/:id
```

**Request Body:**
```json
{
  "action": "approve", // or "reject"
  "comment": "Approved after review"
}
```

---

## 파일 API

### 1. 파일 업로드
```http
POST /api/files/upload
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: 파일 (이미지, PDF)
- `type`: 파일 타입 ("signature", "pdf", "logo")

**Response (200):**
```json
{
  "success": true,
  "data": {
    "fileId": "uuid",
    "url": "https://s3.amazonaws.com/bucket/file.jpg",
    "type": "signature"
  }
}
```

### 2. 파일 다운로드
```http
GET /api/files/:id
```

---

## 에러 응답

모든 API는 에러 발생 시 다음 형식으로 응답합니다:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": {}
  }
}
```

**HTTP 상태 코드:**
- `200`: 성공
- `201`: 생성 성공
- `400`: 잘못된 요청
- `401`: 인증 실패
- `403`: 권한 없음
- `404`: 리소스 없음
- `500`: 서버 오류

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025-01-08
