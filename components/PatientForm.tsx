import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { PatientData, ChiefComplaintData, MedicalHistoryData, ReviewOfSystemsData, TongueData, DiagnosisAndTreatmentData, AcupunctureMethod } from '../types.ts';
import OpenAI from 'openai';
import { database } from '../lib/database';
import { useAuth } from '../contexts/AuthContext';
import type { PatientChart } from '../lib/database';

interface InputFieldProps {
  label: string;
  id: string;
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  unit?: string;
  required?: boolean;
  className?: string;
  readOnly?: boolean;
  disabled?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({ label, id, name, value, onChange, placeholder, type = 'text', unit, required, className='', readOnly=false, disabled=false }) => (
  <div className={className}>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      <input
        type={type}
        id={id}
        name={name || id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        readOnly={readOnly}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm read-only:bg-gray-100 read-only:cursor-not-allowed disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
      {unit && (
        <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500">
          {unit}
        </span>
      )}
    </div>
  </div>
);

interface CheckboxGroupProps {
    options: {value: string, label: string}[];
    selected: string[];
    onChange: (value: string, checked: boolean) => void;
    gridCols?: string;
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({ options, selected, onChange, gridCols = 'grid-cols-3' }) => (
    <div className={`grid ${gridCols} gap-x-4 gap-y-1`}>
        {options.map(({value, label}) => (
            <div key={value} className="flex items-center">
                <input
                    type="checkbox"
                    id={value.replace(/\s/g, '')}
                    value={value}
                    checked={selected.includes(value)}
                    onChange={(e) => onChange(value, e.target.checked)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor={value.replace(/\s/g, '')} className="ml-2 text-sm text-gray-600">{label}</label>
            </div>
        ))}
    </div>
);

interface RadioGroupProps {
    options: { value: string; label: string }[];
    name: string;
    selectedValue: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
}

const RadioGroup: React.FC<RadioGroupProps> = ({ options, name, selectedValue, onChange, className = "flex flex-wrap gap-x-4 gap-y-2" }) => (
    <div className={className}>
        {options.map(({ value, label }) => (
            <label key={value} className="flex items-center text-sm">
                <input
                    type="radio"
                    name={name}
                    value={value}
                    checked={selectedValue === value}
                    onChange={onChange}
                    className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <span className="ml-2 text-gray-700">{label}</span>
            </label>
        ))}
    </div>
);


interface PatientFormProps {
  initialData: PatientData;
  onSubmit: (data: PatientData) => void;
  onBack: () => void;
  mode: 'new' | 'edit';
}

const commonComplaints = [
    {value: 'Neck Pain', label: 'Neck Pain (목 통증)'}, {value: 'Shoulder Pain', label: 'Shoulder Pain (어깨 통증)'}, {value: 'Back Pain', label: 'Back Pain (등 통증)'}, {value: 'Sciatica', label: 'Sciatica (좌골신경통)'}, {value: 'Knee Pain', label: 'Knee Pain (무릎 통증)'}, {value: 'Headache', label: 'Headache (두통)'}, {value: 'Migraine', label: 'Migraine (편두통)'},
    {value: 'Insomnia', label: 'Insomnia (불면증)'}, {value: 'Digestive Issues', label: 'Digestive Issues (소화 장애)'}, {value: 'Fatigue / Lethargy', label: 'Fatigue / Lethargy (피로/무기력)'}, {value: 'Menstrual Issues', label: 'Menstrual Issues (생리 문제)'},
    {value: 'Numbness / Tingling', label: 'Numbness / Tingling (저림/마비)'}
];
const baseAggravatingFactors = [
    {value: 'Prolonged Sitting / Standing', label: 'Prolonged Sitting / Standing (장시간 앉기/서기)'}, {value: 'Lifting Heavy Objects', label: 'Lifting Heavy Objects (무거운 물건 들기)'}, {value: 'Stairs / Weight Bearing', label: 'Stairs / Weight Bearing (계단/체중 부하)'},
    {value: 'Specific Postures', label: 'Specific Postures (특정 자세)'}, {value: 'Weather Changes', label: 'Weather Changes (날씨 변화)'}
];
const baseAlleviatingFactors = [
    {value: 'Rest / Lying Down', label: 'Rest / Lying Down (휴식/누워있기)'}, {value: 'Stretching / Light Exercise', label: 'Stretching / Light Exercise (스트레칭/가벼운 운동)'}, {value: 'Warm Packs / Shower', label: 'Warm Packs / Shower (온찜질/따뜻한 샤워)'},
    {value: 'Massage / Acupressure', label: 'Massage / Acupressure (마사지/지압)'}, {value: 'Medication', label: 'Medication (약물)'}
];
const painQualities = [
    {value: 'Sharp', label: 'Sharp (찌르는 듯한)'}, {value: 'Dull', label: 'Dull (둔한)'}, {value: 'Burning', label: 'Burning (타는 듯한)'}, {value: 'Throbbing', label: 'Throbbing (쑤시는)'}, {value: 'Tingling', label: 'Tingling (저린)'}, {value: 'Numb', label: 'Numb (저린/마비된)'}, {value: 'Stiff', label: 'Stiff (뻣뻣한)'}, {value: 'Aching', label: 'Aching (아픈)'}
];
const basePossibleCauses = [
    {value: 'Traffic Accident', label: 'Traffic Accident (교통사고)'}, {value: 'Fall / Slip', label: 'Fall / Slip (넘어짐/미끄러짐)'}, {value: 'Overwork / Repetitive Labor', label: 'Overwork / Repetitive Labor (과로/반복 작업)'}, {value: 'Excessive Exercise', label: 'Excessive Exercise (과도한 운동)'},
    {value: 'Poor Posture', label: 'Poor Posture (나쁜 자세)'}, {value: 'Lifting / Sudden Movements', label: 'Lifting / Sudden Movements (들기/급작스러운 움직임)'}, {value: 'Poor Sleeping Posture', label: 'Poor Sleeping Posture (나쁜 수면 자세)'}, {value: 'Exposure to Cold / Damp', label: 'Exposure to Cold / Damp (냉기/습기 노출)'},
    {value: 'Degenerative Changes', label: 'Degenerative Changes (퇴행성 변화)'}, {value: 'Post-Injury / Surgery', label: 'Post-Injury / Surgery (부상 후/수술 후)'}
];

const complaintLocationMap: { [key: string]: string[] } = {
    'Neck Pain': ['Left', 'Right', 'Upper', 'Lower'],
    'Shoulder Pain': ['Left', 'Right', 'Both'],
    'Back Pain': ['Upper', 'Middle', 'Lower', 'Left', 'Right'],
    'Knee Pain': ['Left', 'Right', 'Both'],
    'Headache': ['Frontal', 'Temporal', 'Occipital', 'Parietal'],
    'Numbness / Tingling': ['Hands', 'Feet', 'Arms', 'Legs']
};

const pastMedicalHistoryOptions = [
    {value: 'Hypertension', label: 'Hypertension (고혈압)'}, {value: 'Diabetes Mellitus', label: 'Diabetes Mellitus (당뇨병)'}, {value: 'Hyperlipidemia', label: 'Hyperlipidemia (고지혈증)'}, {value: 'Heart Disease', label: 'Heart Disease (심장 질환)'}, {value: 'Cerebrovascular Disease', label: 'Cerebrovascular Disease (뇌혈관 질환)'},
    {value: 'Asthma / COPD', label: 'Asthma / COPD (천식/만성폐쇄성폐질환)'}, {value: 'GI Disease', label: 'GI Disease (소화기 질환)'}, {value: 'Liver Disease', label: 'Liver Disease (간 질환)'}, {value: 'Kidney Disease', label: 'Kidney Disease (신장 질환)'}, {value: 'Cancer', label: 'Cancer (암)'}
];
const medicationOptions = [
    {value: 'Antihypertensives', label: 'Antihypertensives (고혈압약)'}, {value: 'Antidiabetics', label: 'Antidiabetics (당뇨약)'}, {value: 'Statins (Cholesterol)', label: 'Statins (Cholesterol) (콜레스테롤약)'}, {value: 'Heart Medication', label: 'Heart Medication (심장약)'}, {value: 'Blood Thinners', label: 'Blood Thinners (혈액 희석제)'},
    {value: 'GI Medication', label: 'GI Medication (소화제)'}, {value: 'NSAIDs', label: 'NSAIDs (소염진통제)'}, {value: 'Thyroid Medication', label: 'Thyroid Medication (갑상선약)'}, {value: 'Hormones', label: 'Hormones (호르몬제)'}, {value: 'Psychiatric Meds', label: 'Psychiatric Meds (정신과 약물)'}
];
const familyHistoryOptions = [
    {value: 'Hypertension', label: 'Hypertension (고혈압)'}, {value: 'Diabetes', label: 'Diabetes (당뇨)'}, {value: 'Heart Disease', label: 'Heart Disease (심장 질환)'}, {value: 'Stroke', label: 'Stroke (뇌졸중)'}, {value: 'Hyperlipidemia', label: 'Hyperlipidemia (고지혈증)'},
    {value: 'Cancer', label: 'Cancer (암)'}, {value: 'Tuberculosis', label: 'Tuberculosis (결핵)'}, {value: 'Liver Disease', label: 'Liver Disease (간 질환)'}, {value: 'Alcoholism', label: 'Alcoholism (알코올 중독)'}, {value: 'Psychiatric Illness', label: 'Psychiatric Illness (정신 질환)'}
];
const allergyOptions = [
    {value: 'Penicillin', label: 'Penicillin (페니실린)'}, {value: 'Aspirin', label: 'Aspirin (아스피린)'}, {value: 'NSAIDs', label: 'NSAIDs (소염진통제)'}, {value: 'Anesthetics', label: 'Anesthetics (마취제)'}, {value: 'Contrast Media', label: 'Contrast Media (조영제)'},
    {value: 'Seafood', label: 'Seafood (해산물)'}, {value: 'Peanuts', label: 'Peanuts (땅콩)'}, {value: 'Eggs', label: 'Eggs (계란)'}, {value: 'Milk', label: 'Milk (우유)'}, {value: 'Other Medications', label: 'Other Medications (기타 약물)'}
];

const tongueBodyColorOptions = [
    {value: 'Pale', label: 'Pale (창백한)'}, {value: 'Pink', label: 'Pink (분홍색)'}, {value: 'Red', label: 'Red (빨간)'}, {value: 'Dark Red', label: 'Dark Red (진한 빨강)'}, 
    {value: 'Purple', label: 'Purple (자주색)'}, {value: 'Reddish Purple', label: 'Reddish Purple (붉은 자주)'}, {value: 'Bluish Purple', label: 'Bluish Purple (푸른 자주)'}
];
const tongueBodyColorModifierOptions = [
    {value: 'Red Tip', label: 'Red Tip (끝이 빨간)'}, {value: 'Redder side', label: 'Redder side (한쪽이 더 빨간)'}, 
    {value: 'Orange side', label: 'Orange side (한쪽이 주황색)'}, {value: 'Purple side', label: 'Purple side (한쪽이 자주색)'}
];
const tongueBodyShapeOptions = [
    {value: 'Normal', label: 'Normal (정상)'}, {value: 'Stiff', label: 'Stiff (뻣뻣한)'}, {value: 'Long', label: 'Long (긴)'}, {value: 'Flaccid', label: 'Flaccid (무기력한)'}, 
    {value: 'Swollen', label: 'Swollen (부은)'}, {value: 'Short', label: 'Short (짧은)'}, {value: 'Thin', label: 'Thin (얇은)'}, {value: 'Thick', label: 'Thick (두꺼운)'}, {value: 'Narrow', label: 'Narrow (좁은)'}
];
const tongueBodyShapeModifierOptions = [
    {value: 'Cracked', label: 'Cracked (갈라진)'}, {value: 'Rolled up or Down', label: 'Rolled up or Down (말린)'}, {value: 'Ulcerate', label: 'Ulcerate (궤양)'}, 
    {value: 'Tooth-marked', label: 'Tooth-marked (치아 자국)'}, {value: 'Half Swollen', label: 'Half Swollen (반쪽 부은)'}, 
    {value: 'Deviation', label: 'Deviation (치우친)'}, {value: 'Trembling', label: 'Trembling (떨리는)'}
];

const tongueCoatingColorOptions = [
    {value: 'White', label: 'White (흰색)'}, {value: 'Yellow', label: 'Yellow (노란색)'}, {value: 'Gray', label: 'Gray (회색)'}, 
    {value: 'Black', label: 'Black (검은색)'}, {value: 'Greenish', label: 'Greenish (녹색빛)'}, {value: 'Half White or Yellow', label: 'Half White or Yellow (반은 흰색/노란색)'}
];
const tongueCoatingQualityOptions = [
    {value: 'Thin', label: 'Thin (얇은)'}, {value: 'Thick', label: 'Thick (두꺼운)'}, {value: 'Scanty', label: 'Scanty (적은)'}, {value: 'None', label: 'None (없음)'}, 
    {value: 'Dry', label: 'Dry (마른)'}, {value: 'Wet', label: 'Wet (젖은)'}, {value: 'Slippery', label: 'Slippery (미끄러운)'}, {value: 'Greasy', label: 'Greasy (기름진)'}, 
    {value: 'Rough', label: 'Rough (거친)'}, {value: 'Sticky', label: 'Sticky (끈끈한)'}, {value: 'Graphic', label: 'Graphic (지도 모양)'}, {value: 'Mirror', label: 'Mirror (거울 같은)'}
];
const tongueLocationOptions = ['Heart (Tip)', 'Lung (Upper-mid)', 'Stomach/Spleen (Center)', 'Liver/Gallbladder (Sides)', 'Kidney/Bladder (Root)'].map(o => ({value: o, label: o}));

const pulseQualityPairs = {
    buChim: [{value: 'Floating', label: 'Floating (부)'}, {value: 'Sinking', label: 'Sinking (침)'}],
    jiSak: [{value: 'Slow', label: 'Slow (지)'}, {value: 'Rapid', label: 'Rapid (삭)'}],
    heoSil: [{value: 'Deficient', label: 'Deficient (허)'}, {value: 'Excess', label: 'Excess (실)'}],
};

const excessPulseQualities = [
    {value: 'Slippery', label: 'Slippery (활)'}, {value: 'Wiry', label: 'Wiry (현)'}, 
    {value: 'Tight', label: 'Tight (긴)'}, {value: 'Long', label: 'Long (장)'}, 
    {value: 'Surging', label: 'Surging (홍)'},
];
const deficientPulseQualities = [
    {value: 'Faint', label: 'Faint (미)'}, {value: 'Thready', label: 'Thready (세)'},
    {value: 'Intermittent', label: 'Intermittent (대)'}, {value: 'Short', label: 'Short (단)'},
    {value: 'Weak', label: 'Weak (약)'},
];
const otherRemainingPulseQualities = [
    {value: 'Choppy', label: 'Choppy (삽)'}, {value: 'Knotted', label: 'Knotted (결)'},
];


const otherTreatmentOptions: { value: string; label: string; }[] = [
    {value: 'Tui-Na', label: 'Tui-Na'}, 
    {value: 'Acupressure', label: 'Acupressure'}, 
    {value: 'Moxa', label: 'Moxa'},
    {value: 'Cupping', label: 'Cupping'}, 
    {value: 'Electro Acupuncture', label: 'Electro Acupuncture'}, 
    {value: 'Heat Pack', label: 'Heat Pack'},
    {value: 'Auricular Acupuncture', label: 'Auricular Acupuncture / Ear Seeds'},
    {value: 'Other', label: 'Other'}
];

const acupunctureMethodOptions: { value: AcupunctureMethod, label: string }[] = [
    { value: 'TCM Body', label: 'TCM Body (체침)' },
    { value: 'Saam', label: 'Saam (사암침)' },
    { value: 'Master Tung', label: "Master Tung's (동씨침)" },
    { value: 'Five Element', label: 'Five Element (오행침)' },
    { value: 'Trigger Point', label: 'Trigger Point (근육침)' },
    { value: 'Other', label: 'Other' },
];


export const PatientForm: React.FC<PatientFormProps> = ({ initialData, onSubmit, onBack, mode }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<PatientData>(() => {
    // 초기 데이터에 기본값 적용
    const data = { ...initialData };
    if (!data.reviewOfSystems.urine.color) {
      data.reviewOfSystems.urine.color = 'pale yellow';
    }
    if (!data.reviewOfSystems.stool.color) {
      data.reviewOfSystems.stool.color = 'brown';
    }
    return data;
  });
  const [isGeneratingHpi, setIsGeneratingHpi] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [needsHpiRegeneration, setNeedsHpiRegeneration] = useState(false);
  const [previousCharts, setPreviousCharts] = useState<PatientData[]>([]);
  const [showPreviousCharts, setShowPreviousCharts] = useState(false);
  const [improvingFields, setImprovingFields] = useState<Set<string>>(new Set());
  const [fileNoDuplicateWarning, setFileNoDuplicateWarning] = useState<string>('');
  const fileNoCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const isFollowUp = useMemo(() => formData.chartType === 'follow-up', [formData.chartType]);
  const isEditing = useMemo(() => mode === 'edit', [mode]);

  useEffect(() => {
    const data = { ...initialData };
    // 기본값 적용
    if (!data.reviewOfSystems.urine.color) {
      data.reviewOfSystems.urine.color = 'pale yellow';
    }
    if (!data.reviewOfSystems.stool.color) {
      data.reviewOfSystems.stool.color = 'brown';
    }
    setFormData(data);
    setHasChanges(false);
  }, [initialData]);

  useEffect(() => {
    if (!hasChanges) {
      const initialJson = JSON.stringify(initialData);
      const currentJson = JSON.stringify(formData);
      if (initialJson !== currentJson) {
        setHasChanges(true);
      }
    }
  }, [formData, initialData, hasChanges]);

  // 재방문 차트일 때 이전 차트들 로드
  useEffect(() => {
    const loadPreviousCharts = async () => {
      if (isFollowUp && user && formData.fileNo) {
        try {
          const charts = await database.getPatientChartsByFileNo(user.id, formData.fileNo);
          // 현재 차트 제외하고 이전 차트들만
          const previous = charts
            .filter(chart => chart.date !== formData.date)
            .map(chart => JSON.parse(chart.chartData) as PatientData);
          setPreviousCharts(previous);
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error('이전 차트 로드 실패:', error);
          }
        }
      }
    };
    loadPreviousCharts();
  }, [isFollowUp, user, formData.fileNo, formData.date]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (fileNoCheckTimeoutRef.current) {
        clearTimeout(fileNoCheckTimeoutRef.current);
      }
    };
  }, []);

  // Track changes to selected complaints to detect when HPI needs regeneration
  useEffect(() => {
    const initialComplaints = initialData.chiefComplaint.selectedComplaints;
    const currentComplaints = formData.chiefComplaint.selectedComplaints;
    const initialOtherComplaint = initialData.chiefComplaint.otherComplaint;
    const currentOtherComplaint = formData.chiefComplaint.otherComplaint;
    
    const complaintsChanged = 
      JSON.stringify(initialComplaints) !== JSON.stringify(currentComplaints) ||
      initialOtherComplaint !== currentOtherComplaint;
    
    if (complaintsChanged && formData.chiefComplaint.presentIllness) {
      setNeedsHpiRegeneration(true);
    }
  }, [formData.chiefComplaint.selectedComplaints, formData.chiefComplaint.otherComplaint, initialData.chiefComplaint.selectedComplaints, initialData.chiefComplaint.otherComplaint, formData.chiefComplaint.presentIllness]);

  // 파일 번호 중복 체크 함수
  const checkFileNoDuplicate = async (fileNo: string) => {
    if (!user || !fileNo || fileNo.trim() === '') {
      setFileNoDuplicateWarning('');
      return;
    }

    // 현재 편집 중인 환자의 원래 파일 번호는 제외
    const originalFileNo = initialData.fileNo;
    
    try {
      const charts = await database.getPatientChartsByFileNo(user.id, fileNo.trim());
      
      // 현재 편집 중인 환자의 차트는 제외 (같은 환자이므로)
      const otherCharts = charts.filter(chart => {
        const chartData = JSON.parse(chart.chartData) as PatientData;
        // 원래 파일 번호와 다르거나, 같은 파일 번호지만 다른 날짜인 경우
        return chartData.fileNo !== originalFileNo || chart.date !== formData.date;
      });
      
      if (otherCharts.length > 0) {
        const existingPatient = JSON.parse(otherCharts[0].chartData) as PatientData;
        setFileNoDuplicateWarning(`⚠️ Warning: File No. "${fileNo}" already exists for patient "${existingPatient.name || 'Unknown'}" (Date: ${otherCharts[0].date}). Please use a different file number.`);
      } else {
        setFileNoDuplicateWarning('');
      }
    } catch (error) {
      console.error('파일 번호 중복 체크 실패:', error);
      setFileNoDuplicateWarning('');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // 숫자 필드에서 "N/A"나 잘못된 값 처리
    if (type === 'number' && (value === 'N/A' || value === 'n/a' || value === 'na' || value === 'NA')) {
      // "N/A"를 빈 문자열로 변환
      setFormData(prev => ({ ...prev, [name]: '' }));
      return;
    }
    
    // 파일 번호 변경 시 중복 체크 (디바운싱)
    if (name === 'fileNo') {
      setFormData(prev => ({ ...prev, [name]: value }));
      // 이전 타이머 취소
      if (fileNoCheckTimeoutRef.current) {
        clearTimeout(fileNoCheckTimeoutRef.current);
      }
      // 새 타이머 설정 (500ms 후 중복 체크)
      fileNoCheckTimeoutRef.current = setTimeout(() => {
        checkFileNoDuplicate(value);
      }, 500);
      return;
    }
    
    // DOB 입력 시 자동으로 age 계산
    if (name === 'dob' && value) {
      const birthDate = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      setFormData(prev => ({ ...prev, [name]: value, age: age.toString() }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, clinicLogo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    } else {
      setFormData(prev => ({ ...prev, clinicLogo: '' }));
    }
  };
  

  const handleNestedChange = (
    section: keyof PatientData,
    field: string,
    value: any
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: value,
      },
    }));
  };

