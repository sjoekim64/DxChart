
import React from 'react';
import type { PatientData } from '../types.ts';
import html2pdf from 'html2pdf.js';

interface PrintableViewProps {
  data: PatientData;
  onEdit: () => void;
  onGoToList: () => void;
}

const DataCell: React.FC<{ label: string; value: React.ReactNode; className?: string; }> = ({ label, value, className = '' }) => (
  <div className={`flex border-b border-black ${className}`}>
    <div className={`w-1/3 font-bold p-1.5 text-sm border-r border-black bg-slate-50 flex items-center`}>{label}</div>
    <div className={`w-2/3 p-1.5 text-sm flex items-center`}>{value || <span>&nbsp;</span>}</div>
  </div>
);

const VitalsCell: React.FC<{ label: string; value: string; unit: string; className?: string }> = ({ label, value, unit, className='' }) => (
    <div className={`flex items-baseline p-1.5 ${className}`}>
        <span className="font-bold mr-2 text-sm">{label}</span>
        <span className="flex-grow border-b border-dotted border-gray-400 text-center text-sm">{value || <>&nbsp;</>}</span>
        <span className="ml-2 text-sm text-gray-600">{unit}</span>
    </div>
);

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <div className="bg-gray-300 text-center font-bold p-1.5 text-sm border-b-2 border-black">
    {title}
  </div>
);

const PairedComplaintRow: React.FC<{ item1: {label: string, value: React.ReactNode}, item2: {label: string, value: React.ReactNode} }> = ({ item1, item2 }) => (
    <div className="grid grid-cols-2 border-b border-black">
      <div className="grid grid-cols-[150px_1fr] border-r border-black">
         <div className="font-bold p-1.5 border-r border-black bg-slate-50 flex items-center justify-center text-sm">{item1.label}</div>
         <div className="p-1.5 break-words min-w-0 flex items-center text-sm">{item1.value || <span className="text-gray-400">N/A</span>}</div>
      </div>
      <div className="grid grid-cols-[150px_1fr]">
         <div className="font-bold p-1.5 border-r border-black bg-slate-50 flex items-center justify-center text-sm">{item2.label}</div>
         <div className="p-1.5 break-words min-w-0 flex items-center text-sm">{item2.value || <span className="text-gray-400">N/A</span>}</div>
      </div>
    </div>
);

const SingleComplaintRow: React.FC<{ label: string; value: React.ReactNode; }> = ({ label, value }) => (
    <div className="grid grid-cols-[150px_1fr] border-b border-black">
        <div className="font-bold p-1.5 border-r border-black bg-slate-50 flex items-center justify-center text-sm">{label}</div>
        <div className="p-1.5 break-words min-w-0 flex items-center text-sm">{value || <span className="text-gray-400">N/A</span>}</div>
    </div>
);


const FullWidthRow: React.FC<{ label: string; value: React.ReactNode; isLast?: boolean; preserveNewlines?: boolean }> = ({ label, value, isLast=false, preserveNewlines=false }) => (
    <div className={`grid grid-cols-[200px_1fr] ${!isLast ? 'border-b border-black' : ''}`}>
        <div className="font-bold p-1.5 border-r border-black bg-slate-50 flex items-center justify-center text-sm">{label}</div>
        <div className={`p-1.5 break-words min-w-0 text-sm ${preserveNewlines ? 'whitespace-pre-line' : ''}`}>{value || <span className="text-gray-400">N/A</span>}</div>
    </div>
);

// SOAP Modal removed - will be in premium version
/*const SoapModal: React.FC<{ content: string; onClose: () => void; }> = ({ content, onClose }) => {
    const [copySuccess, setCopySuccess] = useState('');

    const copyToClipboard = () => {
        navigator.clipboard.writeText(content).then(() => {
            setCopySuccess('Copied!');
            setTimeout(() => setCopySuccess(''), 2000); // Reset message after 2 seconds
        }, () => {
            setCopySuccess('Failed to copy.');
            setTimeout(() => setCopySuccess(''), 2000);
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl relative">
                <h3 className="text-2xl font-bold mb-4">Generated SOAP Note</h3>
                <pre className="bg-gray-100 p-4 rounded-md whitespace-pre-wrap font-sans text-sm max-h-[60vh] overflow-y-auto">
                    {content}
                </pre>
                <div className="mt-6 flex justify-end space-x-4">
                    <button
                        onClick={copyToClipboard}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {copySuccess || 'Copy to Clipboard'}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};*/


