import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import type { RegisterData } from '../types/auth';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onRegistrationSuccess?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin, onRegistrationSuccess }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<RegisterData>({
    username: '',
    password: '',
    confirmPassword: '',
    clinicName: '',
    therapistName: '',
    therapistLicenseNo: '',
  });
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    if (formData.password.length < 6) {
      setError(t('auth.passwordMinLength'));
      return;
    }

    setIsLoading(true);

    try {
      console.log('Registering user:', formData.username);
      const response = await register(formData);
      console.log('Registration response:', response);
      
      if (!response.success) {
        console.error('Registration failed:', response.error);
        setError(response.error || t('auth.loginError'));
      } else {
        console.log('Registration successful');
        onRegistrationSuccess?.();
      }
    } catch (error) {
      setError(t('auth.loginError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
            Hoelinone
          </h1>
          <h2 className="text-xl font-semibold text-slate-800">
            {t('app.subtitle')}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {t('auth.createNewAccount')}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                {t('auth.username')}
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder={t('auth.enterUsername')}
                value={formData.username}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t('auth.password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder={t('auth.enterPassword')}
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                {t('auth.confirmPassword')}
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder={t('auth.reenterPassword')}
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="clinicName" className="block text-sm font-medium text-gray-700">
                {t('auth.clinicName')}
              </label>
              <input
                id="clinicName"
                name="clinicName"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder={t('auth.enterClinicName')}
                value={formData.clinicName}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="therapistName" className="block text-sm font-medium text-gray-700">
                {t('auth.therapistName')}
              </label>
              <input
                id="therapistName"
                name="therapistName"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder={t('auth.enterTherapistName')}
                value={formData.therapistName}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="therapistLicenseNo" className="block text-sm font-medium text-gray-700">
                {t('auth.licenseNo')}
              </label>
              <input
                id="therapistLicenseNo"
                name="therapistLicenseNo"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder={t('auth.enterLicenseNo')}
                value={formData.therapistLicenseNo}
                onChange={handleChange}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t('auth.registering') : t('auth.registerButton')}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-emerald-600 hover:text-emerald-700 text-sm"
            >
              {t('auth.hasAccount')} {t('app.login')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