  const handleReviewOfSystemsChange = (
    subSection: keyof ReviewOfSystemsData,
    field: string,
    value: any
  ) => {
      setFormData(prev => ({
          ...prev,
          reviewOfSystems: {
              ...prev.reviewOfSystems,
              [subSection]: {
                  ...prev.reviewOfSystems[subSection],
                  [field]: value,
              }
          }
      }));
  };
  
  const handleArrayChange = (
    section: 'chiefComplaint' | 'medicalHistory',
    field: keyof ChiefComplaintData | keyof MedicalHistoryData,
    value: string,
    checked: boolean
  ) => {
      setFormData(prev => {
          const sectionData = prev[section];
          const currentValues = (sectionData[field as keyof typeof sectionData] as string[]) || [];
          const newValues = checked
              ? [...currentValues, value]
              : currentValues.filter(item => item !== value);

          
          return {
              ...prev,
              [section]: {
                  ...sectionData,
                  [field]: newValues,
              },
          };
      });
  };

  const handleRosArrayChange = (
    subSection: keyof ReviewOfSystemsData,
    field: string,
    value: string,
    checked: boolean
  ) => {
      setFormData(prev => {
          const currentValues = (prev.reviewOfSystems[subSection] as any)[field] as string[];
          const newValues = checked
              ? [...currentValues, value]
              : currentValues.filter(item => item !== value);
          
          return {
              ...prev,
              reviewOfSystems: {
                  ...prev.reviewOfSystems,
                  [subSection]: {
                      ...prev.reviewOfSystems[subSection],
                      [field]: newValues,
                  }
              }
          };
      });
  };

  const handleTongueBodyChange = (field: keyof TongueData['body'], value: any) => {
    setFormData(prev => ({
        ...prev,
        tongue: {
            ...prev.tongue,
            body: {
                ...prev.tongue.body,
                [field]: value,
            }
        }
    }))
  };

  const handleTongueBodyArrayChange = (
    field: 'colorModifiers' | 'shapeModifiers' | 'locations',
    value: string,
    checked: boolean
    ) => {
        setFormData(prev => {
            const currentValues = prev.tongue.body[field] || [];
            const newValues = checked
              ? [...currentValues, value]
              : currentValues.filter(item => item !== value);

            return {
                ...prev,
                tongue: {
                    ...prev.tongue,
                    body: {
                        ...prev.tongue.body,
                        [field]: newValues
                    }
                }
            }
        });
  };

  const handleTongueCoatingChange = (field: keyof TongueData['coating'], value: any) => {
    setFormData(prev => ({
        ...prev,
        tongue: {
            ...prev.tongue,
            coating: {
                ...prev.tongue.coating,
                [field]: value
            }
        }
    }));
  };
  
    const handleTongueCoatingArrayChange = (
    field: keyof TongueData['coating'],
    value: string,
    checked: boolean
    ) => {
        setFormData(prev => {
            if (field !== 'quality') return prev;

            const currentValues = (prev.tongue.coating.quality as string[]) || [];
            let newValues;
            
            if (checked) {
                if (currentValues.length < 2) {
                    newValues = [...currentValues, value];
                } else {
                    return prev; // Max 2 selected, do not update state
                }
            } else {
                newValues = currentValues.filter(item => item !== value);
            }

            return {
                ...prev,
                tongue: {
                    ...prev.tongue,
                    coating: {
                        ...prev.tongue.coating,
                        quality: newValues
                    }
                }
            }
        });
  };

