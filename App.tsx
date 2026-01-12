import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthWrapper } from './components/AuthWrapper';
import { PatientForm } from './components/PatientForm';
import { PrintableView } from './components/PrintableView';
import { PatientList } from './components/PatientList';
import { AdminRoute } from './components/AdminRoute';
import { PDFUploader } from './components/PDFUploader';
import { ProfileManagement } from './components/ProfileManagement';
import { useAdminMode } from './hooks/useAdminMode';
import type { PatientData } from './types';
import { database } from './lib/database';
import { initializeSampleData, getNewPatientSample, getFollowUpPatientSample, initializeTestUser, getNewPatientSample100106 } from './lib/sampleData';


const getNewPatientState = (chartType: 'new' | 'follow-up', clinicInfo?: any): PatientData => {
  // Base state with sensible defaults to speed up charting
  const baseState: PatientData = {
    chartType,
    patientType: 'cash',
    clinicName: clinicInfo?.clinicName || '',
    clinicLogo: clinicInfo?.clinicLogo || '',
    fileNo: '', name: '', date: new Date().toISOString().split('T')[0],
    address: '', phone: '',
    occupation: '', dob: '', age: '', sex: 'F',
    heightFt: '', heightIn: '', weight: '',
    temp: '', bpSystolic: '', bpDiastolic: '', heartRate: '', heartRhythm: 'Normal',
    lungRate: '17', lungSound: 'Clear',
    chiefComplaint: {
      selectedComplaints: [], otherComplaint: '', location: '', locationDetails: [], onsetValue: '', onsetUnit: '',
      provocation: [], provocationOther: '', palliation: [], palliationOther: '', quality: [], qualityOther: '',
      regionRadiation: '', severityScore: '', severityDescription: '', frequency: '', timing: '',
      possibleCause: [], possibleCauseOther: '', remark: '', presentIllness: '', westernMedicalDiagnosis: '',
    },
    medicalHistory: {
      pastMedicalHistory: [], pastMedicalHistoryOther: '', medication: [], medicationOther: '',
      familyHistory: [], familyHistoryOther: '', allergy: [], allergyOther: '',
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
        stool: { frequencyValue: '', frequencyUnit: '', form: '', color: 'brown', symptoms: [], other: '' },
        urine: { frequencyDay: '', frequencyNight: '', amount: '', color: 'pale yellow', symptoms: [], other: '' },
        menstruation: { status: '', menopauseAge: '', lmp: '', cycleLength: '', duration: '', amount: '', color: '', clots: '', pain: '', painDetails: '', pms: [], other: '' },
        discharge: { present: '', symptoms: [], other: '' }
    },
    tongue: {
        body: { color: '', colorModifiers: [], shape: '', shapeModifiers: [], locations: [], locationComments: '' },
        coating: { color: '', quality: [], notes: '' },
    },
    pulse: {
        overall: [],
        notes: '',
        cun: '',
        guan: '',
        chi: '',
    },
    rangeOfMotion: {},
    diagnosisAndTreatment: {
      eightPrinciples: { exteriorInterior: '', heatCold: '', excessDeficient: '', yangYin: '' },
      etiology: '', tcmDiagnosis: '', treatmentPrinciple: '', 
      acupunctureMethod: [],
      acupunctureMethodOther: '',
      acupuncturePoints: '', herbalTreatment: '',
      selectedTreatment: [], otherTreatmentText: '', icd: '', cpt: '',
      therapistName: clinicInfo?.therapistName || '', therapistLicNo: clinicInfo?.therapistLicenseNo || '',
    },
    respondToCare: {
        status: '',
        improvedDays: '',
        painLevelBefore: '',
        painLevelAfter: '',
        painLevelCurrent: '',
        canDriveWithoutPain: '',
        canSitWithoutPain: '',
        canSitDuration: '',
        canStandWithoutPain: '',
        canStandDuration: '',
        canWalkWithoutPain: '',
        canWalkDistance: '',
        sleepQualityImprovement: '',
        dailyActivitiesImprovement: '',
        notes: '',
    }
  };

  if (chartType === 'follow-up') {
    // 재방문 환자는 일반적인 기본값으로 설정
    return {
        ...baseState,
        reviewOfSystems: {
            coldHot: { sensation: 'normal', parts: [], other: '' },
            sleep: { hours: '7-8', quality: ['O.K.'], issues: [], other: '' },
            sweat: { present: 'no', time: '', parts: [], other: '' },
            eye: { symptoms: ['normal'], other: '' },
            mouthTongue: { symptoms: 'normal', taste: 'normal', other: '' },
            throatNose: { symptoms: ['normal'], mucusColor: [], other: '' },
            edema: { present: 'no', parts: [], other: '' },
            drink: { thirsty: 'normal', preference: 'normal', amount: 'normal', other: '' },
            digestion: { symptoms: ['good'], other: '' },
            appetiteEnergy: { appetite: 'good', energy: '7', other: '' },
            stool: { frequencyValue: '1', frequencyUnit: 'day', form: 'normal', color: 'brown', symptoms: [], other: '' },
            urine: { frequencyDay: '4-6', frequencyNight: '0-1', amount: 'normal', color: 'pale yellow', symptoms: [], other: '' },
            menstruation: { status: '', menopauseAge: '', lmp: '', cycleLength: '', duration: '', amount: '', color: '', clots: '', pain: '', painDetails: '', pms: [], other: '' },
            discharge: { present: 'no', symptoms: [], other: '' }
        },
        tongue: {
            body: { color: 'Pink', colorModifiers: [], shape: 'Normal', shapeModifiers: [], locations: [], locationComments: '' },
            coating: { color: 'White', quality: ['Thin'], notes: '' },
        },
        pulse: {
            overall: ['Normal'],
            notes: '',
        },
        diagnosisAndTreatment: {
            ...baseState.diagnosisAndTreatment,
            cpt: '99212, 97813, 97814'
        }
    };
  }

  // 신규환자는 기본값으로 설정 (정상 상태)
  return {
    ...baseState,
    reviewOfSystems: {
        coldHot: { sensation: 'normal', parts: [], other: '' },
        sleep: { hours: '', quality: [], issues: [], other: '' },
        sweat: { present: 'no', time: '', parts: [], other: '' },
        eye: { symptoms: ['normal'], other: '' },
        mouthTongue: { symptoms: 'normal', taste: 'normal', other: '' },
        throatNose: { symptoms: ['normal'], mucusColor: [], other: '' },
        edema: { present: 'no', parts: [], other: '' },
        drink: { thirsty: 'normal', preference: 'normal', amount: '', other: '' },
        digestion: { symptoms: ['good'], other: '' },
        appetiteEnergy: { appetite: 'good', energy: '', other: '' },
        stool: { frequencyValue: '', frequencyUnit: '', form: 'normal', color: 'brown', symptoms: [], other: '' },
        urine: { frequencyDay: '', frequencyNight: '', amount: 'normal', color: 'pale yellow', symptoms: [], other: '' },
        menstruation: { status: '', menopauseAge: '', lmp: '', cycleLength: '', duration: '', amount: '', color: '', clots: '', pain: '', painDetails: '', pms: [], other: '' },
        discharge: { present: 'no', symptoms: [], other: '' }
    },
    diagnosisAndTreatment: {
        ...baseState.diagnosisAndTreatment,
        cpt: '99202, 97810, 97811, 97026'
    }
  };
};

