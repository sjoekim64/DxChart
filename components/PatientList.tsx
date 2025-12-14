
import React, { useState } from 'react';
import type { PatientData } from '../types.ts';

interface PatientListProps {
  patients: PatientData[];
  onSelectPatient: (patient: PatientData) => void;
  onNewPatient: () => void;
  onStartFollowUp: (selectedPatient: PatientData) => void;
  onStartFollowUpFromPDF: () => void;
  onDeletePatient: (fileNo: string) => void;
  onSOAPReport: (patient: PatientData) => void;
  onClearSampleData?: () => void;
}

export const PatientList: React.FC<PatientListProps> = ({ patients, onSelectPatient, onNewPatient, onStartFollowUp, onStartFollowUpFromPDF, onDeletePatient, onSOAPReport, onClearSampleData }) => {
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);

  const handleStartFollowUp = () => {
    if (patients.length === 0) {
      alert('환자 데이터가 없습니다. 먼저 신규 환자를 등록해주세요.');
      return;
    }
    setShowFollowUpModal(true);
  };

  const handleSelectPatientForFollowUp = (patient: PatientData) => {
    setShowFollowUpModal(false);
    onStartFollowUp(patient);
  };

  // fileNo별로 그룹화하여 각 환자의 최신 차트만 표시
  const uniquePatients = patients.reduce((acc, patient) => {
    const existing = acc.find(p => p.fileNo === patient.fileNo);
    if (!existing || new Date(patient.date) > new Date(existing.date)) {
      if (existing) {
        const index = acc.indexOf(existing);
        acc[index] = patient;
      } else {
        acc.push(patient);
      }
    }
    return acc;
  }, [] as PatientData[]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
      <div className="border-b pb-4 mb-6 text-center">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Patient Management</h2>
        <div className="flex justify-center space-x-4 flex-wrap gap-2">
          <button
            onClick={onNewPatient}
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            Register New Patient
          </button>
          <button
            onClick={handleStartFollowUp}
            className="px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg shadow-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors duration-200"
          >
            Create Follow-up Chart
          </button>
          <button
            onClick={onStartFollowUpFromPDF}
            className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
          >
            Load from PDF
          </button>
          {onClearSampleData && (
            <button
              onClick={onClearSampleData}
              className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
            >
              Clear Sample Data
            </button>
          )}
        </div>
      </div>
      
      {patients.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No patient records found. Click "Add New Patient" to get started.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {uniquePatients.sort((a, b) => (a.name || a.fileNo).localeCompare(b.name || b.fileNo)).map((patient) => (
            <li key={patient.fileNo} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between">
              <div className="mb-4 sm:mb-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-lg font-medium text-indigo-600">{patient.name || `Patient (${patient.fileNo})`}</p>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    patient.chartType === 'new' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {patient.chartType === 'new' ? '신규환자' : '재방문환자'}
                  </span>
                </div>
                <p className="text-sm text-gray-500">File No: {patient.fileNo} | DOB: {patient.dob || 'N/A'}</p>
              </div>
              <div className="flex-shrink-0 flex space-x-2">
                <button
                  onClick={() => onSelectPatient(patient)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors duration-200 text-sm"
                >
                  View / Edit
                </button>
                <button
                  onClick={() => onSOAPReport(patient)}
                  className="px-4 py-2 bg-blue-100 text-blue-700 font-semibold rounded-lg hover:bg-blue-200 transition-colors duration-200 text-sm"
                >
                  SOAP Report
                </button>
                <button
                  onClick={(e) => {
                      e.stopPropagation();
                      onDeletePatient(patient.fileNo);
                  }}
                  className="px-4 py-2 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 transition-colors duration-200 text-sm"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Follow-up 환자 선택 모달 */}
      {showFollowUpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-800">Follow-up 차트를 작성할 환자를 선택하세요</h3>
              <p className="text-sm text-gray-600 mt-1">선택한 환자의 최근 차트 정보가 기본값으로 불러와집니다.</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {uniquePatients.length === 0 ? (
                <p className="text-center text-gray-500 py-8">환자 데이터가 없습니다.</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {uniquePatients.sort((a, b) => (a.name || a.fileNo).localeCompare(b.name || b.fileNo)).map((patient) => (
                    <li key={patient.fileNo} className="py-3 hover:bg-gray-50 cursor-pointer" onClick={() => handleSelectPatientForFollowUp(patient)}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-medium text-indigo-600">{patient.name || `Patient (${patient.fileNo})`}</p>
                          <p className="text-sm text-gray-500">File No: {patient.fileNo} | DOB: {patient.dob || 'N/A'} | 최근 방문일: {patient.date || 'N/A'}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectPatientForFollowUp(patient);
                          }}
                          className="px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors duration-200 text-sm"
                        >
                          선택
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="p-4 border-t flex justify-end">
              <button
                onClick={() => setShowFollowUpModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors duration-200"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};