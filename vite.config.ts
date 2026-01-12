import path from 'path';
import { defineConfig } from 'vite';

/**
 * Vite 설정 파일
 * 
 * Vite는 자동으로 .env 파일들을 로드하고,
 * VITE_ 접두사가 있는 변수만 클라이언트 코드에 노출합니다.
 * 
 * 환경 변수 파일 우선순위:
 * 1. .env.local (로컬 개발용, Git에 커밋되지 않음)
 * 2. .env.development (개발 모드)
 * 3. .env (기본)
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  },
  server: {
    host: '0.0.0.0', // 네트워크에서 접근 가능하도록 설정
    port: 5173,
    strictPort: false,
    open: true // 브라우저 자동 열기
  },
  // Vite는 자동으로 VITE_ 접두사가 있는 환경 변수를 클라이언트에 노출합니다.
  // 추가 설정이 필요 없습니다.
});
