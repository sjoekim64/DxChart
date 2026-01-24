import React from 'react';

interface WaitingForApprovalProps {
  onBackToLogin: () => void;
}

export const WaitingForApproval: React.FC<WaitingForApprovalProps> = ({ onBackToLogin }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
            <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            승인 대기 중
          </h2>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-2">회원가입이 완료되었습니다!</p>
              <p>관리자 승인을 기다리고 있습니다.</p>
              <p className="mt-2">승인 후 로그인할 수 있습니다.</p>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">📧 이메일 알림</p>
              <p>관리자에게 회원가입 알림이 전송되었습니다.</p>
              <p>승인 처리 후 별도 안내가 있을 예정입니다.</p>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <div className="text-sm text-green-800">
              <p className="font-medium mb-2">🔧 관리자 페이지 접근</p>
              <p>관리자는 다음 URL로 접근하여 승인/거부를 처리할 수 있습니다:</p>
              <div className="mt-2 p-2 bg-green-100 rounded text-xs font-mono break-all">
                {window.location.origin}?admin=true
              </div>
              <p className="mt-2 text-xs">※ 관리자만 접근 가능합니다.</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={onBackToLogin}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              로그인 페이지로 돌아가기
            </button>
            
            <div className="text-center">
              <p className="text-xs text-gray-500">
                승인에 대한 문의사항이 있으시면 관리자에게 연락해주세요.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};