  const handlePulseNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const { value } = e.target;
      setFormData(prev => ({
          ...prev,
          pulse: { ...prev.pulse, notes: value }
      }));
  };

  // 근육이름 한글/중국어를 영어로 변환하는 함수 (Trigger Point 전용)
  const translateMuscleNames = async (text: string): Promise<string> => {
    if (!text || text.trim().length === 0) {
      return text;
    }

    const apiKey = import.meta.env.OPENAI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      alert('OPENAI_API_KEY가 설정되지 않았습니다.');
      return text;
    }

    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

    const prompt = `You are a medical professional translating muscle names from Korean or Chinese to English for trigger point acupuncture.

**IMPORTANT INSTRUCTIONS:**
1. The text below contains muscle names in Korean (한글) or Chinese (中文) for trigger point acupuncture
2. Translate ONLY the muscle names to their standard English anatomical names
3. Keep the structure and format of the text (commas, colons, line breaks, etc.)
4. Do NOT translate other parts like "Trigger Point:", "Ashi points", etc.
5. Use standard anatomical muscle names in English (e.g., "Upper trapezius", "Levator scapulae", "Rhomboids")
6. If the text is already in English, return it as is
7. Preserve any numbers, punctuation, and formatting

Examples:
- "상부승모근, 승모근상부" → "Upper trapezius"
- "견갑거근, 어깨올림근" → "Levator scapulae"
- "대능형근" → "Rhomboids"
- "Trigger Point: 상부승모근, 승모근상부" → "Trigger Point: Upper trapezius, Levator scapulae"

Original text:
${text}

Translated text (muscle names in English only):`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
      });

      const translatedText = response.choices[0]?.message?.content?.trim() || '';
      // 응답에서 프리픽스 제거
      const cleanedText = translatedText.replace(/^(Translated text:|English version:|Translation:)\s*/i, '').trim();
      return cleanedText || text; // 실패 시 원본 반환
    } catch (error) {
      console.error('근육이름 변환 실패:', error);
      alert('근육이름 변환 중 오류가 발생했습니다. 다시 시도해주세요.');
      return text;
    }
  };

  // 언어 감지, 번역 및 영어 문법 검증 및 의료 용어 개선 함수
  const improveEnglishText = async (text: string, fieldType: string): Promise<string> => {
    if (!text || text.trim().length === 0) {
      return text;
    }

    const apiKey = import.meta.env.OPENAI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      alert('OPENAI_API_KEY가 설정되지 않았습니다.');
      return text;
    }

    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

    const contextMap: { [key: string]: string } = {
      'remark': 'patient chart remark or follow-up notes',
      'respondToCareNotes': 'patient response to care notes',
      'tongueCoatingNotes': 'tongue coating observation notes',
      'pulseNotes': 'pulse diagnosis notes',
      'locationComments': 'tongue body location comments',
      'romNotes': 'range of motion notes',
      'presentIllness': 'history of present illness'
    };

    const context = contextMap[fieldType] || 'medical chart notes';

    const prompt = `You are a medical professional reviewing patient chart notes. 

**IMPORTANT INSTRUCTIONS:**
1. First, detect the language of the text below
2. If the text is NOT in English, translate it to English first
3. Then correct the grammar, spelling, and improve the medical terminology
4. Make it professional, clear, and appropriate for a medical chart

Context: ${context}

Original text:
${text}

Please provide ONLY the final corrected and improved English version. Do not add explanations, comments, or indicate the original language. Keep the meaning and medical information intact, but ensure:
1. The text is in English (translate if necessary)
2. Grammar and spelling are correct
3. Medical terminology is accurate
4. Professional medical language is used
5. Clarity and conciseness are improved

Corrected English text:`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
      });

      const improvedText = response.choices[0]?.message?.content?.trim() || '';
      // 응답에서 "Corrected English text:" 같은 프리픽스 제거
      const cleanedText = improvedText.replace(/^(Corrected English text:|Corrected text:|Translation:|English version:)\s*/i, '').trim();
      return cleanedText || text; // 실패 시 원본 반환
    } catch (error) {
      console.error('텍스트 개선 실패:', error);
      alert('텍스트 개선 중 오류가 발생했습니다. 다시 시도해주세요.');
      return text;
    }
  };

  // 텍스트 필드 개선 핸들러
  const handleImproveText = async (fieldPath: string[], currentValue: string, fieldType: string) => {
    if (!currentValue || currentValue.trim().length === 0) {
      alert('개선할 텍스트를 입력해주세요.');
      return;
    }

    const fieldKey = fieldPath.join('.');
    setImprovingFields(prev => new Set(prev).add(fieldKey));

    try {
      const improvedText = await improveEnglishText(currentValue, fieldType);
      
      // formData 업데이트
      setFormData(prev => {
        const newData = { ...prev };
        let target: any = newData;
        
        for (let i = 0; i < fieldPath.length - 1; i++) {
          target = target[fieldPath[i]];
        }
        
        target[fieldPath[fieldPath.length - 1]] = improvedText;
        return newData;
      });
    } catch (error) {
      console.error('텍스트 개선 실패:', error);
    } finally {
      setImprovingFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(fieldKey);
        return newSet;
      });
    }
  };

  const handlePulseOverallChange = (value: string, checked: boolean) => {
    const pulsePairsMap: { [key: string]: string } = {
        'Floating': 'Sinking', 'Sinking': 'Floating',
        'Slow': 'Rapid', 'Rapid': 'Slow',
        'Deficient': 'Excess', 'Excess': 'Deficient',
    };

    setFormData(prev => {
        let currentValues = [...prev.pulse.overall];
        
        if (checked) {
            currentValues.push(value);
            const opposite = pulsePairsMap[value];
            if (opposite && currentValues.includes(opposite)) {
                currentValues = currentValues.filter(item => item !== opposite);
            }
        } else {
            currentValues = currentValues.filter(item => item !== value);
        }
        
        return {
            ...prev,
            pulse: { ...prev.pulse, overall: currentValues }
        };
    });
  };

  
  const handleLungRateChange = (increment: boolean) => {
    setFormData(prev => {
        const currentRate = parseInt(prev.lungRate, 10) || 0;
        const newRate = increment ? currentRate + 1 : Math.max(0, currentRate - 1);
        return { ...prev, lungRate: newRate.toString() };
    });
  };

  const handleTempChange = (increment: boolean) => {
    setFormData(prev => {
        const currentTemp = parseFloat(prev.temp) || 0;
        const newTemp = increment ? currentTemp + 0.1 : Math.max(0, currentTemp - 0.1);
        return { ...prev, temp: newTemp.toFixed(1) };
    });
  };

  const handleHeartRateChange = (increment: boolean) => {
    setFormData(prev => {
        const currentRate = parseInt(prev.heartRate, 10) || 0;
        const newRate = increment ? currentRate + 1 : Math.max(0, currentRate - 1);
        return { ...prev, heartRate: newRate.toString() };
    });
  };

  const handleROMChange = (joint: string, field: string, value: string) => {
    setFormData(prev => {
      const currentROM = prev.rangeOfMotion || {};
      const currentJoint = currentROM[joint] || {};
      
      return {
        ...prev,
        rangeOfMotion: {
          ...currentROM,
          [joint]: {
            ...currentJoint,
            [field]: value,
          },
        },
      };
    });
  };

  const handleROMNotesChange = (joint: string, value: string) => {
    handleROMChange(joint, 'notes', value);
  };

  const addROMJoint = (joint: string) => {
    setFormData(prev => {
      const currentROM = prev.rangeOfMotion || {};
      if (!currentROM[joint]) {
        return {
          ...prev,
          rangeOfMotion: {
            ...currentROM,
            [joint]: {},
          },
        };
      }
      return prev;
    });
  };

  const removeROMJoint = (joint: string) => {
    setFormData(prev => {
      const currentROM = { ...prev.rangeOfMotion };
      delete currentROM[joint];
      return {
        ...prev,
        rangeOfMotion: currentROM,
      };
    });
  };

  const handleGenerateHpi = async () => {
    setIsGeneratingHpi(true);

    const { age, sex, chiefComplaint } = formData;

    const allComplaints = [...chiefComplaint.selectedComplaints, chiefComplaint.otherComplaint].filter(Boolean).join(', ');
    const locationDisplay = [...chiefComplaint.locationDetails, chiefComplaint.location].filter(Boolean).join(', ');
    const onsetDisplay = chiefComplaint.onsetValue && chiefComplaint.onsetUnit ? `${chiefComplaint.onsetValue} ${chiefComplaint.onsetUnit}` : '';
    const provocationDisplay = [...chiefComplaint.provocation, chiefComplaint.provocationOther].filter(Boolean).join(', ');
    const palliationDisplay = [...chiefComplaint.palliation, chiefComplaint.palliationOther].filter(Boolean).join(', ');
    const qualityDisplay = [...chiefComplaint.quality, chiefComplaint.qualityOther].filter(Boolean).join(', ');
    const causeDisplay = [...chiefComplaint.possibleCause, chiefComplaint.possibleCauseOther].filter(Boolean).join(', ');
    const severityDisplay = [
        chiefComplaint.severityScore ? `${chiefComplaint.severityScore}/10` : '',
        chiefComplaint.severityDescription
    ].filter(Boolean).join(' ');
    
    const openingSentence = isFollowUp
      ? `The patient is a [age]-year-old [sex] who returns for a follow-up regarding...`
      : `The patient is a [age]-year-old [sex] who presents with...`;

    let prompt = `You are a medical scribe creating a "History of Present Illness" (HPI) narrative. 

**CRITICAL REQUIREMENT: You must ONLY include the EXACT symptoms listed in the "Current Symptoms" section below. Do NOT add any symptoms that are not explicitly listed.**

**Patient Demographics:**
- Age: ${age}
- Sex: ${sex === 'M' ? 'Male' : sex === 'F' ? 'Female' : 'Not specified'}

**Current Symptoms (MUST include ONLY these):**
${allComplaints || 'No specific complaints listed'}

**Current Complaint Details:**
`;

    if (locationDisplay) prompt += `- Location: ${locationDisplay}\n`;
    if (onsetDisplay) prompt += `- Onset: Approximately ${onsetDisplay} ago\n`;
    if (qualityDisplay) prompt += `- Pain Quality: ${qualityDisplay}\n`;
    if (severityDisplay) prompt += `- Severity: ${severityDisplay}\n`;
    if (chiefComplaint.frequency) prompt += `- Frequency: ${chiefComplaint.frequency}\n`;
    if (chiefComplaint.timing) prompt += `- Timing: ${chiefComplaint.timing}\n`;
    if (provocationDisplay) prompt += `- Aggravating Factors: ${provocationDisplay}\n`;
    if (palliationDisplay) prompt += `- Alleviate Factors: ${palliationDisplay}\n`;
    if (chiefComplaint.regionRadiation) prompt += `- Radiation: ${chiefComplaint.regionRadiation}\n`;
    if (causeDisplay) prompt += `- Possible Cause: ${causeDisplay}\n`;
    if (chiefComplaint.remark) prompt += `- Remarks: ${chiefComplaint.remark}\n`;
    
    // Follow-up 차트인 경우 Respond to Previous Care 정보 추가
    if (isFollowUp && formData.respondToCare) {
        prompt += `\n**Response to Previous Treatment (MNR Assessment):**\n`;
        if (formData.respondToCare.status) {
            prompt += `- Overall Status: ${formData.respondToCare.status}\n`;
        }
        if (formData.respondToCare.status === 'Improved') {
            if (formData.respondToCare.improvedPercent) {
                prompt += `- Improvement: ${formData.respondToCare.improvedPercent}%\n`;
            }
            if (formData.respondToCare.treatmentAfterDays) {
                prompt += `- Treatment After: ${formData.respondToCare.treatmentAfterDays} days\n`;
            }
            if (formData.respondToCare.improvedDays) {
            prompt += `- Improvement Duration: ${formData.respondToCare.improvedDays} days\n`;
            }
        }
        if (formData.respondToCare.painLevelBefore || formData.respondToCare.painLevelAfter || formData.respondToCare.painLevelCurrent) {
            prompt += `- Pain Levels: `;
            const painLevels: string[] = [];
            if (formData.respondToCare.painLevelBefore) painLevels.push(`Before: ${formData.respondToCare.painLevelBefore}/10`);
            if (formData.respondToCare.painLevelAfter) painLevels.push(`After: ${formData.respondToCare.painLevelAfter}/10`);
            if (formData.respondToCare.painLevelCurrent) painLevels.push(`Current: ${formData.respondToCare.painLevelCurrent}/10`);
            prompt += painLevels.join(', ') + '\n';
        }
        const functionalActivities: string[] = [];
        if (formData.respondToCare.canDriveWithoutPain) {
            functionalActivities.push(`Drive: ${formData.respondToCare.canDriveWithoutPain}`);
        }
        if (formData.respondToCare.canSitWithoutPain) {
            let sit = `Sit: ${formData.respondToCare.canSitWithoutPain}`;
            if (formData.respondToCare.canSitDuration) sit += ` (${formData.respondToCare.canSitDuration})`;
            functionalActivities.push(sit);
        }
        if (formData.respondToCare.canStandWithoutPain) {
            let stand = `Stand: ${formData.respondToCare.canStandWithoutPain}`;
            if (formData.respondToCare.canStandDuration) stand += ` (${formData.respondToCare.canStandDuration})`;
            functionalActivities.push(stand);
        }
        if (formData.respondToCare.canWalkWithoutPain) {
            let walk = `Walk: ${formData.respondToCare.canWalkWithoutPain}`;
            if (formData.respondToCare.canWalkDistance) walk += ` (${formData.respondToCare.canWalkDistance})`;
            functionalActivities.push(walk);
        }
        if (formData.respondToCare.canSitMaxTime) {
            prompt += `- Max Sitting Time Without Pain: ${formData.respondToCare.canSitMaxTime}\n`;
        }
        if (formData.respondToCare.canWalkMaxTime) {
            prompt += `- Max Walking Time Without Pain: ${formData.respondToCare.canWalkMaxTime}\n`;
        }
        if (formData.respondToCare.canDriveMaxTime) {
            prompt += `- Max Driving Time Before Pain: ${formData.respondToCare.canDriveMaxTime}\n`;
        }
        if (functionalActivities.length > 0) {
            prompt += `- Functional Activities: ${functionalActivities.join('; ')}\n`;
        }
        if (formData.respondToCare.houseworkDiscomfort) {
            prompt += `- Housework Discomfort (0-10): ${formData.respondToCare.houseworkDiscomfort}\n`;
        }
        if (formData.respondToCare.liftingDiscomfort) {
            prompt += `- Lifting Discomfort (0-10): ${formData.respondToCare.liftingDiscomfort}\n`;
        }
        if (formData.respondToCare.sleepQualityDiscomfort) {
            prompt += `- Sleep Quality Discomfort (0-10): ${formData.respondToCare.sleepQualityDiscomfort}\n`;
        }
        if (formData.respondToCare.commuteDiscomfort) {
            prompt += `- Work/Job Activities Discomfort (0-10): ${formData.respondToCare.commuteDiscomfort}\n`;
        }
        if (formData.respondToCare.avoidedActivitiesCount) {
            prompt += `- Avoided Activities Count: ${formData.respondToCare.avoidedActivitiesCount}\n`;
        }
        if (formData.respondToCare.painMedicationFrequency) {
            prompt += `- Pain Medication Frequency (per week): ${formData.respondToCare.painMedicationFrequency}\n`;
        }
        if (formData.respondToCare.medicationChange) {
            prompt += `- Medication Usage Change: ${formData.respondToCare.medicationChange}\n`;
        }
        if (formData.respondToCare.recoveryPercent) {
            prompt += `- Recovery Percentage: ${formData.respondToCare.recoveryPercent}%\n`;
        }
        if (formData.respondToCare.sleepQualityImprovement) {
            prompt += `- Sleep Quality: ${formData.respondToCare.sleepQualityImprovement}\n`;
        }
        if (formData.respondToCare.dailyActivitiesImprovement) {
            prompt += `- Daily Activities: ${formData.respondToCare.dailyActivitiesImprovement}\n`;
        }
        if (formData.respondToCare.notes) {
            prompt += `- Additional Notes: ${formData.respondToCare.notes}\n`;
        }
    }
    
    // Range of Motion (ROM) 정보 추가
    if (formData.rangeOfMotion && Object.keys(formData.rangeOfMotion).length > 0) {
        prompt += `\n**Range of Motion (ROM) Assessment - IMPORTANT CLINICAL DATA:**\n`;
        const normalRanges: { [key: string]: { [motion: string]: string } } = {
            'Neck': { flexion: '50°', extension: '60°', lateralFlexion: '45°', rotation: '80°' },
            'Shoulder L': { flexion: '180°', extension: '50°', abduction: '180°', adduction: '50°', internalRotation: '70°', externalRotation: '90°' },
            'Shoulder R': { flexion: '180°', extension: '50°', abduction: '180°', adduction: '50°', internalRotation: '70°', externalRotation: '90°' },
            'Elbow L': { flexion: '150°', extension: '0°', pronation: '80°', supination: '80°' },
            'Elbow R': { flexion: '150°', extension: '0°', pronation: '80°', supination: '80°' },
            'Wrist L': { flexion: '80°', extension: '70°', radialDeviation: '20°', ulnarDeviation: '30°' },
            'Wrist R': { flexion: '80°', extension: '70°', radialDeviation: '20°', ulnarDeviation: '30°' },
            'Hip L': { flexion: '120°', extension: '30°', abduction: '50°', adduction: '30°', internalRotation: '40°', externalRotation: '50°' },
            'Hip R': { flexion: '120°', extension: '30°', abduction: '50°', adduction: '30°', internalRotation: '40°', externalRotation: '50°' },
            'Knee L': { flexion: '135°', extension: '0°' },
            'Knee R': { flexion: '135°', extension: '0°' },
            'Ankle L': { dorsiflexion: '20°', plantarflexion: '50°', inversion: '30°', eversion: '20°' },
            'Ankle R': { dorsiflexion: '20°', plantarflexion: '50°', inversion: '30°', eversion: '20°' },
            'Spine': { flexion: '60°', extension: '25°', lateralFlexion: '25°', rotation: '30°' },
        };
        
        Object.keys(formData.rangeOfMotion).forEach(joint => {
            const jointData = formData.rangeOfMotion[joint] || {};
            const romValues: string[] = [];
            const normalRange = normalRanges[joint] || {};
            
            if (jointData.flexion) {
                const normal = normalRange.flexion || 'N/A';
                romValues.push(`Flexion: ${jointData.flexion}° (normal: ${normal})`);
            }
            if (jointData.extension) {
                const normal = normalRange.extension || 'N/A';
                romValues.push(`Extension: ${jointData.extension}° (normal: ${normal})`);
            }
            if (jointData.abduction) {
                const normal = normalRange.abduction || 'N/A';
                romValues.push(`Abduction: ${jointData.abduction}° (normal: ${normal})`);
            }
            if (jointData.adduction) {
                const normal = normalRange.adduction || 'N/A';
                romValues.push(`Adduction: ${jointData.adduction}° (normal: ${normal})`);
            }
            if (jointData.internalRotation) {
                const normal = normalRange.internalRotation || 'N/A';
                romValues.push(`Internal Rotation: ${jointData.internalRotation}° (normal: ${normal})`);
            }
            if (jointData.externalRotation) {
                const normal = normalRange.externalRotation || 'N/A';
                romValues.push(`External Rotation: ${jointData.externalRotation}° (normal: ${normal})`);
            }
            if (jointData.lateralFlexion) {
                const normal = normalRange.lateralFlexion || 'N/A';
                romValues.push(`Lateral Flexion: ${jointData.lateralFlexion}° (normal: ${normal})`);
            }
            if (jointData.rotation) {
                const normal = normalRange.rotation || 'N/A';
                romValues.push(`Rotation: ${jointData.rotation}° (normal: ${normal})`);
            }
            if (jointData.pronation) {
                const normal = normalRange.pronation || 'N/A';
                romValues.push(`Pronation: ${jointData.pronation}° (normal: ${normal})`);
            }
            if (jointData.supination) {
                const normal = normalRange.supination || 'N/A';
                romValues.push(`Supination: ${jointData.supination}° (normal: ${normal})`);
            }
            if (jointData.radialDeviation) {
                const normal = normalRange.radialDeviation || 'N/A';
                romValues.push(`Radial Deviation: ${jointData.radialDeviation}° (normal: ${normal})`);
            }
            if (jointData.ulnarDeviation) {
                const normal = normalRange.ulnarDeviation || 'N/A';
                romValues.push(`Ulnar Deviation: ${jointData.ulnarDeviation}° (normal: ${normal})`);
            }
            if (jointData.dorsiflexion) {
                const normal = normalRange.dorsiflexion || 'N/A';
                romValues.push(`Dorsiflexion: ${jointData.dorsiflexion}° (normal: ${normal})`);
            }
            if (jointData.plantarflexion) {
                const normal = normalRange.plantarflexion || 'N/A';
                romValues.push(`Plantarflexion: ${jointData.plantarflexion}° (normal: ${normal})`);
            }
            if (jointData.inversion) {
                const normal = normalRange.inversion || 'N/A';
                romValues.push(`Inversion: ${jointData.inversion}° (normal: ${normal})`);
            }
            if (jointData.eversion) {
                const normal = normalRange.eversion || 'N/A';
                romValues.push(`Eversion: ${jointData.eversion}° (normal: ${normal})`);
            }
            
            if (romValues.length > 0) {
                prompt += `- ${joint}: ${romValues.join(', ')}\n`;
            }
            if (jointData.notes) {
                prompt += `  Notes: ${jointData.notes}\n`;
            }
        });
    }
    
    const hasROM = formData.rangeOfMotion && Object.keys(formData.rangeOfMotion).length > 0;
    let requirementNumber = 7;
    
    prompt += `
**ABSOLUTE REQUIREMENTS:**
1. ONLY mention the symptoms listed in "Current Symptoms" above
2. If a symptom is NOT in the "Current Symptoms" list, DO NOT mention it
3. Do NOT infer or add symptoms like "back pain", "lower back", "lumbar pain" unless explicitly listed in "Current Symptoms"
4. Write a coherent paragraph in a professional, clinical tone
5. Start with an opening sentence like: "${openingSentence}"
6. Weave the details into a narrative, not just a list
7. Do not use markdown or bullet points in your final output`;
    
    if (hasROM) {
        requirementNumber++;
        prompt += `\n${requirementNumber}. **CRITICAL**: The "Range of Motion (ROM) Assessment" section above contains measured joint ranges of motion. You MUST include these ROM findings in your narrative. Describe the specific joint(s) measured, the range of motion values, and compare them to normal ranges when provided. Note any limitations, restrictions, or deviations from normal. This is essential clinical information that demonstrates the objective assessment of joint function and must be integrated naturally into the HPI narrative.`;
    }
    
    if (isFollowUp && formData.respondToCare) {
        requirementNumber++;
        prompt += `\n${requirementNumber}. **CRITICAL**: This is a follow-up visit. The narrative MUST be centered on the "Response to Previous Treatment" information. Focus on: How much the patient has improved (percentage and duration), Functional activity improvements (maximum time for sitting, walking, driving without pain), Daily activities discomfort levels, Medication usage changes, and Overall recovery. The narrative should emphasize the improvement achieved since the last visit based on the response to previous care data. Describe the progress and changes, not just current symptoms.`;
    }
    
    prompt += `

**Example of what NOT to do:** If "Current Symptoms" only lists "Neck Pain, Shoulder Pain" but you mention "back pain" or "lower back", that is WRONG.

Generate the HPI paragraph below:
`;

    try {
        const apiKey = import.meta.env.OPENAI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey) {
          throw new Error('OPENAI_API_KEY가 설정되지 않았습니다. .env.local 파일을 확인하세요.');
        }
        
        const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
        
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
        });
        

        const generatedText = response.choices[0]?.message?.content || '';
        
        // Validate that the generated text only includes current symptoms
        const currentSymptoms = [...chiefComplaint.selectedComplaints, chiefComplaint.otherComplaint].filter(Boolean);
        const generatedLower = generatedText.toLowerCase();
        
        // Check for common symptoms that might be incorrectly included
        const commonSymptoms = ['back pain', 'lower back', 'lumbar', 'spine', 'backache'];
        const incorrectlyIncluded = commonSymptoms.filter(symptom => 
            generatedLower.includes(symptom) && 
            !currentSymptoms.some(current => current.toLowerCase().includes('back'))
        );
        
        if (incorrectlyIncluded.length > 0 && import.meta.env.DEV) {
            console.warn('Generated text may include symptoms not in current complaints:', incorrectlyIncluded);
            console.warn('Current symptoms:', currentSymptoms);
            console.warn('Generated text:', generatedText);
        }
        
        setFormData(prev => ({
            ...prev,
            chiefComplaint: {
                ...prev.chiefComplaint,
                presentIllness: generatedText.trim(),
            }
        }));
        
        // Reset the regeneration flag after successful generation
        setNeedsHpiRegeneration(false);

    } catch (error) {
        console.error("Error generating Present Illness text:", error);
        console.error("Error details:", {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            name: error instanceof Error ? error.name : undefined
        });
        alert(`Failed to generate Present Illness text. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
        setIsGeneratingHpi(false);
    }
  };


  const handleGenerateDiagnosis = async () => {
    setIsDiagnosing(true);

    // 이전 차트의 진단 정보 가져오기 (follow-up인 경우)
    let previousDiagnosis = null;
    if (isFollowUp && previousCharts.length > 0) {
      const latestPreviousChart = previousCharts[previousCharts.length - 1];
      previousDiagnosis = {
        etiology: latestPreviousChart.diagnosisAndTreatment.etiology,
        tcmDiagnosis: latestPreviousChart.diagnosisAndTreatment.tcmDiagnosis,
        treatmentPrinciple: latestPreviousChart.diagnosisAndTreatment.treatmentPrinciple,
        chiefComplaint: latestPreviousChart.chiefComplaint.selectedComplaints
      };
    }

    // Chief complaint 비교
    const currentComplaints = formData.chiefComplaint.selectedComplaints;
    const previousComplaints = previousDiagnosis?.chiefComplaint || [];
    const complaintsChanged = JSON.stringify(currentComplaints.sort()) !== JSON.stringify(previousComplaints.sort());

    const patientSummary = JSON.stringify({
        demographics: { age: formData.age, sex: formData.sex },
        ...(isFollowUp && { respondToCare: formData.respondToCare }),
        chiefComplaint: formData.chiefComplaint,
        reviewOfSystems: formData.reviewOfSystems,
        tongue: formData.tongue,
        pulse: formData.pulse,
        ...(!isFollowUp && { medicalHistory: formData.medicalHistory }),
    }, null, 2);
    
    const { acupunctureMethod, acupunctureMethodOther } = formData.diagnosisAndTreatment;
    const methodsForPrompt = acupunctureMethod
        .map(method => method === 'Other' && acupunctureMethodOther ? acupunctureMethodOther : method)
        .filter(m => m !== 'Other');
    
    // 선택된 치료법 가져오기
    const rawTreatments = formData.diagnosisAndTreatment.selectedTreatment;
    const selectedTreatments = Array.isArray(rawTreatments) 
      ? rawTreatments 
      : (rawTreatments ? [rawTreatments] : []);
    const selectedTreatmentsForPrompt = selectedTreatments.filter(t => t !== 'None').join(', ') || 'None';
    
    // 이전 진단 정보를 프롬프트에 포함
    const previousDiagnosisContext = previousDiagnosis ? `
**PREVIOUS VISIT DIAGNOSIS (for reference - maintain consistency if chief complaint unchanged):**
- Etiology: ${previousDiagnosis.etiology || 'N/A'}
- TCM Diagnosis: ${previousDiagnosis.tcmDiagnosis || 'N/A'}
- Treatment Principle: ${previousDiagnosis.treatmentPrinciple || 'N/A'}
- Previous Chief Complaint: ${previousComplaints.join(', ') || 'N/A'}

**IMPORTANT**: ${complaintsChanged 
  ? 'The chief complaint has CHANGED from the previous visit. You may adjust the diagnosis accordingly, but maintain the overall diagnostic framework if the underlying pattern is similar.' 
  : 'The chief complaint is UNCHANGED from the previous visit. You MUST maintain the SAME diagnostic framework (etiology, TCM diagnosis, treatment principle) with only minor refinements based on current symptoms. Do NOT create a completely different diagnosis.'}
` : '';

    const prompt = `Based on the following comprehensive patient data, act as an expert TCM practitioner to generate a diagnosis and treatment plan. Your analysis must be grounded in the principles of 'Chinese Acupuncture and Moxibustion' (中国针灸学). Provide the output in a structured JSON format. ${isFollowUp ? `This is a follow-up visit. Pay close attention to the "respondToCare" data to adjust the diagnosis and treatment plan accordingly.` : ''}
${previousDiagnosisContext}

**CRITICAL REQUIREMENTS - YOU MUST FOLLOW THESE EXACTLY:**

1. **SELECTED ACUPUNCTURE METHODS**: The practitioner has selected ONLY these acupuncture methods: ${methodsForPrompt.length > 0 ? methodsForPrompt.join(', ') : 'None'}. 
   - You MUST provide acupuncture points ONLY for these selected methods.
   - DO NOT suggest points for methods that were NOT selected.
   - If 'Trigger Point' is selected, provide trigger points or Ashi points for relevant muscles.
   - If 'TCM Body' is selected, provide standard channel points.
   - If 'Saam' is selected, provide Saam points with tonification/sedation.
   - If 'Master Tung' is selected, provide Tung's points.
   - If 'Five Element' is selected, provide constitutional points.

2. **SELECTED OTHER TREATMENTS**: The practitioner has selected these treatments: ${selectedTreatmentsForPrompt}.
   - You MUST respect this selection in your recommendation.
   - If a treatment is already selected, confirm it in your recommendation.
   - Do NOT suggest different treatments unless the selected ones are clearly inappropriate.

Patient Data:
${patientSummary}

JSON Output Structure:
{
  "eightPrinciples": {
    "exteriorInterior": "Exterior or Interior",
    "heatCold": "Heat or Cold",
    "excessDeficient": "Excess or Deficient",
    "yangYin": "Based on the three principles above (Exterior/Interior, Heat/Cold, Excess/Deficient), determine if the overall pattern is predominantly Yang or Yin. For example, a pattern of Interior, Cold, and Deficient is Yin."
  },
  "etiology": "${previousDiagnosis && !complaintsChanged ? `CRITICAL: The chief complaint is unchanged. Maintain the SAME etiology framework as the previous visit: "${previousDiagnosis.etiology}". Only make minor refinements if symptoms have slightly changed. Keep the core cause and contributing factors consistent.` : 'Describe the root cause and contributing factors. Be very concise; the entire text must not exceed 3 lines.' + (isFollowUp ? ' Consider changes since the last visit, but maintain consistency if the chief complaint is unchanged.' : '')}",
  "tcmDiagnosis": "${previousDiagnosis && !complaintsChanged ? `CRITICAL: The chief complaint is unchanged. You MUST use the SAME TCM diagnosis as the previous visit: "${previousDiagnosis.tcmDiagnosis}". Do NOT change it unless there is a fundamental shift in the pattern. Only add minor qualifiers if symptoms have evolved slightly.` : 'Provide the primary TCM Syndrome/Differentiation diagnosis (e.g., Liver Qi Stagnation, Spleen Qi Deficiency with Dampness), grounded in "Chinese Acupuncture and Moxibustion" principles.'}",
  "treatmentPrinciple": "${previousDiagnosis && !complaintsChanged ? `CRITICAL: The chief complaint is unchanged. You MUST maintain the SAME treatment principle as the previous visit: "${previousDiagnosis.treatmentPrinciple}". Keep the core principle consistent, only adjust minor details if symptoms have changed slightly.` : 'State the clear treatment principle (e.g., Soothe the Liver, tonify Spleen Qi, resolve dampness).'}",
  "acupuncturePoints": "CRITICAL: Provide acupuncture points ONLY for the selected methods: ${methodsForPrompt.length > 0 ? methodsForPrompt.join(', ') : 'None'}. Your response MUST be a single string. List ONLY the point names/groups; DO NOT include any explanations. Structure the output so that EACH SELECTED METHOD IS ON ITS OWN LINE, using '\\n' as a separator, with the format 'Method Name: point1, point2, point3...'. For example: 'Trigger Point: Upper trapezius, Levator scapulae, Rhomboids, Infraspinatus'; 'TCM Body: ST36, SP6, LI4, LV3, GB34, BL23'; 'Saam: HT8, LR1 (sedate); LU8, SP2 (tonify)' (Saam MUST include at least FOUR points — two for sedation and two for tonification); 'Five Element: Source, Tonification, and Sedation points appropriate for the main pattern (at least 4–6 points total)'. DO NOT include methods that were NOT selected.",
  "herbalTreatment": "Recommend a classic herbal formula based on 'Donguibogam' (동의보감) and 'Bangyakhappyeon' (방약합편). IMPORTANT: Consider the patient's current medications and family history to avoid drug interactions. Start with '[RECOMMENDED]' prefix, then provide the formula name (e.g., '[RECOMMENDED] Du Huo Ji Sheng Tang'). After the formula name, list all the individual herbs (약재) that are included in this formula, separated by commas. Format: '[RECOMMENDED] Formula Name: Herb1, Herb2, Herb3, ...'. If there are any potential interactions with current medications, add a warning note.",
  "otherTreatment": {
    "recommendation": "IMPORTANT: The practitioner has already selected: ${selectedTreatmentsForPrompt}. You MUST recommend one of these selected treatments. If multiple are selected, recommend the most appropriate one. If 'None' is selected, recommend 'None'. Do NOT suggest treatments that were NOT selected.",
    "explanation": "Briefly explain why you recommend this specific treatment from the selected options."
  }
}

Instructions:
- Analyze the interconnected symptoms from all sections (ROS, tongue, chief complaint).
- Provide a concise and clinically relevant diagnosis and plan.
- For Eight Principles, choose only one from each pair and logically determine Yin/Yang.
- **MOST IMPORTANT**: Respect the selected acupuncture methods and treatments. Do NOT suggest points or treatments for methods/treatments that were NOT selected.
- Ensure the output is a valid JSON object only.
`;
    const maxRetries = 3;
    const baseDelay = 2000; // 2초
    
    try {
        const apiKey = import.meta.env.OPENAI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey) {
          throw new Error('OPENAI_API_KEY가 설정되지 않았습니다. .env.local 파일을 확인하세요.');
        }
        const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
        
        // 재시도 로직
        let response;
        let lastError;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                response = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'user', content: prompt }],
                    response_format: { type: "json_object" }
                });
                break; // 성공하면 루프 종료
            } catch (error: any) {
                lastError = error;
                const isRetryableError = error?.error?.code === 503 || 
                                       error?.error?.code === 429 ||
                                       error?.error?.status === 'UNAVAILABLE' ||
                                       error?.error?.status === 'RESOURCE_EXHAUSTED' ||
                                       error?.message?.includes('overloaded') ||
                                       error?.message?.includes('quota') ||
                                       error?.message?.includes('503') ||
                                       error?.message?.includes('429');
                
                // 할당량 초과(429)는 재시도하지 않음 (일일 한도 초과)
                if (error?.error?.code === 429 && error?.error?.message?.includes('quota')) {
                    throw new Error('API 일일 할당량(20회)을 초과했습니다. 내일 다시 시도하거나 유료 플랜으로 업그레이드해주세요.');
                }
                
                if (isRetryableError && attempt < maxRetries - 1) {
                    const delay = baseDelay * Math.pow(2, attempt); // 지수 백오프: 2초, 4초, 8초
                    
                    // Retry-After 시간 파싱 (여러 방법 시도)
                    let waitTime = delay;
                    const retryInfo = error?.error?.details?.find((d: any) => d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo');
                    
                    if (retryInfo?.retryDelay) {
                        // retryDelay가 문자열인 경우 (예: "24.23s" 또는 "24.23")
                        const retryDelayStr = String(retryInfo.retryDelay);
                        const match = retryDelayStr.match(/(\d+\.?\d*)/);
                        if (match) {
                            waitTime = parseFloat(match[1]) * 1000; // 초를 밀리초로 변환
                        }
                    } else if (error?.error?.message) {
                        // 메시지에서 "Please retry in X.XXs" 패턴 찾기
                        const messageMatch = error.error.message.match(/retry in ([\d.]+)s/i);
                        if (messageMatch) {
                            waitTime = parseFloat(messageMatch[1]) * 1000;
                        }
                    }
                    
                    // 최소 대기 시간 보장 (너무 짧으면 문제 발생 가능)
                    waitTime = Math.max(waitTime, 1000);
                    
                    console.log(`⚠️ API 오류 발생. ${(waitTime / 1000).toFixed(1)}초 후 재시도... (${attempt + 1}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    continue;
                } else {
                    throw error; // 재시도 불가능하거나 최대 재시도 횟수 초과
                }
            }
        }
        
        if (!response) {
            throw lastError || new Error('API 호출 실패');
        }

        const generatedJsonString = response.choices[0]?.message?.content?.trim() || '';
        const generatedData = JSON.parse(generatedJsonString);
        
        // 기존 선택된 치료법 유지 (배열이 아닌 경우 처리)
        const rawTreatments = formData.diagnosisAndTreatment.selectedTreatment;
        const currentSelectedTreatments = Array.isArray(rawTreatments) 
          ? rawTreatments 
          : (rawTreatments ? [rawTreatments] : []);
        
        // AI가 추천한 치료법이 있으면 추가 (기존 선택 유지)
        const recommendation = generatedData.otherTreatment?.recommendation || '';
        const explanation = generatedData.otherTreatment?.explanation || '';
        let newSelectedTreatments = [...currentSelectedTreatments];
        let otherTreatmentText = formData.diagnosisAndTreatment.otherTreatmentText || '';

        if (recommendation && recommendation.toLowerCase() !== 'none') {
            const foundTreatment = otherTreatmentOptions.find(opt => recommendation.toLowerCase().includes(opt.value.toLowerCase().replace(/\s/g, '')));
            
            if (foundTreatment && !newSelectedTreatments.includes(foundTreatment.value)) {
                // 기존 선택에 추가 (None이 있으면 제거)
                newSelectedTreatments = newSelectedTreatments.filter(t => t !== 'None');
                newSelectedTreatments.push(foundTreatment.value);
                
                if (foundTreatment.value === 'Other' || foundTreatment.value === 'Auricular Acupuncture') {
                    otherTreatmentText = recommendation.split(':').slice(1).join(':').trim() || explanation;
                } else if (!otherTreatmentText) {
                    otherTreatmentText = explanation;
                }
            } else if (!foundTreatment && !newSelectedTreatments.includes('Other')) {
                // Other로 추가
                newSelectedTreatments = newSelectedTreatments.filter(t => t !== 'None');
                newSelectedTreatments.push('Other');
                if (!otherTreatmentText) {
                    otherTreatmentText = `${recommendation} (${explanation})`;
                }
            }
        }
        
        // None만 있거나 아무것도 없으면 None 유지
        if (newSelectedTreatments.length === 0 || (newSelectedTreatments.length === 1 && newSelectedTreatments[0] === 'None')) {
            newSelectedTreatments = ['None'];
        }

        // CPT 코드 업데이트 (Electro Acupuncture 선택 여부에 따라)
        const hasElectroAcupuncture = newSelectedTreatments.includes('Electro Acupuncture');
        const baseVisitCode = isFollowUp ? '99212' : '99202';
        const acupunctureCodes = hasElectroAcupuncture 
          ? ['97813', '97814']  // 전기침
          : ['97810', '97811']; // 일반 침
        
        const baseCpt = [baseVisitCode, ...acupunctureCodes, '97026'];
        const manualCode = '97140';
        let newCptSet = new Set(baseCpt);
        
        // None이나 Acupressure가 아닌 다른 치료법이 선택되면 97140 추가
        const hasOtherTreatment = newSelectedTreatments.some(t => t !== 'None' && t !== 'Acupressure' && t !== '');
        if (hasOtherTreatment) {
            newCptSet.add(manualCode);
        }
        
        // 기존 CPT 코드에서 다른 코드들 유지
        const existingCpt = formData.diagnosisAndTreatment.cpt.split(',').map(c => c.trim()).filter(Boolean);
        existingCpt.forEach(code => {
            if (!baseCpt.includes(code) && code !== manualCode && code !== '97813' && code !== '97814' && code !== '97810' && code !== '97811') {
                newCptSet.add(code);
            }
        });

        // Chief complaint가 바뀌지 않았고 이전 진단이 있으면, 이전 진단을 우선 유지
        // AI가 생성한 진단이 이전 진단과 크게 다르면 이전 진단 유지
        let finalEtiology = generatedData.etiology || '';
        let finalTcmDiagnosis = generatedData.tcmDiagnosis || '';
        let finalTreatmentPrinciple = generatedData.treatmentPrinciple || '';

        if (previousDiagnosis && !complaintsChanged) {
          // Chief complaint가 바뀌지 않았으면 이전 진단 유지 (AI가 생성한 것이 비슷한 경우만 업데이트)
          // 이전 진단과 완전히 다른 경우는 이전 진단 유지
          const previousEtiology = previousDiagnosis.etiology || '';
          const previousTcmDiagnosis = previousDiagnosis.tcmDiagnosis || '';
          const previousTreatmentPrinciple = previousDiagnosis.treatmentPrinciple || '';

          // AI 생성 진단이 이전 진단과 유사한지 확인 (간단한 키워드 비교)
          const etiologySimilar = !finalEtiology || 
            previousEtiology.toLowerCase().split(/\s+/).some(word => 
              word.length > 3 && finalEtiology.toLowerCase().includes(word)
            ) ||
            finalEtiology.toLowerCase().split(/\s+/).some(word => 
              word.length > 3 && previousEtiology.toLowerCase().includes(word)
            );

          const diagnosisSimilar = !finalTcmDiagnosis || 
            previousTcmDiagnosis.toLowerCase().split(/\s+/).some(word => 
              word.length > 3 && finalTcmDiagnosis.toLowerCase().includes(word)
            ) ||
            finalTcmDiagnosis.toLowerCase().split(/\s+/).some(word => 
              word.length > 3 && previousTcmDiagnosis.toLowerCase().includes(word)
            );

          const principleSimilar = !finalTreatmentPrinciple || 
            previousTreatmentPrinciple.toLowerCase().split(/\s+/).some(word => 
              word.length > 3 && finalTreatmentPrinciple.toLowerCase().includes(word)
            ) ||
            finalTreatmentPrinciple.toLowerCase().split(/\s+/).some(word => 
              word.length > 3 && previousTreatmentPrinciple.toLowerCase().includes(word)
            );

          // 유사하지 않으면 이전 진단 유지
          if (!etiologySimilar) {
            finalEtiology = previousEtiology;
          }
          if (!diagnosisSimilar) {
            finalTcmDiagnosis = previousTcmDiagnosis;
          }
          if (!principleSimilar) {
            finalTreatmentPrinciple = previousTreatmentPrinciple;
          }
        }

        setFormData(prev => ({
            ...prev,
            diagnosisAndTreatment: {
                ...prev.diagnosisAndTreatment,
                eightPrinciples: generatedData.eightPrinciples || prev.diagnosisAndTreatment.eightPrinciples,
                etiology: finalEtiology || prev.diagnosisAndTreatment.etiology || '',
                tcmDiagnosis: finalTcmDiagnosis || prev.diagnosisAndTreatment.tcmDiagnosis || '',
                treatmentPrinciple: finalTreatmentPrinciple || prev.diagnosisAndTreatment.treatmentPrinciple || '',
                acupuncturePoints: generatedData.acupuncturePoints || prev.diagnosisAndTreatment.acupuncturePoints || '',
                herbalTreatment: generatedData.herbalTreatment || prev.diagnosisAndTreatment.herbalTreatment || '',
                selectedTreatment: newSelectedTreatments,
                otherTreatmentText: otherTreatmentText,
                cpt: Array.from(newCptSet).join(', ')
            }
        }));

    } catch (error: any) {
        console.error("Error generating diagnosis:", error);
        
        let errorMessage = "AI 진단 생성에 실패했습니다.";
        if (error?.status === 429) {
            errorMessage = "API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";
        } else if (error?.status === 503) {
            errorMessage = "서버가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해주세요.";
        } else if (error?.message) {
            errorMessage = error.message;
        }
        
        alert(errorMessage);
    } finally {
        setIsDiagnosing(false);
    }
};


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fileNo || !formData.sex || !formData.age) {
        alert("Please fill in all required fields: File No., Sex, and Age.");
        return;
    }
    
    // AI generation for Present Illness is now handled by a separate button.
    // Submit the form data as it is.
    onSubmit(formData);
  };
  
  const handleComplaintChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    handleNestedChange('chiefComplaint', e.target.name, e.target.value);
  }
  const handleMedicalHistoryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    handleNestedChange('medicalHistory', e.target.name, e.target.value);
  }
  
  const handleDiagnosisChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
        ...prev,
        diagnosisAndTreatment: {
            ...prev.diagnosisAndTreatment,
            [name]: value
        }
    }));
  };

  const handleDiagnosisArrayChange = (
    field: keyof DiagnosisAndTreatmentData,
    value: string,
    checked: boolean
  ) => {
      setFormData(prev => {
          const diagnosisData = prev.diagnosisAndTreatment;
          const currentValues = (diagnosisData[field as keyof typeof diagnosisData] as string[]) || [];
          const newValues = checked
              ? [...currentValues, value]
              : currentValues.filter(item => item !== value);
          
          return {
              ...prev,
              diagnosisAndTreatment: {
                  ...diagnosisData,
                  [field]: newValues,
              },
          };
      });
  };
  
  const handleOtherTreatmentArrayChange = (value: string, checked: boolean) => {
    setFormData(prev => {
        // 배열이 아닌 경우(문자열 등)를 처리
        const rawTreatments = prev.diagnosisAndTreatment.selectedTreatment;
        const currentTreatments = Array.isArray(rawTreatments) 
          ? rawTreatments 
          : (rawTreatments ? [rawTreatments] : []);
        let newTreatments: string[];
        
        if (checked) {
            // 추가
            if (value === 'None') {
                // None 선택 시 다른 모든 선택 해제
                newTreatments = ['None'];
            } else {
                // None이 있으면 제거하고 새 항목 추가
                newTreatments = [...currentTreatments.filter(t => t !== 'None'), value];
            }
        } else {
            // 제거
            newTreatments = currentTreatments.filter(t => t !== value);
            // 아무것도 선택되지 않으면 None 추가
            if (newTreatments.length === 0) {
                newTreatments = ['None'];
            }
        }
        
        // CPT 코드 업데이트
        // Electro Acupuncture이 선택되었는지 확인
        const hasElectroAcupuncture = newTreatments.includes('Electro Acupuncture');
        
        // 기본 CPT 코드 설정
        const baseVisitCode = isFollowUp ? '99212' : '99202';
        const acupunctureCodes = hasElectroAcupuncture 
          ? ['97813', '97814']  // 전기침
          : ['97810', '97811']; // 일반 침
        
        const baseCpt = [baseVisitCode, ...acupunctureCodes, '97026'];
        const manualCode = '97140';
        let newCptSet = new Set(baseCpt);
        
        // None이나 Acupressure가 아닌 다른 치료법이 선택되면 97140 추가
        const hasOtherTreatment = newTreatments.some(t => t !== 'None' && t !== 'Acupressure' && t !== '');
        if (hasOtherTreatment) {
            newCptSet.add(manualCode);
        }
        
        const existingCpt = prev.diagnosisAndTreatment.cpt.split(',').map(c => c.trim()).filter(Boolean);
        existingCpt.forEach(code => {
            // 기존 코드 중 baseCpt에 포함되지 않고 manualCode도 아니면 유지
            if (!baseCpt.includes(code) && code !== manualCode && code !== '97813' && code !== '97814' && code !== '97810' && code !== '97811') {
                newCptSet.add(code);
            }
        });

        return {
            ...prev,
            diagnosisAndTreatment: {
                ...prev.diagnosisAndTreatment,
                selectedTreatment: newTreatments,
                cpt: Array.from(newCptSet).join(', ')
            }
        };
    });
};

  const handleEightPrincipleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
        ...prev,
        diagnosisAndTreatment: {
            ...prev.diagnosisAndTreatment,
            eightPrinciples: {
                ...prev.diagnosisAndTreatment.eightPrinciples,
                [name]: value
            }
        }
    }));
  };

  const handleRespondToCareChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, respondToCare: { ...prev.respondToCare!, [name]: value } }));
  };
  
  const handleRespondToCareRadioChange = (name: string, value: string) => {
      setFormData(prev => ({ ...prev, respondToCare: { ...prev.respondToCare!, [name]: value } }));
  };

  const handleBack = () => {
    if (hasChanges && !window.confirm("You have unsaved changes. Are you sure you want to leave? Your changes will be lost.")) {
      return;
    }
    onBack();
  };
  
  const formTitle = isEditing 
      ? 'Edit Patient Record' 
      : isFollowUp 
        ? 'Follow-up Chart' 
        : 'New Patient Registration';

  return (
    <div className="h-screen flex flex-col max-w-4xl mx-auto">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 bg-white border-b shadow-sm pb-4 mb-4 sticky top-0 z-10">
        <h1 className="text-3xl font-bold text-slate-800 text-center pt-4">{formTitle}</h1>
        <div className="flex justify-center mt-4">
          <button
            type="button"
            onClick={handleBack}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Back to List
          </button>
        </div>
      </div>
      
      {/* Scrollable Content Area */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-8 px-4">
      {/* Clinic Information */}
      {!isFollowUp && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-800 border-b pb-4 mb-6">Clinic Information</h2>
            <div className="grid grid-cols-3 gap-4">
            <InputField label="Clinic Name" id="clinicName" name="clinicName" value={formData.clinicName} onChange={handleChange} placeholder="Enter your clinic's name" />
            <div>
              <label htmlFor="clinicLogo" className="block text-sm font-medium text-gray-700 mb-1">Clinic Logo</label>
              <input
                type="file"
                id="clinicLogo"
                name="clinicLogo"
                onChange={handleLogoChange}
                accept="image/png, image/jpeg, image/gif"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              {formData.clinicLogo && (
                <div className="mt-4">
                  <img src={formData.clinicLogo} alt="Clinic Logo Preview" className="h-20 w-auto rounded border p-1" />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, clinicLogo: '' }))}
                    className="mt-2 text-xs text-red-600 hover:text-red-800"
                  >
                    Remove Logo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Patient Information */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-4 mb-6">Patient Information</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <InputField label="File No." id="fileNo" value={formData.fileNo} onChange={handleChange} required />
            {fileNoDuplicateWarning && (
              <p className="mt-1 text-sm text-red-600 font-medium">{fileNoDuplicateWarning}</p>
            )}
          </div>
          <InputField label="Name (Last, First)" id="name" value={formData.name} onChange={handleChange} placeholder="e.g., DOE, John" required />
          <InputField label="Date" id="date" value={formData.date} onChange={handleChange} type="date" required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient Type</label>
            <select
              id="patientType"
              name="patientType"
              value={formData.patientType || 'cash'}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="cash">Cash</option>
              <option value="insurance">Insurance</option>
              <option value="pi">PI</option>
              <option value="worker-comp">Worker Comp</option>
            </select>
          </div>
          
          {!isFollowUp && (
            <>
                <InputField label="Address" id="address" name="address" value={formData.address} onChange={handleChange} placeholder="주소를 입력하세요" className="col-span-2" />
                <InputField label="Phone" id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="전화번호를 입력하세요" />
            </>
          )}
          
          <InputField label="Occupation" id="occupation" value={formData.occupation} onChange={handleChange} />
          <InputField label="Date of Birth" id="dob" value={formData.dob} onChange={handleChange} type="date" placeholder="생년월일을 선택하세요" />
          <InputField label="Age" id="age" value={formData.age} onChange={handleChange} type="number" unit="yrs old" required />
          <div>
            <label htmlFor="sex" className="block text-sm font-medium text-gray-700 mb-1">Sex <span className="text-red-500">*</span></label>
            <select
              id="sex"
              name="sex"
              value={formData.sex}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
            >
              <option value="">Select...</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vitals */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-4 mb-6">Vital Signs</h2>
        <div className="grid grid-cols-3 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                <div className="flex items-center space-x-2">
                    <div className="flex-1 relative">
                        <input type="number" id="heightFt" name="heightFt" value={formData.heightFt} onChange={handleChange} placeholder="Feet" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500 pointer-events-none">ft</span>
                    </div>
                    <div className="flex-1 relative">
                        <input type="number" id="heightIn" name="heightIn" value={formData.heightIn} onChange={handleChange} placeholder="Inches" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500 pointer-events-none">in</span>
                    </div>
                </div>
            </div>
            <InputField label="Weight" id="weight" value={formData.weight} onChange={handleChange} type="number" unit="lbs" />
            <div>
              <label htmlFor="temp" className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
              <div className="flex items-center relative">
                  <button type="button" onClick={() => handleTempChange(false)} className="px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 hover:bg-gray-100 focus:outline-none">-</button>
                  <input type="number" id="temp" name="temp" value={formData.temp} onChange={handleChange} step="0.1" className="flex-1 px-3 py-2 border-t border-b border-gray-300 text-center focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                  <span className="absolute right-12 pr-3 flex items-center text-sm text-gray-500 pointer-events-none">°F</span>
                  <button type="button" onClick={() => handleTempChange(true)} className="px-3 py-2 border border-gray-300 rounded-r-md bg-gray-50 hover:bg-gray-100 focus:outline-none">+</button>
              </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blood Pressure</label>
                <div className="flex items-center space-x-2">
                    <input type="number" name="bpSystolic" value={formData.bpSystolic} onChange={handleChange} className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Systolic"/>
                    <span className="text-gray-500">/</span>
                    <input type="number" name="bpDiastolic" value={formData.bpDiastolic} onChange={handleChange} className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Diastolic"/>
                     <span className="text-sm text-gray-500 whitespace-nowrap">mmHg</span>
                </div>
            </div>
            <div>
              <label htmlFor="heartRate" className="block text-sm font-medium text-gray-700 mb-1">Heart Rate</label>
              <div className="flex items-center relative">
                  <button type="button" onClick={() => handleHeartRateChange(false)} className="px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 hover:bg-gray-100 focus:outline-none">-</button>
                  <input type="number" id="heartRate" name="heartRate" value={formData.heartRate} onChange={handleChange} className="flex-1 px-3 py-2 border-t border-b border-gray-300 text-center focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                  <span className="absolute right-12 pr-3 flex items-center text-sm text-gray-500 pointer-events-none">BPM</span>
                  <button type="button" onClick={() => handleHeartRateChange(true)} className="px-3 py-2 border border-gray-300 rounded-r-md bg-gray-50 hover:bg-gray-100 focus:outline-none">+</button>
              </div>
            </div>
            <div>
                <label htmlFor="heartRhythm" className="block text-sm font-medium text-gray-700 mb-1">Heart Rhythm</label>
                <select id="heartRhythm" name="heartRhythm" value={formData.heartRhythm} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                  <option value="Normal">Normal</option>
                  <option value="Occasionally Irregular">Occasionally Irregular</option>
                  <option value="Constantly Irregular">Constantly Irregular</option>
                </select>
              </div>
            <div>
              <label htmlFor="lungRate" className="block text-sm font-medium text-gray-700 mb-1">Lung Rate</label>
              <div className="flex items-center relative">
                  <button type="button" onClick={() => handleLungRateChange(false)} className="px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 hover:bg-gray-100">-</button>
                  <input type="number" id="lungRate" name="lungRate" value={formData.lungRate} onChange={handleChange} className="flex-1 px-3 py-2 border-t border-b border-gray-300 text-center focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                  <span className="absolute right-12 pr-3 flex items-center text-sm text-gray-500 pointer-events-none">BPM</span>
                  <button type="button" onClick={() => handleLungRateChange(true)} className="px-3 py-2 border border-gray-300 rounded-r-md bg-gray-50 hover:bg-gray-100">+</button>
              </div>
            </div>
             <div>
                <label htmlFor="lungSound" className="block text-sm font-medium text-gray-700 mb-1">Lung Sound</label>
                <select id="lungSound" name="lungSound" value={formData.lungSound} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                  <option value="Clear">Clear</option>
                  <option value="Wheezing">Wheezing</option>
                  <option value="Crackles">Crackles</option>
                  <option value="Rhonchi">Rhonchi</option>
                  <option value="Diminished">Diminished</option>
                  <option value="Apnea">Apnea</option>
                </select>
              </div>
        </div>
      </div>
      
      {/* Previous Charts Reference - follow-up only */}
      {isFollowUp && previousCharts.length > 0 && (
        <div className="bg-blue-50 border-2 border-blue-300 p-4 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-blue-800">Previous Charts Reference</h3>
            <button
              type="button"
              onClick={() => setShowPreviousCharts(!showPreviousCharts)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              {showPreviousCharts ? 'Hide' : 'Show Previous Charts'}
            </button>
          </div>
          {showPreviousCharts && (
            <div className="mt-4 space-y-4 max-h-96 overflow-y-auto">
              {previousCharts.map((chart, index) => (
                <div key={index} className="bg-white p-4 rounded border border-blue-200">
                  <div className="font-semibold text-gray-700 mb-2">
                    Visit: {new Date(chart.date).toLocaleDateString('en-US')}
                  </div>
                  <div className="text-sm space-y-2">
                    <div>
                      <strong>Chief Complaints:</strong> {[...chart.chiefComplaint.selectedComplaints, chart.chiefComplaint.otherComplaint].filter(Boolean).join(', ') || 'N/A'}
                    </div>
                    {chart.chiefComplaint.location && (
                      <div>
                        <strong>Location:</strong> {chart.chiefComplaint.location}
                      </div>
                    )}
                    {chart.chiefComplaint.presentIllness && (
                      <div>
                        <strong>Present Illness:</strong>
                        <div className="mt-1 p-2 bg-gray-50 rounded text-xs max-h-32 overflow-y-auto">
                          {chart.chiefComplaint.presentIllness.substring(0, 200)}
                          {chart.chiefComplaint.presentIllness.length > 200 && '...'}
                        </div>
                      </div>
                    )}
                    {chart.diagnosisAndTreatment.tcmDiagnosis && (
                      <div>
                        <strong>TCM Diagnosis:</strong> {chart.diagnosisAndTreatment.tcmDiagnosis}
                      </div>
                    )}
                    {chart.diagnosisAndTreatment.acupuncturePoints && (
                      <div>
                        <strong>Acupuncture Points:</strong> {chart.diagnosisAndTreatment.acupuncturePoints.substring(0, 100)}
                        {chart.diagnosisAndTreatment.acupuncturePoints.length > 100 && '...'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Respond to Care */}
      {isFollowUp && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-800 border-b pb-4 mb-6">Response to Previous Care (MNR Assessment)</h2>
          <div className="space-y-6">
            {/* Overall Status */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">1. Overall Response Status</label>
              <RadioGroup 
                  name="status"
                  selectedValue={formData.respondToCare?.status || ''}
                  onChange={(e) => handleRespondToCareRadioChange('status', e.target.value)}
                  options={[
                      { value: 'Resolved', label: 'Resolved' },
                      { value: 'Improved', label: 'Improved' },
                      { value: 'Same', label: 'Same' },
                      { value: 'Worse', label: 'Worse' },
                  ]}
              />
            </div>

            {/* Improvement Duration */}
            {formData.respondToCare?.status === 'Improved' && (
              <div className="grid grid-cols-2 gap-4">
              <div>
                  <label htmlFor="improvedPercent" className="block text-sm font-semibold text-gray-700 mb-2">
                    How much ?%
                </label>
                <div className="flex items-center space-x-2">
                  <input
                      type="number"
                        id="improvedPercent"
                        name="improvedPercent"
                        value={formData.respondToCare?.improvedPercent || ''}
                      onChange={handleRespondToCareChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="0"
                  />
                    <span className="text-sm text-gray-600">%</span>
                </div>
              </div>
                <div>
                  <label htmlFor="improvedDays" className="block text-sm font-semibold text-gray-700 mb-2">
                    How many days?
                  </label>
                  <div className="flex items-center space-x-2">
                  <input
                      type="number"
                        id="improvedDays"
                        name="improvedDays"
                        value={formData.respondToCare?.improvedDays || ''}
                      onChange={handleRespondToCareChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="0"
                  />
                    <span className="text-sm text-gray-600">days</span>
                </div>
                </div>
                </div>
            )}

            {/* Functional Activities */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Functional Activities</h3>
              
              {/* Sitting Max Time */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum time patient can sit without pain?
                </label>
                <RadioGroup 
                    name="canSitMaxTime"
                    selectedValue={formData.respondToCare?.canSitMaxTime || ''}
                    onChange={(e) => handleRespondToCareRadioChange('canSitMaxTime', e.target.value)}
                    options={[
                        { value: '5min', label: '5 minutes' },
                        { value: '15min', label: '15 minutes' },
                        { value: '30min', label: '30 minutes' },
                        { value: '60min+', label: '60 minutes or more' },
                    ]}
                />
              </div>

              {/* Walking Max Time */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum time patient can walk without pain?
                </label>
                <RadioGroup 
                    name="canWalkMaxTime"
                    selectedValue={formData.respondToCare?.canWalkMaxTime || ''}
                    onChange={(e) => handleRespondToCareRadioChange('canWalkMaxTime', e.target.value)}
                    options={[
                        { value: '5min', label: '5 minutes' },
                        { value: '15min', label: '15 minutes' },
                        { value: '30min', label: '30 minutes' },
                        { value: '60min+', label: '60 minutes or more' },
                    ]}
                />
              </div>

              {/* Driving Max Time */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How long before pain starts while driving?
                </label>
                <RadioGroup 
                    name="canDriveMaxTime"
                    selectedValue={formData.respondToCare?.canDriveMaxTime || ''}
                    onChange={(e) => handleRespondToCareRadioChange('canDriveMaxTime', e.target.value)}
                    options={[
                        { value: '5min', label: '5 minutes' },
                        { value: '15min', label: '15 minutes' },
                        { value: '30min', label: '30 minutes' },
                        { value: '60min+', label: '60 minutes or more' },
                    ]}
                    />
                  </div>
              </div>

            {/* Daily Activities Discomfort */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Daily Activities Discomfort (0-10 scale)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="houseworkDiscomfort" className="block text-sm font-medium text-gray-700 mb-1">
                    Housework (cleaning, cooking): Level of discomfort (0-10)
                </label>
                  <select
                      id="houseworkDiscomfort"
                      name="houseworkDiscomfort"
                      value={formData.respondToCare?.houseworkDiscomfort || ''}
                        onChange={handleRespondToCareChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Select...</option>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <option key={num} value={num.toString()}>{num}</option>
                    ))}
                  </select>
                  </div>
                <div>
                  <label htmlFor="liftingDiscomfort" className="block text-sm font-medium text-gray-700 mb-1">
                    Lifting objects: Level of discomfort (0-10)
                  </label>
                  <select
                      id="liftingDiscomfort"
                      name="liftingDiscomfort"
                      value={formData.respondToCare?.liftingDiscomfort || ''}
                      onChange={handleRespondToCareChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Select...</option>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <option key={num} value={num.toString()}>{num}</option>
                    ))}
                  </select>
              </div>
                <div>
                  <label htmlFor="sleepQualityDiscomfort" className="block text-sm font-medium text-gray-700 mb-1">
                    Sleep quality: Level of discomfort (0-10)
                </label>
                <select
                      id="sleepQualityDiscomfort"
                      name="sleepQualityDiscomfort"
                      value={formData.respondToCare?.sleepQualityDiscomfort || ''}
                    onChange={handleRespondToCareChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Select...</option>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <option key={num} value={num.toString()}>{num}</option>
                    ))}
                </select>
              </div>
                <div>
                  <label htmlFor="commuteDiscomfort" className="block text-sm font-medium text-gray-700 mb-1">
                    Work/Job activities: Level of discomfort (0-10)
                </label>
                <select
                      id="commuteDiscomfort"
                      name="commuteDiscomfort"
                      value={formData.respondToCare?.commuteDiscomfort || ''}
                    onChange={handleRespondToCareChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Select...</option>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <option key={num} value={num.toString()}>{num}</option>
                    ))}
                </select>
                </div>
              </div>
            </div>
            
            {/* Additional Metrics */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Additional Metrics</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="avoidedActivitiesCount" className="block text-sm font-medium text-gray-700 mb-1">
                    Number of activities avoided due to pain? (e.g., golf, tennis, running)
                  </label>
                  <input
                      type="number"
                      id="avoidedActivitiesCount"
                      name="avoidedActivitiesCount"
                      value={formData.respondToCare?.avoidedActivitiesCount || ''}
                      onChange={handleRespondToCareChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="0"
                  />
                </div>
                <div>
                  <label htmlFor="painMedicationFrequency" className="block text-sm font-medium text-gray-700 mb-1">
                    Pain medication frequency (per week)
                  </label>
                  <input
                      type="number"
                      id="painMedicationFrequency"
                      name="painMedicationFrequency"
                      value={formData.respondToCare?.painMedicationFrequency || ''}
                      onChange={handleRespondToCareChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medication usage change compared to before treatment (e.g., pain killer, ibuprofen, Tylenol)
                  </label>
                  <RadioGroup 
                      name="medicationChange"
                      selectedValue={formData.respondToCare?.medicationChange || ''}
                      onChange={(e) => handleRespondToCareRadioChange('medicationChange', e.target.value)}
                      options={[
                          { value: 'Decreased', label: 'Decreased' },
                          { value: 'Same', label: 'Same' },
                          { value: 'Increased', label: 'Increased' },
                      ]}
                  />
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="respondToCareNotes" className="block text-sm font-semibold text-gray-700">
                  9. Additional Notes (Optional)
                </label>
                <button
                  type="button"
                  onClick={() => handleImproveText(['respondToCare', 'notes'], formData.respondToCare?.notes || '', 'respondToCareNotes')}
                  disabled={!formData.respondToCare?.notes || improvingFields.has('respondToCare.notes')}
                  className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {improvingFields.has('respondToCare.notes') ? 'Improving...' : '✎ Improve'}
                </button>
              </div>
              <textarea
                  id="respondToCareNotes"
                  name="notes"
                  value={formData.respondToCare?.notes || ''}
                  onChange={handleRespondToCareChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Examples: Activities avoided due to pain (e.g., golf, tennis, running). Medication names (e.g., pain killer, ibuprofen, Tylenol). Any other relevant details about patient's response to treatment..."
              />
            </div>
          </div>
        </div>
      )}

       {/* Chief Complaint */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-4 mb-6">Chief Complaint(s)</h2>
        <div className="space-y-4 mb-6">
            <label className="block text-sm font-medium text-gray-700">Select common complaints:</label>
            <CheckboxGroup options={commonComplaints} selected={formData.chiefComplaint.selectedComplaints} onChange={(val, checked) => handleArrayChange('chiefComplaint', 'selectedComplaints', val, checked)} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">Other Complaint</label>
            <button
              type="button"
              onClick={() => handleImproveText(['chiefComplaint', 'otherComplaint'], formData.chiefComplaint.otherComplaint, 'otherComplaint')}
              disabled={!formData.chiefComplaint.otherComplaint || improvingFields.has('chiefComplaint.otherComplaint')}
              className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {improvingFields.has('chiefComplaint.otherComplaint') ? 'Improving...' : '✎ Improve'}
            </button>
          </div>
          <InputField
            label=""
            id="otherComplaint"
            name="otherComplaint"
            value={formData.chiefComplaint.otherComplaint}
            onChange={handleComplaintChange}
            placeholder="Enter other complaint if not listed"
          />
        </div>
        
        <div className="mt-6 border-t pt-6 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <InputField label="Location" id="location" name="location" value={formData.chiefComplaint.location} onChange={handleComplaintChange} placeholder="Describe location (e.g., low back, right shoulder)" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Radiation</label>
                <button
                  type="button"
                  onClick={() => handleImproveText(['chiefComplaint', 'regionRadiation'], formData.chiefComplaint.regionRadiation, 'regionRadiation')}
                  disabled={!formData.chiefComplaint.regionRadiation || improvingFields.has('chiefComplaint.regionRadiation')}
                  className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {improvingFields.has('chiefComplaint.regionRadiation') ? 'Improving...' : '✎ Improve'}
                </button>
              </div>
              <InputField label="" id="regionRadiation" name="regionRadiation" value={formData.chiefComplaint.regionRadiation} onChange={handleComplaintChange} placeholder="e.g., Pain radiates to left leg" />
            </div>
             {!isFollowUp && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Onset</label>
                  <div className="flex items-center space-x-2">
                    <input type="number" name="onsetValue" value={formData.chiefComplaint.onsetValue} onChange={handleComplaintChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="e.g., 3" />
                    <select name="onsetUnit" value={formData.chiefComplaint.onsetUnit} onChange={handleComplaintChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                      <option value="">Select unit...</option>
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                      <option value="months">Months</option>
                      <option value="years">Years</option>
                    </select>
                  </div>
                </div>
             )}
          </div>

          <div className="grid grid-cols-3 gap-4">
             <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                 <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">P/L = </span>
                    <input type="number" name="severityScore" value={formData.chiefComplaint.severityScore} onChange={handleComplaintChange} className="w-16 px-2 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                     <span className="text-sm text-gray-600">/ 10</span>
                     <select name="severityDescription" value={formData.chiefComplaint.severityDescription} onChange={handleComplaintChange} className="flex-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                         <option value="">Select...</option>
                         <option value="Minimal">Minimal (최소)</option>
                         <option value="Slight">Slight (약간)</option>
                         <option value="Moderate">Moderate (중간)</option>
                         <option value="Severe">Severe (심각)</option>
                     </select>
                 </div>
            </div>
          </div>
          
          {/* Quality of Pain - 항상 표시 (PDF에서 추출한 값도 보여주기 위해) */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Quality of Pain</label>
            <CheckboxGroup 
              options={painQualities} 
              selected={formData.chiefComplaint.quality || []} 
              onChange={(val, checked) => handleArrayChange('chiefComplaint', 'quality', val, checked)} 
              gridCols="grid-cols-4" 
            />
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Other Quality</label>
                <button
                  type="button"
                  onClick={() => handleImproveText(['chiefComplaint', 'qualityOther'], formData.chiefComplaint.qualityOther || '', 'qualityOther')}
                  disabled={!formData.chiefComplaint.qualityOther || improvingFields.has('chiefComplaint.qualityOther')}
                  className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {improvingFields.has('chiefComplaint.qualityOther') ? 'Improving...' : '✎ Improve'}
                </button>
              </div>
            <InputField 
                label="" 
              id="qualityOther" 
              name="qualityOther" 
              value={formData.chiefComplaint.qualityOther || ''} 
              onChange={handleComplaintChange} 
            />
            </div>
          </div>
          
          {/* Range of Motion */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Range of Motion (관절 가동 범위)</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Add Joint to Measure:</label>
              <div className="flex flex-wrap gap-2">
                {['Neck', 'Shoulder L', 'Shoulder R', 'Elbow L', 'Elbow R', 'Wrist L', 'Wrist R', 'Hip L', 'Hip R', 'Knee L', 'Knee R', 'Ankle L', 'Ankle R', 'Spine'].map(joint => {
                  const rom = formData.rangeOfMotion || {};
                  const isAdded = rom[joint];
                  return (
                    <button
                      key={joint}
                      type="button"
                      onClick={() => isAdded ? removeROMJoint(joint) : addROMJoint(joint)}
                      className={`px-3 py-1 text-sm rounded-md ${
                        isAdded
                          ? 'bg-green-100 text-green-800 border border-green-300 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {isAdded ? '✓ ' : '+'} {joint}
                    </button>
                  );
                })}
              </div>
            </div>

            {Object.keys(formData.rangeOfMotion || {}).length > 0 && (
              <div className="space-y-4 border-t pt-4">
                {Object.keys(formData.rangeOfMotion || {}).map(joint => {
                  const jointData = formData.rangeOfMotion[joint] || {};
                  const isNeck = joint === 'Neck';
                  const isSpine = joint === 'Spine';
                  const isShoulder = joint.includes('Shoulder');
                  const isHip = joint.includes('Hip');
                  const isElbow = joint.includes('Elbow');
                  const isWrist = joint.includes('Wrist');
                  const isAnkle = joint.includes('Ankle');
                  
                  return (
                    <div key={joint} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-gray-800">{joint}</h4>
                        <button
                          type="button"
                          onClick={() => removeROMJoint(joint)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3">
                        {/* Normal ROM ranges */}
                        {(() => {
                          const normalRanges: { [key: string]: { [motion: string]: string } } = {
                            'Neck': { flexion: '50°', extension: '60°', lateralFlexion: '45°', rotation: '80°' },
                            'Shoulder L': { flexion: '180°', extension: '50°', abduction: '180°', adduction: '50°', internalRotation: '70°', externalRotation: '90°' },
                            'Shoulder R': { flexion: '180°', extension: '50°', abduction: '180°', adduction: '50°', internalRotation: '70°', externalRotation: '90°' },
                            'Elbow L': { flexion: '150°', extension: '0°', pronation: '80°', supination: '80°' },
                            'Elbow R': { flexion: '150°', extension: '0°', pronation: '80°', supination: '80°' },
                            'Wrist L': { flexion: '80°', extension: '70°', radialDeviation: '20°', ulnarDeviation: '30°' },
                            'Wrist R': { flexion: '80°', extension: '70°', radialDeviation: '20°', ulnarDeviation: '30°' },
                            'Hip L': { flexion: '120°', extension: '30°', abduction: '50°', adduction: '30°', internalRotation: '40°', externalRotation: '50°' },
                            'Hip R': { flexion: '120°', extension: '30°', abduction: '50°', adduction: '30°', internalRotation: '40°', externalRotation: '50°' },
                            'Knee L': { flexion: '135°', extension: '0°' },
                            'Knee R': { flexion: '135°', extension: '0°' },
                            'Ankle L': { dorsiflexion: '20°', plantarflexion: '50°', inversion: '30°', eversion: '20°' },
                            'Ankle R': { dorsiflexion: '20°', plantarflexion: '50°', inversion: '30°', eversion: '20°' },
                            'Spine': { flexion: '60°', extension: '25°', lateralFlexion: '25°', rotation: '30°' },
                          };
                          const normalRange = normalRanges[joint] || {};
                          
                          return (
                            <>
                              {/* Neck: Flexion, Extension, Lateral Flexion, Rotation */}
                              {isNeck && (
                          <>
                            <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Flexion (forward) {normalRange.flexion && <span className="text-gray-400">({normalRange.flexion})</span>}
                                    </label>
                              <div className="flex items-center space-x-1">
                                <input
                                  type="number"
                                  value={jointData.flexion || ''}
                                  onChange={(e) => handleROMChange(joint, 'flexion', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                  placeholder="0"
                                />
                                <span className="text-xs text-gray-500">°</span>
                              </div>
                            </div>
                            <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Extension (backward) {normalRange.extension && <span className="text-gray-400">({normalRange.extension})</span>}
                                    </label>
                              <div className="flex items-center space-x-1">
                                <input
                                  type="number"
                                  value={jointData.extension || ''}
                                  onChange={(e) => handleROMChange(joint, 'extension', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                  placeholder="0"
                                />
                                <span className="text-xs text-gray-500">°</span>
                              </div>
                            </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Lateral Flexion {normalRange.lateralFlexion && <span className="text-gray-400">({normalRange.lateralFlexion})</span>}
                                    </label>
                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="number"
                                        value={jointData.lateralFlexion || ''}
                                        onChange={(e) => handleROMChange(joint, 'lateralFlexion', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="0"
                                      />
                                      <span className="text-xs text-gray-500">°</span>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Rotation {normalRange.rotation && <span className="text-gray-400">({normalRange.rotation})</span>}
                                    </label>
                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="number"
                                        value={jointData.rotation || ''}
                                        onChange={(e) => handleROMChange(joint, 'rotation', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="0"
                                      />
                                      <span className="text-xs text-gray-500">°</span>
                                    </div>
                                  </div>
                          </>
                        )}
                        
                              {/* Spine: Flexion, Extension, Lateral Flexion, Rotation */}
                              {isSpine && (
                          <>
                            <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Flexion (forward) {normalRange.flexion && <span className="text-gray-400">({normalRange.flexion})</span>}
                                    </label>
                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="number"
                                        value={jointData.flexion || ''}
                                        onChange={(e) => handleROMChange(joint, 'flexion', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="0"
                                      />
                                      <span className="text-xs text-gray-500">°</span>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Extension (backward) {normalRange.extension && <span className="text-gray-400">({normalRange.extension})</span>}
                                    </label>
                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="number"
                                        value={jointData.extension || ''}
                                        onChange={(e) => handleROMChange(joint, 'extension', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="0"
                                      />
                                      <span className="text-xs text-gray-500">°</span>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Lateral Flexion {normalRange.lateralFlexion && <span className="text-gray-400">({normalRange.lateralFlexion})</span>}
                                    </label>
                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="number"
                                        value={jointData.lateralFlexion || ''}
                                        onChange={(e) => handleROMChange(joint, 'lateralFlexion', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="0"
                                      />
                                      <span className="text-xs text-gray-500">°</span>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Rotation {normalRange.rotation && <span className="text-gray-400">({normalRange.rotation})</span>}
                                    </label>
                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="number"
                                        value={jointData.rotation || ''}
                                        onChange={(e) => handleROMChange(joint, 'rotation', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="0"
                                      />
                                      <span className="text-xs text-gray-500">°</span>
                                    </div>
                                  </div>
                                </>
                              )}
                              
                              {/* Shoulder: Flexion, Extension, Abduction, Adduction, Internal/External Rotation */}
                              {isShoulder && (
                                <>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Flexion {normalRange.flexion && <span className="text-gray-400">({normalRange.flexion})</span>}
                                    </label>
                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="number"
                                        value={jointData.flexion || ''}
                                        onChange={(e) => handleROMChange(joint, 'flexion', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="0"
                                      />
                                      <span className="text-xs text-gray-500">°</span>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Extension {normalRange.extension && <span className="text-gray-400">({normalRange.extension})</span>}
                                    </label>
                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="number"
                                        value={jointData.extension || ''}
                                        onChange={(e) => handleROMChange(joint, 'extension', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="0"
                                      />
                                      <span className="text-xs text-gray-500">°</span>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Abduction {normalRange.abduction && <span className="text-gray-400">({normalRange.abduction})</span>}
                                    </label>
                              <div className="flex items-center space-x-1">
                                <input
                                  type="number"
                                  value={jointData.abduction || ''}
                                  onChange={(e) => handleROMChange(joint, 'abduction', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                  placeholder="0"
                                />
                                <span className="text-xs text-gray-500">°</span>
                              </div>
                            </div>
                            <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Adduction {normalRange.adduction && <span className="text-gray-400">({normalRange.adduction})</span>}
                                    </label>
                              <div className="flex items-center space-x-1">
                                <input
                                  type="number"
                                  value={jointData.adduction || ''}
                                  onChange={(e) => handleROMChange(joint, 'adduction', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                  placeholder="0"
                                />
                                <span className="text-xs text-gray-500">°</span>
                              </div>
                            </div>
                            <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Internal Rotation {normalRange.internalRotation && <span className="text-gray-400">({normalRange.internalRotation})</span>}
                                    </label>
                              <div className="flex items-center space-x-1">
                                <input
                                  type="number"
                                  value={jointData.internalRotation || ''}
                                  onChange={(e) => handleROMChange(joint, 'internalRotation', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                  placeholder="0"
                                />
                                <span className="text-xs text-gray-500">°</span>
                              </div>
                            </div>
                            <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      External Rotation {normalRange.externalRotation && <span className="text-gray-400">({normalRange.externalRotation})</span>}
                                    </label>
                              <div className="flex items-center space-x-1">
                                <input
                                  type="number"
                                  value={jointData.externalRotation || ''}
                                  onChange={(e) => handleROMChange(joint, 'externalRotation', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                  placeholder="0"
                                />
                                <span className="text-xs text-gray-500">°</span>
                              </div>
                            </div>
                          </>
                        )}
                        
                              {/* Hip: Flexion, Extension, Abduction, Adduction, Internal/External Rotation */}
                              {isHip && (
                          <>
                            <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Flexion {normalRange.flexion && <span className="text-gray-400">({normalRange.flexion})</span>}
                                    </label>
                              <div className="flex items-center space-x-1">
                                <input
                                  type="number"
                                        value={jointData.flexion || ''}
                                        onChange={(e) => handleROMChange(joint, 'flexion', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                  placeholder="0"
                                />
                                <span className="text-xs text-gray-500">°</span>
                              </div>
                            </div>
                            <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Extension {normalRange.extension && <span className="text-gray-400">({normalRange.extension})</span>}
                                    </label>
                              <div className="flex items-center space-x-1">
                                <input
                                  type="number"
                                        value={jointData.extension || ''}
                                        onChange={(e) => handleROMChange(joint, 'extension', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="0"
                                      />
                                      <span className="text-xs text-gray-500">°</span>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Abduction {normalRange.abduction && <span className="text-gray-400">({normalRange.abduction})</span>}
                                    </label>
                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="number"
                                        value={jointData.abduction || ''}
                                        onChange={(e) => handleROMChange(joint, 'abduction', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="0"
                                      />
                                      <span className="text-xs text-gray-500">°</span>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Adduction {normalRange.adduction && <span className="text-gray-400">({normalRange.adduction})</span>}
                                    </label>
                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="number"
                                        value={jointData.adduction || ''}
                                        onChange={(e) => handleROMChange(joint, 'adduction', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="0"
                                      />
                                      <span className="text-xs text-gray-500">°</span>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Internal Rotation {normalRange.internalRotation && <span className="text-gray-400">({normalRange.internalRotation})</span>}
                                    </label>
                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="number"
                                        value={jointData.internalRotation || ''}
                                        onChange={(e) => handleROMChange(joint, 'internalRotation', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="0"
                                      />
                                      <span className="text-xs text-gray-500">°</span>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      External Rotation {normalRange.externalRotation && <span className="text-gray-400">({normalRange.externalRotation})</span>}
                                    </label>
                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="number"
                                        value={jointData.externalRotation || ''}
                                        onChange={(e) => handleROMChange(joint, 'externalRotation', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                  placeholder="0"
                                />
                                <span className="text-xs text-gray-500">°</span>
                              </div>
                            </div>
                          </>
                        )}
                              
                              {/* Elbow: Flexion, Extension, Pronation, Supination */}
                              {isElbow && (
                                <>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Flexion {normalRange.flexion && <span className="text-gray-400">({normalRange.flexion})</span>}
                                    </label>
                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="number"
                                        value={jointData.flexion || ''}
                                        onChange={(e) => handleROMChange(joint, 'flexion', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="0"
                                      />
                                      <span className="text-xs text-gray-500">°</span>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Extension {normalRange.extension && <span className="text-gray-400">({normalRange.extension})</span>}
                                    </label>
                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="number"
                                        value={jointData.extension || ''}
                                        onChange={(e) => handleROMChange(joint, 'extension', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="0"
                                      />
                                      <span className="text-xs text-gray-500">°</span>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Pronation {normalRange.pronation && <span className="text-gray-400">({normalRange.pronation})</span>}
                                    </label>
                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="number"
                                        value={jointData.pronation || ''}
                                        onChange={(e) => handleROMChange(joint, 'pronation', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="0"
                                      />
                                      <span className="text-xs text-gray-500">°</span>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Supination {normalRange.supination && <span className="text-gray-400">({normalRange.supination})</span>}
                                    </label>
                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="number"
                                        value={jointData.supination || ''}
                                        onChange={(e) => handleROMChange(joint, 'supination', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="0"
                                      />
                                      <span className="text-xs text-gray-500">°</span>
                                    </div>
                                  </div>
                                </>
                              )}
                              
                              {/* Wrist: Flexion, Extension, Radial Deviation, Ulnar Deviation */}
                              {isWrist && (
                                <>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Flexion {normalRange.flexion && <span className="text-gray-400">({normalRange.flexion})</span>}
                                    </label>
                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="number"
                                        value={jointData.flexion || ''}
                                        onChange={(e) => handleROMChange(joint, 'flexion', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="0"
                                      />
                                      <span className="text-xs text-gray-500">°</span>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Extension {normalRange.extension && <span className="text-gray-400">({normalRange.extension})</span>}
                                    </label>
                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="number"
                                        value={jointData.extension || ''}
                                        onChange={(e) => handleROMChange(joint, 'extension', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="0"
                                      />
                                      <span className="text-xs text-gray-500">°</span>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Radial Deviation {normalRange.radialDeviation && <span className="text-gray-400">({normalRange.radialDeviation})</span>}
                                    </label>
                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="number"
                                        value={jointData.radialDeviation || ''}
                                        onChange={(e) => handleROMChange(joint, 'radialDeviation', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="0"
                                      />
                                      <span className="text-xs text-gray-500">°</span>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Ulnar Deviation {normalRange.ulnarDeviation && <span className="text-gray-400">({normalRange.ulnarDeviation})</span>}
                                    </label>
                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="number"
                                        value={jointData.ulnarDeviation || ''}
                                        onChange={(e) => handleROMChange(joint, 'ulnarDeviation', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="0"
                                      />
                                      <span className="text-xs text-gray-500">°</span>
                                    </div>
                                  </div>
                                </>
                              )}
                              
                              {/* Knee: Flexion, Extension */}
                              {(joint.includes('Knee') || joint.includes('knee')) && (
                                <>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Flexion {normalRange.flexion && <span className="text-gray-400">({normalRange.flexion})</span>}
                                    </label>
                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="number"
                                        value={jointData.flexion || ''}
                                        onChange={(e) => handleROMChange(joint, 'flexion', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="0"
                                      />
                                      <span className="text-xs text-gray-500">°</span>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Extension {normalRange.extension && <span className="text-gray-400">({normalRange.extension})</span>}
                                    </label>
                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="number"
                                        value={jointData.extension || ''}
                                        onChange={(e) => handleROMChange(joint, 'extension', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="0"
                                      />
                                      <span className="text-xs text-gray-500">°</span>
                                    </div>
                                  </div>
                                </>
                              )}
                              
                              {/* Ankle: Dorsiflexion, Plantarflexion, Inversion, Eversion */}
                              {isAnkle && (
                                <>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Dorsiflexion {normalRange.dorsiflexion && <span className="text-gray-400">({normalRange.dorsiflexion})</span>}
                                    </label>
                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="number"
                                        value={jointData.dorsiflexion || ''}
                                        onChange={(e) => handleROMChange(joint, 'dorsiflexion', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="0"
                                      />
                                      <span className="text-xs text-gray-500">°</span>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Plantarflexion {normalRange.plantarflexion && <span className="text-gray-400">({normalRange.plantarflexion})</span>}
                                    </label>
                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="number"
                                        value={jointData.plantarflexion || ''}
                                        onChange={(e) => handleROMChange(joint, 'plantarflexion', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="0"
                                      />
                                      <span className="text-xs text-gray-500">°</span>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Inversion {normalRange.inversion && <span className="text-gray-400">({normalRange.inversion})</span>}
                                    </label>
                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="number"
                                        value={jointData.inversion || ''}
                                        onChange={(e) => handleROMChange(joint, 'inversion', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="0"
                                      />
                                      <span className="text-xs text-gray-500">°</span>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Eversion {normalRange.eversion && <span className="text-gray-400">({normalRange.eversion})</span>}
                                    </label>
                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="number"
                                        value={jointData.eversion || ''}
                                        onChange={(e) => handleROMChange(joint, 'eversion', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="0"
                                      />
                                      <span className="text-xs text-gray-500">°</span>
                                    </div>
                                  </div>
                                </>
                              )}
                            </>
                          );
                        })()}
                        
                        <div className="md:col-span-2 lg:col-span-3">
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-medium text-gray-700">Notes (메모)</label>
                            <button
                              type="button"
                              onClick={async () => {
                                const romNotes = formData.rangeOfMotion?.[joint]?.notes || '';
                                if (!romNotes) {
                                  alert('개선할 텍스트를 입력해주세요.');
                                  return;
                                }
                                
                                const fieldKey = `rangeOfMotion.${joint}.notes`;
                                setImprovingFields(prev => new Set(prev).add(fieldKey));
                                
                                try {
                                  const improvedText = await improveEnglishText(romNotes, 'romNotes');
                                  handleROMNotesChange(joint, improvedText);
                                } catch (error) {
                                  console.error('ROM notes 개선 실패:', error);
                                } finally {
                                  setImprovingFields(prev => {
                                    const newSet = new Set(prev);
                                    newSet.delete(fieldKey);
                                    return newSet;
                                  });
                                }
                              }}
                              disabled={!jointData.notes || improvingFields.has(`rangeOfMotion.${joint}.notes`)}
                              className="text-xs px-1.5 py-0.5 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                              {improvingFields.has(`rangeOfMotion.${joint}.notes`) ? '...' : '✎'}
                            </button>
                          </div>
                          <textarea
                            value={jointData.notes || ''}
                            onChange={(e) => handleROMNotesChange(joint, e.target.value)}
                            rows={2}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Additional notes..."
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {!isFollowUp && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Aggravating Factors</label>
                <CheckboxGroup options={baseAggravatingFactors} selected={formData.chiefComplaint.provocation} onChange={(val, checked) => handleArrayChange('chiefComplaint', 'provocation', val, checked)} />
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">Other Factors</label>
                    <button
                      type="button"
                      onClick={() => handleImproveText(['chiefComplaint', 'provocationOther'], formData.chiefComplaint.provocationOther, 'provocationOther')}
                      disabled={!formData.chiefComplaint.provocationOther || improvingFields.has('chiefComplaint.provocationOther')}
                      className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {improvingFields.has('chiefComplaint.provocationOther') ? 'Improving...' : '✎ Improve'}
                    </button>
                  </div>
                  <InputField label="" id="provocationOther" name="provocationOther" value={formData.chiefComplaint.provocationOther} onChange={handleComplaintChange} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Alleviating Factors</label>
                <CheckboxGroup options={baseAlleviatingFactors} selected={formData.chiefComplaint.palliation} onChange={(val, checked) => handleArrayChange('chiefComplaint', 'palliation', val, checked)} />
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">Other Factors</label>
                    <button
                      type="button"
                      onClick={() => handleImproveText(['chiefComplaint', 'palliationOther'], formData.chiefComplaint.palliationOther, 'palliationOther')}
                      disabled={!formData.chiefComplaint.palliationOther || improvingFields.has('chiefComplaint.palliationOther')}
                      className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {improvingFields.has('chiefComplaint.palliationOther') ? 'Improving...' : '✎ Improve'}
                    </button>
                  </div>
                  <InputField label="" id="palliationOther" name="palliationOther" value={formData.chiefComplaint.palliationOther} onChange={handleComplaintChange} />
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div>
                <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                <select id="frequency" name="frequency" value={formData.chiefComplaint.frequency} onChange={handleComplaintChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                  <option value="">Select...</option>
                  <option value="Occasional">Occasional (가끔)</option>
                  <option value="Intermittent">Intermittent (간헐적)</option>
                  <option value="Frequent">Frequent (자주)</option>
                  <option value="Constant">Constant (지속적)</option>
                </select>
            </div>
            <InputField label="Timing" id="timing" name="timing" value={formData.chiefComplaint.timing} onChange={handleComplaintChange} placeholder="e.g., Worse in the afternoon" />
          </div>
          
          {!isFollowUp && (
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Possible Cause</label>
                <CheckboxGroup options={basePossibleCauses} selected={formData.chiefComplaint.possibleCause} onChange={(val, checked) => handleArrayChange('chiefComplaint', 'possibleCause', val, checked)} />
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">Other Cause</label>
                    <button
                      type="button"
                      onClick={() => handleImproveText(['chiefComplaint', 'possibleCauseOther'], formData.chiefComplaint.possibleCauseOther, 'possibleCauseOther')}
                      disabled={!formData.chiefComplaint.possibleCauseOther || improvingFields.has('chiefComplaint.possibleCauseOther')}
                      className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {improvingFields.has('chiefComplaint.possibleCauseOther') ? 'Improving...' : '✎ Improve'}
                    </button>
                  </div>
                  <InputField label="" id="possibleCauseOther" name="possibleCauseOther" value={formData.chiefComplaint.possibleCauseOther} onChange={handleComplaintChange} />
                </div>
            </div>
          )}

          <div>
             <div className="flex items-center justify-between mb-1">
               <label htmlFor="remark" className="block text-sm font-medium text-gray-700">{isFollowUp ? 'Follow-up Notes / Changes' : 'Remark'}</label>
               <button
                 type="button"
                 onClick={() => handleImproveText(['chiefComplaint', 'remark'], formData.chiefComplaint.remark, 'remark')}
                 disabled={!formData.chiefComplaint.remark || improvingFields.has('chiefComplaint.remark')}
                 className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
               >
                 {improvingFields.has('chiefComplaint.remark') ? 'Improving...' : '✎ Improve'}
               </button>
             </div>
             <textarea
                id="remark"
                name="remark"
                value={formData.chiefComplaint.remark}
                onChange={handleComplaintChange}
                rows={isFollowUp ? 5 : 2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder={isFollowUp ? "Describe any changes in symptoms, progress, or new issues since the last visit." : ""}
             />
          </div>
        </div>
      </div>
      
       {/* Present Illness */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center border-b pb-4 mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800">Present Illness</h2>
                  {needsHpiRegeneration && (
                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">
                            <strong>주의:</strong> 주증상이 변경되었습니다. Present Illness를 다시 생성하시기 바랍니다.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <button 
                  type="button" 
                  onClick={handleGenerateHpi}
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:bg-blue-400 disabled:cursor-not-allowed"
                  disabled={isGeneratingHpi || isDiagnosing}
                >
                  {isGeneratingHpi ? 'Generating...' : needsHpiRegeneration ? 'Update with AI' : 'Regenerate with AI'}
                </button>
            </div>
             <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="presentIllness" className="block text-sm font-medium text-gray-700">Description</label>
                  <button
                    type="button"
                    onClick={() => handleImproveText(['chiefComplaint', 'presentIllness'], formData.chiefComplaint.presentIllness, 'presentIllness')}
                    disabled={!formData.chiefComplaint.presentIllness || improvingFields.has('chiefComplaint.presentIllness')}
                    className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {improvingFields.has('chiefComplaint.presentIllness') ? 'Improving...' : '✎ Improve'}
                  </button>
                </div>
                {isFollowUp && formData.respondToCare?.status && (
                    <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                        <strong>Note:</strong> This is a follow-up visit. Please include information about response to previous treatment:
                        <ul className="list-disc list-inside mt-1 ml-2">
                            <li>Status: {formData.respondToCare.status}</li>
                            {formData.respondToCare.status === 'Improved' && formData.respondToCare.improvedDays && (
                                <li>Improvement duration: {formData.respondToCare.improvedDays} days</li>
                            )}
                            {(formData.respondToCare.painLevelBefore || formData.respondToCare.painLevelCurrent) && (
                                <li>Pain levels: {formData.respondToCare.painLevelBefore ? `Before: ${formData.respondToCare.painLevelBefore}/10` : ''} 
                                    {formData.respondToCare.painLevelCurrent ? ` → Current: ${formData.respondToCare.painLevelCurrent}/10` : ''}</li>
                            )}
                            {(formData.respondToCare.canDriveWithoutPain || formData.respondToCare.canSitWithoutPain || 
                              formData.respondToCare.canStandWithoutPain || formData.respondToCare.canWalkWithoutPain) && (
                                <li>Functional improvements: {[
                                    formData.respondToCare.canDriveWithoutPain && `Drive: ${formData.respondToCare.canDriveWithoutPain}`,
                                    formData.respondToCare.canSitWithoutPain && `Sit: ${formData.respondToCare.canSitWithoutPain}`,
                                    formData.respondToCare.canStandWithoutPain && `Stand: ${formData.respondToCare.canStandWithoutPain}`,
                                    formData.respondToCare.canWalkWithoutPain && `Walk: ${formData.respondToCare.canWalkWithoutPain}`
                                ].filter(Boolean).join(', ')}</li>
                            )}
                            {formData.respondToCare.notes && (
                                <li>Additional notes: {formData.respondToCare.notes}</li>
                            )}
                        </ul>
                    </div>
                )}
                <textarea
                    id="presentIllness"
                    name="presentIllness"
                    value={formData.chiefComplaint.presentIllness}
                    onChange={handleComplaintChange}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50"
                    placeholder={isFollowUp 
                        ? "Click 'Regenerate with AI' to auto-generate based on Chief Complaint and Response to Previous Care, or fill in manually. Include how the patient responded to previous treatment."
                        : "Click 'Regenerate with AI' to auto-generate based on Chief Complaint details, or fill in manually."}
                ></textarea>
            </div>
            <div className="mt-6">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Western Medical Diagnosis (Only if the patient brings it)</label>
                  <button
                    type="button"
                    onClick={() => handleImproveText(['chiefComplaint', 'westernMedicalDiagnosis'], formData.chiefComplaint.westernMedicalDiagnosis, 'westernMedicalDiagnosis')}
                    disabled={!formData.chiefComplaint.westernMedicalDiagnosis || improvingFields.has('chiefComplaint.westernMedicalDiagnosis')}
                    className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {improvingFields.has('chiefComplaint.westernMedicalDiagnosis') ? 'Improving...' : '✎ Improve'}
                  </button>
                </div>
                <textarea
                  id="westernMedicalDiagnosis"
                  name="westernMedicalDiagnosis"
                  value={formData.chiefComplaint.westernMedicalDiagnosis}
                  onChange={handleComplaintChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g., Lumbar disc herniation"
                />
            </div>
          </div>
      
       {/* Medical History */}
      {!isFollowUp && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-800 border-b pb-4 mb-6">Medical History</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">Past Medical History</label>
              <div className="space-y-4">
                <CheckboxGroup options={pastMedicalHistoryOptions} selected={formData.medicalHistory.pastMedicalHistory} onChange={(val, checked) => handleArrayChange('medicalHistory', 'pastMedicalHistory', val, checked)} />
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">Other</label>
                    <button
                      type="button"
                      onClick={() => handleImproveText(['medicalHistory', 'pastMedicalHistoryOther'], formData.medicalHistory.pastMedicalHistoryOther, 'pastMedicalHistoryOther')}
                      disabled={!formData.medicalHistory.pastMedicalHistoryOther || improvingFields.has('medicalHistory.pastMedicalHistoryOther')}
                      className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {improvingFields.has('medicalHistory.pastMedicalHistoryOther') ? 'Improving...' : '✎ Improve'}
                    </button>
                  </div>
                  <InputField label="" id="pastMedicalHistoryOther" name="pastMedicalHistoryOther" value={formData.medicalHistory.pastMedicalHistoryOther} onChange={handleMedicalHistoryChange} />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">Medication</label>
              <div className="space-y-4">
                <CheckboxGroup options={medicationOptions} selected={formData.medicalHistory.medication} onChange={(val, checked) => handleArrayChange('medicalHistory', 'medication', val, checked)} />
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">Other</label>
                    <button
                      type="button"
                      onClick={() => handleImproveText(['medicalHistory', 'medicationOther'], formData.medicalHistory.medicationOther, 'medicationOther')}
                      disabled={!formData.medicalHistory.medicationOther || improvingFields.has('medicalHistory.medicationOther')}
                      className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {improvingFields.has('medicalHistory.medicationOther') ? 'Improving...' : '✎ Improve'}
                    </button>
                  </div>
                  <InputField label="" id="medicationOther" name="medicationOther" value={formData.medicalHistory.medicationOther} onChange={handleMedicalHistoryChange} />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">Family History</label>
              <div className="space-y-4">
                <CheckboxGroup options={familyHistoryOptions} selected={formData.medicalHistory.familyHistory} onChange={(val, checked) => handleArrayChange('medicalHistory', 'familyHistory', val, checked)} />
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">Other</label>
                    <button
                      type="button"
                      onClick={() => handleImproveText(['medicalHistory', 'familyHistoryOther'], formData.medicalHistory.familyHistoryOther, 'familyHistoryOther')}
                      disabled={!formData.medicalHistory.familyHistoryOther || improvingFields.has('medicalHistory.familyHistoryOther')}
                      className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {improvingFields.has('medicalHistory.familyHistoryOther') ? 'Improving...' : '✎ Improve'}
                    </button>
                  </div>
                  <InputField label="" id="familyHistoryOther" name="familyHistoryOther" value={formData.medicalHistory.familyHistoryOther} onChange={handleMedicalHistoryChange} />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">Allergy</label>
              <div className="space-y-4">
                <CheckboxGroup options={allergyOptions} selected={formData.medicalHistory.allergy} onChange={(val, checked) => handleArrayChange('medicalHistory', 'allergy', val, checked)} />
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">Other</label>
                    <button
                      type="button"
                      onClick={() => handleImproveText(['medicalHistory', 'allergyOther'], formData.medicalHistory.allergyOther, 'allergyOther')}
                      disabled={!formData.medicalHistory.allergyOther || improvingFields.has('medicalHistory.allergyOther')}
                      className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {improvingFields.has('medicalHistory.allergyOther') ? 'Improving...' : '✎ Improve'}
                    </button>
                  </div>
                  <InputField label="" id="allergyOther" name="allergyOther" value={formData.medicalHistory.allergyOther} onChange={handleMedicalHistoryChange} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Review of Systems */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-4 mb-6">Review of Systems</h2>
        <div className="space-y-6">
            
            {/* Energy - 제일 앞으로 이동 */}
            <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">Energy</label>
                <InputField label="Energy ( /10)" type="number" id="energy" value={formData.reviewOfSystems.appetiteEnergy.energy} onChange={e => handleReviewOfSystemsChange('appetiteEnergy', 'energy', e.target.value)} />
            </div>
            
            {/* Cold / Hot */}
            <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">Cold / Hot</label>
                <RadioGroup name="coldHotSensation" selectedValue={formData.reviewOfSystems.coldHot.sensation} options={[{value: 'cold', label: 'Cold (차가운)'}, {value: 'hot', label: 'Hot (뜨거운)'}, {value: 'normal', label: 'Normal (정상)'}]} onChange={e => handleReviewOfSystemsChange('coldHot', 'sensation', e.target.value)} />
                {formData.reviewOfSystems.coldHot.sensation !== 'normal' && (
                  <div className="mt-2 pl-2">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Body Parts:</label>
                      <CheckboxGroup options={[
                        {value: 'hand', label: 'hand (손)'}, {value: 'fingers', label: 'fingers (손가락)'}, {value: 'feet', label: 'feet (발)'}, {value: 'toes', label: 'toes (발가락)'}, 
                        {value: 'knee', label: 'knee (무릎)'}, {value: 'leg', label: 'leg (다리)'}, {value: 'waist', label: 'waist (허리)'}, {value: 'back', label: 'back (등)'}, 
                        {value: 'shoulder', label: 'shoulder (어깨)'}, {value: 'whole body', label: 'whole body (전신)'}
                      ]} selected={formData.reviewOfSystems.coldHot.parts} onChange={(val, checked) => handleRosArrayChange('coldHot', 'parts', val, checked)} gridCols="grid-cols-4" />
                  </div>
                )}
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">Other</label>
                    <button
                      type="button"
                      onClick={() => handleImproveText(['reviewOfSystems', 'coldHotOther'], formData.reviewOfSystems.coldHot.other, 'coldHotOther')}
                      disabled={!formData.reviewOfSystems.coldHot.other || improvingFields.has('reviewOfSystems.coldHotOther')}
                      className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {improvingFields.has('reviewOfSystems.coldHotOther') ? 'Improving...' : '✎ Improve'}
                    </button>
                  </div>
                  <InputField label="" id="coldHotOther" name="other" value={formData.reviewOfSystems.coldHot.other} onChange={e => handleReviewOfSystemsChange('coldHot', 'other', e.target.value)} />
                </div>
            </div>

             {/* Sleep */}
             <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">Sleep</label>
                 <InputField 
                    label="Duration"
                    id="sleepHours"
                    name="hours"
                    value={formData.reviewOfSystems.sleep.hours}
                    onChange={e => handleReviewOfSystemsChange('sleep', 'hours', e.target.value)}
                    placeholder="e.g., 7-8"
                    className="max-w-xs"
                    unit="hours / day"
                />
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Quality/Issues:</label>
                    <CheckboxGroup options={[
                        {value: 'O.K.', label: 'O.K. (괜찮음)'}, {value: 'dream', label: 'dream (꿈)'}, {value: 'nightmare', label: 'nightmare (악몽)'}, 
                        {value: 'insomnia', label: 'insomnia (불면증)'}
                    ]} selected={[...formData.reviewOfSystems.sleep.quality, ...formData.reviewOfSystems.sleep.issues].filter(v => !['easily wake up', 'hard to fall asleep', 'pain'].includes(v))} onChange={(val, checked) => {
                         const isQuality = ['O.K.', 'dream', 'nightmare'].includes(val);
                         if(isQuality) {
                             handleRosArrayChange('sleep', 'quality', val, checked);
                         } else {
                             handleRosArrayChange('sleep', 'issues', val, checked);
                         }
                    }} gridCols="grid-cols-4" />
                    {(formData.reviewOfSystems.sleep.quality.includes('insomnia') || formData.reviewOfSystems.sleep.issues.includes('insomnia')) && (
                        <div className="mt-2">
                            <label className="block text-sm font-medium text-gray-600 mb-1">Insomnia Details (multi-select):</label>
                            <CheckboxGroup options={[
                                {value: 'easily wake up', label: 'easily wake up (잘 깸)'}, 
                                {value: 'hard to fall asleep', label: 'hard to fall asleep (잠들기 어려움)'}, 
                                {value: 'pain', label: 'pain (통증)'}
                            ]} selected={[...formData.reviewOfSystems.sleep.quality, ...formData.reviewOfSystems.sleep.issues].filter(v => ['easily wake up', 'hard to fall asleep', 'pain'].includes(v))} onChange={(val, checked) => {
                                handleRosArrayChange('sleep', 'issues', val, checked);
                            }} gridCols="grid-cols-3" />
                        </div>
                    )}
                </div>
             </div>

             {/* Sweat */}
             <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">Sweat</label>
                <RadioGroup name="sweatPresent" selectedValue={formData.reviewOfSystems.sweat.present} options={[{value: 'yes', label: 'Yes (있음)'}, {value: 'no', label: 'No (없음)'}]} onChange={e => handleReviewOfSystemsChange('sweat', 'present', e.target.value)} />
                {formData.reviewOfSystems.sweat.present === 'yes' && (
                  <div className="mt-2 pl-2 grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Time:</label>
                        <RadioGroup name="sweatTime" selectedValue={formData.reviewOfSystems.sweat.time} options={[{value: 'night', label: 'Night (밤)'}, {value: 'day', label: 'Day (낮)'}, {value: 'all time', label: 'Both (항상)'}]} onChange={e => handleReviewOfSystemsChange('sweat', 'time', e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Parts:</label>
                        <CheckboxGroup options={[
                          {value: 'hand', label: 'hand (손)'}, {value: 'foot', label: 'foot (발)'}, {value: 'head', label: 'head (머리)'}, 
                          {value: 'chest', label: 'chest (가슴)'}, {value: 'whole body', label: 'whole body (전신)'}
                        ]} selected={formData.reviewOfSystems.sweat.parts} onChange={(val, checked) => handleRosArrayChange('sweat', 'parts', val, checked)} gridCols="grid-cols-4" />
                    </div>
                  </div>
                )}
             </div>

             {/* Eye, Mouth, Throat */}
            <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">Eye</label>
                <RadioGroup 
                    name="eyeNormal" 
                    selectedValue={formData.reviewOfSystems.eye.symptoms.includes('normal') ? 'normal' : 'abnormal'} 
                    options={[
                        {value: 'normal', label: 'normal (정상)'}, 
                        {value: 'abnormal', label: 'Abnormal (비정상)'}
                    ]} 
                    onChange={e => {
                        if (e.target.value === 'normal') {
                            setFormData(prev => ({
                                ...prev,
                                reviewOfSystems: {
                                    ...prev.reviewOfSystems,
                                    eye: {
                                        ...prev.reviewOfSystems.eye,
                                        symptoms: ['normal']
                                    }
                                }
                            }));
                        } else {
                            setFormData(prev => ({
                                ...prev,
                                reviewOfSystems: {
                                    ...prev.reviewOfSystems,
                                    eye: {
                                        ...prev.reviewOfSystems.eye,
                                        symptoms: prev.reviewOfSystems.eye.symptoms.filter(s => s !== 'normal')
                                    }
                                }
                            }));
                        }
                    }} 
                />
                {!formData.reviewOfSystems.eye.symptoms.includes('normal') && (
                    <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-600 mb-1">Symptoms (multi-select, max 2):</label>
                <CheckboxGroup options={[
                            {value: 'dry', label: 'dry (건조한)'}, {value: 'sandy', label: 'sandy (모래알 같은)'}, {value: 'redness', label: 'redness (빨갛게 충혈된)'}, 
                  {value: 'tearing', label: 'tearing (눈물나는)'}, {value: 'fatigued', label: 'fatigued (피로한)'}, {value: 'pain', label: 'pain (통증)'}, 
                  {value: 'twitching', label: 'twitching (경련)'}, {value: 'dizzy', label: 'dizzy (어지러운)'}, {value: 'vertigo', label: 'vertigo (현기증)'}
                        ]} selected={formData.reviewOfSystems.eye.symptoms} onChange={(val, checked) => {
                            const currentSymptoms = formData.reviewOfSystems.eye.symptoms.filter(s => s !== 'normal');
                            if (checked && currentSymptoms.length < 2) {
                                handleRosArrayChange('eye', 'symptoms', val, checked);
                            } else if (!checked) {
                                handleRosArrayChange('eye', 'symptoms', val, checked);
                            }
                        }} gridCols="grid-cols-4" />
                    </div>
                )}
            </div>
            <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">Mouth / Tongue</label>
                <RadioGroup name="mouthSymptoms" selectedValue={formData.reviewOfSystems.mouthTongue.symptoms} options={[{value: 'dry', label: 'Dry (마른)'}, {value: 'normal', label: 'Normal (정상)'}, {value: 'wet (sputum, phlegm)', label: 'Wet (sputum, phlegm) (젖은/담)'}]} onChange={e => handleReviewOfSystemsChange('mouthTongue', 'symptoms', e.target.value)} />
                <label className="block text-sm font-medium text-gray-600 mt-2 mb-1">Taste:</label>
                <RadioGroup name="mouthTaste" selectedValue={formData.reviewOfSystems.mouthTongue.taste} options={[
                  {value: 'sour', label: 'sour (신)'}, {value: 'bitter', label: 'bitter (쓴)'}, {value: 'sweet', label: 'sweet (단)'}, 
                  {value: 'acrid', label: 'acrid (매운)'}, {value: 'salty', label: 'salty (짠)'}, {value: 'bland', label: 'bland (맛없는)'}
                ]} onChange={e => handleReviewOfSystemsChange('mouthTongue', 'taste', e.target.value)} />
            </div>
            <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">Throat / Nose</label>
                <RadioGroup 
                    name="throatNoseNormal" 
                    selectedValue={formData.reviewOfSystems.throatNose.symptoms.includes('normal') ? 'normal' : 'abnormal'} 
                    options={[
                        {value: 'normal', label: 'normal (정상)'}, 
                        {value: 'abnormal', label: 'Abnormal (비정상)'}
                    ]} 
                    onChange={e => {
                        if (e.target.value === 'normal') {
                            setFormData(prev => ({
                                ...prev,
                                reviewOfSystems: {
                                    ...prev.reviewOfSystems,
                                    throatNose: {
                                        ...prev.reviewOfSystems.throatNose,
                                        symptoms: ['normal']
                                    }
                                }
                            }));
                        } else {
                            setFormData(prev => ({
                                ...prev,
                                reviewOfSystems: {
                                    ...prev.reviewOfSystems,
                                    throatNose: {
                                        ...prev.reviewOfSystems.throatNose,
                                        symptoms: prev.reviewOfSystems.throatNose.symptoms.filter(s => s !== 'normal')
                                    }
                                }
                            }));
                        }
                    }} 
                />
                {!formData.reviewOfSystems.throatNose.symptoms.includes('normal') && (
                    <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-600 mb-1">Symptoms (multi-select, max 2):</label>
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                        {[
                                {value: 'block', label: 'block (막힌)'}, {value: 'itchy', label: 'itchy (가려운)'}, 
                          {value: 'pain', label: 'pain (통증)'}, {value: 'mucus', label: 'mucus (점액)'}, {value: 'sputum', label: 'sputum (가래)'}, {value: 'bloody', label: 'bloody (피가 섞인)'}
                        ].map(o => (
                            <div key={o.value} className="flex items-center">
                                <input
                                    type="checkbox"
                                    id={`throatNose_${o.value}`}
                                    value={o.value}
                                    checked={formData.reviewOfSystems.throatNose.symptoms.includes(o.value)}
                                        onChange={(e) => {
                                            const currentSymptoms = formData.reviewOfSystems.throatNose.symptoms.filter(s => s !== 'normal');
                                            if (e.target.checked && currentSymptoms.length < 2) {
                                                handleRosArrayChange('throatNose', 'symptoms', o.value, e.target.checked);
                                            } else if (!e.target.checked) {
                                                handleRosArrayChange('throatNose', 'symptoms', o.value, e.target.checked);
                                            }
                                        }}
                                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <label htmlFor={`throatNose_${o.value}`} className="ml-2 text-sm text-gray-600">{o.label}</label>
                            </div>
                        ))}
                    </div>
                </div>
                )}
                {formData.reviewOfSystems.throatNose.symptoms.includes('mucus') && (
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-600 mb-1">Mucus Color:</label>
                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                            {[
                              {value: 'clear', label: 'clear (맑은)'}, {value: 'white', label: 'white (흰색)'}, 
                              {value: 'yellow', label: 'yellow (노란색)'}, {value: 'green', label: 'green (녹색)'}
                            ].map(o => (
                                <div key={o.value} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={`mucusColor_${o.value}`}
                                        value={o.value}
                                        checked={formData.reviewOfSystems.throatNose.mucusColor.includes(o.value)}
                                        onChange={(e) => handleRosArrayChange('throatNose', 'mucusColor', o.value, e.target.checked)}
                                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                    />
                                    <label htmlFor={`mucusColor_${o.value}`} className="ml-2 text-sm text-gray-600">{o.label}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

             {/* Edema */}
             <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">Edema</label>
                <RadioGroup name="edemaPresent" selectedValue={formData.reviewOfSystems.edema.present} options={[{value: 'yes', label: 'Yes (있음)'}, {value: 'no', label: 'No (없음)'}]} onChange={e => handleReviewOfSystemsChange('edema', 'present', e.target.value)} />
                {formData.reviewOfSystems.edema.present === 'yes' && (
                  <div className="mt-2 pl-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Parts:</label>
                    <CheckboxGroup options={[
                      {value: 'face', label: 'face (얼굴)'}, {value: 'hand', label: 'hand (손)'}, {value: 'finger', label: 'finger (손가락)'}, 
                      {value: 'leg', label: 'leg (다리)'}, {value: 'foot', label: 'foot (발)'}, {value: 'chest', label: 'chest (가슴)'}, 
                      {value: 'whole body', label: 'whole body (전신)'}
                    ]} selected={formData.reviewOfSystems.edema.parts} onChange={(val, checked) => handleRosArrayChange('edema', 'parts', val, checked)} gridCols="grid-cols-4" />
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-700">Other</label>
                        <button
                          type="button"
                          onClick={() => handleImproveText(['reviewOfSystems', 'edemaOther'], formData.reviewOfSystems.edema.other, 'edemaOther')}
                          disabled={!formData.reviewOfSystems.edema.other || improvingFields.has('reviewOfSystems.edemaOther')}
                          className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          {improvingFields.has('reviewOfSystems.edemaOther') ? 'Improving...' : '✎ Improve'}
                        </button>
                      </div>
                      <InputField label="" id="edemaOther" value={formData.reviewOfSystems.edema.other} onChange={e => handleReviewOfSystemsChange('edema', 'other', e.target.value)} />
                    </div>
                  </div>
                )}
             </div>
             
            {/* Drink, Digestion, Appetite - vertical layout */}
            <div className="flex flex-col gap-6">
                <div>
                    <label className="block text-lg font-medium text-gray-700 mb-2">Drink</label>
                    <RadioGroup name="drinkThirsty" selectedValue={formData.reviewOfSystems.drink.thirsty} options={[{value: 'thirsty', label: 'Thirsty (목마른)'}, {value: 'normal', label: 'Normal (정상)'}, {value: 'no', label: 'Not Thirsty (목마르지 않은)'}]} onChange={e => handleReviewOfSystemsChange('drink', 'thirsty', e.target.value)} />
                    <label className="block text-sm font-medium text-gray-600 mt-2 mb-1">Preference:</label>
                    <RadioGroup name="drinkPreference" selectedValue={formData.reviewOfSystems.drink.preference} options={[{value: 'cold', label: 'Cold (차가운)'}, {value: 'normal', label: 'Normal (보통)'}, {value: 'hot', label: 'Hot (뜨거운)'}]} onChange={e => handleReviewOfSystemsChange('drink', 'preference', e.target.value)} />
                     <label className="block text-sm font-medium text-gray-600 mt-2 mb-1">Amount:</label>
                    <RadioGroup name="drinkAmount" selectedValue={formData.reviewOfSystems.drink.amount} options={[{value: 'sip', label: 'Sip (한 모금)'}, {value: 'washes mouth', label: 'Washes Mouth (입 헹구기)'}, {value: 'drink large amount', label: 'Large Amount (많이 마심)'}]} onChange={e => handleReviewOfSystemsChange('drink', 'amount', e.target.value)} />
                </div>
                 <div>
                    <label className="block text-lg font-medium text-gray-700 mb-2">Digestion</label>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Status:</label>
                        <RadioGroup name="digestionStatus" selectedValue={
                            formData.reviewOfSystems.digestion.symptoms.includes('good') ? 'good' :
                            formData.reviewOfSystems.digestion.symptoms.includes('ok') ? 'ok' :
                            formData.reviewOfSystems.digestion.symptoms.includes('sometimes bad') ? 'sometimes bad' :
                            formData.reviewOfSystems.digestion.symptoms.includes('bad') ? 'bad' : ''
                        } options={[
                            {value: 'good', label: 'good (좋음)'}, {value: 'ok', label: 'ok (괜찮음)'}, 
                            {value: 'sometimes bad', label: 'sometimes bad (가끔 나쁨)'}, {value: 'bad', label: 'bad (나쁨)'}
                        ]} onChange={e => {
                            const status = e.target.value;
                            const otherSymptoms = formData.reviewOfSystems.digestion.symptoms.filter(s => !['good', 'ok', 'sometimes bad', 'bad'].includes(s));
                            setFormData(prev => ({
                                ...prev,
                                reviewOfSystems: {
                                    ...prev.reviewOfSystems,
                                    digestion: {
                                        ...prev.reviewOfSystems.digestion,
                                        symptoms: status ? [status, ...otherSymptoms] : otherSymptoms
                                    }
                                }
                            }));
                        }} />
                    </div>
                    {(formData.reviewOfSystems.digestion.symptoms.includes('sometimes bad') || formData.reviewOfSystems.digestion.symptoms.includes('bad')) && (
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-600 mb-1">Symptoms (multi-select):</label>
                    <CheckboxGroup options={[
                                {value: 'pain', label: 'pain (통증)'}, {value: 'acid', label: 'acid (산)'}, 
                      {value: 'bloat', label: 'bloat (부풀어 오름)'}, {value: 'blech', label: 'blech (트림)'}, {value: 'heart burn', label: 'heart burn (속쓰림)'}, 
                      {value: 'bad breath', label: 'bad breath (입냄새)'}, {value: 'nausea', label: 'nausea (메스꺼움)'}
                            ]} selected={formData.reviewOfSystems.digestion.symptoms.filter(s => !['good', 'ok', 'sometimes bad', 'bad'].includes(s))} onChange={(val, checked) => {
                                const status = formData.reviewOfSystems.digestion.symptoms.find(s => ['good', 'ok', 'sometimes bad', 'bad'].includes(s)) || '';
                                const currentOtherSymptoms = formData.reviewOfSystems.digestion.symptoms.filter(s => !['good', 'ok', 'sometimes bad', 'bad'].includes(s));
                                if (checked) {
                                    setFormData(prev => ({
                                        ...prev,
                                        reviewOfSystems: {
                                            ...prev.reviewOfSystems,
                                            digestion: {
                                                ...prev.reviewOfSystems.digestion,
                                                symptoms: status ? [status, ...currentOtherSymptoms, val] : [...currentOtherSymptoms, val]
                                            }
                                        }
                                    }));
                                } else {
                                    setFormData(prev => ({
                                        ...prev,
                                        reviewOfSystems: {
                                            ...prev.reviewOfSystems,
                                            digestion: {
                                                ...prev.reviewOfSystems.digestion,
                                                symptoms: status ? [status, ...currentOtherSymptoms.filter(s => s !== val)] : currentOtherSymptoms.filter(s => s !== val)
                                            }
                                        }
                                    }));
                                }
                            }} gridCols="grid-cols-3" />
                        </div>
                    )}
                </div>
                 <div>
                    <label className="block text-lg font-medium text-gray-700 mb-2">Appetite</label>
                     <RadioGroup name="appetite" selectedValue={formData.reviewOfSystems.appetiteEnergy.appetite} options={[{value: 'good', label: 'Good (좋음)'}, {value: 'ok', label: 'OK (괜찮음)'}, {value: 'sometimes bad', label: 'Sometimes Bad (가끔 나쁨)'}, {value: 'bad', label: 'Bad (나쁨)'}]} onChange={e => handleReviewOfSystemsChange('appetiteEnergy', 'appetite', e.target.value)} />
                </div>
            </div>

            {/* Urination */}
            <div className="border-t pt-6 mt-6">
                <div>
                    <label className="block text-lg font-medium text-gray-700 mb-2">Urination</label>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <InputField label="Times a day" id="urineFrequencyDay" value={formData.reviewOfSystems.urine.frequencyDay} onChange={e => handleReviewOfSystemsChange('urine', 'frequencyDay', e.target.value)} />
                        <InputField label="Times at night" id="urineFrequencyNight" value={formData.reviewOfSystems.urine.frequencyNight} onChange={e => handleReviewOfSystemsChange('urine', 'frequencyNight', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Amount:</label>
                        <RadioGroup name="urineAmount" selectedValue={formData.reviewOfSystems.urine.amount} options={[{value: 'much', label: 'Much (많은)'}, {value: 'normal', label: 'Normal (정상)'}, {value: 'scanty', label: 'Scanty (적은)'}]} onChange={e => handleReviewOfSystemsChange('urine', 'amount', e.target.value)} />
                    </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Color:</label>
                            <select 
                                id="urineColor" 
                                value={formData.reviewOfSystems.urine.color || 'pale yellow'} 
                                onChange={e => handleReviewOfSystemsChange('urine', 'color', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            >
                                <option value="pale yellow">Pale Yellow (연한 노란색) - Normal</option>
                                <option value="yellow">Yellow (노란색)</option>
                                <option value="dark yellow">Dark Yellow (진한 노란색)</option>
                                <option value="amber">Amber (호박색)</option>
                                <option value="orange">Orange (주황색)</option>
                                <option value="red">Red (빨간색)</option>
                                <option value="brown">Brown (갈색)</option>
                                <option value="cloudy">Cloudy (흐린)</option>
                                <option value="clear">Clear (맑은)</option>
                            </select>
                        </div>
                    </div>
                </div>
                </div>

            {/* Stool */}
            <div className="border-t pt-6 mt-6">
                <div>
                    <label className="block text-lg font-medium text-gray-700 mb-2">Stool</label>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                        <div className="flex items-center space-x-2">
                            <input type="text" name="stoolFrequencyValue" value={formData.reviewOfSystems.stool.frequencyValue} onChange={e => handleReviewOfSystemsChange('stool', 'frequencyValue', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="e.g., 1 or 2-3" />
                            <span className="text-gray-500">time(s) per</span>
                            <select name="stoolFrequencyUnit" value={formData.reviewOfSystems.stool.frequencyUnit} onChange={e => handleReviewOfSystemsChange('stool', 'frequencyUnit', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                              <option value="day">Day (일)</option>
                              <option value="week">Week (주)</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Form:</label>
                      <RadioGroup name="stoolForm" selectedValue={formData.reviewOfSystems.stool.form} options={[{value: 'normal', label: 'Normal (정상)'}, {value: 'diarrhea', label: 'Diarrhea (설사)'}, {value: 'constipation', label: 'Constipation (변비)'}, {value: 'alternating', label: 'Alternating (교대)'}]} onChange={e => handleReviewOfSystemsChange('stool', 'form', e.target.value)} />
                    </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Color:</label>
                            <select 
                                id="stoolColor" 
                                value={formData.reviewOfSystems.stool.color || 'brown'} 
                                onChange={e => handleReviewOfSystemsChange('stool', 'color', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            >
                                <option value="brown">Brown (갈색) - Normal</option>
                                <option value="dark brown">Dark Brown (진한 갈색)</option>
                                <option value="light brown">Light Brown (밝은 갈색)</option>
                                <option value="green">Green (녹색)</option>
                                <option value="yellow">Yellow (노란색)</option>
                                <option value="black">Black (검은색)</option>
                                <option value="red">Red (빨간색)</option>
                                <option value="gray">Gray (회색)</option>
                                <option value="clay">Clay (점토색)</option>
                                <option value="white">White (흰색)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Menstruation & Discharge (Conditional) */}
            {formData.sex === 'F' && (
                <div className="border-t pt-6 mt-6">
                    <div>
                        <label className="block text-lg font-medium text-gray-700 mb-2">Menstruation</label>
                        <RadioGroup 
                            name="menstruationStatus" 
                            selectedValue={formData.reviewOfSystems.menstruation.status} 
                            options={[
                                {value: 'regular', label: 'Regular (규칙적)'}, 
                                {value: 'irregular', label: 'Irregular (불규칙적)'},
                                {value: 'menopause', label: 'Menopause (폐경)'}
                            ]} 
                            onChange={e => handleReviewOfSystemsChange('menstruation', 'status', e.target.value)} />
                    </div>

                    {formData.reviewOfSystems.menstruation.status === 'menopause' ? (
                        !isFollowUp ? (
                            // Follow-up 차트가 아닐 때만 age를 묻기
                        <div className="mt-4">
                            <InputField label="Age at Menopause" id="menopauseAge" type="number" value={formData.reviewOfSystems.menstruation.menopauseAge} onChange={e => handleReviewOfSystemsChange('menstruation', 'menopauseAge', e.target.value)} />
                        </div>
                        ) : null
                    ) : formData.reviewOfSystems.menstruation.status !== '' ? (
                        <div className="mt-4 space-y-4">
                            <div className="grid grid-cols-3 gap-6">
                                <InputField label="LMP (Last Menstrual Period)" id="lmp" type="date" value={formData.reviewOfSystems.menstruation.lmp} onChange={e => handleReviewOfSystemsChange('menstruation', 'lmp', e.target.value)} />
                                <InputField label="Cycle (days)" id="cycleLength" type="number" value={formData.reviewOfSystems.menstruation.cycleLength} onChange={e => handleReviewOfSystemsChange('menstruation', 'cycleLength', e.target.value)} />
                                <InputField label="Duration (days)" id="duration" type="number" value={formData.reviewOfSystems.menstruation.duration} onChange={e => handleReviewOfSystemsChange('menstruation', 'duration', e.target.value)} />
                            </div>
                            <div className="grid grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Amount:</label>
                                    <RadioGroup name="menstruationAmount" selectedValue={formData.reviewOfSystems.menstruation.amount} options={[{value: 'normal', label: 'Normal (정상)'}, {value: 'scanty', label: 'Scanty (적은)'}, {value: 'heavy', label: 'Heavy (많은)'}]} onChange={e => handleReviewOfSystemsChange('menstruation', 'amount', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Color:</label>
                                    <RadioGroup name="menstruationColor" selectedValue={formData.reviewOfSystems.menstruation.color} options={[{value: 'fresh red', label: 'Fresh Red (선홍색)'}, {value: 'dark', label: 'Dark (어두운)'}, {value: 'pale', label: 'Pale (연한)'}]} onChange={e => handleReviewOfSystemsChange('menstruation', 'color', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Clots:</label>
                                    <RadioGroup name="menstruationClots" selectedValue={formData.reviewOfSystems.menstruation.clots} options={[{value: 'yes', label: 'Yes (있음)'}, {value: 'no', label: 'No (없음)'}]} onChange={e => handleReviewOfSystemsChange('menstruation', 'clots', e.target.value)} />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Pain:</label>
                                <RadioGroup name="menstruationPain" selectedValue={formData.reviewOfSystems.menstruation.pain} options={[{value: 'yes', label: 'Yes (있음)'}, {value: 'no', label: 'No (없음)'}]} onChange={e => handleReviewOfSystemsChange('menstruation', 'pain', e.target.value)} />
                                    {formData.reviewOfSystems.menstruation.pain === 'yes' &&
                                        <InputField label="Pain Details" id="painDetails" value={formData.reviewOfSystems.menstruation.painDetails} onChange={e => handleReviewOfSystemsChange('menstruation', 'painDetails', e.target.value)} className="mt-2" />
                                    }
                                </div>
                                <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">PMS:</label>
                                <CheckboxGroup options={[
                                  {value: 'breast tenderness', label: 'breast tenderness (유방 압통)'}, 
                                  {value: 'irritability', label: 'irritability (과민반응)'}, 
                                  {value: 'bloating', label: 'bloating (복부 팽만)'}, 
                                  {value: 'headache', label: 'headache (두통)'}
                                ]} selected={formData.reviewOfSystems.menstruation.pms} onChange={(val, checked) => handleRosArrayChange('menstruation', 'pms', val, checked)} gridCols="grid-cols-3" />
                                </div>
                            </div>
                        </div>
                    ) : null}

                    <div className="mt-6">
                      <label className="block text-lg font-medium text-gray-700 mb-2">Discharge</label>
                       <RadioGroup 
                            name="dischargePresent" 
                            selectedValue={formData.reviewOfSystems.discharge.present} 
                            options={[{value: 'yes', label: 'Yes (있음)'}, {value: 'no', label: 'No (없음)'}]} 
                            onChange={e => handleReviewOfSystemsChange('discharge', 'present', e.target.value)} 
                        />
                        {formData.reviewOfSystems.discharge.present === 'yes' && (
                            <div className="mt-2 pl-2">
                                <CheckboxGroup options={[
                                  {value: 'watery', label: 'watery (물 같은)'}, {value: 'clear', label: 'clear (맑은)'}, 
                                  {value: 'yellow', label: 'yellow (노란)'}, {value: 'white', label: 'white (흰색)'}, 
                                  {value: 'sticky', label: 'sticky (끈끈한)'}, {value: 'no smell', label: 'no smell (냄새 없음)'}, 
                                  {value: 'foul smell', label: 'foul smell (악취)'}
                                ]} selected={formData.reviewOfSystems.discharge.symptoms} onChange={(val, checked) => handleRosArrayChange('discharge', 'symptoms', val, checked)} gridCols="grid-cols-4" />
                                <div className="mt-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="block text-sm font-medium text-gray-700">Other</label>
                                    <button
                                      type="button"
                                      onClick={() => handleImproveText(['reviewOfSystems', 'dischargeOther'], formData.reviewOfSystems.discharge.other, 'dischargeOther')}
                                      disabled={!formData.reviewOfSystems.discharge.other || improvingFields.has('reviewOfSystems.dischargeOther')}
                                      className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                      {improvingFields.has('reviewOfSystems.dischargeOther') ? 'Improving...' : '✎ Improve'}
                                    </button>
                                  </div>
                                  <InputField label="" id="dischargeOther" value={formData.reviewOfSystems.discharge.other} onChange={e => handleReviewOfSystemsChange('discharge', 'other', e.target.value)} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>
      
      {/* Inspection of the Tongue */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-4 mb-6">Inspection of the Tongue</h2>
        <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">BODY</h3>
              <div className="pl-2 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Color (Single Choice):</label>
                  <RadioGroup options={tongueBodyColorOptions} name="tongueBodyColor" selectedValue={formData.tongue.body.color} onChange={e => handleTongueBodyChange('color', e.target.value)} />
                </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Color Modifiers (Multi-Choice):</label>
                  <CheckboxGroup options={tongueBodyColorModifierOptions} selected={formData.tongue.body.colorModifiers} onChange={(val, checked) => handleTongueBodyArrayChange('colorModifiers', val, checked)} gridCols="grid-cols-3" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Shape (Single Choice):</label>
                  <RadioGroup options={tongueBodyShapeOptions} name="tongueBodyShape" selectedValue={formData.tongue.body.shape} onChange={e => handleTongueBodyChange('shape', e.target.value)} className="grid grid-cols-3 gap-x-6 gap-y-2"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Shape Modifiers (Multi-Choice):</label>
                  <CheckboxGroup options={tongueBodyShapeModifierOptions} selected={formData.tongue.body.shapeModifiers} onChange={(val, checked) => handleTongueBodyArrayChange('shapeModifiers', val, checked)} gridCols="grid-cols-3" />
                </div>
                {formData.tongue.body.shapeModifiers.includes('Cracked') && (
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Locations (Multi-Choice):</label>
                    <CheckboxGroup 
                        options={tongueLocationOptions} 
                        selected={formData.tongue.body.locations} 
                        onChange={(val, checked) => handleTongueBodyArrayChange('locations', val, checked)} 
                        gridCols="grid-cols-3" 
                    />
                    <InputField
                        label="Location Comments"
                        id="locationComments"
                        name="locationComments"
                        value={formData.tongue.body.locationComments}
                        onChange={(e) => handleTongueBodyChange('locationComments', e.target.value)}
                        placeholder="e.g., Heart (Tip) is cracked"
                        className="mt-4"
                    />
                </div>
                )}
              </div>
            </div>
             <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">COATING</h3>
              <div className="pl-2 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Color (Single Choice):</label>
                  <RadioGroup options={tongueCoatingColorOptions} name="tongueCoatingColor" selectedValue={formData.tongue.coating.color} onChange={e => handleTongueCoatingChange('color', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Quality (Max 2 Choices):</label>
                  <CheckboxGroup options={tongueCoatingQualityOptions} selected={formData.tongue.coating.quality} onChange={(val, checked) => handleTongueCoatingArrayChange('quality', val, checked)} gridCols="grid-cols-4" />
                </div>
                 <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="tongueCoatingNotes" className="block text-sm font-medium text-gray-600">Notes:</label>
                    <button
                      type="button"
                      onClick={() => handleImproveText(['tongue', 'coating', 'notes'], formData.tongue.coating.notes, 'tongueCoatingNotes')}
                      disabled={!formData.tongue.coating.notes || improvingFields.has('tongue.coating.notes')}
                      className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {improvingFields.has('tongue.coating.notes') ? 'Improving...' : '✎ Improve'}
                    </button>
                  </div>
                  <textarea
                    id="tongueCoatingNotes"
                    value={formData.tongue.coating.notes}
                    onChange={(e) => handleTongueCoatingChange('notes', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="e.g., Geographic, covering Stomach/Spleen area"
                  />
                </div>
              </div>
            </div>
        </div>
      </div>
      
      {/* Pulse Diagnosis */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-4 mb-6">Pulse Diagnosis</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">Overall Qualities</label>
            <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                    <div className="p-2 border rounded-md bg-slate-50">
                        <h4 className="text-sm font-semibold text-center text-gray-600 mb-2">부/침 (Floating/Sinking)</h4>
                        <CheckboxGroup options={pulseQualityPairs.buChim} selected={formData.pulse.overall} onChange={handlePulseOverallChange} gridCols="grid-cols-2" />
                    </div>
                    <div className="p-2 border rounded-md bg-slate-50">
                        <h4 className="text-sm font-semibold text-center text-gray-600 mb-2">지/삭 (Slow/Rapid)</h4>
                        <CheckboxGroup options={pulseQualityPairs.jiSak} selected={formData.pulse.overall} onChange={handlePulseOverallChange} gridCols="grid-cols-2" />
                    </div>
                    <div className="p-2 border rounded-md bg-slate-50">
                        <h4 className="text-sm font-semibold text-center text-gray-600 mb-2">허/실 (Deficient/Excess)</h4>
                        <CheckboxGroup options={pulseQualityPairs.heoSil} selected={formData.pulse.overall} onChange={handlePulseOverallChange} gridCols="grid-cols-2" />
                    </div>
                </div>
                <div className="border-t pt-4">
                     <h4 className="text-md font-semibold text-gray-600 mb-2">실맥 (Excess Pulse)</h4>
                     <CheckboxGroup
                      options={excessPulseQualities}
                      selected={formData.pulse.overall}
                      onChange={(val, checked) => handlePulseOverallChange(val, checked)}
                      gridCols="grid-cols-5"
                    />
                </div>
                 <div className="border-t pt-4">
                     <h4 className="text-md font-semibold text-gray-600 mb-2">허맥 (Deficient Pulse)</h4>
                     <CheckboxGroup
                      options={deficientPulseQualities}
                      selected={formData.pulse.overall}
                      onChange={(val, checked) => handlePulseOverallChange(val, checked)}
                      gridCols="grid-cols-5"
                    />
                </div>
                <div className="border-t pt-4">
                     <h4 className="text-md font-semibold text-gray-600 mb-2">Other Qualities</h4>
                     <CheckboxGroup
                      options={otherRemainingPulseQualities}
                      selected={formData.pulse.overall}
                      onChange={(val, checked) => handlePulseOverallChange(val, checked)}
                      gridCols="grid-cols-2"
                    />
                </div>
            </div>
          </div>
          <div className="border-t pt-6">
              <label className="block text-lg font-medium text-gray-700 mb-4">Pulse Notes / Details</label>
              <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                      <label htmlFor="pulseCun" className="block text-sm font-medium text-gray-600 mb-1">Cun (촌) - near the wrist</label>
                      <textarea
                        id="pulseCun"
                        name="pulseCun"
                        value={formData.pulse.cun || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, pulse: { ...prev.pulse, cun: e.target.value } }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Pulse condition at Cun position"
                      />
                  </div>
                  <div>
                      <label htmlFor="pulseGuan" className="block text-sm font-medium text-gray-600 mb-1">Guan (관) - middle</label>
                      <textarea
                        id="pulseGuan"
                        name="pulseGuan"
                        value={formData.pulse.guan || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, pulse: { ...prev.pulse, guan: e.target.value } }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Pulse condition at Guan position"
                      />
                  </div>
                  <div>
                      <label htmlFor="pulseChi" className="block text-sm font-medium text-gray-600 mb-1">Chi (척) - far from the wrist</label>
                      <textarea
                        id="pulseChi"
                        name="pulseChi"
                        value={formData.pulse.chi || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, pulse: { ...prev.pulse, chi: e.target.value } }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Pulse condition at Chi position"
                      />
                  </div>
              </div>
              <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="pulseNotes" className="block text-sm font-medium text-gray-600">General Pulse Notes</label>
                    <button
                      type="button"
                      onClick={() => handleImproveText(['pulse', 'notes'], formData.pulse.notes, 'pulseNotes')}
                      disabled={!formData.pulse.notes || improvingFields.has('pulse.notes')}
                      className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {improvingFields.has('pulse.notes') ? 'Improving...' : '✎ Improve'}
                    </button>
                  </div>
                  <textarea
                    id="pulseNotes"
                    name="pulseNotes"
                    value={formData.pulse.notes}
                    onChange={handlePulseNotesChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Other pulse diagnosis related notes"
                  />
              </div>
          </div>
        </div>
      </div>

       {/* Diagnosis & Treatment */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="border-b pb-4 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">Diagnosis & Treatment</h2>
        </div>
        <div className="space-y-6">
            <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">Acupuncture Method</label>
                <p className="text-sm text-gray-600 mb-3">사용하는 침법을 선택하세요</p>
                <CheckboxGroup
                    options={acupunctureMethodOptions}
                    selected={formData.diagnosisAndTreatment.acupunctureMethod}
                    onChange={(val, checked) => handleDiagnosisArrayChange('acupunctureMethod', val as AcupunctureMethod, checked)}
                    gridCols="grid-cols-3"
                />
                {formData.diagnosisAndTreatment.acupunctureMethod.includes('Other') && (
                    <InputField 
                        label="Specify Other Method" 
                        id="acupunctureMethodOther" 
                        name="acupunctureMethodOther" 
                        value={formData.diagnosisAndTreatment.acupunctureMethodOther || ''} 
                        onChange={handleDiagnosisChange} 
                        className="mt-2" 
                    />
                )}
            </div>
            
            <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">Other Treatments</label>
                <CheckboxGroup
                    options={otherTreatmentOptions}
                    selected={(() => {
                        const raw = formData.diagnosisAndTreatment.selectedTreatment;
                        return Array.isArray(raw) ? raw : (raw ? [raw] : []);
                    })()}
                    onChange={(val, checked) => handleOtherTreatmentArrayChange(val, checked)}
                    gridCols="grid-cols-4"
                />
                {(() => {
                    const treatments = Array.isArray(formData.diagnosisAndTreatment.selectedTreatment) 
                      ? formData.diagnosisAndTreatment.selectedTreatment 
                      : (formData.diagnosisAndTreatment.selectedTreatment ? [formData.diagnosisAndTreatment.selectedTreatment] : []);
                    return treatments.includes('Other') || treatments.includes('Auricular Acupuncture');
                })() && (
                    <InputField 
                        label={(() => {
                            const treatments = Array.isArray(formData.diagnosisAndTreatment.selectedTreatment) 
                              ? formData.diagnosisAndTreatment.selectedTreatment 
                              : (formData.diagnosisAndTreatment.selectedTreatment ? [formData.diagnosisAndTreatment.selectedTreatment] : []);
                            return treatments.includes('Other') ? "Specify Other Treatment" : "Specify Points/Seeds";
                        })()} 
                        id="otherTreatmentText" 
                        name="otherTreatmentText" 
                        value={formData.diagnosisAndTreatment.otherTreatmentText} 
                        onChange={handleDiagnosisChange} 
                        className="mt-2" 
                    />
                )}
            </div>
            
            <div className="flex justify-center">
                <button 
                  type="button" 
                  onClick={handleGenerateDiagnosis}
                  className="px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg shadow-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors duration-200 disabled:bg-teal-400 disabled:cursor-not-allowed"
                  disabled={isDiagnosing}
                >
                  {isDiagnosing ? 'Generating...' : 'Generate AI Diagnosis & Treatment Plan'}
                </button>
            </div>
            
            <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">Eight Principles</label>
                <div className="grid grid-cols-4 gap-x-8 gap-y-4">
                    <RadioGroup name="exteriorInterior" selectedValue={formData.diagnosisAndTreatment.eightPrinciples.exteriorInterior} onChange={handleEightPrincipleChange} options={[{value: 'Exterior', label: 'Exterior'}, {value: 'Interior', label: 'Interior'}]} />
                    <RadioGroup name="heatCold" selectedValue={formData.diagnosisAndTreatment.eightPrinciples.heatCold} onChange={handleEightPrincipleChange} options={[{value: 'Heat', label: 'Heat'}, {value: 'Cold', label: 'Cold'}]} />
                    <RadioGroup name="excessDeficient" selectedValue={formData.diagnosisAndTreatment.eightPrinciples.excessDeficient} onChange={handleEightPrincipleChange} options={[{value: 'Excess', label: 'Excess'}, {value: 'Deficient', label: 'Deficient'}]} />
                    <RadioGroup name="yangYin" selectedValue={formData.diagnosisAndTreatment.eightPrinciples.yangYin} onChange={handleEightPrincipleChange} options={[{value: 'Yang', label: 'Yang'}, {value: 'Yin', label: 'Yin'}]} />
                </div>
            </div>
            
             <div className="space-y-4">
               <div>
                 <div className="flex items-center justify-between mb-1">
                   <label className="block text-sm font-medium text-gray-700">Etiology</label>
                   <button
                     type="button"
                     onClick={() => handleImproveText(['diagnosisAndTreatment', 'etiology'], formData.diagnosisAndTreatment.etiology, 'etiology')}
                     disabled={!formData.diagnosisAndTreatment.etiology || improvingFields.has('diagnosisAndTreatment.etiology')}
                     className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                   >
                     {improvingFields.has('diagnosisAndTreatment.etiology') ? 'Improving...' : '✎ Improve'}
                   </button>
                 </div>
                 <textarea
                   id="etiology"
                   name="etiology"
                   value={formData.diagnosisAndTreatment.etiology}
                   onChange={handleDiagnosisChange}
                   rows={2}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                 />
             </div>
             <div>
                <div className="flex items-center justify-between mb-1">
                   <label className="block text-sm font-medium text-gray-700">TCM Diagnosis (Syndrome/Differentiation)</label>
                   <button
                     type="button"
                     onClick={() => handleImproveText(['diagnosisAndTreatment', 'tcmDiagnosis'], formData.diagnosisAndTreatment.tcmDiagnosis, 'tcmDiagnosis')}
                     disabled={!formData.diagnosisAndTreatment.tcmDiagnosis || improvingFields.has('diagnosisAndTreatment.tcmDiagnosis')}
                     className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                   >
                     {improvingFields.has('diagnosisAndTreatment.tcmDiagnosis') ? 'Improving...' : '✎ Improve'}
                   </button>
                 </div>
                 <textarea
                   id="tcmDiagnosis"
                   name="tcmDiagnosis"
                   value={formData.diagnosisAndTreatment.tcmDiagnosis}
                   onChange={handleDiagnosisChange}
                   rows={3}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                 />
               </div>
               <div>
                 <div className="flex items-center justify-between mb-1">
                   <label className="block text-sm font-medium text-gray-700">Treatment Principle</label>
                   <button
                     type="button"
                     onClick={() => handleImproveText(['diagnosisAndTreatment', 'treatmentPrinciple'], formData.diagnosisAndTreatment.treatmentPrinciple, 'treatmentPrinciple')}
                     disabled={!formData.diagnosisAndTreatment.treatmentPrinciple || improvingFields.has('diagnosisAndTreatment.treatmentPrinciple')}
                     className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                   >
                     {improvingFields.has('diagnosisAndTreatment.treatmentPrinciple') ? 'Improving...' : '✎ Improve'}
                   </button>
                 </div>
                 <textarea
                   id="treatmentPrinciple"
                   name="treatmentPrinciple"
                   value={formData.diagnosisAndTreatment.treatmentPrinciple}
                   onChange={handleDiagnosisChange}
                   rows={3}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                 />
               </div>
             </div>
             <div>
                <div className="flex items-center justify-between mb-1 gap-2">
                  <label htmlFor="acupuncturePoints" className="block text-sm font-medium text-gray-700">Acupuncture Points</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleImproveText(['diagnosisAndTreatment', 'acupuncturePoints'], formData.diagnosisAndTreatment.acupuncturePoints, 'acupuncturePoints')}
                      disabled={!formData.diagnosisAndTreatment.acupuncturePoints || improvingFields.has('diagnosisAndTreatment.acupuncturePoints')}
                      className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {improvingFields.has('diagnosisAndTreatment.acupuncturePoints') ? 'Improving...' : '✎ Improve'}
                    </button>
                  {formData.diagnosisAndTreatment.acupunctureMethod.includes('Trigger Point') && (
                    <button
                      type="button"
                      onClick={async () => {
                        const currentValue = formData.diagnosisAndTreatment.acupuncturePoints;
                        if (!currentValue || currentValue.trim().length === 0) {
                          alert('변환할 텍스트를 입력해주세요.');
                          return;
                        }
                        const fieldKey = 'acupuncturePoints';
                        setImprovingFields(prev => new Set(prev).add(fieldKey));
                        try {
                          const translatedText = await translateMuscleNames(currentValue);
                          setFormData(prev => ({
                            ...prev,
                            diagnosisAndTreatment: {
                              ...prev.diagnosisAndTreatment,
                              acupuncturePoints: translatedText
                            }
                          }));
                        } catch (error) {
                          console.error('근육이름 변환 실패:', error);
                        } finally {
                          setImprovingFields(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(fieldKey);
                            return newSet;
                          });
                        }
                      }}
                      disabled={!formData.diagnosisAndTreatment.acupuncturePoints || improvingFields.has('acupuncturePoints')}
                      className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {improvingFields.has('acupuncturePoints') ? 'Translating...' : '🔤 Translate Muscle Names'}
                    </button>
                  )}
                </div>
                </div>
                <textarea id="acupuncturePoints" name="acupuncturePoints" value={formData.diagnosisAndTreatment.acupuncturePoints} onChange={handleDiagnosisChange} rows={8} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono whitespace-pre-wrap" placeholder="각 항목을 한 줄씩 입력하세요&#10;예:&#10;TCM Body: ST36, SP6, LI4, LV3&#10;Trigger Point: Upper trapezius, Levator scapulae"></textarea>
            </div>
            <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="herbalTreatment" className="block text-sm font-medium text-gray-700">Herbal Treatment</label>
                  <button
                    type="button"
                    onClick={() => handleImproveText(['diagnosisAndTreatment', 'herbalTreatment'], formData.diagnosisAndTreatment.herbalTreatment, 'herbalTreatment')}
                    disabled={!formData.diagnosisAndTreatment.herbalTreatment || improvingFields.has('diagnosisAndTreatment.herbalTreatment')}
                    className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {improvingFields.has('diagnosisAndTreatment.herbalTreatment') ? 'Improving...' : '✎ Improve'}
                  </button>
                </div>
                <textarea id="herbalTreatment" name="herbalTreatment" value={formData.diagnosisAndTreatment.herbalTreatment} onChange={handleDiagnosisChange} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
            </div>
             <div className="grid grid-cols-3 gap-4">
                <InputField label="ICD" id="icd" name="icd" value={formData.diagnosisAndTreatment.icd} onChange={handleDiagnosisChange} />
                <InputField label="CPT" id="cpt" name="cpt" value={formData.diagnosisAndTreatment.cpt} onChange={handleDiagnosisChange} />
                <InputField label="Therapist Name" id="therapistName" name="therapistName" value={formData.diagnosisAndTreatment.therapistName} onChange={handleDiagnosisChange} />
                <InputField label="Lic #" id="therapistLicNo" name="therapistLicNo" value={formData.diagnosisAndTreatment.therapistLicNo} onChange={handleDiagnosisChange} />
             </div>
        </div>
      </div>


      <div className="flex justify-end items-center pt-8 mt-8 border-t sticky bottom-0 bg-white pb-4">
          <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 disabled:bg-indigo-400 disabled:cursor-not-allowed" disabled={isGeneratingHpi || isDiagnosing}>
            Save & View Chart
          </button>
      </div>
    </form>
    </div>
  );
};