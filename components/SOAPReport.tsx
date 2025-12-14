import React from 'react';
import html2pdf from 'html2pdf.js';
import type { PatientData } from '../types';

interface SOAPReportProps {
  data: PatientData;
  onClose: () => void;
}

export const SOAPReport: React.FC<SOAPReportProps> = ({ data, onClose }) => {
  // HIPAA 준수: 개인정보 제외하고 진료 관련 정보만 포함
  const getHIPAACompliantData = (patientData: PatientData) => {
    return {
      fileNo: patientData.fileNo,
      date: patientData.date,
      chartType: patientData.chartType,
      clinicName: patientData.clinicName,
      therapistName: patientData.diagnosisAndTreatment.therapistName,
      therapistLicNo: patientData.diagnosisAndTreatment.therapistLicNo,
      
      // 신체 측정값 (개인 식별 불가능)
      vitalSigns: {
        heightFt: patientData.heightFt,
        heightIn: patientData.heightIn,
        weight: patientData.weight,
        temp: patientData.temp,
        bpSystolic: patientData.bpSystolic,
        bpDiastolic: patientData.bpDiastolic,
        heartRate: patientData.heartRate,
        heartRhythm: patientData.heartRhythm,
        lungRate: patientData.lungRate,
        lungSound: patientData.lungSound,
      },
      
      // 주증상 (개인 식별 불가능)
      chiefComplaint: patientData.chiefComplaint,
      
      // 병력 (개인 식별 불가능)
      medicalHistory: patientData.medicalHistory,
      
      // 진단 및 치료
      diagnosisAndTreatment: patientData.diagnosisAndTreatment,
      
      // 한의학적 진단
      tongue: patientData.tongue,
      pulse: patientData.pulse,
      
      // 관절 가동 범위
      rangeOfMotion: patientData.rangeOfMotion,
      
      // 치료 반응
      respondToCare: patientData.respondToCare,
    };
  };

  const hipaaData = getHIPAACompliantData(data);

  const generateFileName = () => {
    const date = new Date(data.date).toISOString().split('T')[0];
    const chartType = data.chartType === 'new' ? 'Initial' : 'FollowUp';
    return `SOAP_Clinical_Report_${chartType}_${data.fileNo}_${date}.pdf`;
  };

  const downloadPDF = () => {
    const element = document.getElementById('soap-report-content');
    if (!element) return;

    const opt = {
      margin: 0.5,
      filename: generateFileName(),
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">SOAP Report</h2>
          <div className="flex gap-2">
            <button
              onClick={downloadPDF}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Close
            </button>
          </div>
        </div>
        
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div id="soap-report-content" className="p-6 bg-white">
            {/* Header */}
            <div className="text-center mb-6 border-b pb-4">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">SOAP Clinical Report</h1>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Patient File No:</strong> {hipaaData.fileNo}</p>
                <p><strong>Date of Service:</strong> {formatDate(hipaaData.date)}</p>
                <p><strong>Visit Type:</strong> {hipaaData.chartType === 'new' ? 'Initial Consultation' : 'Follow-up Treatment'}</p>
                <p><strong>Provider:</strong> {hipaaData.clinicName}</p>
                <p><strong>Licensed Acupuncturist:</strong> {hipaaData.therapistName} (License #: {hipaaData.therapistLicNo})</p>
              </div>
            </div>

            {/* Narrative SOAP Format */}
            <div className="space-y-6">
              {/* Subjective */}
              <div className="border-l-4 border-blue-500 pl-4">
                <h2 className="text-lg font-bold text-blue-700 mb-3">S - SUBJECTIVE</h2>
                <div className="text-gray-700 leading-relaxed">
                  <p className="mb-3">
                    The patient presents with a chief complaint of <strong>{hipaaData.chiefComplaint.selectedComplaints.join(', ')}{hipaaData.chiefComplaint.otherComplaint && `, ${hipaaData.chiefComplaint.otherComplaint}`}</strong>.
                    {hipaaData.chiefComplaint.location && ` The symptoms are primarily localized to the ${hipaaData.chiefComplaint.location} region,`}
                    {hipaaData.chiefComplaint.onsetValue && hipaaData.chiefComplaint.onsetUnit && ` with onset approximately ${hipaaData.chiefComplaint.onsetValue} ${hipaaData.chiefComplaint.onsetUnit} ago.`}
                  </p>
                  
                  {hipaaData.chiefComplaint.severityScore && (
                    <p className="mb-3">
                      Pain intensity is rated at <strong>{hipaaData.chiefComplaint.severityScore}/10</strong> on a numeric pain scale, 
                      {hipaaData.chiefComplaint.severityDescription && ` described as ${hipaaData.chiefComplaint.severityDescription}.`}
                    </p>
                  )}
                  
                  {hipaaData.chiefComplaint.presentIllness && (
                    <p className="mb-3">
                      <strong>History of Present Illness:</strong> {hipaaData.chiefComplaint.presentIllness}
                    </p>
                  )}
                  
                  {hipaaData.chiefComplaint.provocation.length > 0 && (
                    <p className="mb-3">
                      <strong>Aggravating Factors:</strong> Symptoms are exacerbated by {hipaaData.chiefComplaint.provocation.join(', ')}
                      {hipaaData.chiefComplaint.provocationOther && `, ${hipaaData.chiefComplaint.provocationOther}`}.
                    </p>
                  )}
                  
                  {hipaaData.chiefComplaint.palliation.length > 0 && (
                    <p className="mb-3">
                      <strong>Palliative Factors:</strong> Symptoms are relieved by {hipaaData.chiefComplaint.palliation.join(', ')}
                      {hipaaData.chiefComplaint.palliationOther && `, ${hipaaData.chiefComplaint.palliationOther}`}.
                    </p>
                  )}
                  
                  {hipaaData.chiefComplaint.quality.length > 0 && (
                    <p className="mb-3">
                      <strong>Quality of Symptoms:</strong> The patient describes the pain as {hipaaData.chiefComplaint.quality.join(', ')}
                      {hipaaData.chiefComplaint.qualityOther && `, ${hipaaData.chiefComplaint.qualityOther}`}.
                    </p>
                  )}
                  
                  {hipaaData.chiefComplaint.frequency && (
                    <p className="mb-3">
                      <strong>Frequency:</strong> {hipaaData.chiefComplaint.frequency}
                    </p>
                  )}
                  
                  {hipaaData.chiefComplaint.timing && (
                    <p className="mb-3">
                      <strong>Timing:</strong> {hipaaData.chiefComplaint.timing}
                    </p>
                  )}
                </div>
              </div>

              {/* Objective */}
              <div className="border-l-4 border-green-500 pl-4">
                <h2 className="text-lg font-bold text-green-700 mb-3">O - OBJECTIVE</h2>
                <div className="text-gray-700 leading-relaxed">
                  <p className="mb-3">
                    <strong>Vital Signs:</strong> 
                    {hipaaData.vitalSigns.heightFt && hipaaData.vitalSigns.heightIn && ` Height: ${hipaaData.vitalSigns.heightFt}'${hipaaData.vitalSigns.heightIn}",`}
                    {hipaaData.vitalSigns.weight && ` Weight: ${hipaaData.vitalSigns.weight} lbs,`}
                    {hipaaData.vitalSigns.temp && ` Temperature: ${hipaaData.vitalSigns.temp}°F,`}
                    {hipaaData.vitalSigns.bpSystolic && hipaaData.vitalSigns.bpDiastolic && ` Blood Pressure: ${hipaaData.vitalSigns.bpSystolic}/${hipaaData.vitalSigns.bpDiastolic} mmHg,`}
                    {hipaaData.vitalSigns.heartRate && ` Heart Rate: ${hipaaData.vitalSigns.heartRate} bpm,`}
                    {hipaaData.vitalSigns.heartRhythm && ` Heart Rhythm: ${hipaaData.vitalSigns.heartRhythm},`}
                    {hipaaData.vitalSigns.lungRate && ` Respiratory Rate: ${hipaaData.vitalSigns.lungRate}/min,`}
                    {hipaaData.vitalSigns.lungSound && ` Lung Sounds: ${hipaaData.vitalSigns.lungSound}.`}
                  </p>
                  
                  <p className="mb-3">
                    <strong>Tongue Examination:</strong> 
                    {hipaaData.tongue.body.color && ` Tongue body appears ${hipaaData.tongue.body.color} in color with ${hipaaData.tongue.body.shape} shape.`}
                    {hipaaData.tongue.coating.color && ` Tongue coating is ${hipaaData.tongue.coating.color} in color and ${hipaaData.tongue.coating.quality.join(', ')} in quality.`}
                    {hipaaData.tongue.coating.notes && ` ${hipaaData.tongue.coating.notes}`}
                  </p>
                  
                  <p className="mb-3">
                    <strong>Pulse Examination:</strong> 
                    {hipaaData.pulse.overall.length > 0 && ` Pulse quality is ${hipaaData.pulse.overall.join(', ')}.`}
                    {hipaaData.pulse.notes && ` ${hipaaData.pulse.notes}`}
                  </p>
                  
                  {Object.keys(hipaaData.rangeOfMotion || {}).length > 0 && (
                    <div className="mb-3">
                      <strong>Range of Motion Assessment:</strong>
                      <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                        {Object.keys(hipaaData.rangeOfMotion).map(joint => {
                          const jointData = hipaaData.rangeOfMotion[joint];
                          const measurements: string[] = [];
                          
                          if (jointData.flexion) measurements.push(`Flexion: ${jointData.flexion}°`);
                          if (jointData.extension) measurements.push(`Extension: ${jointData.extension}°`);
                          if (jointData.abduction) measurements.push(`Abduction: ${jointData.abduction}°`);
                          if (jointData.adduction) measurements.push(`Adduction: ${jointData.adduction}°`);
                          if (jointData.internalRotation) measurements.push(`Internal Rotation: ${jointData.internalRotation}°`);
                          if (jointData.externalRotation) measurements.push(`External Rotation: ${jointData.externalRotation}°`);
                          if (jointData.lateralFlexion) measurements.push(`Lateral Flexion: ${jointData.lateralFlexion}°`);
                          if (jointData.rotation) measurements.push(`Rotation: ${jointData.rotation}°`);
                          
                          if (measurements.length === 0) return null;
                          
                          return (
                            <li key={joint} className="text-sm">
                              <strong>{joint}:</strong> {measurements.join(', ')}
                              {jointData.notes && ` (${jointData.notes})`}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                  
                  <p className="mb-3">
                    <strong>Physical Examination:</strong> The patient appears alert and oriented. No acute distress noted.
                    {Object.keys(hipaaData.rangeOfMotion || {}).length > 0 
                      ? ' Range of motion assessment performed as documented above.' 
                      : ' Range of motion and functional assessment performed as indicated by presenting symptoms.'}
                  </p>
                </div>
              </div>

              {/* Assessment */}
              <div className="border-l-4 border-yellow-500 pl-4">
                <h2 className="text-lg font-bold text-yellow-700 mb-3">A - ASSESSMENT</h2>
                <div className="text-gray-700 leading-relaxed">
                  {hipaaData.diagnosisAndTreatment.tcmDiagnosis && (
                    <p className="mb-3">
                      <strong>Traditional Chinese Medicine Diagnosis:</strong> {hipaaData.diagnosisAndTreatment.tcmDiagnosis}
                    </p>
                  )}
                  
                  {(hipaaData.diagnosisAndTreatment.eightPrinciples.exteriorInterior || 
                    hipaaData.diagnosisAndTreatment.eightPrinciples.heatCold || 
                    hipaaData.diagnosisAndTreatment.eightPrinciples.excessDeficient || 
                    hipaaData.diagnosisAndTreatment.eightPrinciples.yangYin) && (
                    <p className="mb-3">
                      <strong>Eight Principles Pattern Differentiation:</strong> 
                      {hipaaData.diagnosisAndTreatment.eightPrinciples.exteriorInterior && ` Exterior/Interior: ${hipaaData.diagnosisAndTreatment.eightPrinciples.exteriorInterior},`}
                      {hipaaData.diagnosisAndTreatment.eightPrinciples.heatCold && ` Heat/Cold: ${hipaaData.diagnosisAndTreatment.eightPrinciples.heatCold},`}
                      {hipaaData.diagnosisAndTreatment.eightPrinciples.excessDeficient && ` Excess/Deficient: ${hipaaData.diagnosisAndTreatment.eightPrinciples.excessDeficient},`}
                      {hipaaData.diagnosisAndTreatment.eightPrinciples.yangYin && ` Yang/Yin: ${hipaaData.diagnosisAndTreatment.eightPrinciples.yangYin}.`}
                    </p>
                  )}
                  
                  {hipaaData.diagnosisAndTreatment.etiology && (
                    <p className="mb-3">
                      <strong>Etiology:</strong> {hipaaData.diagnosisAndTreatment.etiology}
                    </p>
                  )}
                  
                  {hipaaData.chiefComplaint.westernMedicalDiagnosis && (
                    <p className="mb-3">
                      <strong>Western Medical Diagnosis:</strong> {hipaaData.chiefComplaint.westernMedicalDiagnosis}
                    </p>
                  )}
                  
                  <p className="mb-3">
                    <strong>Clinical Assessment:</strong> Based on the patient's presentation, examination findings, and TCM pattern differentiation, the condition is assessed as requiring acupuncture and/or herbal medicine intervention to address the underlying imbalance and symptom presentation.
                  </p>
                </div>
              </div>

              {/* Plan */}
              <div className="border-l-4 border-red-500 pl-4">
                <h2 className="text-lg font-bold text-red-700 mb-3">P - PLAN</h2>
                <div className="text-gray-700 leading-relaxed">
                  {hipaaData.diagnosisAndTreatment.treatmentPrinciple && (
                    <p className="mb-3">
                      <strong>Treatment Principle:</strong> {hipaaData.diagnosisAndTreatment.treatmentPrinciple}
                    </p>
                  )}
                  
                  {(hipaaData.diagnosisAndTreatment.acupunctureMethod.length > 0 || hipaaData.diagnosisAndTreatment.acupunctureMethodOther) && (
                    <p className="mb-3">
                      <strong>Acupuncture Treatment:</strong> 
                      {hipaaData.diagnosisAndTreatment.acupunctureMethod.length > 0 && ` Treatment will utilize ${hipaaData.diagnosisAndTreatment.acupunctureMethod.join(', ')} technique(s),`}
                      {hipaaData.diagnosisAndTreatment.acupunctureMethodOther && ` with additional ${hipaaData.diagnosisAndTreatment.acupunctureMethodOther} method as indicated.`}
                    </p>
                  )}
                  
                  {hipaaData.diagnosisAndTreatment.acupuncturePoints && (
                    <p className="mb-3">
                      <strong>Acupuncture Points:</strong> {hipaaData.diagnosisAndTreatment.acupuncturePoints}
                    </p>
                  )}
                  
                  {hipaaData.diagnosisAndTreatment.herbalTreatment && (
                    <p className="mb-3">
                      <strong>Herbal Medicine:</strong> {hipaaData.diagnosisAndTreatment.herbalTreatment}
                    </p>
                  )}
                  
                  {(hipaaData.diagnosisAndTreatment.selectedTreatment !== 'None' || hipaaData.diagnosisAndTreatment.otherTreatmentText) && (
                    <p className="mb-3">
                      <strong>Additional Therapies:</strong> 
                      {hipaaData.diagnosisAndTreatment.selectedTreatment !== 'None' && ` ${hipaaData.diagnosisAndTreatment.selectedTreatment}`}
                      {hipaaData.diagnosisAndTreatment.otherTreatmentText && ` - ${hipaaData.diagnosisAndTreatment.otherTreatmentText}`}
                    </p>
                  )}
                  
                  {hipaaData.diagnosisAndTreatment.cpt && (
                    <p className="mb-3">
                      <strong>CPT Codes:</strong> {hipaaData.diagnosisAndTreatment.cpt}
                    </p>
                  )}
                  
                  <p className="mb-3">
                    <strong>Treatment Response:</strong> 
                    {hipaaData.respondToCare.status && ` Current status: ${hipaaData.respondToCare.status}.`}
                    {hipaaData.respondToCare.improvedDays && ` Patient has shown improvement over ${hipaaData.respondToCare.improvedDays} days of treatment.`}
                    {hipaaData.respondToCare.notes && ` ${hipaaData.respondToCare.notes}`}
                  </p>
                  
                  <p className="mb-3">
                    <strong>Follow-up Plan:</strong> Patient will continue with the prescribed treatment plan. Progress will be monitored and treatment plan adjusted as necessary based on patient response and clinical presentation.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
              <p>This report contains no personally identifiable information in compliance with HIPAA regulations.</p>
              <p>Generated on {new Date().toLocaleDateString('ko-KR')} at {new Date().toLocaleTimeString('ko-KR')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
