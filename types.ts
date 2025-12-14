export interface ChiefComplaintData {
  selectedComplaints: string[];
  otherComplaint: string;
  location: string;
  locationDetails: string[];
  onsetValue: string;
  onsetUnit: 'days' | 'weeks' | 'months' | 'years' | '';
  provocation: string[];
  provocationOther: string;
  palliation: string[];
  palliationOther: string;
  quality: string[];
  qualityOther: string;
  regionRadiation: string;
  severityScore: string;
  severityDescription: 'Minimal' | 'Slight' | 'Moderate' | 'Severe' | '';
  frequency: 'Occasional' | 'Intermittent' | 'Frequent' | 'Constant' | '';
  timing: string;
  possibleCause: string[];
  possibleCauseOther: string;
  remark: string;
  presentIllness: string;
  westernMedicalDiagnosis: string;
}

export interface MedicalHistoryData {
  pastMedicalHistory: string[];
  pastMedicalHistoryOther: string;
  medication: string[];
  medicationOther: string;
  familyHistory: string[];
  familyHistoryOther: string;
  allergy: string[];
  allergyOther: string;
}

export interface ReviewOfSystemsData {
  coldHot: {
    sensation: 'cold' | 'hot' | 'normal' | '';
    parts: string[];
    other: string;
  };
  sleep: {
    hours: string;
    quality: string[];
    issues: string[];
    other: string;
  };
  sweat: {
    present: 'yes' | 'no' | '';
    time: 'night' | 'day' | 'all time' | '';
    parts: string[];
    other: string;
  };
  eye: {
    symptoms: string[];
    other: string;
  };
  mouthTongue: {
    symptoms: 'dry' | 'normal' | 'wet (sputum, phlegm)' | '';
    taste: 'sour' | 'bitter' | 'sweet' | 'acrid' | 'salty' | 'bland' | '';
    other: string;
  };
  throatNose: {
    symptoms: string[];
    mucusColor: string[];
    other: string;
  };
  edema: {
    present: 'yes' | 'no' | '';
    parts: string[];
    other: string;
  };
  drink: {
    thirsty: 'thirsty' | 'normal' | 'no' | '';
    preference: 'cold' | 'normal' | 'hot' | '';
    amount: 'sip' | 'washes mouth' | 'drink large amount' | '';
    other: string;
  };
  digestion: {
    symptoms: string[];
    other: string;
  };
  appetiteEnergy: {
    appetite: 'good' | 'ok' | 'sometimes bad' | 'bad' | '';
    energy: string;
    other: string;
  };
  stool: {
    frequencyValue: string;
    frequencyUnit: 'day' | 'week' | '';
    form: 'normal' | 'diarrhea' | 'constipation' | 'alternating' | '';
    color: string;
    symptoms: string[];
    other: string;
  };
  urine: {
    frequencyDay: string;
    frequencyNight: string;
    amount: 'much' | 'normal' | 'scanty' | '';
    color: string;
    symptoms: string[];
    other: string;
  };
  menstruation: {
    status: 'regular' | 'irregular' | 'menopause' | '';
    menopauseAge: string;
    lmp: string;
    cycleLength: string;
    duration: string;
    amount: 'normal' | 'scanty' | 'heavy' | '';
    color: 'fresh red' | 'dark' | 'pale' | '';
    clots: 'yes' | 'no' | '';
    pain: 'yes' | 'no' | '';
    painDetails: string;
    pms: string[];
    other: string;
  };
  discharge: {
    present: 'yes' | 'no' | '';
    symptoms: string[];
    other: string;
  };
}

export interface TongueData {
    body: {
        color: string;
        colorModifiers: string[];
        shape: string;
        shapeModifiers: string[];
        locations: string[];
        locationComments: string;
    };
    coating: {
        color: string;
        quality: string[];
        notes: string;
    };
}

export interface PulseData {
  overall: string[];
  notes: string;
  cun?: string;  // 촌 (Cun) - 손목 가까운 쪽
  guan?: string;  // 관 (Guan) - 중간
  chi?: string;   // 척 (Chi) - 손목 먼 쪽
}

export type AcupunctureMethod = 'TCM Body' | 'Saam' | 'Master Tung' | 'Five Element' | 'Trigger Point' | 'Other';

export interface DiagnosisAndTreatmentData {
  eightPrinciples: {
    exteriorInterior: 'Exterior' | 'Interior' | '';
    heatCold: 'Heat' | 'Cold' | '';
    excessDeficient: 'Excess' | 'Deficient' | '';
    yangYin: 'Yang' | 'Yin' | '';
  };
  etiology: string;
  tcmDiagnosis: string;
  treatmentPrinciple: string;
  acupunctureMethod: AcupunctureMethod[];
  acupunctureMethodOther?: string;
  acupuncturePoints: string;
  herbalTreatment: string;
  selectedTreatment: string[];
  otherTreatmentText: string;
  icd: string;
  cpt: string;
  therapistName: string;
  therapistLicNo: string;
}

export interface RespondToCareData {
  status: 'Resolved' | 'Improved' | 'Same' | 'Worse' | '';
  improvedDays: string;
  notes?: string;
}

export interface RangeOfMotionData {
  // 각 관절 부위별 측정값
  // 키는 부위명 (예: "Neck", "Shoulder L", "Shoulder R", "Hip L", "Hip R" 등)
  // 값은 해당 부위의 측정값 객체
  [joint: string]: {
    flexion?: string;        // 굴곡 (degrees)
    extension?: string;     // 신전 (degrees)
    abduction?: string;      // 외전 (degrees)
    adduction?: string;      // 내전 (degrees)
    internalRotation?: string;  // 내회전 (degrees)
    externalRotation?: string;   // 외회전 (degrees)
    lateralFlexion?: string;     // 측면 굴곡 (degrees) - 목/척추용
    rotation?: string;            // 회전 (degrees) - 목/척추용
    notes?: string;              // 추가 메모
  };
}

export interface PatientData {
  chartType: 'new' | 'follow-up';
  clinicName: string;
  clinicLogo: string; // Base64 string
  fileNo: string;
  name: string;
  date: string;
  address: string;
  phone: string;
  occupation: string;
  dob: string;
  age: string;
  sex: 'M' | 'F' | '';
  heightFt: string;
  heightIn: string;
  weight: string; // in lbs
  temp: string; // in °F
  bpSystolic: string;
  bpDiastolic: string;
  heartRate: string; // BPM
  heartRhythm: string;
  lungRate: string; // BPM
  lungSound: string;
  chiefComplaint: ChiefComplaintData;
  medicalHistory: MedicalHistoryData;
  reviewOfSystems: ReviewOfSystemsData;
  tongue: TongueData;
  pulse: PulseData;
  rangeOfMotion: RangeOfMotionData;
  diagnosisAndTreatment: DiagnosisAndTreatmentData;
  respondToCare?: RespondToCareData;
}