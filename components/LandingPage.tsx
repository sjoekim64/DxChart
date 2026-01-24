import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onRegister }) => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {t('app.title')}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <LanguageSelector />
              <button
                onClick={onLogin}
                className="px-4 py-2 text-slate-600 hover:text-emerald-600 font-medium transition-colors"
              >
                {t('app.login')}
              </button>
              <button
                onClick={onRegister}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full hover:from-emerald-600 hover:to-teal-700 font-medium transition-all shadow-md hover:shadow-lg"
              >
                {t('app.register')}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-16">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50"></div>
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{animationDelay: '2s'}}></div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-6">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {t('landing.badge') || 'Trusted by Oriental Medicine Clinics'}
                </div>
                <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-slate-900 leading-tight mb-6">
                  {t('app.subtitle')}
                </h1>
                <p className="text-lg lg:text-xl text-slate-600 mb-8 leading-relaxed">
                  {t('app.description')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={onRegister}
                    className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-lg font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                  >
                    {t('app.freeSignup')}
                  </button>
                  <button
                    onClick={onLogin}
                    className="px-8 py-4 bg-white text-slate-700 border-2 border-slate-200 rounded-xl text-lg font-semibold hover:border-emerald-300 hover:text-emerald-600 transition-all"
                  >
                    {t('app.getStarted')}
                  </button>
                </div>
                <div className="mt-8 flex items-center gap-6 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t('landing.feature1') || 'Free to start'}
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t('landing.feature2') || 'No credit card required'}
                  </div>
                </div>
              </div>
              
              <div className="relative lg:pl-8">
                <div className="relative bg-white rounded-2xl shadow-2xl p-6 border border-slate-200">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="h-3 bg-slate-200 rounded w-24 mb-2"></div>
                        <div className="h-2 bg-slate-100 rounded w-32"></div>
                      </div>
                      <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                        Active
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <div className="text-2xl font-bold text-slate-900">1,234</div>
                        <div className="text-sm text-slate-500">{t('landing.patients') || 'Patients'}</div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <div className="text-2xl font-bold text-emerald-600">98%</div>
                        <div className="text-sm text-slate-500">{t('landing.satisfaction') || 'Satisfaction'}</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-slate-100 rounded-full">
                        <div className="h-2 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full w-4/5"></div>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full">
                        <div className="h-2 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full w-3/5"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg flex items-center justify-center transform rotate-6">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
                {t('features.title')}
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                {t('features.subtitle') || 'Everything you need to manage your clinic efficiently'}
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="group p-8 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-100 hover:border-emerald-200 hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {t('features.digitalChart')}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {t('features.digitalChartDesc')}
                </p>
              </div>

              <div className="group p-8 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-100 hover:border-emerald-200 hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 bg-gradient-to-br from-violet-400 to-purple-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {t('features.patientManagement')}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {t('features.patientManagementDesc')}
                </p>
              </div>

              <div className="group p-8 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-100 hover:border-emerald-200 hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {t('features.printChart')}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {t('features.printChartDesc')}
                </p>
              </div>

              <div className="group p-8 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-100 hover:border-emerald-200 hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {t('features.aiAssistant') || 'AI Assistant'}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {t('features.aiAssistantDesc') || 'Get intelligent suggestions and insights powered by advanced AI technology.'}
                </p>
              </div>

              <div className="group p-8 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-100 hover:border-emerald-200 hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 bg-gradient-to-br from-rose-400 to-pink-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {t('features.notifications') || 'Smart Notifications'}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {t('features.notificationsDesc') || 'Automated reminders via email, SMS, and messaging platforms.'}
                </p>
              </div>

              <div className="group p-8 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-100 hover:border-emerald-200 hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {t('features.security') || 'Secure & Private'}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {t('features.securityDesc') || 'Enterprise-grade security to protect sensitive patient information.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-slate-50" id="pricing">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
                {t('pricing.landingTitle')}
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                {t('pricing.landingSubtitle')}
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="bg-white rounded-2xl border border-slate-200 p-8 hover:shadow-xl transition-all">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{t('pricing.basicName')}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-slate-900">$9.99</span>
                    <span className="text-slate-500">/{t('pricing.month')}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-slate-600">
                    <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t('pricing.basicFeature1')}
                  </li>
                  <li className="flex items-center gap-3 text-slate-600">
                    <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t('pricing.basicFeature2')}
                  </li>
                  <li className="flex items-center gap-3 text-slate-600">
                    <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t('pricing.basicFeature3')}
                  </li>
                </ul>
                <button
                  onClick={onRegister}
                  className="w-full py-3 px-6 border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:border-emerald-300 hover:text-emerald-600 transition-all"
                >
                  {t('pricing.selectPlan')}
                </button>
              </div>

              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-8 shadow-xl relative transform md:-translate-y-4">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-amber-400 text-amber-900 text-sm font-bold px-4 py-1 rounded-full">
                    {t('pricing.popular')}
                  </span>
                </div>
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">{t('pricing.proName')}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-white">$29.99</span>
                    <span className="text-emerald-100">/{t('pricing.month')}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-emerald-50">
                    <svg className="w-5 h-5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t('pricing.proFeature1')}
                  </li>
                  <li className="flex items-center gap-3 text-emerald-50">
                    <svg className="w-5 h-5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t('pricing.proFeature2')}
                  </li>
                  <li className="flex items-center gap-3 text-emerald-50">
                    <svg className="w-5 h-5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t('pricing.proFeature3')}
                  </li>
                  <li className="flex items-center gap-3 text-emerald-50">
                    <svg className="w-5 h-5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t('pricing.proFeature4')}
                  </li>
                </ul>
                <button
                  onClick={onRegister}
                  className="w-full py-3 px-6 bg-white text-emerald-600 rounded-xl font-semibold hover:bg-emerald-50 transition-all shadow-lg"
                >
                  {t('pricing.selectPlan')}
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-8 hover:shadow-xl transition-all">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{t('pricing.entName')}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-slate-900">$99.99</span>
                    <span className="text-slate-500">/{t('pricing.month')}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-slate-600">
                    <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t('pricing.entFeature1')}
                  </li>
                  <li className="flex items-center gap-3 text-slate-600">
                    <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t('pricing.entFeature2')}
                  </li>
                  <li className="flex items-center gap-3 text-slate-600">
                    <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t('pricing.entFeature3')}
                  </li>
                  <li className="flex items-center gap-3 text-slate-600">
                    <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t('pricing.entFeature4')}
                  </li>
                </ul>
                <button
                  onClick={onRegister}
                  className="w-full py-3 px-6 border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:border-emerald-300 hover:text-emerald-600 transition-all"
                >
                  {t('pricing.selectPlan')}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDIwMjAiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZ2LTRoLTJ2NGgyek0zNiAxNGgtMnY0aDJ2LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-10"></div>
          <div className="max-w-4xl mx-auto text-center px-4 relative">
            <div className="inline-flex items-center px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium mb-6">
              {t('cta.badge') || 'Start for Free'}
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              {t('cta.title') || 'Ready to transform your clinic?'}
            </h2>
            <p className="text-slate-400 mb-10 text-lg max-w-2xl mx-auto">
              {t('app.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onRegister}
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-lg font-semibold hover:from-emerald-400 hover:to-teal-500 transition-all shadow-lg hover:shadow-emerald-500/25"
              >
                {t('app.freeSignup')}
              </button>
              <button
                onClick={onLogin}
                className="px-8 py-4 bg-white/10 text-white border border-white/20 rounded-xl text-lg font-semibold hover:bg-white/20 transition-all"
              >
                {t('app.login')}
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-white">{t('app.title')}</span>
              </div>
              <p className="text-slate-400 max-w-md">
                {t('app.description')}
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">{t('footer.product') || 'Product'}</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">{t('features.digitalChart')}</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">{t('features.patientManagement')}</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">{t('features.printChart')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">{t('footer.contact') || 'Contact'}</h4>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <a href="mailto:sjoekim@gmail.com" className="hover:text-emerald-400 transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    sjoekim@gmail.com
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
            <p>{t('app.copyright')}</p>
            <p className="mt-1 text-xs">{t('app.ipNotice')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
