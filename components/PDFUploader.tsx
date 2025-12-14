import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import type { PatientData } from '../types.ts';

interface PDFUploaderProps {
  onExtractComplete: (patientData: PatientData) => void;
  onCancel: () => void;
  clinicInfo?: any;
}

export const PDFUploader: React.FC<PDFUploaderProps> = ({ onExtractComplete, onCancel, clinicInfo }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  // AI를 사용해서 PDF 텍스트에서 환자 정보 추출
  const extractPatientDataFromText = async (pdfText: string): Promise<PatientData> => {
    const apiKey = import.meta.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.');
    }

    const ai = new GoogleGenAI({ apiKey });
    
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const jsonText = response.text.trim();
    const patientData = JSON.parse(jsonText) as PatientData;
    
    // 필수 필드 설정
    patientData.chartType = 'follow-up';
    patientData.clinicName = clinicInfo?.clinicName || '';
    patientData.clinicLogo = clinicInfo?.clinicLogo || '';
    patientData.date = patientData.date || new Date().toISOString().split('T')[0];
    
    // 치료사 정보 설정
    if (patientData.diagnosisAndTreatment) {
      patientData.diagnosisAndTreatment.therapistName = clinicInfo?.therapistName || patientData.diagnosisAndTreatment.therapistName || '';
      patientData.diagnosisAndTreatment.therapistLicNo = clinicInfo?.therapistLicenseNo || patientData.diagnosisAndTreatment.therapistLicNo || '';
    }
    
    return patientData;
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
      
      // AI로 환자 정보 추출
      const patientData = await extractPatientDataFromText(pdfText);
      
      // 완료 콜백 호출
      onExtractComplete(patientData);
    } catch (err: any) {
      console.error('PDF 처리 오류:', err);
      setError(err.message || 'PDF 처리 중 오류가 발생했습니다.');
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
            {error}
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