const PatientChartApp: React.FC = () => {
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [currentPatient, setCurrentPatient] = useState<PatientData | null>(null);
  const [view, setView] = useState<'list' | 'form' | 'print' | 'profile'>('list');
  const [formMode, setFormMode] = useState<'new' | 'edit'>('new');
  const [clinicInfo, setClinicInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPDFUploader, setShowPDFUploader] = useState(false);

  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { isAdminMode, clearAdminMode } = useAdminMode();

  // 자동 리다이렉트 로직 제거 - 관리자는 URL 파라미터로만 접근

  // 사용자 인증 상태에 따라 데이터 로드
  useEffect(() => {
    if (isAuthenticated && user) {
      // 일반 사용자인 경우 admin 모드 강제 해제
      if (user.id !== 'admin' && user.username !== 'admin' && isAdminMode) {
        console.log('🔒 일반 사용자 로그인 - admin 모드 강제 해제');
        clearAdminMode();
      }
      loadUserData();
    } else if (!authLoading) {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, authLoading, isAdminMode]);

  const loadUserData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // 데이터베이스 초기화
      await database.initialize();
      
      // 테스트 사용자 초기화 (앱 시작 시 항상 실행)
      await initializeTestUser();
      
      // 환자 데이터 로드
      const charts = await database.getPatientCharts(user.id);
      
      // 개발 모드에서만 디버깅 정보 출력
      if (import.meta.env.DEV) {
        console.log('📊 로드된 차트 개수:', charts.length, `(사용자: ${user.username}, ID: ${user.id})`);
        
        if (charts.length === 0) {
          console.warn('⚠️ 저장된 차트가 없습니다.');
          // 디버깅: 모든 사용자의 차트 확인
          const allUsers = await database.getAllUsers();
          const allCharts = await database.getAllCharts();
          console.log('🔍 디버깅 정보:', {
            전체사용자수: allUsers.length,
            전체차트수: allCharts.length,
            사용자별차트: allUsers.map(u => ({ username: u.username, id: u.id }))
          });
        }
      }
      
      const patientData = charts.map(chart => JSON.parse(chart.chartData));
      setPatients(patientData);

      // 클리닉 정보 로드
      const clinicData = await database.getClinicInfo(user.id);
      if (clinicData) {
        setClinicInfo(clinicData);
      } else {
        // 기본 클리닉 정보 설정
        setClinicInfo({
          clinicName: user.clinicName,
          therapistName: user.therapistName,
          therapistLicenseNo: user.therapistLicenseNo,
        });
      }

      // 샘플 데이터 초기화 (처음 로그인한 사용자에게만)
      if (patientData.length === 0) {
        const sampleResult = await initializeSampleData(user.id, clinicData || {
          clinicName: user.clinicName,
          therapistName: user.therapistName,
          therapistLicenseNo: user.therapistLicenseNo,
        });
        
        if (sampleResult.newSampleAdded || sampleResult.followUpSampleAdded) {
          // 샘플 데이터가 추가되었으므로 다시 로드
          const updatedCharts = await database.getPatientCharts(user.id);
          const updatedPatientData = updatedCharts.map(chart => JSON.parse(chart.chartData));
          setPatients(updatedPatientData);
        }
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePatients = async (updatedPatients: PatientData[]) => {
    if (!user) return;
    
    try {
      // 각 환자 데이터를 개별적으로 저장
      for (const patient of updatedPatients) {
        await database.savePatientChart(user.id, patient);
      }
      setPatients(updatedPatients);
    } catch (error) {
      console.error("Failed to save patient records:", error);
    }
  };

  const handleFormSubmit = async (data: PatientData) => {
    if (!user) return;
    
    // 재방문 차트인 경우 날짜 확인 및 로그
    if (data.chartType === 'follow-up') {
      console.log('💾 재방문 차트 저장 - 날짜 확인:', {
        fileNo: data.fileNo,
        name: data.name,
        저장날짜: data.date,
        chartType: data.chartType
      });
      
      // 날짜가 없거나 이전 날짜인 경우 오늘 날짜로 설정
      if (!data.date || data.date === '') {
        const todayDate = new Date().toISOString().split('T')[0];
        console.log('⚠️ 날짜가 없어서 오늘 날짜로 설정:', todayDate);
        data.date = todayDate;
      }
    }
    
    // 클리닉 정보 저장
    try {
        const infoToStore = {
            clinicName: data.clinicName,
            clinicLogo: data.clinicLogo,
            therapistName: data.diagnosisAndTreatment.therapistName,
            therapistLicenseNo: data.diagnosisAndTreatment.therapistLicNo,
        };
        await database.saveClinicInfo(user.id, infoToStore);
        setClinicInfo(infoToStore);
    } catch (error) {
        console.error("Failed to save clinic info:", error);
    }
    
    // 환자 데이터 저장 - 항상 새로운 차트로 저장 (기존 차트는 덮어쓰지 않음)
    try {
      console.log('💾 차트 저장 전 최종 확인:', {
        fileNo: data.fileNo,
        date: data.date,
        chartType: data.chartType
      });
      await database.savePatientChartAsNew(user.id, data);
      
      // 저장 후 모든 차트를 다시 로드하여 최신 상태 유지
      const updatedCharts = await database.getPatientCharts(user.id);
      const updatedPatientData = updatedCharts.map(chart => JSON.parse(chart.chartData));
      setPatients(updatedPatientData);
    
      setCurrentPatient(data);
      setView('print');
    } catch (error) {
      console.error("Failed to save patient record:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save patient record. Please try again.";
      alert(`저장 실패: ${errorMessage}\n\n브라우저를 새로고침하여 데이터베이스를 업데이트한 후 다시 시도해주세요.`);
    }
  };

  const handleNewPatient = () => {
    setCurrentPatient(getNewPatientState('new', clinicInfo));
    setFormMode('new');
    setView('form');
  }

  const handleNewFollowUpFromScratch = () => {
    // 새로운 follow-up 차트를 처음부터 작성
    setCurrentPatient(getNewPatientState('follow-up', clinicInfo));
    setFormMode('new');
    setView('form');
  }

  // 기존 샘플 데이터 제거 함수
  const clearSampleData = async () => {
    if (!user) return;
    
    try {
      const charts = await database.getPatientCharts(user.id);
      const sampleCharts = charts.filter(chart => 
        chart.fileNo === 'CH-12345' || chart.fileNo === 'CH-67890'
      );
      
      for (const chart of sampleCharts) {
        await database.deletePatientChartById(user.id, chart.id!);
      }
      
      // 환자 목록 새로고침
      const updatedCharts = await database.getPatientCharts(user.id);
      const updatedPatientData = updatedCharts.map(chart => JSON.parse(chart.chartData));
      setPatients(updatedPatientData);
      
      console.log('샘플 데이터가 제거되었습니다.');
    } catch (error) {
      console.error('샘플 데이터 제거 실패:', error);
    }
  }

  const handleManageProfile = () => {
    setView('profile');
  };

  const handleProfileUpdate = async () => {
    // 프로필 업데이트 후 클리닉 정보 다시 로드
    if (user) {
      try {
        const clinicData = await database.getClinicInfo(user.id);
        if (clinicData) {
          setClinicInfo(clinicData);
        }
      } catch (error) {
        console.error('클리닉 정보 로드 실패:', error);
      }
    }
    setView('list');
  };

  // 100106 샘플 데이터 생성 함수
  const createSample100106 = async () => {
    if (!user) return;
    
    try {
      // 기존 100106 차트가 있는지 확인
      const charts = await database.getPatientCharts(user.id);
      const existing100106 = charts.some(chart => chart.fileNo === '100106');
      
      if (existing100106) {
        if (!window.confirm('File No. 100106 already exists. Do you want to create another chart?')) {
          return;
        }
      }
      
      const sample100106 = getNewPatientSample100106(clinicInfo);
      await database.savePatientChartAsNew(user.id, sample100106);
      
      // 환자 목록 새로고침
      const updatedCharts = await database.getPatientCharts(user.id);
      const updatedPatientData = updatedCharts.map(chart => JSON.parse(chart.chartData));
      setPatients(updatedPatientData);
      
      alert('Sample patient chart 100106 has been created successfully!');
    } catch (error) {
      console.error('샘플 데이터 생성 실패:', error);
      alert('Failed to create sample data. Please try again.');
    }
  };
  
  const handleNewFollowUpChart = async (selectedPatient: PatientData) => {
    if (!user) return;
    
    try {
      // 선택된 환자의 최근 차트 불러오기
      const charts = await database.getPatientChartsByFileNo(user.id, selectedPatient.fileNo);
      
      // 최신 차트 찾기 (날짜 기준)
      const latestChart = charts
        .map(chart => JSON.parse(chart.chartData) as PatientData)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      
      if (latestChart) {
        // 마지막 방문 차트의 데이터를 그대로 유지하되, 날짜만 오늘로 변경하고 chartType을 follow-up으로 변경
        // 재방문 시에는 환자의 변경사항이 거의 없으므로 대부분의 데이터를 유지
        const todayDate = new Date().toISOString().split('T')[0];
        console.log('📅 재방문 차트 생성 - 날짜 설정:', {
          이전날짜: latestChart.date,
          새날짜: todayDate,
          fileNo: latestChart.fileNo
        });
        const followUpChart: PatientData = {
          ...latestChart,
          chartType: 'follow-up',
          date: todayDate, // 오늘 날짜로 변경
          // Chief Complaint는 유지하되, remark와 presentIllness만 초기화 (새로운 방문이므로)
          chiefComplaint: {
            ...latestChart.chiefComplaint,
            remark: '', // Follow-up Notes는 새로 작성
            presentIllness: '', // HPI는 새로 작성
          },
          // Respond to Care는 초기화 (새로운 방문이므로 새로운 응답 필요)
          respondToCare: {
            status: '',
            improvedDays: '',
            improvedPercent: '',
            treatmentAfterDays: '',
            painLevelBefore: '',
            painLevelAfter: '',
            painLevelCurrent: '',
            canDriveWithoutPain: '',
            canSitWithoutPain: '',
            canSitDuration: '',
            canSitMaxTime: '',
            canStandWithoutPain: '',
            canStandDuration: '',
            canWalkWithoutPain: '',
            canWalkDistance: '',
            canWalkMaxTime: '',
            canDriveMaxTime: '',
            houseworkDiscomfort: '',
            liftingDiscomfort: '',
            sleepQualityDiscomfort: '',
            commuteDiscomfort: '',
            avoidedActivitiesCount: '',
            painMedicationFrequency: '',
            medicationChange: '',
            recoveryPercent: '',
            sleepQualityImprovement: '',
            dailyActivitiesImprovement: '',
            notes: '',
          },
          // 진단 및 치료 - Eight Principles는 초기화 (새로 진단), 나머지는 유지
          diagnosisAndTreatment: {
            ...latestChart.diagnosisAndTreatment,
            eightPrinciples: { exteriorInterior: '', heatCold: '', excessDeficient: '', yangYin: '' },
            // acupunctureMethod, acupuncturePoints, herbalTreatment 등은 유지하되 필요시 수정 가능
            cpt: '99212, 97813, 97814', // Follow-up CPT 코드
          },
          // Vital signs는 유지 (변경이 있을 수 있으므로 수정 가능)
          // Review of Systems는 유지 (크게 변하지 않으므로)
          // Tongue와 Pulse는 유지 (변경이 있을 수 있으므로 수정 가능)
        };
        
        setCurrentPatient(followUpChart);
      } else {
        // 차트가 없으면 기본 follow-up 차트 생성
        const baseFollowUp = getNewPatientState('follow-up', clinicInfo);
        const todayDate = new Date().toISOString().split('T')[0];
        console.log('📅 재방문 차트 생성 (기본) - 날짜 설정:', {
          새날짜: todayDate,
          fileNo: selectedPatient.fileNo
        });
        setCurrentPatient({
          ...baseFollowUp,
          fileNo: selectedPatient.fileNo,
          name: selectedPatient.name,
          dob: selectedPatient.dob,
          age: selectedPatient.age,
          sex: selectedPatient.sex,
          address: selectedPatient.address,
          phone: selectedPatient.phone,
          occupation: selectedPatient.occupation,
          heightFt: selectedPatient.heightFt,
          heightIn: selectedPatient.heightIn,
          weight: selectedPatient.weight,
          date: todayDate, // 오늘 날짜로 명시적으로 설정
        });
      }
    } catch (error) {
      console.error('이전 차트 불러오기 실패:', error);
      // 에러 발생 시 기본 follow-up 차트 생성
      const baseFollowUp = getNewPatientState('follow-up', clinicInfo);
      const todayDate = new Date().toISOString().split('T')[0];
      console.log('📅 재방문 차트 생성 (에러 시) - 날짜 설정:', {
        새날짜: todayDate,
        fileNo: selectedPatient.fileNo
      });
      setCurrentPatient({
        ...baseFollowUp,
        fileNo: selectedPatient.fileNo,
        name: selectedPatient.name,
        dob: selectedPatient.dob,
        age: selectedPatient.age,
        sex: selectedPatient.sex,
        address: selectedPatient.address,
        phone: selectedPatient.phone,
        occupation: selectedPatient.occupation,
        heightFt: selectedPatient.heightFt,
        heightIn: selectedPatient.heightIn,
        weight: selectedPatient.weight,
        date: todayDate, // 오늘 날짜로 명시적으로 설정
      });
    }
    
    setFormMode('new');
    setView('form');
  };

  const handleStartFollowUpFromPDF = () => {
    setShowPDFUploader(true);
  };

  const handlePDFExtractComplete = (patientData: PatientData) => {
    setShowPDFUploader(false);
    setCurrentPatient(patientData);
    setFormMode('new');
    setView('form');
  };

  const handlePDFUploadCancel = () => {
    setShowPDFUploader(false);
  };

  const handleSelectPatient = (patient: PatientData) => {
    setCurrentPatient(patient);
    setFormMode('edit');
    setView('form');
  }

  const handleViewPatient = (patient: PatientData) => {
    // 차트를 읽기 전용으로 보기만 함
    setCurrentPatient(patient);
    setView('print');
  }

  const handleSelectPatientChart = async (fileNo: string): Promise<PatientData[]> => {
    if (!user) return [];
    try {
      const charts = await database.getPatientChartsByFileNo(user.id, fileNo);
      return charts.map(chart => JSON.parse(chart.chartData) as PatientData);
    } catch (error) {
      console.error('차트 로드 실패:', error);
      return [];
    }
  }

  const handleDeletePatient = async (fileNo: string, date: string) => {
    if (!user) return;
    
    if (window.confirm(`Are you sure you want to delete the chart for File No. ${fileNo} dated ${date}? This action cannot be undone.`)) {
      try {
        await database.deletePatientChart(user.id, fileNo, date);
        // 삭제 후 데이터 다시 로드
        const updatedCharts = await database.getPatientCharts(user.id);
        const updatedPatientData = updatedCharts.map(chart => JSON.parse(chart.chartData));
        setPatients(updatedPatientData);
      } catch (error) {
        console.error("Failed to delete patient record:", error);
        alert("Failed to delete patient record. Please try again.");
      }
    }
  }
  
  const handleGoToList = () => {
    setCurrentPatient(null);
    setView('list');
  };

  const handleEdit = () => {
    setView('form');
  };


  const renderView = () => {
    switch (view) {
      case 'form':
        return <PatientForm 
                  initialData={currentPatient!} 
                  onSubmit={handleFormSubmit}
                  onBack={handleGoToList}
                  mode={formMode}
               />;
      case 'print':
        return <PrintableView data={currentPatient!} onEdit={handleEdit} onGoToList={handleGoToList} />;
      case 'profile':
        return <ProfileManagement onBack={handleGoToList} onUpdate={handleProfileUpdate} />;
      case 'list':
      default:
        return <PatientList 
                    patients={patients} 
                    onSelectPatient={handleSelectPatient} 
                    onNewPatient={handleNewPatient} 
                    onDeletePatient={handleDeletePatient} 
                    onStartFollowUp={handleNewFollowUpChart}
                    onStartFollowUpFromScratch={handleNewFollowUpFromScratch}
                    onStartFollowUpFromPDF={handleStartFollowUpFromPDF}
                    onClearSampleData={clearSampleData}
                    onViewPatient={handleViewPatient}
                    onCreateSample100106={createSample100106}
                />;
    }
  };

  // 로딩 중이거나 인증되지 않은 경우
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthWrapper />;
  }

  // 관리자 대시보드 모드 (admin 사용자만)
  if (isAuthenticated && isAdminMode && user && user.id === 'admin' && user.username === 'admin') {
    return <AdminRoute isAuthenticated={isAuthenticated} isAdminMode={isAdminMode} />;
  }
  
  // 일반 사용자인데 admin 모드가 활성화되어 있으면 강제 해제
  if (isAuthenticated && user && user.id !== 'admin' && user.username !== 'admin' && isAdminMode) {
    clearAdminMode();
  }

  return (
    <div className="min-h-screen container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="text-left">
        <h1 className="text-4xl font-bold text-slate-800">Patient Chart System</h1>
        <p className="text-slate-600 mt-2">A modern solution for digital patient records.</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Welcome, {user?.therapistName}</p>
            <p className="text-xs text-gray-500">{user?.clinicName}</p>
            <div className="flex gap-2 mt-2 justify-end">
              <button
                onClick={handleManageProfile}
                className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                Manage Profile
              </button>
              <button
                onClick={() => {
                  clearAdminMode();
                  localStorage.removeItem('adminRedirected');
                  logout();
                }}
                className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main>
        {renderView()}
      </main>
      

      {/* PDF Uploader Modal */}
      {showPDFUploader && (
        <PDFUploader
          onExtractComplete={handlePDFExtractComplete}
          onCancel={handlePDFUploadCancel}
          clinicInfo={clinicInfo}
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <PatientChartApp />
    </AuthProvider>
  );
};

export default App;