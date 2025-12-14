import type { PatientData } from '../types';
import type { User } from './database';

// 신규환자 샘플 데이터 (Jane Doe) - 빈 값으로 설정
export const getNewPatientSample = (clinicInfo?: any): PatientData => ({
  chartType: 'new',
  clinicName: clinicInfo?.clinicName || 'East-West Wellness Center',
  clinicLogo: clinicInfo?.clinicLogo || '',
  fileNo: 'CH-12345',
  name: 'Jane Doe',
  date: new Date().toISOString().split('T')[0],
  address: '',
  phone: '',
  occupation: '',
  dob: '',
  age: '',
  sex: 'F',
  heightFt: '',
  heightIn: '',
  weight: '',
  temp: '',
  bpSystolic: '',
  bpDiastolic: '',
  heartRate: '',
  heartRhythm: '',
  lungRate: '',
  lungSound: '',
  chiefComplaint: {
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
    westernMedicalDiagnosis: '',
  },
  medicalHistory: {
    pastMedicalHistory: [],
    pastMedicalHistoryOther: '',
    medication: [],
    medicationOther: '',
    familyHistory: [],
    familyHistoryOther: '',
    allergy: [],
    allergyOther: '',
  },
  reviewOfSystems: {
    coldHot: { sensation: '', parts: [], other: '' },
    sleep: { hours: '', quality: [], issues: [], other: '' },
    sweat: { present: '', time: '', parts: [], other: '' },
    eye: { symptoms: [], other: '' },
    mouthTongue: { symptoms: '', taste: '', other: '' },
    throatNose: { symptoms: [], mucusColor: [], other: '' },
    edema: { present: '', parts: [], other: '' },
    drink: { thirsty: '', preference: '', amount: '', other: '' },
    digestion: { symptoms: [], other: '' },
    appetiteEnergy: { appetite: '', energy: '', other: '' },
    stool: { frequencyValue: '', frequencyUnit: '', form: '', color: '', symptoms: [], other: '' },
    urine: { frequencyDay: '', frequencyNight: '', amount: '', color: '', symptoms: [], other: '' },
    menstruation: { status: '', menopauseAge: '', lmp: '', cycleLength: '', duration: '', amount: '', color: '', clots: '', pain: '', painDetails: '', pms: [], other: '' },
    discharge: { present: '', symptoms: [], other: '' }
  },
  tongue: {
    body: { 
      color: '', colorModifiers: [], 
      shape: '', shapeModifiers: [], 
      locations: [], 
      locationComments: '' 
    },
    coating: { color: '', quality: [], notes: '' },
  },
  pulse: {
    overall: [],
    notes: '',
  },
  rangeOfMotion: {},
  diagnosisAndTreatment: {
    eightPrinciples: { exteriorInterior: '', heatCold: '', excessDeficient: '', yangYin: '' },
    etiology: '',
    tcmDiagnosis: '',
    treatmentPrinciple: '',
    acupunctureMethod: [],
    acupunctureMethodOther: '',
    acupuncturePoints: '',
    herbalTreatment: '',
    selectedTreatment: ['None'],
    otherTreatmentText: '',
    icd: '',
    cpt: '99202, 97810, 97811, 97026',
    therapistName: clinicInfo?.therapistName || '',
    therapistLicNo: clinicInfo?.therapistLicenseNo || '',
  },
  respondToCare: {
    status: 'Same',
    improvedDays: '',
    notes: '',
  }
});

