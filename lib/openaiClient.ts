/**
 * OpenAI API 클라이언트 유틸리티
 * 
 * 이 파일은 OpenAI API 키를 안전하게 관리하고 클라이언트를 생성합니다.
 * Vite 환경 변수 시스템을 사용합니다.
 */

import OpenAI from 'openai';

/**
 * 환경 변수에서 OpenAI API 키를 가져옵니다.
 * Vite는 VITE_ 접두사가 있는 환경 변수만 클라이언트에 노출합니다.
 */
function getApiKey(): string {
  // Vite 환경 변수에서 API 키 가져오기
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  // 상세한 디버깅 정보
  console.log('🔍 [OpenAI Client] 환경 변수 확인:', {
    키존재여부: !!apiKey,
    키타입: typeof apiKey,
    키길이: apiKey ? apiKey.length : 0,
    키시작부분: apiKey ? apiKey.substring(0, 15) + '...' : '없음',
    환경변수모드: import.meta.env.MODE,
    개발모드: import.meta.env.DEV,
    모든VITE키: Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')),
    전체env키: Object.keys(import.meta.env).slice(0, 10) // 처음 10개만
  });
  
  // API 키 검증
  if (!apiKey || apiKey === 'undefined' || apiKey === '') {
    const errorMsg = `
❌ OpenAI API 키를 찾을 수 없습니다.

현재 상태:
- API 키 존재: ${!!apiKey}
- API 키 값: ${apiKey || '(없음)'}
- 환경 변수 모드: ${import.meta.env.MODE}
- 개발 모드: ${import.meta.env.DEV}
- 사용 가능한 VITE_ 키: ${Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')).join(', ') || '없음'}

해결 방법:
1. 프로젝트 루트에 .env.local 파일이 있는지 확인하세요
2. .env.local 파일에 다음 내용이 있는지 확인하세요:
   VITE_OPENAI_API_KEY=sk-proj-your-api-key-here
3. 등호(=) 앞뒤에 공백이 없어야 합니다
4. 따옴표 없이 입력하세요
5. 개발 서버를 완전히 종료하고 다시 시작하세요 (Ctrl+C 후 npm run dev)
`;
    console.error(errorMsg);
    throw new Error('OPENAI_API_KEY가 설정되지 않았습니다. .env.local 파일을 확인하고 개발 서버를 재시작하세요.');
  }
  
  // API 키 형식 검증 (sk-로 시작하는지 확인)
  if (!apiKey.startsWith('sk-')) {
    console.warn('⚠️ API 키 형식이 올바르지 않을 수 있습니다. (sk-로 시작해야 함)');
    console.warn('⚠️ 현재 API 키 시작 부분:', apiKey.substring(0, 10));
  }
  
  console.log('✅ [OpenAI Client] API 키 확인 완료');
  return apiKey;
}

/**
 * OpenAI 클라이언트 인스턴스를 생성합니다.
 * 
 * @returns {OpenAI} OpenAI 클라이언트 인스턴스
 * @throws {Error} API 키가 설정되지 않은 경우
 */
export function createOpenAIClient(): OpenAI {
  try {
    console.log('🚀 [OpenAI Client] 클라이언트 생성 시작...');
    const apiKey = getApiKey();
    
    const client = new OpenAI({ 
      apiKey, 
      dangerouslyAllowBrowser: true 
    });
    
    console.log('✅ [OpenAI Client] 클라이언트 생성 완료');
    return client;
  } catch (error) {
    console.error('❌ [OpenAI Client] 클라이언트 생성 실패:', error);
    // 에러를 다시 던져서 호출자가 처리할 수 있도록 함
    throw error;
  }
}

/**
 * API 키가 설정되어 있는지 확인합니다.
 * 
 * @returns {boolean} API 키가 설정되어 있으면 true
 */
export function hasApiKey(): boolean {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    return !!apiKey && apiKey !== 'undefined' && apiKey !== '';
  } catch {
    return false;
  }
}

/**
 * API 연결 테스트 함수
 * 실제로 OpenAI API에 요청을 보내서 연결을 확인합니다.
 */
export async function testApiConnection(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🧪 [OpenAI Client] API 연결 테스트 시작...');
    
    const client = createOpenAIClient();
    
    // 간단한 테스트 요청
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Say "OK" if you can read this.' }],
      max_tokens: 10,
    });
    
    const result = response.choices[0]?.message?.content?.trim() || '';
    console.log('✅ [OpenAI Client] API 연결 테스트 성공:', result);
    
    return {
      success: true,
      message: `API 연결 성공! 응답: ${result}`
    };
  } catch (error: any) {
    console.error('❌ [OpenAI Client] API 연결 테스트 실패:', error);
    
    let errorMessage = '알 수 없는 오류가 발생했습니다.';
    
    if (error?.message) {
      errorMessage = error.message;
    } else if (error?.error) {
      errorMessage = error.error.message || JSON.stringify(error.error);
    } else if (error?.status) {
      errorMessage = `HTTP ${error.status}: ${error.statusText || 'Unknown error'}`;
    }
    
    return {
      success: false,
      message: `API 연결 실패: ${errorMessage}`
    };
  }
}
