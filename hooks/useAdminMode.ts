import { useState, useEffect, useCallback } from 'react';

export const useAdminMode = () => {
  const [isAdminMode, setIsAdminMode] = useState(false);

  useEffect(() => {
    const checkAdminMode = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const adminParam = urlParams.get('admin') === 'true';
      
      setIsAdminMode(prev => {
        // 값이 변경된 경우에만 업데이트하여 불필요한 리렌더링 방지
        if (prev !== adminParam) {
          console.log('🔍 URL 파라미터 확인:');
          console.log('  URL:', window.location.href);
          console.log('  Search:', window.location.search);
          console.log('  Admin param:', urlParams.get('admin'));
          console.log('  IsAdminMode:', adminParam);
          return adminParam;
        }
        return prev;
      });
    };
    
    // 즉시 확인
    checkAdminMode();
    
    // URL 변경 감지
    const handlePopState = () => {
      checkAdminMode();
    };
    
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const clearAdminMode = useCallback(() => {
    // URL에서 admin 파라미터 제거
    const url = new URL(window.location.href);
    url.searchParams.delete('admin');
    window.history.replaceState({}, '', url.toString());
    setIsAdminMode(false);
    // popstate 이벤트 트리거하여 다른 컴포넌트도 업데이트
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, []);

  return { isAdminMode, clearAdminMode };
};
