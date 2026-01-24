import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { WaitingForApproval } from './WaitingForApproval';
import { useLanguage } from '../contexts/LanguageContext';

interface AuthWrapperProps {
  initialMode?: 'login' | 'register';
  onBackToLanding?: () => void;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ initialMode = 'login', onBackToLanding }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [showWaiting, setShowWaiting] = useState(false);
  const { t } = useLanguage();

  if (showWaiting) {
    return <WaitingForApproval onBackToLogin={() => setShowWaiting(false)} />;
  }

  return (
    <div className="relative">
      {onBackToLanding && (
        <button
          onClick={onBackToLanding}
          className="absolute top-4 left-4 text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t('auth.backToHome')}
        </button>
      )}
      {isLogin ? (
        <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
      ) : (
        <RegisterForm 
          onSwitchToLogin={() => setIsLogin(true)}
          onRegistrationSuccess={() => {
            setShowWaiting(true);
          }}
        />
      )}
    </div>
  );
};
