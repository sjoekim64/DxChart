import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import type { LoginCredentials } from '../types/auth';
import { database } from '../lib/database';

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const { t } = useLanguage();
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
        setError(response.error || t('auth.loginError'));
      }
    } catch (error) {
      setError(t('auth.loginError'));
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

    if (!forgotPasswordData.username || !forgotPasswordData.licenseNo) {
      setForgotPasswordError(t('auth.enterUsernameAndLicense'));
      return;
    }

    if (!forgotPasswordData.newPassword || forgotPasswordData.newPassword.length < 6) {
      setForgotPasswordError(t('auth.passwordMinLength'));
      return;
    }

    if (forgotPasswordData.newPassword !== forgotPasswordData.confirmPassword) {
      setForgotPasswordError(t('auth.passwordMismatch'));
      return;
    }

    setIsResettingPassword(true);

    try {
      await database.initialize();
      
      const user = await database.getUserByUsername(forgotPasswordData.username);
      
      if (!user) {
        setForgotPasswordError(t('auth.userNotFound'));
        setIsResettingPassword(false);
        return;
      }

      if (user.therapistLicenseNo !== forgotPasswordData.licenseNo) {
        setForgotPasswordError(t('auth.licenseNoMismatch'));
        setIsResettingPassword(false);
        return;
      }

      await database.updateUserPassword(forgotPasswordData.username, forgotPasswordData.newPassword);
      
      setForgotPasswordSuccess(true);
      setForgotPasswordData({
        username: '',
        licenseNo: '',
        newPassword: '',
        confirmPassword: '',
      });

      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotPasswordSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Password reset failed:', error);
      setForgotPasswordError(error instanceof Error ? error.message : t('auth.passwordResetFailed'));
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('app.subtitle')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('auth.loginToAccount')}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                {t('auth.username')}
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder={t('auth.username')}
                value={credentials.username}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                {t('auth.password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder={t('auth.password')}
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
              {isLoading ? t('auth.loggingIn') : t('auth.loginButton')}
            </button>
          </div>

          <div className="flex justify-between items-center text-sm">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-indigo-600 hover:text-indigo-500"
            >
              {t('auth.forgotPassword')}
            </button>
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-indigo-600 hover:text-indigo-500"
            >
              {t('app.register')}
            </button>
          </div>
        </form>

        {showForgotPassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">{t('auth.resetPassword')}</h3>
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
                  <p className="text-green-800 font-medium">{t('auth.passwordResetSuccess')}</p>
                  <p className="text-sm text-gray-600 mt-2">{t('auth.loginWithNewPassword')}</p>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label htmlFor="forgot-username" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('auth.username')}
                    </label>
                    <input
                      id="forgot-username"
                      name="username"
                      type="text"
                      required
                      value={forgotPasswordData.username}
                      onChange={handleForgotPasswordChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder={t('auth.enterUsername')}
                    />
                  </div>

                  <div>
                    <label htmlFor="forgot-license" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('auth.licenseNo')}
                    </label>
                    <input
                      id="forgot-license"
                      name="licenseNo"
                      type="text"
                      required
                      value={forgotPasswordData.licenseNo}
                      onChange={handleForgotPasswordChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder={t('auth.enterLicenseNo')}
                    />
                  </div>

                  <div>
                    <label htmlFor="forgot-new-password" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('auth.newPassword')}
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
                      placeholder={t('auth.minChars')}
                    />
                  </div>

                  <div>
                    <label htmlFor="forgot-confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('auth.confirmPassword')}
                    </label>
                    <input
                      id="forgot-confirm-password"
                      name="confirmPassword"
                      type="password"
                      required
                      value={forgotPasswordData.confirmPassword}
                      onChange={handleForgotPasswordChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder={t('auth.reenterPassword')}
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
                      {t('common.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={isResettingPassword}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                    >
                      {isResettingPassword ? t('auth.processing') : t('auth.resetPassword')}
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
