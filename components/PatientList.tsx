
import React, { useState } from 'react';
import type { PatientData } from '../types.ts';

interface PatientListProps {
  patients: PatientData[];
  onSelectPatient: (patient: PatientData) => void;
  onNewPatient: () => void;
  onStartFollowUp: (selectedPatient: PatientData) => void;
  onStartFollowUpFromScratch: () => void;
  onStartFollowUpFromPDF: () => void;
  onDeletePatient: (fileNo: string, date: string) => void;
  onClearSampleData?: () => void;
  onViewPatient?: (patient: PatientData) => void;
}

export const PatientList: React.FC<PatientListProps> = ({ patients, onSelectPatient, onNewPatient, onStartFollowUp, onStartFollowUpFromScratch, onStartFollowUpFromPDF, onDeletePatient, onClearSampleData, onViewPatient, onCreateSample100106 }) => {
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const patientsPerPage = 15;

  const formatName = (name: string) => {
    const parts = name?.trim().split(/\s+/).filter(Boolean) || [];
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].toUpperCase();
    const last = parts.pop() as string;
    const first = parts.join(' ');
    return `${last.toUpperCase()}, ${first}`;
  };

  const handleStartFollowUp = () => {
    setShowFollowUpModal(true);
  };

  const handleSelectPatientForFollowUp = (patient: PatientData) => {
    setShowFollowUpModal(false);
    onStartFollowUp(patient);
  };

  const handleViewClick = (patient: PatientData) => {
    // 원래 차트를 그대로 보기만 함 (수정 불가)
    if (onViewPatient) {
      onViewPatient(patient);
    } else {
      onSelectPatient(patient);
    }
  };

  const handleEditClick = (patient: PatientData) => {
    // 해당 차트를 기반으로 새로운 Follow-up 차트 생성
    // 원래 차트는 그대로 두고, 새로운 Follow-up 차트로 열림
    onStartFollowUp(patient);
  };

  // 모든 차트를 표시 (같은 환자가 여러 번 방문하면 여러 개 표시)
  // 검색 및 정렬 적용
  const filteredPatients = patients
    .filter((patient) => {
      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;
      const fileMatch = patient.fileNo?.toLowerCase().includes(query);
      const rawName = (patient.name || '').toLowerCase();
      const formattedName = formatName(patient.name || '').toLowerCase();
      return fileMatch || rawName.includes(query) || formattedName.includes(query);
    })
    .sort((a, b) => {
      // 먼저 방문일로 정렬 (최신순)
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      if (dateA !== dateB) {
        return dateB - dateA; // 최신순 (내림차순)
      }
      // 같은 날짜면 fileNo로 정렬 (숫자 순서)
      const fileNoA = parseInt(a.fileNo || '0', 10) || 0;
      const fileNoB = parseInt(b.fileNo || '0', 10) || 0;
      return fileNoA - fileNoB;
    });

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / patientsPerPage) || 1);
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * patientsPerPage;
  const paginatedPatients = filteredPatients.slice(startIndex, startIndex + patientsPerPage);

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
          {onCreateSample100106 && (
            <button
              onClick={onCreateSample100106}
              className="px-6 py-3 bg-yellow-600 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors duration-200"
            >
              Create Sample 100106
            </button>
          )}
        </div>
      </div>
      
      {patients.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No patient records found. Click "Add New Patient" to get started.</p>
      ) : (
        <div className="overflow-x-auto">
          {/* Search bar */}
          <div className="flex justify-between items-center mb-3 gap-2 flex-wrap">
            <label className="text-sm text-gray-700">
              Search by File No. or Name:
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              placeholder="e.g., 0001, KIM, JOHN"
            />
          </div>
          <div className="grid grid-cols-[1fr_1.2fr_2fr_1fr_1fr_1fr] text-sm font-semibold text-gray-700 border-b pb-2 mb-2">
            <span>Visiting Date</span>
            <span>File No.</span>
            <span>Patient Name</span>
            <span>View/Edit</span>
            <span>Add</span>
            <span>Delete</span>
          </div>
          <div className="divide-y divide-gray-200">
            {paginatedPatients.map((patient, index) => {
                const nameFormatted = formatName(patient.name || '') || `PATIENT ${patient.fileNo}`;
                // 같은 fileNo와 date 조합으로 고유 키 생성
                const uniqueKey = `${patient.fileNo}-${patient.date}-${index}`;
                return (
                  <div key={uniqueKey} className="grid grid-cols-[1fr_1.2fr_2fr_1fr_1fr_1fr] items-center py-3 text-sm">
                    <span className="font-medium">{patient.date || 'N/A'}</span>
                    <span className="font-medium text-indigo-700">{patient.fileNo}</span>
                    <span className="truncate">{nameFormatted}</span>
                    <button
                      onClick={() => handleViewClick(patient)}
                      className="px-3 py-1 bg-blue-200 text-blue-800 font-semibold rounded-lg hover:bg-blue-300 transition-colors duration-200 text-xs"
                    >
                      View/Edit
                    </button>
                    <button
                      onClick={() => handleEditClick(patient)}
                      className="px-3 py-1 bg-teal-200 text-teal-800 font-semibold rounded-lg hover:bg-teal-300 transition-colors duration-200 text-xs"
                    >
                      Add
                    </button>
                    <button
                      onClick={(e) => {
                          e.stopPropagation();
                          // 특정 차트를 삭제하기 위해 fileNo와 date를 모두 전달
                          onDeletePatient(patient.fileNo, patient.date);
                      }}
                      className="px-3 py-1 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 transition-colors duration-200 text-xs"
                    >
                      Delete
                    </button>
                  </div>
                );
              })}
          </div>
          {/* Pagination controls */}
          <div className="flex justify-between items-center mt-4 text-sm text-gray-700">
            <span>
              Page {safeCurrentPage} of {totalPages} (Total: {filteredPatients.length})
            </span>
            <div className="space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={safeCurrentPage === 1}
                className={`px-3 py-1 rounded-md border text-xs ${
                  safeCurrentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={safeCurrentPage === totalPages}
                className={`px-3 py-1 rounded-md border text-xs ${
                  safeCurrentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Follow-up 환자 선택 모달 */}
      {showFollowUpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-800">Follow-up 차트 작성 방법 선택</h3>
              <p className="text-sm text-gray-600 mt-1">기존 환자를 선택하거나 새로운 follow-up 차트를 처음부터 작성할 수 있습니다.</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="mb-6 pb-6 border-b">
                <button
                  onClick={() => {
                    setShowFollowUpModal(false);
                    onStartFollowUpFromScratch();
                  }}
                  className="w-full px-6 py-4 bg-teal-600 text-white font-semibold rounded-lg shadow-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors duration-200"
                >
                  새로운 Follow-up 차트 작성 (처음부터)
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">환자 데이터가 없어도 처음부터 follow-up 차트를 작성할 수 있습니다.</p>
              </div>
              {patients.length === 0 ? (
                <p className="text-center text-gray-500 py-8">기존 환자 데이터가 없습니다. 위의 버튼을 사용하여 새로운 follow-up 차트를 작성하세요.</p>
              ) : (
                <>
                  <h4 className="text-lg font-medium text-gray-700 mb-4">기존 환자 선택</h4>
                <ul className="divide-y divide-gray-200">
                  {patients
                    .reduce((acc, patient) => {
                      // fileNo별로 그룹화하여 각 환자의 최신 차트만 표시 (모달에서는)
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
                    }, [] as PatientData[])
                    .sort((a, b) => (a.name || a.fileNo).localeCompare(b.name || b.fileNo)).map((patient) => (
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
                </>
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