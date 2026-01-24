import React from 'react';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onRegister }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-indigo-600">Patient Chart</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={onLogin}
                className="px-4 py-2 text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
              >
                로그인
              </button>
              <button
                onClick={onRegister}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
              >
                회원가입
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              환자 차트 관리 시스템
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              한의원을 위한 디지털 환자 차트 솔루션. 
              효율적인 진료 기록과 체계적인 환자 관리를 경험하세요.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={onLogin}
                className="px-8 py-4 bg-indigo-600 text-white rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl"
              >
                시작하기
              </button>
              <button
                onClick={onRegister}
                className="px-8 py-4 border-2 border-indigo-600 text-indigo-600 rounded-lg text-lg font-semibold hover:bg-indigo-50 transition-colors"
              >
                무료 회원가입
              </button>
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              주요 기능
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 bg-gradient-to-br from-indigo-50 to-white rounded-xl shadow-md">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  디지털 환자 차트
                </h3>
                <p className="text-gray-600">
                  신환 및 재방문 환자 차트를 디지털로 작성하고 관리하세요. 
                  SOAP 형식의 체계적인 진료 기록을 지원합니다.
                </p>
              </div>

              <div className="p-6 bg-gradient-to-br from-purple-50 to-white rounded-xl shadow-md">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  환자 기록 관리
                </h3>
                <p className="text-gray-600">
                  모든 환자의 진료 기록을 한곳에서 관리하세요. 
                  검색과 필터링으로 원하는 기록을 빠르게 찾을 수 있습니다.
                </p>
              </div>

              <div className="p-6 bg-gradient-to-br from-green-50 to-white rounded-xl shadow-md">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  차트 출력
                </h3>
                <p className="text-gray-600">
                  작성한 차트를 깔끔한 형식으로 출력하세요. 
                  클리닉 로고와 치료사 정보가 포함된 전문적인 문서를 생성합니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="max-w-4xl mx-auto text-center px-4">
            <h2 className="text-3xl font-bold text-white mb-4">
              지금 바로 시작하세요
            </h2>
            <p className="text-indigo-100 mb-8 text-lg">
              무료로 회원가입하고 디지털 환자 차트 관리를 경험해보세요.
            </p>
            <button
              onClick={onRegister}
              className="px-8 py-4 bg-white text-indigo-600 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
            >
              무료 회원가입
            </button>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>Patient Chart System</p>
          <p className="text-sm mt-2">한의원을 위한 디지털 환자 차트 솔루션</p>
        </div>
      </footer>
    </div>
  );
};