export const PrintableView: React.FC<PrintableViewProps> = ({ data, onEdit, onGoToList }) => {
  const isFollowUp = data.chartType === 'follow-up';

  const handlePrintPdf = () => {
    const element = document.getElementById('print-area');
    if (!element) {
        console.error('Print area not found');
        return;
    }

    // 파일명 생성: fileNo + visitingDate(YYMMdd) + LN.FN
    const formatFileName = () => {
      const fileNo = data.fileNo || 'UNKNOWN';
      
      // 날짜를 YYMMdd 형식으로 변환
      let dateStr = '';
      if (data.date) {
        const date = new Date(data.date);
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        dateStr = `${year}${month}${day}`;
      } else {
        dateStr = 'NODATE';
      }
      
      // 이름 파싱: "DOE, John" 형식 또는 "John Doe" 형식
      let lastName = '';
      let firstName = '';
      if (data.name) {
        if (data.name.includes(',')) {
          // "DOE, John" 형식
          const parts = data.name.split(',').map(s => s.trim());
          lastName = parts[0] || '';
          firstName = parts[1] || '';
        } else {
          // "John Doe" 형식
          const parts = data.name.trim().split(/\s+/);
          if (parts.length >= 2) {
            firstName = parts[0] || '';
            lastName = parts[parts.length - 1] || '';
          } else if (parts.length === 1) {
            lastName = parts[0] || '';
          }
        }
      }
      
      // 각각 3글자만 사용 (대문자로)
      const ln = lastName.toUpperCase().substring(0, 3).padEnd(3, 'X');
      const fn = firstName.toUpperCase().substring(0, 3).padEnd(3, 'X');
      
      return `${fileNo}${dateStr}${ln}.${fn}`;
    };

    const fileName = formatFileName();

    // 브라우저 인쇄 기능 사용 (저장 위치 선택 가능, 텍스트 복사 가능한 PDF)
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('팝업이 차단되었습니다. 팝업 차단을 해제하고 다시 시도해주세요.');
        return;
    }

    // 스타일 복사
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(style => style.outerHTML)
      .join('\n');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${fileName}</title>
          ${styles}
          <style>
            @media print {
              @page { margin: 0.25in; }
              body { margin: 0; padding: 0; }
            }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              background: white;
            }
            .print\\:hidden { display: none !important; }
          </style>
        </head>
        <body>
          ${element.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    
    // 파일명을 제목에 설정하여 인쇄 시 파일명으로 제안되도록 함
    setTimeout(() => {
      printWindow.print();
      // 인쇄 다이얼로그에서 "PDF로 저장" 선택 시 파일명이 제안됨
      // (브라우저에 따라 다를 수 있음)
    }, 250);
  };

  const heightValue = [
    data.heightFt ? `${data.heightFt}'` : null,
    data.heightIn ? `${data.heightIn}"` : null,
  ].filter(Boolean).join(' ');

  const allComplaints = [
      ...data.chiefComplaint.selectedComplaints,
      data.chiefComplaint.otherComplaint,
  ].filter(Boolean).join(', ');

  const locationDisplay = [...data.chiefComplaint.locationDetails, data.chiefComplaint.location].filter(Boolean).join(', ');
  const onsetDisplay = data.chiefComplaint.onsetValue ? `${data.chiefComplaint.onsetValue} ${data.chiefComplaint.onsetUnit}` : '';
  const provocationDisplay = [...data.chiefComplaint.provocation, data.chiefComplaint.provocationOther].filter(Boolean).join(', ');
  const palliationDisplay = [...data.chiefComplaint.palliation, data.chiefComplaint.palliationOther].filter(Boolean).join(', ');
  const qualityDisplay = [...data.chiefComplaint.quality, data.chiefComplaint.qualityOther].filter(Boolean).join(', ');
  const causeDisplay = [...data.chiefComplaint.possibleCause, data.chiefComplaint.possibleCauseOther].filter(Boolean).join(', ');
  const severityDisplay = [
      data.chiefComplaint.severityScore ? `P/L= ${data.chiefComplaint.severityScore} / 10` : '',
      data.chiefComplaint.severityDescription
  ].filter(Boolean).join(', ');

  const formatHistory = (items: string[], other: string) => {
    return [...items, other].filter(Boolean).join(', ');
  }

  const pastMedicalHistoryDisplay = formatHistory(data.medicalHistory.pastMedicalHistory, data.medicalHistory.pastMedicalHistoryOther);
  const medicationDisplay = formatHistory(data.medicalHistory.medication, data.medicalHistory.medicationOther);
  const familyHistoryDisplay = formatHistory(data.medicalHistory.familyHistory, data.medicalHistory.familyHistoryOther);
  const allergyDisplay = formatHistory(data.medicalHistory.allergy, data.medicalHistory.allergyOther);

  const ros = data.reviewOfSystems;
  const formatRos = (items: (string | undefined | null)[], other?: string) => [ ...(items || []), other].filter(Boolean).join(', ');

  const renderMenstruation = () => {
    const { menstruation } = ros;
    if (menstruation.status === 'menopause') {
      if (isFollowUp) return 'Menopause';
      return menstruation.menopauseAge ? `Menopause (Age: ${menstruation.menopauseAge})` : 'Menopause';
    }
    if (menstruation.status === 'regular' || menstruation.status === 'irregular') {
      const parts = [
        `Status: ${menstruation.status}`,
        menstruation.lmp ? `LMP: ${menstruation.lmp}` : null,
        menstruation.cycleLength ? `Cycle: ${menstruation.cycleLength}d` : null,
        menstruation.duration ? `Duration: ${menstruation.duration}d` : null,
        `Amount: ${menstruation.amount}`,
        `Color: ${menstruation.color}`,
        `Clots: ${menstruation.clots}`,
        `Pain: ${menstruation.pain}${menstruation.pain === 'yes' ? ` (${menstruation.painDetails || 'N/A'})` : ''}`,
        menstruation.pms.length > 0 ? `PMS: ${menstruation.pms.join(', ')}` : null,
        menstruation.other ? `Other: ${menstruation.other}` : null,
      ].filter(Boolean).join('; ');
      return parts;
    }
    return <span className="text-gray-400">N/A</span>;
  };
  
  const getFormulaName = (treatment: string) => {
      if (!treatment) return <span className="text-gray-400">N/A</span>;
      // Handle "Formula: [Name]" and just "[Name]" from AI or user input
      return treatment.replace(/^Formula:\s*/i, '').split('\n')[0].trim();
  };
  
  const renderCombinedOtherTreatments = () => {
    const { selectedTreatment, otherTreatmentText } = data.diagnosisAndTreatment;
    const treatments = Array.isArray(selectedTreatment) ? selectedTreatment : (selectedTreatment ? [selectedTreatment] : []);
    
    if (!treatments || treatments.length === 0 || (treatments.length === 1 && treatments[0] === 'None')) {
        return 'None';
    }

    const filteredTreatments = treatments.filter(t => t !== 'None');
    if (filteredTreatments.length === 0) {
        return 'None';
    }

    const treatmentLabels = filteredTreatments.map(treatment => {
        if (treatment === 'Auricular Acupuncture') {
            return otherTreatmentText ? `Auricular Acupuncture / Ear Seeds: ${otherTreatmentText}` : 'Auricular Acupuncture / Ear Seeds';
        } else if (treatment === 'Other') {
            return otherTreatmentText ? `Other: ${otherTreatmentText}` : 'Other';
        } else {
            return treatment;
        }
    });
    
    return treatmentLabels.join(', ');
  };

  const renderTongueSection = () => {
    const { body, coating } = data.tongue;
    
    const bodyLocations = body.locations.join(', ');
    const bodyColor = [body.color, ...(body.colorModifiers || [])].filter(Boolean).join(', ');
    const bodyShape = [body.shape, ...(body.shapeModifiers || [])].filter(Boolean).join(', ');

    const bodyDisplay = [
      `Color: ${bodyColor || 'N/A'}`,
      `Shape: ${bodyShape || 'N/A'}`,
      `Locations: ${bodyLocations || 'N/A'}`,
      body.locationComments ? `Comments: ${body.locationComments}` : null
    ].filter(Boolean).join('; ');
    
    const coatingDisplay = [
      `Color: ${coating.color || 'N/A'}`,
      `Quality: ${coating.quality.join(', ') || 'N/A'}`,
      coating.notes ? `Notes: ${coating.notes}` : null
    ].filter(Boolean).join('; ');

    return (
      <>
        <div className="grid grid-cols-[100px_1fr] border-b border-black">
          <div className="font-bold p-1.5 border-r border-black bg-slate-50 flex items-center justify-center text-sm">BODY</div>
          <div className="p-1.5 break-words min-w-0 text-sm">{bodyDisplay}</div>
        </div>
        <div className="grid grid-cols-[100px_1fr]">
          <div className="font-bold p-1.5 border-r border-black bg-slate-50 flex items-center justify-center text-sm">COATING</div>
          <div className="p-1.5 break-words min-w-0 text-sm">{coatingDisplay}</div>
        </div>
      </>
    );
  }
  
  const rosItems: { label: string, value: React.ReactNode }[] = [
      { label: "Cold / Hot", value: formatRos(ros.coldHot.sensation === 'normal' ? [ros.coldHot.sensation] : [ros.coldHot.sensation, ...ros.coldHot.parts], ros.coldHot.other) },
      { label: "Sleep", value: formatRos([...ros.sleep.quality, ...ros.sleep.issues], `${ros.sleep.hours} hrs, ${ros.sleep.other}`) },
      { label: "Sweat", value: ros.sweat.present === 'yes' ? formatRos([ros.sweat.time, ...ros.sweat.parts], ros.sweat.other) : 'No' },
      { label: "Eye", value: formatRos(ros.eye.symptoms, ros.eye.other) },
      { label: "Mouth / Tongue", value: formatRos([ros.mouthTongue.symptoms, ros.mouthTongue.taste], ros.mouthTongue.other) },
      { label: "Throat / Nose", value: formatRos([...ros.throatNose.symptoms, ...ros.throatNose.mucusColor], ros.throatNose.other) },
      { label: "Edema", value: ros.edema.present === 'yes' ? formatRos(ros.edema.parts, ros.edema.other) : 'No' },
      { label: "Drink", value: formatRos([ros.drink.thirsty, ros.drink.preference, ros.drink.amount], ros.drink.other) },
      { label: "Digestion", value: formatRos(ros.digestion.symptoms, ros.digestion.other) },
      { label: "Appetite / Energy", value: `Appetite: ${ros.appetiteEnergy.appetite}, Energy: ${ros.appetiteEnergy.energy}/10 ${ros.appetiteEnergy.other || ''}`.trim() },
      { label: "Urination", value: `Day: ${ros.urine.frequencyDay}, Night: ${ros.urine.frequencyNight}, Amount: ${ros.urine.amount}, Color: ${ros.urine.color}` },
      { label: "Stool", value: `Freq: ${ros.stool.frequencyValue} / ${ros.stool.frequencyUnit}, Form: ${ros.stool.form}, Color: ${ros.stool.color}` },
  ];

  if (data.sex === 'F') {
      rosItems.push({ label: "Menstruation", value: renderMenstruation() });
      rosItems.push({ label: "Discharge", value: ros.discharge.present === 'yes' ? formatRos(ros.discharge.symptoms, ros.discharge.other) : 'No' });
  }

  const renderRespondToCare = () => {
    if (!data.respondToCare || !data.respondToCare.status) return <span className="text-gray-400">N/A</span>;
    const { 
      status, 
      improvedDays, 
      painLevelBefore, 
      painLevelAfter, 
      painLevelCurrent,
      canDriveWithoutPain,
      canSitWithoutPain,
      canSitDuration,
      canStandWithoutPain,
      canStandDuration,
      canWalkWithoutPain,
      canWalkDistance,
      sleepQualityImprovement,
      dailyActivitiesImprovement,
      notes 
    } = data.respondToCare;
    
    const parts: string[] = [];
    
    // Overall status
    parts.push(`Status: ${status}`);
    
    // Improvement duration
    if (status === 'Improved' && improvedDays) {
      parts.push(`Improvement lasted: ${improvedDays} days`);
    }
    
    // Pain levels
    if (painLevelBefore || painLevelAfter || painLevelCurrent) {
      const painParts: string[] = [];
      if (painLevelBefore) painParts.push(`Before: ${painLevelBefore}/10`);
      if (painLevelAfter) painParts.push(`After: ${painLevelAfter}/10`);
      if (painLevelCurrent) painParts.push(`Current: ${painLevelCurrent}/10`);
      if (painParts.length > 0) {
        parts.push(`Pain levels: ${painParts.join(', ')}`);
      }
    }
    
    // Functional activities
    const activities: string[] = [];
    if (canDriveWithoutPain) {
      activities.push(`Drive: ${canDriveWithoutPain}`);
    }
    if (canSitWithoutPain) {
      let sitText = `Sit: ${canSitWithoutPain}`;
      if (canSitDuration) sitText += ` (${canSitDuration})`;
      activities.push(sitText);
    }
    if (canStandWithoutPain) {
      let standText = `Stand: ${canStandWithoutPain}`;
      if (canStandDuration) standText += ` (${canStandDuration})`;
      activities.push(standText);
    }
    if (canWalkWithoutPain) {
      let walkText = `Walk: ${canWalkWithoutPain}`;
      if (canWalkDistance) walkText += ` (${canWalkDistance})`;
      activities.push(walkText);
    }
    if (activities.length > 0) {
      parts.push(`Functional activities: ${activities.join('; ')}`);
    }
    
    // Quality of life
    if (sleepQualityImprovement) {
      parts.push(`Sleep: ${sleepQualityImprovement}`);
    }
    if (dailyActivitiesImprovement) {
      parts.push(`Daily activities: ${dailyActivitiesImprovement}`);
    }
    
    // Notes
    if (notes) {
      parts.push(`Notes: ${notes}`);
    }
    
    return parts.length > 0 ? parts.join(' | ') : 'N/A';
  }

  const renderPulseSection = () => {
    const { pulse } = data;
    if (!pulse) return null;
    return (
        <>
            <div className="grid grid-cols-[150px_1fr] border-b border-black">
                <div className="font-bold p-1.5 border-r border-black bg-slate-50 flex items-center justify-center text-sm">Overall Qualities</div>
                <div className="p-1.5 min-h-[2rem]">
                  {pulse.overall && pulse.overall.length > 0 ? (
                    <div className="flex flex-wrap gap-1 text-xs">
                      {pulse.overall.map((q, idx) => (
                        <span key={`${q}-${idx}`} className="px-2 py-1 bg-gray-100 border border-gray-300 rounded">{q}</span>
                      ))}
                    </div>
                  ) : (
                    <span>&nbsp;</span>
                  )}
                </div>
            </div>
            <div className="grid grid-cols-[150px_1fr]">
                <div className="font-bold p-1.5 border-r border-black bg-slate-50 flex items-center justify-center text-sm">Notes</div>
                <div className="p-1.5 break-words min-w-0 whitespace-pre-wrap text-sm">{pulse.notes || <span>&nbsp;</span>}</div>
            </div>
        </>
    );
};

  const chiefComplaintContent = () => (
    <>
        <div className="flex border-b border-black">
            <div className="grid grid-cols-[150px_1fr] w-full">
                <div className="font-bold p-1.5 border-r border-black bg-gray-300 flex items-center justify-center text-sm">CHIEF COMPLAINT(S)</div>
                <div className="p-1.5 flex items-center text-sm">{allComplaints}</div>
            </div>
        </div>
        {!isFollowUp ? (
            <>
                <PairedComplaintRow item1={{label: "Location", value: locationDisplay}} item2={{label: "Onset", value: onsetDisplay}} />
                <PairedComplaintRow item1={{label: "Aggravate", value: provocationDisplay}} item2={{label: "Alleviation", value: palliationDisplay}} />
                <PairedComplaintRow item1={{label: "Quality", value: qualityDisplay}} item2={{label: "Radiation", value: data.chiefComplaint.regionRadiation}} />
                <PairedComplaintRow item1={{label: "Severity", value: severityDisplay}} item2={{label: "Frequency", value: data.chiefComplaint.frequency}} />
                <PairedComplaintRow item1={{label: "Timing", value: data.chiefComplaint.timing}} item2={{label: "Possible Cause", value: causeDisplay}} />
                <SingleComplaintRow label="Remark" value={data.chiefComplaint.remark} />
            </>
        ) : (
             <>
                <PairedComplaintRow item1={{label: "Location", value: locationDisplay}} item2={{label: "Radiation", value: data.chiefComplaint.regionRadiation}} />
                <PairedComplaintRow item1={{label: "Quality", value: qualityDisplay}} item2={{label: "Severity", value: severityDisplay}} />
                <PairedComplaintRow item1={{label: "Frequency", value: data.chiefComplaint.frequency}} item2={{label: "Timing", value: data.chiefComplaint.timing}} />
            </>
        )}
    </>
  );

  return (
    <div className="max-w-4xl mx-auto">
       {/* SOAP Modal removed - will be in premium version */}
      <div className="bg-white p-1 sm:p-2 md:p-4" id="print-area">
        
        {/* PAGE 1 CONTAINER */}
        <div className="border-2 border-black">
          {/* Clinic Header */}
          {(data.clinicName || data.clinicLogo) && (
            <div className="p-2 flex justify-between items-center min-h-[4rem] border-b-2 border-black">
              {data.clinicLogo && (
                <div className="w-1/4 flex justify-start items-center">
                  <img src={data.clinicLogo} alt="Clinic Logo" className="max-h-20 max-w-full object-contain" />
                </div>
              )}
              <div className={`text-right ${data.clinicLogo ? 'w-3/4' : 'w-full text-center'}`}>
                {data.clinicName && <h1 className="text-2xl font-bold text-slate-800">{data.clinicName}</h1>}
                <h2 className="text-xl font-semibold text-slate-600">{isFollowUp ? 'Follow-up Patient Chart' : 'New Patient Chart'}</h2>
              </div>
            </div>
          )}

          {/* Patient Info Section */}
          <div className="border-b-2 border-black">
            <div className="grid grid-cols-3">
              <DataCell label="FILE NO." value={data.fileNo} className="border-r"/>
              <DataCell label="Name" value={data.name} className="border-r"/>
              <DataCell label="Date:" value={data.date} />
            </div>
            {!isFollowUp && (
                <>
                    <div className="grid grid-cols-3">
                        <DataCell label="Address" value={data.address} className="col-span-2 border-b-0 border-r" />
                        <DataCell label="Phone" value={data.phone} className="border-b-0" />
                    </div>
                </>
            )}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr]">
                <DataCell label="Occupation" value={data.occupation} className="border-b-0 border-r"/>
                <DataCell label="DOB" value={data.dob} className="border-b-0 border-r" />
                <DataCell label="Age" value={`${data.age}`} className="border-b-0 border-r" />
                <DataCell label="Sex" value={data.sex} className="border-b-0" />
            </div>
          </div>

          {/* Vitals Section */}
          <div className="border-b-2 border-black">
            <SectionHeader title="VITAL SIGNS" />
            <div className="grid grid-cols-3">
              <VitalsCell label="HT." value={heightValue} unit="" className="border-r border-black" />
              <VitalsCell label="WT." value={data.weight} unit="lbs" className="border-r border-black" />
              <VitalsCell label="Temp." value={data.temp} unit="°F" />
            </div>
            <div className="grid grid-cols-2 border-t border-black">
              <div className="flex border-r border-black">
                  <div className="font-bold p-2 w-1/4 border-r border-black bg-slate-50 flex items-center justify-center">Heart</div>
                  <div className="w-3/4">
                      <VitalsCell label="Rate:" value={data.heartRate} unit="BPM" className="border-b border-black" />
                      <VitalsCell label="Rhythm:" value={data.heartRhythm} unit="" className="border-b border-black" />
                      <VitalsCell label="B.P.:" value={data.bpSystolic && data.bpDiastolic ? `${data.bpSystolic}/${data.bpDiastolic}` : ''} unit="mmHg" />
                  </div>
              </div>
              <div className="flex">
                  <div className="font-bold p-2 w-1/4 border-r border-black bg-slate-50 flex items-center justify-center">LUNG</div>
                  <div className="w-3/4">
                      <VitalsCell label="Rate:" value={data.lungRate} unit="BPM" className="border-b border-black" />
                      <VitalsCell label="Sound:" value={data.lungSound} unit="" />
                  </div>
              </div>
            </div>
          </div>

          {/* Response to Care Section */}
          {isFollowUp && (
              <div className="border-b-2 border-black">
                  <SectionHeader title="RESPONSE TO PREVIOUS CARE" />
                  <div className="p-2">{renderRespondToCare()}</div>
              </div>
          )}

          {/* Chief Complaint Section */}
          <div className="border-b-2 border-black">
            <SectionHeader title="CHIEF COMPLAINT(S)" />
            {chiefComplaintContent()}
          </div>

          {/* Present Illness Section */}
          <div>
            <SectionHeader title="PRESENT ILLNESS" />
            <div className="p-2 space-y-2 text-sm min-h-[5rem]">
                {data.chiefComplaint.presentIllness ? (
                    <p className="whitespace-pre-wrap">{data.chiefComplaint.presentIllness}</p>
                ) : (
                    <p className="text-gray-400">N/A</p>
                )}
                {data.chiefComplaint.westernMedicalDiagnosis && (
                    <div className="pt-2">
                        <p className="font-semibold">Western Medical Diagnosis:</p>
                        <p>{data.chiefComplaint.westernMedicalDiagnosis}</p>
                    </div>
                )}
                {isFollowUp && data.chiefComplaint.remark && (
                    <div className="pt-2 border-t">
                        <p className="font-semibold">Follow-up Notes / Changes:</p>
                        <p className="whitespace-pre-wrap">{data.chiefComplaint.remark}</p>
                    </div>
                )}
            </div>
          </div>
        </div>

        {/* PAGE 2 CONTAINER */}
        <div className="border-2 border-black break-before-page mt-4 print:mt-0">
          {/* Medical History Section - Vertical layout */}
          {!isFollowUp && (
              <div className="border-b-2 border-black divide-y-2 divide-black">
                  <div className="grid grid-cols-[200px_1fr] min-h-[3rem]">
                      <div className="bg-gray-300 p-1.5 font-bold flex items-center justify-center text-sm border-r border-black">Past Medical History</div>
                      <div className="p-1.5 break-words min-w-0 text-sm">{pastMedicalHistoryDisplay || <span className="text-gray-400">N/A</span>}</div>
                  </div>
                  <div className="grid grid-cols-[200px_1fr] min-h-[3rem]">
                      <div className="bg-gray-300 p-1.5 font-bold flex items-center justify-center text-sm border-r border-black">Medication</div>
                      <div className="p-1.5 break-words min-w-0 text-sm">{medicationDisplay || <span className="text-gray-400">N/A</span>}</div>
                  </div>
                  <div className="grid grid-cols-[200px_1fr] min-h-[3rem]">
                      <div className="bg-gray-300 p-1.5 font-bold flex items-center justify-center text-sm border-r border-black">Family History</div>
                      <div className="p-1.5 break-words min-w-0 text-sm">{familyHistoryDisplay || <span className="text-gray-400">N/A</span>}</div>
                  </div>
                  <div className="grid grid-cols-[200px_1fr] min-h-[3rem]">
                      <div className="bg-gray-300 p-1.5 font-bold flex items-center justify-center text-sm border-r border-black">Allergy</div>
                      <div className="p-1.5 break-words min-w-0 text-sm">{allergyDisplay || <span className="text-gray-400">N/A</span>}</div>
                  </div>
              </div>
          )}

          {/* Review of Systems Section - Paired layout like Chief Complaint */}
          <div className="border-b-2 border-black">
            <SectionHeader title="REVIEW OF SYSTEMS" />
            <div className="text-sm">
              {(() => {
                const rows = [];
                for (let i = 0; i < rosItems.length; i += 2) {
                  const first = rosItems[i];
                  const second = rosItems[i + 1];
                  rows.push(
                    <div key={first.label} className="grid grid-cols-2 border-t border-black">
                      {/* Left cell */}
                      <div className="grid grid-cols-[150px_1fr] border-r border-black">
                        <div className="font-bold p-1.5 border-r border-black bg-slate-50 flex items-center justify-center">
                          {first.label}
                        </div>
                        <div className="p-1.5 break-words min-w-0">
                          {first.value || <span className="text-gray-400">N/A</span>}
                        </div>
                      </div>
                      {/* Right cell (if exists) */}
                      {second ? (
                        <div className="grid grid-cols-[150px_1fr]">
                          <div className="font-bold p-1.5 border-r border-black bg-slate-50 flex items-center justify-center">
                            {second.label}
                          </div>
                          <div className="p-1.5 break-words min-w-0">
                            {second.value || <span className="text-gray-400">N/A</span>}
                          </div>
                        </div>
                      ) : (
                        <div className="border-l border-black" />
                      )}
                    </div>
                  );
                }
                return rows;
              })()}
            </div>
          </div>

          {/* Inspection of the Tongue Section */}
          <div className="border-b-2 border-black">
            <SectionHeader title="INSPECTION OF THE TONGUE" />
            <div>
                {renderTongueSection()}
            </div>
          </div>
          
          {/* Pulse Diagnosis Section */}
          <div className="border-b-2 border-black">
            <SectionHeader title="PULSE DIAGNOSIS" />
            <div>
              {renderPulseSection()}
            </div>
          </div>

          {/* Diagnosis Section */}
          <div className="border-b-2 border-black">
            <SectionHeader title="DIAGNOSIS" />
            <div>
                <div className="grid grid-cols-[200px_1fr] border-b border-black">
                    <div className="font-bold p-1.5 border-r border-black bg-slate-50 flex items-center justify-center text-sm">EIGHT PRINCIPLES</div>
                    <div className="grid grid-cols-4">
                        <div className="p-1.5 border-r border-black text-center text-sm">{data.diagnosisAndTreatment.eightPrinciples.exteriorInterior || <span className="text-gray-400">Ext/Int</span>}</div>
                        <div className="p-1.5 border-r border-black text-center text-sm">{data.diagnosisAndTreatment.eightPrinciples.heatCold || <span className="text-gray-400">Heat/Cold</span>}</div>
                        <div className="p-1.5 border-r border-black text-center text-sm">{data.diagnosisAndTreatment.eightPrinciples.excessDeficient || <span className="text-gray-400">Exc/Def</span>}</div>
                        <div className="p-1.5 text-center text-sm">{data.diagnosisAndTreatment.eightPrinciples.yangYin || <span className="text-gray-400">Yang/Yin</span>}</div>
                    </div>
                </div>
                {!isFollowUp && <FullWidthRow label="ETIOLOGY" value={data.diagnosisAndTreatment.etiology} />}
                <FullWidthRow label="TCM DIAGNOSIS" value={data.diagnosisAndTreatment.tcmDiagnosis} />
            </div>
          </div>
          
          {/* Treatment Section */}
          <div className="border-b-2 border-black">
            <SectionHeader title="TREATMENT" />
            <div>
              <FullWidthRow label="TREATMENT PRINCIPLE" value={data.diagnosisAndTreatment.treatmentPrinciple} />
              <FullWidthRow label="ACUPUNCTURE POINTS" value={data.diagnosisAndTreatment.acupuncturePoints} preserveNewlines={true} />
              <FullWidthRow label="HERBAL TREATMENT" value={getFormulaName(data.diagnosisAndTreatment.herbalTreatment)} />
              <FullWidthRow label="OTHER TREATMENTS" value={renderCombinedOtherTreatments()} />

              <div className="grid grid-cols-2">
                  <div className="flex border-r border-black">
                      <div className="w-1/3 font-bold p-1.5 border-r border-black bg-slate-100 flex items-center justify-center text-sm">ICD</div>
                      <div className="w-2/3 p-1.5 flex items-center text-sm">{data.diagnosisAndTreatment.icd}</div>
                  </div>
                  <div className="flex">
                      <div className="w-1/3 font-bold p-1.5 border-r border-black bg-slate-100 flex items-center justify-center text-sm">CPT</div>
                      <div className="w-2/3 p-1.5 flex items-center text-sm">{data.diagnosisAndTreatment.cpt}</div>
                  </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Consent Form (First Visit) - same page (no forced page break) */}
        {!isFollowUp && (
            <div className="pt-8 text-black">
                <div>
                    <h2 className="text-center font-bold text-lg mb-4">Consent for Treatments and Arbitration Agreement</h2>
                    <div className="text-xs space-y-2 text-justify">
                        <p><span className="font-bold">Agreement to Arbitrate :</span> It is understood that any dispute as to medical malpractice, including whether any medical services rendered under this contract were unnecessary or unauthorized or were improperly, negligently or incompetently rendered, will be determined by submission to arbitration as provided by state and federal law, and not by a lawsuit or resort to court process, except as state and federal law provides for judicial review of arbitration proceedings. Both parties to this contract, by entering into it, are giving up their constitutional right to have any such dispute decided in a court of law before a jury, and instead are accepting the use of arbitration.</p>
                        <p><span className="font-bold">All Claims Must be Arbitrated:</span> It is also understood that any dispute that does not relate to medical malpractice, including disputes as to whether or not a dispute is subject to arbitration, as to whether this agreement is unconscionable, and any procedural disputes, will also be determined by submission to binding arbitration. It is intention of the parties that this agreement bind all parties as to all claims, including claims arising out of or relating to treatment or services provided by the health care provider, including any heirs or past, present or future spouse(s) of the patient in relation to all claims, including loss of consortium. This agreement is also intended to bind any children of the patient whether born or unborn at the time of the occurrence, giving rise to any claim. This agreement is intended to bind the patient and the health care provider and/or other licensed health care providers, preceptors, or interns who now or in the future treat the patient while employed by, working or associated with or serving as a backup for the health care provider, including those working at the health care provider’s clinic or office or any other clinic or office whether signatories to this form or not. All claims for monetary damages exceeding the jurisdictional limit of the small claims court against the health care provider, and/or the health care provider’s associates, corporation, partnership, employees, agents and estate, must be arbitrated including, without limitation, claims for loss of consortium, wrongful death, emotional distress, injunctive relief, or punitive damages. This agreement is intended to create an open book account unless and until revoked.</p>
                        <p><span className="font-bold">General provision:</span> All claims based upon the same incident, transaction, or related circumstances shall be arbitrated in one proceeding. A claim shall be waived and forever barred if (1) on the date notice thereof is received, the claim, if asserted in a civil action, would be barred by the applicable legal statute of limitations, or (2) the claimant fails to pursue the arbitration claim in accordance with the procedures prescribed herein with reasonable diligence.</p>
                        <p>I, the undersigned, a fully understand that there is no implied or stated guarantee of success or effectiveness of a specific treatment of series of treatment. Every attempt will be made to protect me from harm, but there may be unfavorable skin reaction, unexpected bleeding, and/or other complications not anticipated. I realize that I may withdraw from the program at any time. By voluntarily signing below, I show that I have read, or have had read to me, the above consent to treatment, have been told about the risks and benefits of acupuncture and other procedures, and have had an opportunity to ask questions. I intend this consent form to cover the entire course of treatment for my present condition and for any future condition(s) for which I seek treatment. Both parties to this contract, by entering it, are giving up their constitutional right to have any such dispute decided in court of law before jury and instead are accepting the use of arbitration. Further, the parties will not have the right to participate as a member of any class of claimants, and there shall be no authority for any dispute to be decided on a class action basis. By Signing this contract, you are agreeing to have any issue of medical malpractice decided by neutral arbitration, and You are giving up your right to a jury or court trial.</p>
                    </div>
                    <div className="mt-8 text-sm space-y-8">
                        <div className="flex items-end space-x-4">
                        <span className="font-bold whitespace-nowrap">Patient's signature :</span>
                        {data.patientSignature ? (
                          <div className="flex-grow border border-black min-h-[60px] flex items-center justify-center p-2">
                            <img src={data.patientSignature} alt="Patient Signature" className="max-h-[50px] max-w-full object-contain" />
                          </div>
                        ) : (
                          <div className="flex-grow border-b border-black min-h-[40px]"></div>
                        )}
                        <span className="font-bold whitespace-nowrap">Date :</span>
                        <div className="w-40 border-b border-black text-center">{data.patientSignatureDate || data.date}</div>
                        </div>
                        <div className="flex items-end space-x-4">
                        <span className="font-bold whitespace-nowrap">Therapist Name:</span>
                        <div className="flex-grow border-b border-black text-center">{data.diagnosisAndTreatment.therapistName}</div>
                        <span className="font-bold whitespace-nowrap">Lic #: AC</span>
                        <div className="w-40 border-b border-black text-center">{data.diagnosisAndTreatment.therapistLicNo}</div>
                        </div>
                        <div className="flex items-end space-x-4">
                        <span className="font-bold whitespace-nowrap">Signature:</span>
                        <div className="flex-grow border-b border-black"></div>
                        <span className="font-bold whitespace-nowrap">Date:</span>
                        <div className="w-40 border-b border-black"></div>
                        </div>
                    </div>
                </div>
            </div>
        )}
        
        {/* Follow-up Chart Signature Section (same page, no forced page break) */}
        {isFollowUp && (
            <div className="pt-8 text-black">
                <div className="mt-8 text-sm space-y-8">
                    <div className="flex items-end space-x-4">
                        <span className="font-bold whitespace-nowrap">Patient's signature :</span>
                        {data.patientSignature ? (
                          <div className="flex-grow border border-black min-h-[60px] flex items-center justify-center p-2">
                            <img src={data.patientSignature} alt="Patient Signature" className="max-h-[50px] max-w-full object-contain" />
                          </div>
                        ) : (
                          <div className="flex-grow border-b border-black min-h-[40px]"></div>
                        )}
                        <span className="font-bold whitespace-nowrap">Date :</span>
                        <div className="w-40 border-b border-black text-center">{data.patientSignatureDate || data.date}</div>
                    </div>
                    <div className="flex items-end space-x-4">
                        <span className="font-bold whitespace-nowrap">Therapist Name:</span>
                        <div className="flex-grow border-b border-black text-center">{data.diagnosisAndTreatment.therapistName}</div>
                        <span className="font-bold whitespace-nowrap">Lic #: AC</span>
                        <div className="w-40 border-b border-black text-center">{data.diagnosisAndTreatment.therapistLicNo}</div>
                    </div>
                    <div className="flex items-end space-x-4">
                        <span className="font-bold whitespace-nowrap">Signature:</span>
                        <div className="flex-grow border-b border-black"></div>
                        <span className="font-bold whitespace-nowrap">Date:</span>
                        <div className="w-40 border-b border-black"></div>
                    </div>
                </div>
            </div>
        )}
      </div>

      <div className="mt-8 flex justify-center space-x-4 print:hidden">
        <button onClick={onGoToList} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
          Patient List
        </button>
        <button onClick={onEdit} className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200">
          Edit
        </button>
        {/* SOAP Note button removed - will be in premium version */}
        <button 
          onClick={handlePrintPdf}
          className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200">
          Download / Print PDF (Text Copyable)
        </button>
      </div>
    </div>
  );
};