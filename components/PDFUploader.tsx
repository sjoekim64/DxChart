import React, { useState, useRef } from 'react';
import OpenAI from 'openai';
import type { PatientData } from '../types.ts';

interface PDFUploaderProps {
  onExtractComplete: (patientData: PatientData) => void;
  onCancel: () => void;
  clinicInfo?: any;
}

export const PDFUploader: React.FC<PDFUploaderProps> = ({ onExtractComplete, onCancel, clinicInfo }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastPdfText, setLastPdfText] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PDF.js를 동적으로 로드
  const loadPDFJS = async () => {
    if ((window as any).pdfjsLib) {
      return (window as any).pdfjsLib;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    
    return new Promise((resolve, reject) => {
      script.onload = () => {
        (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve((window as any).pdfjsLib);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  // PDF에서 텍스트 추출
  const extractTextFromPDF = async (file: File): Promise<string> => {
    const pdfjsLib = await loadPDFJS() as any;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  };

  // AI를 사용해서 PDF 텍스트에서 환자 정보 추출 (재시도 로직 포함)
  const extractPatientDataFromText = async (pdfText: string, retryCount = 0): Promise<PatientData> => {
    const { createOpenAIClient } = await import('../lib/openaiClient');
    const openai = createOpenAIClient();
    
    const prompt = `다음은 환자 차트 PDF에서 추출한 텍스트입니다. 이 텍스트에서 환자 정보를 추출하여 JSON 형식으로 반환해주세요.

PDF 텍스트:
${pdfText}

다음 JSON 형식으로 환자 정보를 추출해주세요. 정보가 없는 필드는 빈 문자열이나 빈 배열로 설정하세요:

{
  "fileNo": "파일 번호",
  "name": "환자 이름",
  "date": "날짜 (YYYY-MM-DD 형식)",
  "dob": "생년월일",
  "age": "나이",
  "sex": "성별 (M 또는 F)",
  "address": "주소",
  "phone": "전화번호",
  "occupation": "직업",
  "heightFt": "키 피트",
  "heightIn": "키 인치",
  "weight": "체중",
  "temp": "체온",
  "bpSystolic": "수축기 혈압",
  "bpDiastolic": "이완기 혈압",
  "heartRate": "심박수",
  "heartRhythm": "심박 리듬",
  "lungRate": "호흡수",
  "lungSound": "폐음",
  "chiefComplaint": {
    "selectedComplaints": ["주증상 배열"],
    "otherComplaint": "기타 주증상",
    "location": "통증 위치",
    "locationDetails": ["위치 상세"],
    "onsetValue": "발병 시기 값",
    "onsetUnit": "발병 시기 단위",
    "provocation": ["악화 요인"],
    "provocationOther": "기타 악화 요인",
    "palliation": ["완화 요인"],
    "palliationOther": "기타 완화 요인",
    "quality": ["통증 성질"],
    "qualityOther": "기타 통증 성질",
    "regionRadiation": "방사 부위",
    "severityScore": "심각도 점수",
    "severityDescription": "심각도 설명",
    "frequency": "빈도",
    "timing": "시기",
    "possibleCause": ["가능한 원인"],
    "possibleCauseOther": "기타 원인",
    "remark": "비고",
    "presentIllness": "현병력",
    "westernMedicalDiagnosis": "서양의학 진단"
  },
  "medicalHistory": {
    "pastMedicalHistory": ["과거 병력"],
    "pastMedicalHistoryOther": "기타 과거 병력",
    "medication": ["복용 약물"],
    "medicationOther": "기타 복용 약물",
    "familyHistory": ["가족력"],
    "familyHistoryOther": "기타 가족력",
    "allergy": ["알레르기"],
    "allergyOther": "기타 알레르기"
  },
  "reviewOfSystems": {
    "coldHot": { "sensation": "차고/뜨거움", "parts": [], "other": "" },
    "sleep": { "hours": "수면 시간", "quality": ["수면 질"], "issues": [], "other": "" },
    "sweat": { "present": "땀 유무", "time": "땀 시간", "parts": [], "other": "" },
    "eye": { "symptoms": ["눈 증상"], "other": "" },
    "mouthTongue": { "symptoms": "입/혀 증상", "taste": "맛", "other": "" },
    "throatNose": { "symptoms": ["목/코 증상"], "mucusColor": [], "other": "" },
    "edema": { "present": "부종 유무", "parts": [], "other": "" },
    "drink": { "thirsty": "갈증", "preference": "선호", "amount": "양", "other": "" },
    "digestion": { "symptoms": ["소화 증상"], "other": "" },
    "appetiteEnergy": { "appetite": "식욕", "energy": "에너지", "other": "" },
    "stool": { "frequencyValue": "배변 빈도 값", "frequencyUnit": "배변 빈도 단위", "form": "형태", "color": "색상", "symptoms": [], "other": "" },
    "urine": { "frequencyDay": "낮 소변 빈도", "frequencyNight": "밤 소변 빈도", "amount": "양", "color": "색상", "symptoms": [], "other": "" },
    "menstruation": { "status": "", "menopauseAge": "", "lmp": "", "cycleLength": "", "duration": "", "amount": "", "color": "", "clots": "", "pain": "", "painDetails": "", "pms": [], "other": "" },
    "discharge": { "present": "분비물 유무", "symptoms": [], "other": "" }
  },
  "tongue": {
    "body": { "color": "혀 색상", "colorModifiers": [], "shape": "혀 형태", "shapeModifiers": [], "locations": [], "locationComments": "" },
    "coating": { "color": "태 색상", "quality": ["태 질"], "notes": "" }
  },
  "pulse": {
    "overall": ["맥박 전체"],
    "notes": "맥박 비고",
    "cun": "寸",
    "guan": "關",
    "chi": "尺"
  },
  "diagnosisAndTreatment": {
    "eightPrinciples": { "exteriorInterior": "", "heatCold": "", "excessDeficient": "", "yangYin": "" },
    "etiology": "병인",
    "tcmDiagnosis": "한의학 진단",
    "treatmentPrinciple": "치료 원칙",
    "acupunctureMethod": ["침법"],
    "acupunctureMethodOther": "기타 침법",
    "acupuncturePoints": "침혈",
    "herbalTreatment": "한약 치료",
    "selectedTreatment": ["선택된 치료"],
    "otherTreatmentText": "기타 치료",
    "icd": "ICD 코드",
    "cpt": "CPT 코드",
    "therapistName": "치료사 이름",
    "therapistLicNo": "치료사 면허번호"
  },
  "respondToCare": {
    "status": "",
    "improvedDays": "",
    "notes": ""
  }
}

중요: JSON만 반환하고 다른 텍스트는 포함하지 마세요.`;

    const maxRetries = 3;
    const baseDelay = 2000; // 2초

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      });

      const jsonText = response.choices[0]?.message?.content?.trim() || '';
      const patientData = JSON.parse(jsonText) as PatientData;
    
    // 필수 필드 설정
    patientData.chartType = 'follow-up';
    patientData.clinicName = clinicInfo?.clinicName || '';
    patientData.clinicLogo = clinicInfo?.clinicLogo || '';
    patientData.date = patientData.date || new Date().toISOString().split('T')[0];
    
    // Chief Complaint 필드 초기화 (배열 필드가 없을 경우 빈 배열로 설정)
    if (!patientData.chiefComplaint) {
      patientData.chiefComplaint = {
        selectedComplaints: [],
        otherComplaint: '',
        location: '',
        locationDetails: [],
        onsetValue: '',
        onsetUnit: '',
        provocation: [],
        provocationOther: '',
        palliation: [],
        palliationOther: '',
        quality: [],
        qualityOther: '',
        regionRadiation: '',
        severityScore: '',
        severityDescription: '',
        frequency: '',
        timing: '',
        possibleCause: [],
        possibleCauseOther: '',
        remark: '',
        presentIllness: '',
        westernMedicalDiagnosis: ''
      };
    } else {
      // quality 필드가 배열이 아닌 경우 배열로 변환
      if (!Array.isArray(patientData.chiefComplaint.quality)) {
        patientData.chiefComplaint.quality = patientData.chiefComplaint.quality 
          ? [patientData.chiefComplaint.quality as any].filter(Boolean)
          : [];
      }
      // 다른 배열 필드들도 확인
      if (!Array.isArray(patientData.chiefComplaint.selectedComplaints)) {
        patientData.chiefComplaint.selectedComplaints = [];
      }
      if (!Array.isArray(patientData.chiefComplaint.locationDetails)) {
        patientData.chiefComplaint.locationDetails = [];
      }
      if (!Array.isArray(patientData.chiefComplaint.provocation)) {
        patientData.chiefComplaint.provocation = [];
      }
      if (!Array.isArray(patientData.chiefComplaint.palliation)) {
        patientData.chiefComplaint.palliation = [];
      }
      if (!Array.isArray(patientData.chiefComplaint.possibleCause)) {
        patientData.chiefComplaint.possibleCause = [];
      }
    }
    
    // 치료사 정보 설정
    if (patientData.diagnosisAndTreatment) {
      patientData.diagnosisAndTreatment.therapistName = clinicInfo?.therapistName || patientData.diagnosisAndTreatment.therapistName || '';
      patientData.diagnosisAndTreatment.therapistLicNo = clinicInfo?.therapistLicenseNo || patientData.diagnosisAndTreatment.therapistLicNo || '';
    }
    
    return patientData;
    } catch (error: any) {
      // 503 오류 또는 서버 과부하 오류인 경우 재시도
      const isRetryableError = error?.error?.code === 503 || 
                               error?.error?.status === 'UNAVAILABLE' ||
                               error?.message?.includes('overloaded') ||
                               error?.message?.includes('503');
      
      if (isRetryableError && retryCount < maxRetries) {
        const delay = baseDelay * Math.pow(2, retryCount); // 지수 백오프: 2초, 4초, 8초
        console.log(`⚠️ API 과부하 오류 발생. ${delay / 1000}초 후 재시도... (${retryCount + 1}/${maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return extractPatientDataFromText(pdfText, retryCount + 1);
      }
      
      // 재시도 불가능한 오류 또는 최대 재시도 횟수 초과
      throw error;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('PDF 파일만 업로드할 수 있습니다.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // PDF에서 텍스트 추출
      const pdfText = await extractTextFromPDF(file);
      setLastPdfText(pdfText);
      setRetryCount(0);
      
      // AI로 환자 정보 추출
      const patientData = await extractPatientDataFromText(pdfText);
      
      // 완료 콜백 호출
      onExtractComplete(patientData);
      setError(null);
    } catch (err: any) {
      console.error('PDF 처리 오류:', err);
      
      // 에러 메시지 개선
      let errorMessage = 'PDF 처리 중 오류가 발생했습니다.';
      if (err?.error?.code === 503 || err?.error?.status === 'UNAVAILABLE') {
        errorMessage = 'AI 서버가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해주세요.';
      } else if (err?.message) {
        errorMessage = err.message;
        // 환경 변수 오류인 경우 더 자세한 안내 제공
        if (errorMessage.includes('OPENAI_API_KEY')) {
          errorMessage += '\n\n해결 방법:\n1. 프로젝트 루트에 .env.local 파일 생성\n2. OPENAI_API_KEY와 VITE_OPENAI_API_KEY 설정\n3. 개발 서버 재시작 (npm run dev)';
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = async () => {
    if (!lastPdfText) return;
    
    setIsProcessing(true);
    setError(null);
    setRetryCount(prev => prev + 1);
    
    try {
      const patientData = await extractPatientDataFromText(lastPdfText);
      onExtractComplete(patientData);
      setError(null);
    } catch (err: any) {
      console.error('PDF 재시도 오류:', err);
      let errorMessage = 'PDF 처리 중 오류가 발생했습니다.';
      if (err?.error?.code === 503 || err?.error?.status === 'UNAVAILABLE') {
        errorMessage = 'AI 서버가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해주세요.';
      } else if (err?.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">PDF에서 환자 정보 불러오기</h3>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            <p className="mb-2">{error}</p>
            {lastPdfText && (
              <button
                onClick={handleRetry}
                disabled={isProcessing}
                className="text-sm underline hover:no-underline disabled:opacity-50"
              >
                다시 시도
              </button>
            )}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            PDF 파일 선택
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            disabled={isProcessing}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>

        {isProcessing && (
          <div className="mb-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">PDF를 처리하는 중...</p>
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors duration-200 disabled:opacity-50"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

