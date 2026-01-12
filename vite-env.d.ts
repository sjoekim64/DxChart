/// <reference types="vite/client" />

/**
 * Vite 환경 변수 타입 정의
 * 
 * Vite는 VITE_ 접두사가 있는 환경 변수만 클라이언트 코드에 노출합니다.
 * .env.local 파일에 VITE_OPENAI_API_KEY를 설정하세요.
 */
interface ImportMetaEnv {
  /**
   * OpenAI API 키
   * .env.local 파일에 설정: VITE_OPENAI_API_KEY=sk-proj-your-key-here
   */
  readonly VITE_OPENAI_API_KEY: string;
  
  /**
   * EmailJS 서비스 ID (선택사항)
   * .env.local 파일에 설정: VITE_EMAILJS_SERVICE_ID=your-service-id
   */
  readonly VITE_EMAILJS_SERVICE_ID?: string;
  
  /**
   * EmailJS 템플릿 ID (선택사항)
   * .env.local 파일에 설정: VITE_EMAILJS_TEMPLATE_ID=your-template-id
   */
  readonly VITE_EMAILJS_TEMPLATE_ID?: string;
  
  /**
   * EmailJS 공개 키 (선택사항)
   * .env.local 파일에 설정: VITE_EMAILJS_PUBLIC_KEY=your-public-key
   */
  readonly VITE_EMAILJS_PUBLIC_KEY?: string;
  
  // 하위 호환성을 위한 레거시 변수 (사용하지 않음)
  readonly EMAILJS_SERVICE_ID?: string;
  readonly EMAILJS_TEMPLATE_ID?: string;
  readonly EMAILJS_PUBLIC_KEY?: string;
  
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
