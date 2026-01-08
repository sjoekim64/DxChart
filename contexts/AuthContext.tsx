import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import type { User, AuthState, LoginCredentials, RegisterData, AuthResponse } from '../types/auth';
import { database } from '../lib/database';
import { sendLoginNotification, sendRegistrationNotification, getClientIP, getBrowserInfo } from '../lib/emailService';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (data: RegisterData) => Promise<AuthResponse>;
  logout: () => void;
  verifyToken: () => Promise<boolean>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'VERIFY_START' }
  | { type: 'VERIFY_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'VERIFY_FAILURE' }
  | { type: 'UPDATE_USER'; payload: { user: User } };

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('auth_token'),
  isAuthenticated: false,
  isLoading: true,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
    case 'VERIFY_START':
      return {
        ...state,
        isLoading: true,
      };
    case 'LOGIN_SUCCESS':
    case 'VERIFY_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGIN_FAILURE':
    case 'VERIFY_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload.user,
      };
    default:
      return state;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      console.log('🔐 로그인 시도:', credentials.username);
      
      // Admin 계정 특별 처리 (데이터베이스 체크 우회)
      const isAdminAccount = credentials.username.toLowerCase() === 'admin' && 
                            credentials.password === 'joe007007';
      
      if (isAdminAccount) {
        console.log('🔐 Admin 계정으로 로그인 - 관리자 대시보드로 이동');
        
        // 가상의 admin 사용자 객체 생성
        const adminUser: User = {
          id: 'admin',
          username: 'admin',
          passwordHash: '',
          clinicName: 'Admin Dashboard',
          therapistName: 'Administrator',
          therapistLicenseNo: 'ADMIN',
          createdAt: new Date().toISOString(),
          isApproved: true,
        };
        
        const adminToken = 'admin_token_' + Date.now();
        localStorage.setItem('auth_token', adminToken);
        
        dispatch({ 
          type: 'LOGIN_SUCCESS', 
          payload: { 
            user: adminUser, 
            token: adminToken 
          } 
        });
        
        // 관리자 대시보드로 리다이렉트 (페이지 새로고침 없이)
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('admin', 'true');
        window.history.replaceState({}, '', currentUrl.toString());
        
        // useAdminMode 훅이 URL 변경을 감지하도록 짧은 지연 후 상태 업데이트
        // 페이지 새로고침 없이 관리자 모드 활성화
        setTimeout(() => {
          // URL 변경 이벤트 트리거
          window.dispatchEvent(new PopStateEvent('popstate'));
        }, 50);
        
        return { success: true, data: { user: adminUser, token: adminToken } };
      }
      
      // 일반 사용자 로그인 처리
      // 데이터베이스 초기화는 loginUser 내부에서 처리 (크롬 호환성 개선)
      console.log('🗄️ 로그인 처리 시작...');
      
      const result = await database.loginUser(credentials);
      
      localStorage.setItem('auth_token', result.token);
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: { 
          user: result.user, 
          token: result.token 
        } 
      });

      // 일반 사용자 로그인 시 admin 파라미터 제거
      const currentUrl = new URL(window.location.href);
      if (currentUrl.searchParams.get('admin') === 'true') {
        console.log('🔗 일반 사용자 로그인 - admin 파라미터 제거');
        currentUrl.searchParams.delete('admin');
        window.history.replaceState({}, '', currentUrl.toString());
        // URL 변경 이벤트 트리거하여 admin 모드 해제
        window.dispatchEvent(new PopStateEvent('popstate'));
      }

      // 로그인 성공 시 이메일 알림 발송 (비동기로 처리하여 로그인 속도에 영향 없음)
      console.log('📧 로그인 알림 이메일 발송 시작...');
      sendLoginNotification({
        username: result.user.username,
        clinicName: result.user.clinicName,
        therapistName: result.user.therapistName,
        loginTime: new Date().toLocaleString('ko-KR'),
        userAgent: getBrowserInfo(),
        ipAddress: await getClientIP()
      }).then(success => {
        console.log('📧 로그인 알림 이메일 발송 결과:', success ? '성공' : '실패');
      }).catch(error => {
        console.error('❌ 로그인 알림 이메일 발송 실패:', error);
        // 이메일 발송 실패는 로그인에 영향을 주지 않음
      });
      
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ 로그인 실패:', error);
      dispatch({ type: 'LOGIN_FAILURE' });
      const errorMessage = error instanceof Error ? error.message : '로그인 중 오류가 발생했습니다.';
      console.error('❌ 에러 메시지:', errorMessage);
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const register = async (data: RegisterData): Promise<AuthResponse> => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      console.log('🔐 회원가입 시작:', data.username);
      
      // 데이터베이스 초기화 먼저 실행
      console.log('🗄️ 데이터베이스 초기화 중...');
      await database.initialize();
      console.log('✅ 데이터베이스 초기화 완료');
      
      const result = await database.registerUser({
        username: data.username,
        password: data.password,
        clinicName: data.clinicName,
        therapistName: data.therapistName,
        therapistLicenseNo: data.therapistLicenseNo,
      });
      console.log('✅ 회원가입 성공:', result);
      
      // 회원가입 성공 시 통합 알림 발송 (비동기로 처리)
      console.log('📧 회원가입 알림 발송 시작...');
      
      // 관리자 알림 설정 로드
      const adminSettings = JSON.parse(localStorage.getItem('adminNotificationSettings') || '{}');
      const defaultSettings = {
        email: 'stjoe1004@gmail.com',
        phoneNumber: '',
        enableEmailNotifications: true,
        enableSMSNotifications: false,
        ...adminSettings
      };
      
      const { sendAdminNotification } = await import('../lib/emailService');
      sendAdminNotification('registration', {
        username: data.username,
        clinicName: data.clinicName,
        therapistName: data.therapistName,
        therapistLicenseNo: data.therapistLicenseNo,
        registrationTime: new Date().toLocaleString('ko-KR'),
        userAgent: getBrowserInfo(),
        ipAddress: await getClientIP()
      }, defaultSettings).then(results => {
        console.log('📧 회원가입 알림 발송 결과:', results);
      }).catch(error => {
        console.error('❌ 회원가입 알림 발송 실패:', error);
        // 알림 발송 실패는 회원가입에 영향을 주지 않음
      });
      
      // 회원가입은 성공했지만 승인 대기 상태이므로 로그인하지 않음
      console.log('⏳ 회원가입 완료, 승인 대기 상태');
      dispatch({ type: 'LOGIN_FAILURE' });
      
      return { 
        success: true, 
        data: { 
          message: '회원가입이 완료되었습니다. 관리자 승인을 기다리고 있습니다. 승인 후 로그인할 수 있습니다.',
          requiresApproval: true
        }
      };
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' });
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '회원가입 중 오류가 발생했습니다.' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    dispatch({ type: 'LOGOUT' });
  };

  const verifyToken = async (): Promise<boolean> => {
    if (!state.token) {
      dispatch({ type: 'VERIFY_FAILURE' });
      return false;
    }

    dispatch({ type: 'VERIFY_START' });
    
    try {
      const user = await database.verifyToken(state.token);
      
      // Admin 사용자인 경우 URL에 admin 파라미터 추가
      if (user.id === 'admin' && user.username === 'admin') {
        const currentUrl = new URL(window.location.href);
        if (currentUrl.searchParams.get('admin') !== 'true') {
          currentUrl.searchParams.set('admin', 'true');
          window.history.replaceState({}, '', currentUrl.toString());
          // URL 변경 이벤트 트리거하여 admin 모드 활성화
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      } else {
        // 일반 사용자인 경우 admin 파라미터 제거
        const currentUrl = new URL(window.location.href);
        if (currentUrl.searchParams.get('admin') === 'true') {
          currentUrl.searchParams.delete('admin');
          window.history.replaceState({}, '', currentUrl.toString());
          // URL 변경 이벤트 트리거하여 admin 모드 해제
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      }
      
      dispatch({ 
        type: 'VERIFY_SUCCESS', 
        payload: { 
          user, 
          token: state.token 
        } 
      });
      return true;
    } catch (error) {
      localStorage.removeItem('auth_token');
      dispatch({ type: 'VERIFY_FAILURE' });
      return false;
    }
  };

  // 앱 시작 시 토큰 검증 및 테스트 사용자 초기화
  useEffect(() => {
    const initialize = async () => {
      // 데이터베이스 초기화 및 테스트 사용자 생성 (로그인 전에 실행)
      try {
        await database.initialize();
        const { initializeTestUser } = await import('../lib/sampleData');
        await initializeTestUser();
      } catch (error) {
        console.error('❌ 앱 초기화 실패:', error);
      }
      
      // 토큰 검증
      if (state.token) {
        verifyToken();
      } else {
        dispatch({ type: 'VERIFY_FAILURE' });
      }
    };
    
    initialize();
  }, []);

  const updateUser = (user: User) => {
    dispatch({ type: 'UPDATE_USER', payload: { user } });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    verifyToken,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
