// 브라우저 개발자 도구에서 실행할 수 있는 디버깅 스크립트

// 1. IndexedDB 초기화
console.log('=== IndexedDB 초기화 ===');
indexedDB.deleteDatabase('PatientChartDB');
console.log('IndexedDB가 초기화되었습니다. 페이지를 새로고침하세요.');

// 2. 샘플 데이터 수동 추가 (페이지 새로고침 후 실행)
console.log('=== 샘플 데이터 수동 추가 ===');
console.log('페이지를 새로고침한 후 이 스크립트를 다시 실행하세요.');

// 3. 현재 저장된 데이터 확인
console.log('=== 현재 데이터 확인 ===');
const request = indexedDB.open('PatientChartDB', 2);
request.onsuccess = function(event) {
  const db = event.target.result;
  const transaction = db.transaction(['patientCharts'], 'readonly');
  const store = transaction.objectStore('patientCharts');
  const getAllRequest = store.getAll();
  
  getAllRequest.onsuccess = function() {
    const charts = getAllRequest.result;
    console.log('저장된 환자 차트 수:', charts.length);
    charts.forEach(chart => {
      console.log(`- ${chart.fileNo}: ${chart.chartType} (${chart.date})`);
    });
  };
};
