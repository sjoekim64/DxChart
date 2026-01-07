// Netlify에서 실행할 수 있는 빠른 해결 스크립트
// 브라우저 개발자 도구 콘솔에 붙여넣기

console.log('=== 빠른 샘플 데이터 생성 ===');

(async () => {
  try {
    // 1. 데이터베이스 초기화
    const { database } = await import('./lib/database.js');
    await database.initialize();
    
    // 2. 사용자 찾기
    const users = await database.getAllUsers();
    const user = users.find(u => u.username === 'sjoekim');
    
    if (!user) {
      console.log('사용자를 찾을 수 없습니다. 먼저 로그인하세요.');
      return;
    }
    
    console.log('사용자 찾음:', user.username);
    
    // 3. 기존 샘플 데이터 삭제
    const existingCharts = await database.getPatientCharts(user.id);
    const sampleFileNos = ['CH-12345', 'CH-67890', 'CH-54321', 'CH-98765'];
    
    for (const chart of existingCharts) {
      if (sampleFileNos.includes(chart.fileNo)) {
        await database.deletePatientChart(user.id, chart.fileNo);
        console.log('삭제:', chart.fileNo);
      }
    }
    
    // 4. 새로운 샘플 데이터 생성
    const { getNewPatientSample, getFollowUpPatientSample, getFollowUpPatientSample2, getFollowUpPatientSample3 } = await import('./lib/sampleData.js');
    
    const clinicInfo = {
      clinicName: 'Test Wellness Center',
      therapistName: '김선생',
      therapistLicenseNo: 'TEST12345'
    };
    
    // 신규환자
    const newPatient = getNewPatientSample(clinicInfo);
    await database.savePatientChart(user.id, newPatient);
    console.log('✅ 신규환자 생성:', newPatient.name);
    
    // 재방문 환자 1
    const followUp1 = getFollowUpPatientSample(clinicInfo);
    await database.savePatientChart(user.id, followUp1);
    console.log('✅ 재방문 환자 1 생성:', followUp1.name);
    
    // 재방문 환자 2
    const followUp2 = getFollowUpPatientSample2(clinicInfo);
    await database.savePatientChart(user.id, followUp2);
    console.log('✅ 재방문 환자 2 생성:', followUp2.name);
    
    // 재방문 환자 3
    const followUp3 = getFollowUpPatientSample3(clinicInfo);
    await database.savePatientChart(user.id, followUp3);
    console.log('✅ 재방문 환자 3 생성:', followUp3.name);
    
    console.log('🎉 모든 샘플 데이터가 생성되었습니다!');
    console.log('페이지를 새로고침하세요.');
    
  } catch (error) {
    console.error('오류 발생:', error);
  }
})();
