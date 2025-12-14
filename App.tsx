import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthWrapper } from './components/AuthWrapper';
import { PatientForm } from './components/PatientForm.tsx';
import { PrintableView } from './components/PrintableView.tsx';
import { PatientList } from './components/PatientList.tsx';
import { SOAPReport } from './components/SOAPReport';
import { AdminRoute } from './components/AdminRoute';
import { PDFUploader } from './components/PDFUploader';
import { useAdminMode } from './hooks/useAdminMode';
import type { PatientData } from './types.ts';
import { database } from './lib/database';
import { initializeSampleData, getNewPatientSample, getFollowUpPatientSample, initializeTestUser } from './lib/sampleData';


const getNewPatientState = (chartType: 'new' | 'follow-up', clinicInfo?: any): PatientData => {
  // Base state with sensible defaults to speed up charting
  const baseState: PatientData = {
    chartType,
    clinicName: clinicInfo?.clinicName || '',
    clinicLogo: clinicInfo?.clinicLogo || '',
    fileNo: '', name: '', date: new Date().toISOString().split('T')[0],
    address: '', phone: '',
    occupation: '', dob: '', age: '', sex: 'F',
    heightFt: '', heightIn: '', weight: '',
    temp: '', bpSystolic: '', bpDiastolic: '', heartRate: '', heartRhythm: '',
    lungRate: '17', lungSound: '',
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
  const [view, setView] = useState<'list' | 'form' | 'print' | 'soap'>('list');
  const [formMode, setFormMode] = useState<'new' | 'edit'>('new');
  const [clinicInfo, setClinicInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSOAPReport, setShowSOAPReport] = useState(false);
  const [showPDFUploader, setShowPDFUploader] = useState(false);

  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { isAdminMode, clearAdminMode } = useAdminMode();

  // 자동 리다이렉트 로직 제거 - 관리자는 URL 파라미터로만 접근

  // 사용자 인증 상태에 따라 데이터 로드
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserData();
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, authLoading]);

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
    
    // 환자 데이터 저장
    try {
      await database.savePatientChart(user.id, data);
      
      // 로컬 상태 업데이트
    const existingPatientIndex = patients.findIndex(p => p.fileNo === data.fileNo);
    let updatedPatients;
    if (existingPatientIndex > -1) {
      updatedPatients = [...patients];
      updatedPatients[existingPatientIndex] = data;
    } else {
      updatedPatients = [...patients, data];
    }
      setPatients(updatedPatients);
    
    setCurrentPatient(data);
    setView('print');
    } catch (error) {
      console.error("Failed to save patient record:", error);
    }
  };

  const handleNewPatient = () => {
    setCurrentPatient(getNewPatientState('new', clinicInfo));
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
        await database.deletePatientChart(user.id, chart.id);
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
        // 최근 차트 정보를 기반으로 새로운 follow-up 차트 생성
        const followUpChart: PatientData = {
          ...latestChart,
          chartType: 'follow-up',
          date: new Date().toISOString().split('T')[0], // 오늘 날짜로 변경
          // Chief Complaint는 초기화 (새로운 방문이므로)
          chiefComplaint: {
            ...latestChart.chiefComplaint,
            remark: '', // Follow-up Notes는 비워둠
            presentIllness: '', // HPI는 새로 작성
          },
          // Respond to Care는 초기화
          respondToCare: {
            status: '',
            improvedDays: '',
            notes: '',
          },
          // 진단 및 치료는 초기화 (새로운 평가 필요)
          diagnosisAndTreatment: {
            ...latestChart.diagnosisAndTreatment,
            eightPrinciples: { exteriorInterior: '', heatCold: '', excessDeficient: '', yangYin: '' },
            etiology: '',
            tcmDiagnosis: '',
            treatmentPrinciple: '',
            acupunctureMethod: [],
            acupunctureMethodOther: '',
            acupuncturePoints: '',
            herbalTreatment: '',
            selectedTreatment: [],
            otherTreatmentText: '',
            icd: '',
            cpt: '99212, 97813, 97814', // Follow-up CPT 코드
          },
          // Vital signs는 초기화 (새로 측정)
          temp: '',
          bpSystolic: '',
          bpDiastolic: '',
          heartRate: '',
          heartRhythm: '',
          lungRate: latestChart.lungRate || '17',
          lungSound: '',
          // Review of Systems는 이전 차트 정보 유지 (크게 변하지 않으므로)
          // Tongue와 Pulse는 초기화 (새로 진단)
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
        };
        
        setCurrentPatient(followUpChart);
      } else {
        // 차트가 없으면 기본 follow-up 차트 생성
        const baseFollowUp = getNewPatientState('follow-up', clinicInfo);
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
        });
      }
    } catch (error) {
      console.error('이전 차트 불러오기 실패:', error);
      // 에러 발생 시 기본 follow-up 차트 생성
      const baseFollowUp = getNewPatientState('follow-up', clinicInfo);
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

  const handleDeletePatient = async (fileNo: string) => {
    if (!user) return;
    
    if (window.confirm(`Are you sure you want to delete patient record ${fileNo}? This action cannot be undone.`)) {
      try {
        await database.deletePatientChart(user.id, fileNo);
        const updatedPatients = patients.filter(p => p.fileNo !== fileNo);
        setPatients(updatedPatients);
      } catch (error) {
        console.error("Failed to delete patient record:", error);
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

  const handleSOAPReport = (patient: PatientData) => {
    setCurrentPatient(patient);
    setShowSOAPReport(true);
  };

  const handleCloseSOAPReport = () => {
    setShowSOAPReport(false);
    setCurrentPatient(null);
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
      case 'list':
      default:
        return <PatientList 
                    patients={patients} 
                    onSelectPatient={handleSelectPatient} 
                    onNewPatient={handleNewPatient} 
                    onDeletePatient={handleDeletePatient} 
                    onStartFollowUp={handleNewFollowUpChart}
                    onStartFollowUpFromPDF={handleStartFollowUpFromPDF}
                    onSOAPReport={handleSOAPReport}
                    onClearSampleData={clearSampleData}
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

  // 관리자 대시보드 모드
  if (isAuthenticated && isAdminMode) {
    return <AdminRoute isAuthenticated={isAuthenticated} isAdminMode={isAdminMode} />;
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
            <p className="text-sm text-gray-600">환영합니다, {user?.therapistName}님</p>
            <p className="text-xs text-gray-500">{user?.clinicName}</p>
            <button
              onClick={() => {
                clearAdminMode();
                localStorage.removeItem('adminRedirected');
                logout();
              }}
              className="mt-2 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>
      
      <main>
        {renderView()}
      </main>
      
      {/* SOAP Report Modal */}
      {showSOAPReport && currentPatient && (
        <SOAPReport 
          data={currentPatient} 
          onClose={handleCloseSOAPReport} 
        />
      )}

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