// 재방문 환자 샘플 데이터 (John Smith) - 일반적인 기본값으로 설정
export const getFollowUpPatientSample = (clinicInfo?: any): PatientData => ({
  chartType: 'follow-up',
  clinicName: clinicInfo?.clinicName || 'East-West Wellness Center',
  clinicLogo: clinicInfo?.clinicLogo || '',
  fileNo: 'CH-67890',
  name: 'John Smith',
  date: new Date().toISOString().split('T')[0],
  address: '456 Health Street, Apt 2B, Wellness City, ST 12345',
  phone: '(555) 123-4567',
  occupation: 'Teacher',
  dob: '1985-03-22',
  age: '39',
  sex: 'M',
  heightFt: '6',
  heightIn: '0',
  weight: '180',
  temp: '98.4',
  bpSystolic: '130',
  bpDiastolic: '85',
  heartRate: '78',
  heartRhythm: 'Normal',
  lungRate: '16',
  lungSound: 'Clear',
  chiefComplaint: {
    selectedComplaints: ['Neck Pain', 'Shoulder Pain'],
    otherComplaint: '',
    location: 'Right shoulder and neck area',
    locationDetails: ['Right'],
    onsetValue: '',
    onsetUnit: '',
    provocation: ['Computer Work', 'Stress'],
    provocationOther: '',
    palliation: ['Heat Pack', 'Massage'],
    palliationOther: '',
    quality: ['Stiff', 'Tight'],
    qualityOther: '',
    regionRadiation: 'Radiates to right arm',
    severityScore: '4',
    severityDescription: 'Slight',
    frequency: 'Frequent',
    timing: 'Worse after work and in the evening',
    possibleCause: ['Poor Posture', 'Overwork / Repetitive Labor'],
    possibleCauseOther: '',
    remark: 'Patient reports 40% improvement since last visit. Neck mobility has increased, but still experiences stiffness after long computer sessions. Sleep quality has improved. Patient is very satisfied with the treatment progress.',
    presentIllness: '',
    westernMedicalDiagnosis: '',
  },
  medicalHistory: {
    pastMedicalHistory: [],
    pastMedicalHistoryOther: '',
    medication: [],
    medicationOther: '',
    familyHistory: ['Hypertension'],
    familyHistoryOther: '',
    allergy: [],
    allergyOther: '',
  },
  reviewOfSystems: {
    coldHot: { sensation: 'normal', parts: [], other: '' },
    sleep: { hours: '7-8', quality: ['O.K.'], issues: [], other: '' },
    sweat: { present: 'no', time: '', parts: [], other: '' },
    eye: { symptoms: ['normal'], other: '' },
    mouthTongue: { symptoms: 'normal', taste: 'bland', other: '' },
    throatNose: { symptoms: ['normal'], mucusColor: [], other: '' },
    edema: { present: 'no', parts: [], other: '' },
    drink: { thirsty: 'normal', preference: 'normal', amount: '', other: '' },
    digestion: { symptoms: ['good'], other: '' },
    appetiteEnergy: { appetite: 'good', energy: '7', other: '' },
    stool: { frequencyValue: '1', frequencyUnit: 'day', form: 'normal', color: 'brown', symptoms: [], other: '' },
    urine: { frequencyDay: '4-5', frequencyNight: '0-1', amount: 'normal', color: 'pale yellow', symptoms: [], other: '' },
    menstruation: { status: '', menopauseAge: '', lmp: '', cycleLength: '', duration: '', amount: 'normal', color: 'fresh red', clots: 'no', pain: 'no', painDetails: '', pms: [], other: '' },
    discharge: { present: 'no', symptoms: [], other: '' }
  },
  tongue: {
    body: { 
      color: 'Pink', colorModifiers: [], 
      shape: 'Normal', shapeModifiers: [], 
      locations: [], 
      locationComments: '' 
    },
    coating: { color: 'White', quality: ['Thin'], notes: '' },
  },
  pulse: {
    overall: ['Normal', 'Slightly Wiry'],
    notes: 'Overall improvement noted. Less wiry compared to initial visit.',
  },
  rangeOfMotion: {},
  diagnosisAndTreatment: {
    eightPrinciples: { exteriorInterior: 'Interior', heatCold: 'Normal', excessDeficient: 'Excess', yangYin: 'Yang' },
    etiology: 'Continued improvement in Liver Qi stagnation. Some residual tension remains from work stress.',
    tcmDiagnosis: 'Liver Qi Stagnation (Improving)',
    treatmentPrinciple: 'Continue to soothe Liver Qi, relax muscles, and improve circulation.',
    acupunctureMethod: ['TCM Body'],
    acupunctureMethodOther: '',
    acupuncturePoints: 'GB20, GB21, LI4, LV3, ST36, Ashi points',
    herbalTreatment: 'Xiao Yao San',
    selectedTreatment: ['Tui-Na'],
    otherTreatmentText: '',
    icd: 'M54.2 (Cervicalgia), M25.5 (Pain in joint)',
    cpt: '99212, 97813, 97814',
    therapistName: clinicInfo?.therapistName || 'John Smith, L.Ac.',
    therapistLicNo: clinicInfo?.therapistLicenseNo || '12345',
  },
  respondToCare: {
    status: 'Improved',
    improvedDays: '5',
    notes: 'Patient reports 40% improvement since last visit. Neck mobility has increased, but still experiences stiffness after long computer sessions. Sleep quality has improved. Patient is very satisfied with the treatment progress.',
  }
});

