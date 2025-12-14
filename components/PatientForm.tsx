import React, { useState, useMemo, useEffect } from 'react';
import type { PatientData, ChiefComplaintData, MedicalHistoryData, ReviewOfSystemsData, TongueData, DiagnosisAndTreatmentData, AcupunctureMethod } from '../types.ts';
import { GoogleGenAI } from "@google/genai";
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

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({ options, selected, onChange, gridCols = 'grid-cols-2 md:grid-cols-3' }) => (
    <div className={`grid ${gridCols} gap-x-6 gap-y-2`}>
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
    {value: 'Neck Pain', label: 'Neck Pain (목 통증)'}, {value: 'Shoulder Pain', label: 'Shoulder Pain (어깨 통증)'}, {value: 'Back Pain', label: 'Back Pain (등 통증)'}, {value: 'Knee Pain', label: 'Knee Pain (무릎 통증)'}, {value: 'Headache', label: 'Headache (두통)'}, {value: 'Migraine', label: 'Migraine (편두통)'},
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
    {value: 'None', label: 'None'}, {value: 'Tui-Na', label: 'Tui-Na'}, {value: 'Acupressure', label: 'Acupressure'}, {value: 'Moxa', label: 'Moxa'},
    {value: 'Cupping', label: 'Cupping'}, {value: 'Electro Acupuncture', label: 'Electro Acupuncture'}, {value: 'Heat Pack', label: 'Heat Pack'},
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
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
        prompt += `\n**Response to Previous Treatment:**\n`;
        if (formData.respondToCare.status) {
            prompt += `- Status: ${formData.respondToCare.status}\n`;
        }
        if (formData.respondToCare.status === 'Improved' && formData.respondToCare.improvedDays) {
            prompt += `- Improvement Duration: Good for ${formData.respondToCare.improvedDays} days\n`;
        }
        if (formData.respondToCare.notes) {
            prompt += `- Notes: ${formData.respondToCare.notes}\n`;
        }
    }
    
    prompt += `
**ABSOLUTE REQUIREMENTS:**
1. ONLY mention the symptoms listed in "Current Symptoms" above
2. If a symptom is NOT in the "Current Symptoms" list, DO NOT mention it
3. Do NOT infer or add symptoms like "back pain", "lower back", "lumbar pain" unless explicitly listed in "Current Symptoms"
4. Write a coherent paragraph in a professional, clinical tone
5. Start with an opening sentence like: "${openingSentence}"
6. Weave the details into a narrative, not just a list
7. Do not use markdown or bullet points in your final output
${isFollowUp && formData.respondToCare ? '8. **IMPORTANT**: This is a follow-up visit. You MUST incorporate the "Response to Previous Treatment" information into the narrative. Describe how the patient responded to previous treatment and how their condition has changed since the last visit.' : ''}

**Example of what NOT to do:** If "Current Symptoms" only lists "Neck Pain, Shoulder Pain" but you mention "back pain" or "lower back", that is WRONG.

Generate the HPI paragraph below:
`;

    try {
        const apiKey = import.meta.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
          throw new Error('GEMINI_API_KEY가 설정되지 않았습니다. .env.local 파일을 확인하세요.');
        }
        
        const ai = new GoogleGenAI({ apiKey });
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        

        const generatedText = response.text;
        
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
    
    const prompt = `Based on the following comprehensive patient data, act as an expert TCM practitioner to generate a diagnosis and treatment plan. Your analysis must be grounded in the principles of 'Chinese Acupuncture and Moxibustion' (中国针灸学). Provide the output in a structured JSON format. ${isFollowUp ? `This is a follow-up visit. Pay close attention to the "respondToCare" data to adjust the diagnosis and treatment plan accordingly.` : ''}

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
  "etiology": "Describe the root cause and contributing factors. Be very concise; the entire text must not exceed 3 lines.${isFollowUp ? ' Consider changes since the last visit.' : ''}",
  "tcmDiagnosis": "Provide the primary TCM Syndrome/Differentiation diagnosis (e.g., Liver Qi Stagnation, Spleen Qi Deficiency with Dampness), grounded in 'Chinese Acupuncture and Moxibustion' principles.",
  "treatmentPrinciple": "State the clear treatment principle (e.g., Soothe the Liver, tonify Spleen Qi, resolve dampness).",
  "acupuncturePoints": "Suggest primary acupuncture points for EACH of the selected methods: '${methodsForPrompt.join(', ')}'. Your response for this field MUST be a single string. List ONLY the point names/groups. Do NOT include any descriptions or explanations. Structure the output with each method as a heading on a new line, using '\\n' as a separator. For example: 'Saam: HT8, LR1 (sedate); LU8, SP2 (tonify)\\nTCM Body: ST36, SP6, LI4, LV3'. For 'Saam', provide the tonification/sedation combination. For 'Master Tung', list Tung's points. For 'Five Element', list constitutional points. For 'Trigger Point', list relevant muscles or Ashi points. For 'TCM Body', list standard channel points.",
  "herbalTreatment": "Recommend a classic herbal formula based on 'Donguibogam' (동의보감) and 'Bangyakhappyeon' (방약합편). IMPORTANT: Consider the patient's current medications and family history to avoid drug interactions. Start with '[RECOMMENDED]' prefix, then provide the formula name (e.g., '[RECOMMENDED] Du Huo Ji Sheng Tang'). After the formula name, list all the individual herbs (약재) that are included in this formula, separated by commas. Format: '[RECOMMENDED] Formula Name: Herb1, Herb2, Herb3, ...'. If there are any potential interactions with current medications, add a warning note.",
  "otherTreatment": {
    "recommendation": "Suggest only the single most relevant treatment from this list: None, Tui-Na, Acupressure, Moxa, Cupping, Electro Acupuncture, Heat Pack, Auricular Acupuncture, Other. If 'Other' or 'Auricular Acupuncture', specify what it is (e.g., 'Auricular Acupuncture: Shen Men, Liver').",
    "explanation": "Briefly explain why you recommend it."
  }
}

Instructions:
- Analyze the interconnected symptoms from all sections (ROS, tongue, chief complaint).
- Provide a concise and clinically relevant diagnosis and plan.
- For Eight Principles, choose only one from each pair and logically determine Yin/Yang.
- Ensure the output is a valid JSON object only.
`;
    try {
        const apiKey = import.meta.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
          throw new Error('GEMINI_API_KEY가 설정되지 않았습니다. .env.local 파일을 확인하세요.');
        }
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });

        const generatedJsonString = response.text.trim();
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

        setFormData(prev => ({
            ...prev,
            diagnosisAndTreatment: {
                ...prev.diagnosisAndTreatment,
                eightPrinciples: generatedData.eightPrinciples || prev.diagnosisAndTreatment.eightPrinciples,
                etiology: generatedData.etiology || '',
                tcmDiagnosis: generatedData.tcmDiagnosis || '',
                treatmentPrinciple: generatedData.treatmentPrinciple || '',
                acupuncturePoints: generatedData.acupuncturePoints || '',
                herbalTreatment: generatedData.herbalTreatment || '',
                selectedTreatment: newSelectedTreatments,
                otherTreatmentText: otherTreatmentText,
                cpt: Array.from(newCptSet).join(', ')
            }
        }));

    } catch (error) {
        console.error("Error generating diagnosis:", error);
        alert("Failed to generate AI diagnosis. Please check the console for errors.");
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

  const handleRespondToCareChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
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
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 text-center">{formTitle}</h1>
      
      {/* Clinic Information */}
      {!isFollowUp && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-800 border-b pb-4 mb-6">Clinic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InputField label="File No." id="fileNo" value={formData.fileNo} onChange={handleChange} required readOnly={isEditing} />
          <InputField label="Name" id="name" value={formData.name} onChange={handleChange} placeholder="환자 이름을 입력하세요" required />
          <InputField label="Date" id="date" value={formData.date} onChange={handleChange} type="date" required />
          
          {!isFollowUp && (
            <>
                <InputField label="Address" id="address" name="address" value={formData.address} onChange={handleChange} placeholder="주소를 입력하세요" className="md:col-span-2" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                <div className="flex items-center space-x-2">
                    <InputField type="number" id="heightFt" name="heightFt" value={formData.heightFt} onChange={handleChange} unit="ft" label="" placeholder="Feet" />
                    <InputField type="number" id="heightIn" name="heightIn" value={formData.heightIn} onChange={handleChange} unit="in" label="" placeholder="Inches" />
                </div>
            </div>
            <InputField label="Weight" id="weight" value={formData.weight} onChange={handleChange} type="number" unit="lbs" />
            <InputField label="Temperature" id="temp" value={formData.temp} onChange={handleChange} type="number" unit="°F" />
            <div className="md:col-span-2 lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Blood Pressure</label>
                <div className="flex items-center space-x-2">
                    <input type="number" name="bpSystolic" value={formData.bpSystolic} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Systolic"/>
                    <span className="text-gray-500">/</span>
                    <input type="number" name="bpDiastolic" value={formData.bpDiastolic} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Diastolic"/>
                     <span className="text-sm text-gray-500 whitespace-nowrap">mmHg</span>
                </div>
            </div>
             <InputField label="Heart Rate" id="heartRate" value={formData.heartRate} onChange={handleChange} type="number" unit="BPM" />
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
              <div className="flex items-center">
                  <button type="button" onClick={() => handleLungRateChange(false)} className="px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 hover:bg-gray-100">-</button>
                  <input type="number" id="lungRate" name="lungRate" value={formData.lungRate} onChange={handleChange} className="w-full px-3 py-2 border-t border-b border-gray-300 text-center focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                  <span className="absolute right-10 pr-3 flex items-center text-sm text-gray-500 pointer-events-none">BPM</span>
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
      
      {/* Previous Charts Reference - 재방문 차트일 때만 */}
      {isFollowUp && previousCharts.length > 0 && (
        <div className="bg-blue-50 border-2 border-blue-300 p-4 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-blue-800">이전 차트 참조</h3>
            <button
              type="button"
              onClick={() => setShowPreviousCharts(!showPreviousCharts)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              {showPreviousCharts ? '숨기기' : '이전 차트 보기'}
            </button>
          </div>
          {showPreviousCharts && (
            <div className="mt-4 space-y-4 max-h-96 overflow-y-auto">
              {previousCharts.map((chart, index) => (
                <div key={index} className="bg-white p-4 rounded border border-blue-200">
                  <div className="font-semibold text-gray-700 mb-2">
                    {new Date(chart.date).toLocaleDateString('ko-KR')} 방문
                  </div>
                  <div className="text-sm space-y-2">
                    <div>
                      <strong>주증상:</strong> {[...chart.chiefComplaint.selectedComplaints, chart.chiefComplaint.otherComplaint].filter(Boolean).join(', ') || 'N/A'}
                    </div>
                    {chart.chiefComplaint.location && (
                      <div>
                        <strong>위치:</strong> {chart.chiefComplaint.location}
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
                        <strong>TCM 진단:</strong> {chart.diagnosisAndTreatment.tcmDiagnosis}
                      </div>
                    )}
                    {chart.diagnosisAndTreatment.acupuncturePoints && (
                      <div>
                        <strong>침혈:</strong> {chart.diagnosisAndTreatment.acupuncturePoints.substring(0, 100)}
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
          <h2 className="text-2xl font-semibold text-gray-800 border-b pb-4 mb-6">Respond to Previous Care</h2>
          <div className="space-y-4">
            <RadioGroup 
                name="status"
                selectedValue={formData.respondToCare?.status || ''}
                onChange={handleRespondToCareChange}
                options={[
                    { value: 'Resolved', label: 'Resolved' },
                    { value: 'Improved', label: 'Improved' },
                    { value: 'Same', label: 'Same' },
                    { value: 'Worse', label: 'Worse' },
                ]}
            />
            {formData.respondToCare?.status === 'Improved' && (
                <div className="flex items-center space-x-2 pl-6">
                    <label htmlFor="improvedDays" className="text-sm font-medium text-gray-700">Good for</label>
                    <input
                        type="number"
                        id="improvedDays"
                        name="improvedDays"
                        value={formData.respondToCare?.improvedDays || ''}
                        onChange={handleRespondToCareChange}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    <span className="text-sm text-gray-600">days</span>
                </div>
            )}
             <div className="pl-6">
                <label htmlFor="respondToCareNotes" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                    id="respondToCareNotes"
                    name="notes"
                    value={formData.respondToCare?.notes || ''}
                    onChange={handleRespondToCareChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="e.g., Patient reports 10% improvement in pain..."
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
        <InputField label="Other Complaint" id="otherComplaint" name="otherComplaint" value={formData.chiefComplaint.otherComplaint} onChange={handleComplaintChange} placeholder="Enter other complaint if not listed" />
        
        <div className="mt-6 border-t pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <InputField label="Location" id="location" name="location" value={formData.chiefComplaint.location} onChange={handleComplaintChange} placeholder="위치를 설명하세요" />
            </div>
            <InputField label="Radiation" id="regionRadiation" name="regionRadiation" value={formData.chiefComplaint.regionRadiation} onChange={handleComplaintChange} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {!isNeck && !isSpine && (
                          <>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Flexion (굴곡)</label>
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
                              <label className="block text-xs font-medium text-gray-700 mb-1">Extension (신전)</label>
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
                        
                        {(isShoulder || isHip) && (
                          <>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Abduction (외전)</label>
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
                              <label className="block text-xs font-medium text-gray-700 mb-1">Adduction (내전)</label>
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
                              <label className="block text-xs font-medium text-gray-700 mb-1">Internal Rotation (내회전)</label>
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
                              <label className="block text-xs font-medium text-gray-700 mb-1">External Rotation (외회전)</label>
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
                        
                        {(isNeck || isSpine) && (
                          <>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Lateral Flexion (측면 굴곡)</label>
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
                              <label className="block text-xs font-medium text-gray-700 mb-1">Rotation (회전)</label>
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
                        
                        <div className="md:col-span-2 lg:col-span-3">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Notes (메모)</label>
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
                <InputField label="Other Factors" id="provocationOther" name="provocationOther" value={formData.chiefComplaint.provocationOther} onChange={handleComplaintChange} className="mt-2" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Alleviating Factors</label>
                <CheckboxGroup options={baseAlleviatingFactors} selected={formData.chiefComplaint.palliation} onChange={(val, checked) => handleArrayChange('chiefComplaint', 'palliation', val, checked)} />
                <InputField label="Other Factors" id="palliationOther" name="palliationOther" value={formData.chiefComplaint.palliationOther} onChange={handleComplaintChange} className="mt-2" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quality of Pain</label>
                <CheckboxGroup options={painQualities} selected={formData.chiefComplaint.quality} onChange={(val, checked) => handleArrayChange('chiefComplaint', 'quality', val, checked)} gridCols="grid-cols-2 md:grid-cols-4" />
                <InputField label="Other Quality" id="qualityOther" name="qualityOther" value={formData.chiefComplaint.qualityOther} onChange={handleComplaintChange} className="mt-2" />
              </div>
            </>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <InputField label="Other Cause" id="possibleCauseOther" name="possibleCauseOther" value={formData.chiefComplaint.possibleCauseOther} onChange={handleComplaintChange} className="mt-2" />
            </div>
          )}

          <div>
             <label htmlFor="remark" className="block text-sm font-medium text-gray-700 mb-1">{isFollowUp ? 'Follow-up Notes / Changes' : 'Remark'}</label>
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
                <label htmlFor="presentIllness" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                {isFollowUp && formData.respondToCare?.status && (
                    <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                        <strong>Note:</strong> This is a follow-up visit. Please include information about response to previous treatment (Status: {formData.respondToCare.status}
                        {formData.respondToCare.status === 'Improved' && formData.respondToCare.improvedDays ? `, Good for ${formData.respondToCare.improvedDays} days` : ''}
                        {formData.respondToCare.notes ? `. ${formData.respondToCare.notes}` : ''}).
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
                <InputField label="Western Medical Diagnosis (Only if the patient brings it)" id="westernMedicalDiagnosis" name="westernMedicalDiagnosis" value={formData.chiefComplaint.westernMedicalDiagnosis} onChange={handleComplaintChange} />
            </div>
          </div>
      
       {/* Medical History */}
      {!isFollowUp && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-800 border-b pb-4 mb-6">Medical History</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">Past Medical History</label>
              <div className="space-y-4">
                <CheckboxGroup options={pastMedicalHistoryOptions} selected={formData.medicalHistory.pastMedicalHistory} onChange={(val, checked) => handleArrayChange('medicalHistory', 'pastMedicalHistory', val, checked)} />
                <InputField label="Other" id="pastMedicalHistoryOther" name="pastMedicalHistoryOther" value={formData.medicalHistory.pastMedicalHistoryOther} onChange={handleMedicalHistoryChange} />
              </div>
            </div>
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">Medication</label>
              <div className="space-y-4">
                <CheckboxGroup options={medicationOptions} selected={formData.medicalHistory.medication} onChange={(val, checked) => handleArrayChange('medicalHistory', 'medication', val, checked)} />
                <InputField label="Other" id="medicationOther" name="medicationOther" value={formData.medicalHistory.medicationOther} onChange={handleMedicalHistoryChange} />
              </div>
            </div>
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">Family History</label>
              <div className="space-y-4">
                <CheckboxGroup options={familyHistoryOptions} selected={formData.medicalHistory.familyHistory} onChange={(val, checked) => handleArrayChange('medicalHistory', 'familyHistory', val, checked)} />
                <InputField label="Other" id="familyHistoryOther" name="familyHistoryOther" value={formData.medicalHistory.familyHistoryOther} onChange={handleMedicalHistoryChange} />
              </div>
            </div>
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">Allergy</label>
              <div className="space-y-4">
                <CheckboxGroup options={allergyOptions} selected={formData.medicalHistory.allergy} onChange={(val, checked) => handleArrayChange('medicalHistory', 'allergy', val, checked)} />
                <InputField label="Other" id="allergyOther" name="allergyOther" value={formData.medicalHistory.allergyOther} onChange={handleMedicalHistoryChange} />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Review of Systems */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-4 mb-6">Review of Systems</h2>
        <div className="space-y-6">
            
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
                      ]} selected={formData.reviewOfSystems.coldHot.parts} onChange={(val, checked) => handleRosArrayChange('coldHot', 'parts', val, checked)} gridCols="grid-cols-2 md:grid-cols-4 lg:grid-cols-5" />
                  </div>
                )}
                <InputField label="Other" id="coldHotOther" name="other" value={formData.reviewOfSystems.coldHot.other} onChange={e => handleReviewOfSystemsChange('coldHot', 'other', e.target.value)} className="mt-2" />
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
                        {value: 'insomnia', label: 'insomnia (불면증)'}, {value: 'easily wake up', label: 'easily wake up (잘 깸)'}, 
                        {value: 'hard to fall asleep', label: 'hard to fall asleep (잠들기 어려움)'}, {value: 'pain', label: 'pain (통증)'}
                    ]} selected={[...formData.reviewOfSystems.sleep.quality, ...formData.reviewOfSystems.sleep.issues]} onChange={(val, checked) => {
                         const isQuality = ['O.K.', 'dream', 'nightmare'].includes(val);
                         if(isQuality) handleRosArrayChange('sleep', 'quality', val, checked);
                         else handleRosArrayChange('sleep', 'issues', val, checked);
                    }} gridCols="grid-cols-2 md:grid-cols-4" />
                </div>
             </div>

             {/* Sweat */}
             <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">Sweat</label>
                <RadioGroup name="sweatPresent" selectedValue={formData.reviewOfSystems.sweat.present} options={[{value: 'yes', label: 'Yes (있음)'}, {value: 'no', label: 'No (없음)'}]} onChange={e => handleReviewOfSystemsChange('sweat', 'present', e.target.value)} />
                {formData.reviewOfSystems.sweat.present === 'yes' && (
                  <div className="mt-2 pl-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Time:</label>
                        <RadioGroup name="sweatTime" selectedValue={formData.reviewOfSystems.sweat.time} options={[{value: 'night', label: 'Night (밤)'}, {value: 'day', label: 'Day (낮)'}, {value: 'all time', label: 'Both (항상)'}]} onChange={e => handleReviewOfSystemsChange('sweat', 'time', e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Parts:</label>
                        <CheckboxGroup options={[
                          {value: 'hand', label: 'hand (손)'}, {value: 'foot', label: 'foot (발)'}, {value: 'head', label: 'head (머리)'}, 
                          {value: 'chest', label: 'chest (가슴)'}, {value: 'whole body', label: 'whole body (전신)'}
                        ]} selected={formData.reviewOfSystems.sweat.parts} onChange={(val, checked) => handleRosArrayChange('sweat', 'parts', val, checked)} gridCols="grid-cols-2 md:grid-cols-3 lg:grid-cols-5" />
                    </div>
                  </div>
                )}
             </div>

             {/* Eye, Mouth, Throat */}
            <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">Eye</label>
                <CheckboxGroup options={[
                  {value: 'normal', label: 'normal (정상)'}, {value: 'dry', label: 'dry (건조한)'}, {value: 'sandy', label: 'sandy (모래알 같은)'}, {value: 'redness', label: 'redness (빨갛게 충혈된)'}, 
                  {value: 'tearing', label: 'tearing (눈물나는)'}, {value: 'fatigued', label: 'fatigued (피로한)'}, {value: 'pain', label: 'pain (통증)'}, 
                  {value: 'twitching', label: 'twitching (경련)'}, {value: 'dizzy', label: 'dizzy (어지러운)'}, {value: 'vertigo', label: 'vertigo (현기증)'}
                ]} selected={formData.reviewOfSystems.eye.symptoms} onChange={(val, checked) => handleRosArrayChange('eye', 'symptoms', val, checked)} gridCols="grid-cols-2 md:grid-cols-4 lg:grid-cols-5" />
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
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Symptoms:</label>
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                        {[
                          {value: 'normal', label: 'normal (정상)'}, {value: 'block', label: 'block (막힌)'}, {value: 'itchy', label: 'itchy (가려운)'}, 
                          {value: 'pain', label: 'pain (통증)'}, {value: 'mucus', label: 'mucus (점액)'}, {value: 'sputum', label: 'sputum (가래)'}, {value: 'bloody', label: 'bloody (피가 섞인)'}
                        ].map(o => (
                            <div key={o.value} className="flex items-center">
                                <input
                                    type="checkbox"
                                    id={`throatNose_${o.value}`}
                                    value={o.value}
                                    checked={formData.reviewOfSystems.throatNose.symptoms.includes(o.value)}
                                    onChange={(e) => handleRosArrayChange('throatNose', 'symptoms', o.value, e.target.checked)}
                                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <label htmlFor={`throatNose_${o.value}`} className="ml-2 text-sm text-gray-600">{o.label}</label>
                            </div>
                        ))}
                    </div>
                </div>
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
                    ]} selected={formData.reviewOfSystems.edema.parts} onChange={(val, checked) => handleRosArrayChange('edema', 'parts', val, checked)} gridCols="grid-cols-2 md:grid-cols-4" />
                    <InputField label="Other" id="edemaOther" value={formData.reviewOfSystems.edema.other} onChange={e => handleReviewOfSystemsChange('edema', 'other', e.target.value)} className="mt-2" />
                  </div>
                )}
             </div>
             
             {/* Drink, Digestion, Appetite */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <CheckboxGroup options={[
                      {value: 'good', label: 'good (좋음)'}, {value: 'ok', label: 'ok (괜찮음)'}, {value: 'sometimes bad', label: 'sometimes bad (가끔 나쁨)'}, 
                      {value: 'bad', label: 'bad (나쁨)'}, {value: 'pain', label: 'pain (통증)'}, {value: 'acid', label: 'acid (산)'}, 
                      {value: 'bloat', label: 'bloat (부풀어 오름)'}, {value: 'blech', label: 'blech (트림)'}, {value: 'heart burn', label: 'heart burn (속쓰림)'}, 
                      {value: 'bad breath', label: 'bad breath (입냄새)'}, {value: 'nausea', label: 'nausea (메스꺼움)'}
                    ]} selected={formData.reviewOfSystems.digestion.symptoms} onChange={(val, checked) => handleRosArrayChange('digestion', 'symptoms', val, checked)} gridCols="grid-cols-2" />
                </div>
                 <div>
                    <label className="block text-lg font-medium text-gray-700 mb-2">Appetite / Energy</label>
                     <RadioGroup name="appetite" selectedValue={formData.reviewOfSystems.appetiteEnergy.appetite} options={[{value: 'good', label: 'Good (좋음)'}, {value: 'ok', label: 'OK (괜찮음)'}, {value: 'sometimes bad', label: 'Sometimes Bad (가끔 나쁨)'}, {value: 'bad', label: 'Bad (나쁨)'}]} onChange={e => handleReviewOfSystemsChange('appetiteEnergy', 'appetite', e.target.value)} />
                     <div className="mt-2">
                        <InputField label="Energy ( /10)" type="number" id="energy" value={formData.reviewOfSystems.appetiteEnergy.energy} onChange={e => handleReviewOfSystemsChange('appetiteEnergy', 'energy', e.target.value)} />
                     </div>
                </div>
            </div>

            {/* Stool & Urine */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 border-t pt-6 mt-6">
                <div>
                    <label className="block text-lg font-medium text-gray-700 mb-2">Urination</label>
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Times a day" id="urineFrequencyDay" value={formData.reviewOfSystems.urine.frequencyDay} onChange={e => handleReviewOfSystemsChange('urine', 'frequencyDay', e.target.value)} />
                        <InputField label="Times at night" id="urineFrequencyNight" value={formData.reviewOfSystems.urine.frequencyNight} onChange={e => handleReviewOfSystemsChange('urine', 'frequencyNight', e.target.value)} />
                    </div>
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-600 mb-1">Amount:</label>
                        <RadioGroup name="urineAmount" selectedValue={formData.reviewOfSystems.urine.amount} options={[{value: 'much', label: 'Much (많은)'}, {value: 'normal', label: 'Normal (정상)'}, {value: 'scanty', label: 'Scanty (적은)'}]} onChange={e => handleReviewOfSystemsChange('urine', 'amount', e.target.value)} />
                    </div>
                    <InputField label="Color" id="urineColor" value={formData.reviewOfSystems.urine.color || 'pale yellow'} onChange={e => handleReviewOfSystemsChange('urine', 'color', e.target.value)} placeholder="pale yellow" className="mt-4"/>
                </div>

                <div>
                    <label className="block text-lg font-medium text-gray-700 mb-2">Stool</label>
                    <div>
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
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Form:</label>
                      <RadioGroup name="stoolForm" selectedValue={formData.reviewOfSystems.stool.form} options={[{value: 'normal', label: 'Normal (정상)'}, {value: 'diarrhea', label: 'Diarrhea (설사)'}, {value: 'constipation', label: 'Constipation (변비)'}, {value: 'alternating', label: 'Alternating (교대)'}]} onChange={e => handleReviewOfSystemsChange('stool', 'form', e.target.value)} />
                    </div>
                    <InputField label="Color" id="stoolColor" value={formData.reviewOfSystems.stool.color || 'brown'} onChange={e => handleReviewOfSystemsChange('stool', 'color', e.target.value)} placeholder="brown" className="mt-4"/>
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
                        <div className="mt-4">
                            <InputField label="Age at Menopause" id="menopauseAge" type="number" value={formData.reviewOfSystems.menstruation.menopauseAge} onChange={e => handleReviewOfSystemsChange('menstruation', 'menopauseAge', e.target.value)} />
                        </div>
                    ) : formData.reviewOfSystems.menstruation.status !== '' ? (
                        <div className="mt-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <InputField label="LMP (Last Menstrual Period)" id="lmp" type="date" value={formData.reviewOfSystems.menstruation.lmp} onChange={e => handleReviewOfSystemsChange('menstruation', 'lmp', e.target.value)} />
                                <InputField label="Cycle (days)" id="cycleLength" type="number" value={formData.reviewOfSystems.menstruation.cycleLength} onChange={e => handleReviewOfSystemsChange('menstruation', 'cycleLength', e.target.value)} />
                                <InputField label="Duration (days)" id="duration" type="number" value={formData.reviewOfSystems.menstruation.duration} onChange={e => handleReviewOfSystemsChange('menstruation', 'duration', e.target.value)} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                ]} selected={formData.reviewOfSystems.menstruation.pms} onChange={(val, checked) => handleRosArrayChange('menstruation', 'pms', val, checked)} gridCols="grid-cols-2" />
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
                                ]} selected={formData.reviewOfSystems.discharge.symptoms} onChange={(val, checked) => handleRosArrayChange('discharge', 'symptoms', val, checked)} gridCols="grid-cols-2 md:grid-cols-4" />
                                <InputField label="Other" id="dischargeOther" value={formData.reviewOfSystems.discharge.other} onChange={e => handleReviewOfSystemsChange('discharge', 'other', e.target.value)} className="mt-2" />
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
                  <CheckboxGroup options={tongueBodyColorModifierOptions} selected={formData.tongue.body.colorModifiers} onChange={(val, checked) => handleTongueBodyArrayChange('colorModifiers', val, checked)} gridCols="grid-cols-2 sm:grid-cols-4 lg:grid-cols-6" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Shape (Single Choice):</label>
                  <RadioGroup options={tongueBodyShapeOptions} name="tongueBodyShape" selectedValue={formData.tongue.body.shape} onChange={e => handleTongueBodyChange('shape', e.target.value)} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-2"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Shape Modifiers (Multi-Choice):</label>
                  <CheckboxGroup options={tongueBodyShapeModifierOptions} selected={formData.tongue.body.shapeModifiers} onChange={(val, checked) => handleTongueBodyArrayChange('shapeModifiers', val, checked)} gridCols="grid-cols-2 sm:grid-cols-4 lg:grid-cols-6" />
                </div>
                {formData.tongue.body.shapeModifiers.includes('Cracked') && (
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Locations (Multi-Choice):</label>
                    <CheckboxGroup 
                        options={tongueLocationOptions} 
                        selected={formData.tongue.body.locations} 
                        onChange={(val, checked) => handleTongueBodyArrayChange('locations', val, checked)} 
                        gridCols="grid-cols-1 sm:grid-cols-3" 
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
                  <CheckboxGroup options={tongueCoatingQualityOptions} selected={formData.tongue.coating.quality} onChange={(val, checked) => handleTongueCoatingArrayChange('quality', val, checked)} gridCols="grid-cols-2 sm:grid-cols-4 lg:grid-cols-6" />
                </div>
                 <div>
                  <label htmlFor="tongueCoatingNotes" className="block text-sm font-medium text-gray-600 mb-1">Notes:</label>
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                      gridCols="grid-cols-2 sm:grid-cols-3 md:grid-cols-5"
                    />
                </div>
                 <div className="border-t pt-4">
                     <h4 className="text-md font-semibold text-gray-600 mb-2">허맥 (Deficient Pulse)</h4>
                     <CheckboxGroup
                      options={deficientPulseQualities}
                      selected={formData.pulse.overall}
                      onChange={(val, checked) => handlePulseOverallChange(val, checked)}
                      gridCols="grid-cols-2 sm:grid-cols-3 md:grid-cols-5"
                    />
                </div>
                <div className="border-t pt-4">
                     <h4 className="text-md font-semibold text-gray-600 mb-2">Other Qualities</h4>
                     <CheckboxGroup
                      options={otherRemainingPulseQualities}
                      selected={formData.pulse.overall}
                      onChange={(val, checked) => handlePulseOverallChange(val, checked)}
                      gridCols="grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
                    />
                </div>
            </div>
          </div>
          <div className="border-t pt-6">
              <label className="block text-lg font-medium text-gray-700 mb-4">Pulse Notes / Details</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                      <label htmlFor="pulseCun" className="block text-sm font-medium text-gray-600 mb-1">촌 (Cun) - 손목 가까운 쪽</label>
                      <textarea
                        id="pulseCun"
                        name="pulseCun"
                        value={formData.pulse.cun || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, pulse: { ...prev.pulse, cun: e.target.value } }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="촌 위치의 맥상"
                      />
                  </div>
                  <div>
                      <label htmlFor="pulseGuan" className="block text-sm font-medium text-gray-600 mb-1">관 (Guan) - 중간</label>
                      <textarea
                        id="pulseGuan"
                        name="pulseGuan"
                        value={formData.pulse.guan || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, pulse: { ...prev.pulse, guan: e.target.value } }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="관 위치의 맥상"
                      />
                  </div>
                  <div>
                      <label htmlFor="pulseChi" className="block text-sm font-medium text-gray-600 mb-1">척 (Chi) - 손목 먼 쪽</label>
                      <textarea
                        id="pulseChi"
                        name="pulseChi"
                        value={formData.pulse.chi || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, pulse: { ...prev.pulse, chi: e.target.value } }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="척 위치의 맥상"
                      />
                  </div>
              </div>
              <div>
                  <label htmlFor="pulseNotes" className="block text-sm font-medium text-gray-600 mb-1">General Pulse Notes</label>
                  <textarea
                    id="pulseNotes"
                    name="pulseNotes"
                    value={formData.pulse.notes}
                    onChange={handlePulseNotesChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="기타 맥진 관련 메모"
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
                    gridCols="grid-cols-2 md:grid-cols-3"
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
                    gridCols="grid-cols-2 md:grid-cols-3"
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
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-4">
                    <RadioGroup name="exteriorInterior" selectedValue={formData.diagnosisAndTreatment.eightPrinciples.exteriorInterior} onChange={handleEightPrincipleChange} options={[{value: 'Exterior', label: 'Exterior'}, {value: 'Interior', label: 'Interior'}]} />
                    <RadioGroup name="heatCold" selectedValue={formData.diagnosisAndTreatment.eightPrinciples.heatCold} onChange={handleEightPrincipleChange} options={[{value: 'Heat', label: 'Heat'}, {value: 'Cold', label: 'Cold'}]} />
                    <RadioGroup name="excessDeficient" selectedValue={formData.diagnosisAndTreatment.eightPrinciples.excessDeficient} onChange={handleEightPrincipleChange} options={[{value: 'Excess', label: 'Excess'}, {value: 'Deficient', label: 'Deficient'}]} />
                    <RadioGroup name="yangYin" selectedValue={formData.diagnosisAndTreatment.eightPrinciples.yangYin} onChange={handleEightPrincipleChange} options={[{value: 'Yang', label: 'Yang'}, {value: 'Yin', label: 'Yin'}]} />
                </div>
            </div>
            
             <InputField label="Etiology" id="etiology" name="etiology" value={formData.diagnosisAndTreatment.etiology} onChange={handleDiagnosisChange} />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="TCM Diagnosis (Syndrome/Differentiation)" id="tcmDiagnosis" name="tcmDiagnosis" value={formData.diagnosisAndTreatment.tcmDiagnosis} onChange={handleDiagnosisChange} />
                <InputField label="Treatment Principle" id="treatmentPrinciple" name="treatmentPrinciple" value={formData.diagnosisAndTreatment.treatmentPrinciple} onChange={handleDiagnosisChange} />
             </div>
             <div>
                <label htmlFor="acupuncturePoints" className="block text-sm font-medium text-gray-700 mb-1">Acupuncture Points</label>
                <textarea id="acupuncturePoints" name="acupuncturePoints" value={formData.diagnosisAndTreatment.acupuncturePoints} onChange={handleDiagnosisChange} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
            </div>
            <div>
                <label htmlFor="herbalTreatment" className="block text-sm font-medium text-gray-700 mb-1">Herbal Treatment</label>
                <textarea id="herbalTreatment" name="herbalTreatment" value={formData.diagnosisAndTreatment.herbalTreatment} onChange={handleDiagnosisChange} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="ICD" id="icd" name="icd" value={formData.diagnosisAndTreatment.icd} onChange={handleDiagnosisChange} />
                <InputField label="CPT" id="cpt" name="cpt" value={formData.diagnosisAndTreatment.cpt} onChange={handleDiagnosisChange} />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Therapist Name" id="therapistName" name="therapistName" value={formData.diagnosisAndTreatment.therapistName} onChange={handleDiagnosisChange} />
                <InputField label="Lic #" id="therapistLicNo" name="therapistLicNo" value={formData.diagnosisAndTreatment.therapistLicNo} onChange={handleDiagnosisChange} />
             </div>
        </div>
      </div>


      <div className="flex justify-between items-center pt-8 mt-8 border-t">
        <button 
            type="button" 
            onClick={handleBack} 
            className="px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors duration-200"
        >
          Back to List
        </button>
        <div className="flex items-center space-x-4">
          <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 disabled:bg-indigo-400 disabled:cursor-not-allowed" disabled={isGeneratingHpi || isDiagnosing}>
            Save & View Chart
          </button>
        </div>
      </div>
    </form>
  );
};