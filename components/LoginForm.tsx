import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { LoginCredentials } from '../types/auth';
import { database } from '../lib/database';

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
  });
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordData, setForgotPasswordData] = useState({
    username: '',
    licenseNo: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [forgotPasswordError, setForgotPasswordError] = useState<string>('');
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await login(credentials);
      
      if (!response.success) {
        setError(response.error || '로그인에 실패했습니다.');
      }
    } catch (error) {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value,
    }));
    // 입력 시 에러 메시지 초기화
    if (error) setError('');
  };

  const handleForgotPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForgotPasswordData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (forgotPasswordError) setForgotPasswordError('');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordError('');
    setForgotPasswordSuccess(false);

    // 유효성 검사
    if (!forgotPasswordData.username || !forgotPasswordData.licenseNo) {
      setForgotPasswordError('사용자명과 면허번호를 모두 입력해주세요.');
      return;
    }

    if (!forgotPasswordData.newPassword || forgotPasswordData.newPassword.length < 6) {
      setForgotPasswordError('새 비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    if (forgotPasswordData.newPassword !== forgotPasswordData.confirmPassword) {
      setForgotPasswordError('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsResettingPassword(true);

    try {
      await database.initialize();
      
      // 사용자 확인
      const user = await database.getUserByUsername(forgotPasswordData.username);
      
      if (!user) {
        setForgotPasswordError('사용자를 찾을 수 없습니다. 사용자명을 확인해주세요.');
        setIsResettingPassword(false);
        return;
      }

      // 면허번호 확인
      if (user.therapistLicenseNo !== forgotPasswordData.licenseNo) {
        setForgotPasswordError('면허번호가 일치하지 않습니다.');
        setIsResettingPassword(false);
        return;
      }

      // 비밀번호 업데이트
      await database.updateUserPassword(forgotPasswordData.username, forgotPasswordData.newPassword);
      
      setForgotPasswordSuccess(true);
      setForgotPasswordData({
        username: '',
        licenseNo: '',
        newPassword: '',
        confirmPassword: '',
      });

      // 3초 후 비밀번호 찾기 폼 닫기
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotPasswordSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('비밀번호 재설정 실패:', error);
      setForgotPasswordError(error instanceof Error ? error.message : '비밀번호 재설정에 실패했습니다.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            환자 차트 시스템
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            계정에 로그인하세요
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                사용자명
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="사용자명"
                value={credentials.username}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="비밀번호"
                value={credentials.password}
                onChange={handleChange}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-4">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="text-sm font-medium text-red-800">{error}</div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </div>

          <div className="flex justify-between items-center text-sm">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-indigo-600 hover:text-indigo-500"
            >
              비밀번호를 잊으셨나요?
            </button>
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-indigo-600 hover:text-indigo-500"
            >
              회원가입
            </button>
          </div>
        </form>

        {/* 비밀번호 찾기 모달 */}
        {showForgotPassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">비밀번호 재설정</h3>
                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordError('');
                    setForgotPasswordSuccess(false);
                    setForgotPasswordData({
                      username: '',
                      licenseNo: '',
                      newPassword: '',
                      confirmPassword: '',
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {forgotPasswordSuccess ? (
                <div className="text-center py-4">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-green-800 font-medium">비밀번호가 성공적으로 변경되었습니다!</p>
                  <p className="text-sm text-gray-600 mt-2">새 비밀번호로 로그인해주세요.</p>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label htmlFor="forgot-username" className="block text-sm font-medium text-gray-700 mb-1">
                      사용자명
                    </label>
                    <input
                      id="forgot-username"
                      name="username"
                      type="text"
                      required
                      value={forgotPasswordData.username}
                      onChange={handleForgotPasswordChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="사용자명을 입력하세요"
                    />
                  </div>

                  <div>
                    <label htmlFor="forgot-license" className="block text-sm font-medium text-gray-700 mb-1">
                      면허번호
                    </label>
                    <input
                      id="forgot-license"
                      name="licenseNo"
                      type="text"
                      required
                      value={forgotPasswordData.licenseNo}
                      onChange={handleForgotPasswordChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="면허번호를 입력하세요"
                    />
                  </div>

                  <div>
                    <label htmlFor="forgot-new-password" className="block text-sm font-medium text-gray-700 mb-1">
                      새 비밀번호
                    </label>
                    <input
                      id="forgot-new-password"
                      name="newPassword"
                      type="password"
                      required
                      minLength={6}
                      value={forgotPasswordData.newPassword}
                      onChange={handleForgotPasswordChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="최소 6자 이상"
                    />
                  </div>

                  <div>
                    <label htmlFor="forgot-confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                      새 비밀번호 확인
                    </label>
                    <input
                      id="forgot-confirm-password"
                      name="confirmPassword"
                      type="password"
                      required
                      value={forgotPasswordData.confirmPassword}
                      onChange={handleForgotPasswordChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="새 비밀번호를 다시 입력하세요"
                    />
                  </div>

                  {forgotPasswordError && (
                    <div className="rounded-md bg-red-50 border border-red-200 p-3">
                      <div className="text-sm text-red-700">{forgotPasswordError}</div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setForgotPasswordError('');
                        setForgotPasswordData({
                          username: '',
                          licenseNo: '',
                          newPassword: '',
                          confirmPassword: '',
                        });
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={isResettingPassword}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                    >
                      {isResettingPassword ? '처리 중...' : '비밀번호 재설정'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