// 샘플 데이터 초기화 함수
export const initializeSampleData = async (userId: string, clinicInfo?: any) => {
  const { database } = await import('./database');
  
  try {
    // 기존 샘플 데이터가 있는지 확인
    const existingCharts = await database.getPatientCharts(userId);
    const hasNewSample = existingCharts.some(chart => chart.fileNo === 'CH-12345');
    const hasFollowUpSample = existingCharts.some(chart => chart.fileNo === 'CH-67890');
    
    // 기존 불필요한 샘플 데이터 제거 (Michael Chen, Sarah Johnson 등)
    const unwantedSamples = existingCharts.filter(chart => {
      const patientData = JSON.parse(chart.chartData);
      return patientData.name === 'Michael Chen' || 
             patientData.name === 'Sarah Johnson' ||
             (patientData.fileNo !== 'CH-12345' && patientData.fileNo !== 'CH-67890' && 
              patientData.name && patientData.name.includes('Sample'));
    });
    
    for (const chart of unwantedSamples) {
      await database.deletePatientChart(userId, chart.id);
      console.log('불필요한 샘플 데이터 제거:', chart.fileNo);
    }
    
    // 신규환자 샘플 추가 (Jane Doe)
    if (!hasNewSample) {
      const newPatientSample = getNewPatientSample(clinicInfo);
      await database.savePatientChart(userId, newPatientSample);
      console.log('신규환자 샘플 데이터가 추가되었습니다.');
    }
    
    // 재방문 환자 샘플 추가 (John Smith)
    if (!hasFollowUpSample) {
      const followUpSample = getFollowUpPatientSample(clinicInfo);
      await database.savePatientChart(userId, followUpSample);
      console.log('재방문 환자 샘플 데이터가 추가되었습니다.');
    }
    
    return { newSampleAdded: !hasNewSample, followUpSampleAdded: !hasFollowUpSample };
  } catch (error) {
    console.error('샘플 데이터 초기화 실패:', error);
    return { newSampleAdded: false, followUpSampleAdded: false };
  }
};

// 테스트용 사용자 계정 초기화 함수
export const initializeTestUser = async () => {
  const { database } = await import('./database');
  
  try {
    // 데이터베이스 초기화 보장
    await database.initialize();
    
    // 테스트 사용자 정보
    const testUserData = {
      username: 'sjoekim',
      password: 'Joe007007',
      clinicName: 'Test Wellness Center',
      therapistName: '김선생',
      therapistLicenseNo: 'TEST12345'
    };
    
    // 기존 사용자가 있는지 확인
    const existingUsers = await database.getAllUsers();
    const existingUser = existingUsers.find(user => user.username === 'sjoekim');
    
    if (!existingUser) {
      // 테스트 사용자 생성
      console.log('🔧 테스트 사용자 계정 생성 중...');
      const result = await database.registerUser(testUserData);
      console.log('✅ 테스트 사용자 계정이 생성되었습니다:', result.user.username);
      
      // 관리자 승인 처리
      await database.approveUser(result.user.id, 'admin');
      console.log('✅ 테스트 사용자 계정이 승인되었습니다.');
      
      return { userCreated: true, userApproved: true };
    } else {
      console.log('ℹ️ 테스트 사용자 계정이 이미 존재합니다.');
      
      // 테스트 사용자의 비밀번호를 항상 업데이트 (비밀번호가 변경되었을 수 있으므로)
      console.log('🔧 테스트 사용자 비밀번호 업데이트 중...');
      await database.updateUserPassword('sjoekim', testUserData.password);
      
      // 기존 사용자가 승인되지 않은 경우 자동 승인 (테스트 계정이므로)
      if (!existingUser.isApproved) {
        console.log('🔧 테스트 사용자 계정 승인 처리 중...');
        await database.approveUser(existingUser.id, 'admin');
        console.log('✅ 테스트 사용자 계정이 승인되었습니다.');
        return { userCreated: false, userApproved: true };
      }
      
      console.log('✅ 테스트 사용자 계정이 준비되었습니다.');
      return { userCreated: false, userApproved: existingUser.isApproved };
    }
  } catch (error) {
    console.error('❌ 테스트 사용자 초기화 실패:', error);
    return { userCreated: false, userApproved: false };
  }
};
