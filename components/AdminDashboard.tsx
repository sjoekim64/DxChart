import React, { useState, useEffect } from 'react';
import { database } from '../lib/database';
import type { User } from '../types/auth';
import { NotificationSettings } from './NotificationSettings';
import { AISettings } from './AISettings';
import { PricingSettings } from './PricingSettings';
import { useAuth } from '../contexts/AuthContext';
import { useAdminMode } from '../hooks/useAdminMode';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

export const AdminDashboard: React.FC = () => {
  const { logout } = useAuth();
  const { clearAdminMode } = useAdminMode();
  const { t, language } = useLanguage();
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [showPricingSettings, setShowPricingSettings] = useState(false);
  
  const handleLogout = () => {
    clearAdminMode();
    logout();
  };

  const loadUsers = async () => {
    try {
      await database.initialize();
      const pending = await database.getPendingUsers();
      const all = await database.getAllUsers();
      setPendingUsers(pending);
      setAllUsers(all);
    } catch (error) {
      console.error('Failed to load users:', error);
      setMessage({ type: 'error', text: t('admin.loadUsersFailed') });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleApprove = async (userId: string, username: string) => {
    try {
      await database.approveUser(userId, 'admin');
      setMessage({ type: 'success', text: t('admin.userApproved').replace('{username}', username) });
      loadUsers();
    } catch (error) {
      console.error('Failed to approve user:', error);
      setMessage({ type: 'error', text: t('admin.approveFailed') });
    }
  };

  const handleReject = async (userId: string, username: string) => {
    if (!confirm(t('admin.confirmReject').replace('{username}', username))) {
      return;
    }
    
    try {
      await database.rejectUser(userId);
      setMessage({ type: 'success', text: t('admin.userRejected').replace('{username}', username) });
      loadUsers();
    } catch (error) {
      console.error('Failed to reject user:', error);
      setMessage({ type: 'error', text: t('admin.rejectFailed') });
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(t('admin.confirmDelete').replace('{username}', username))) {
      return;
    }
    
    try {
      await database.deleteUser(userId);
      setMessage({ type: 'success', text: t('admin.userDeleted').replace('{username}', username) });
      loadUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      setMessage({ type: 'error', text: t('admin.deleteFailed') });
    }
  };

  const formatDate = (dateString: string) => {
    const locale = language === 'ko' ? 'ko-KR' : 
                   language === 'zh-TW' ? 'zh-TW' : 
                   language === 'ja' ? 'ja-JP' : 
                   language === 'es' ? 'es-ES' : 'en-US';
    return new Date(dateString).toLocaleString(locale);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">{t('admin.title')}</h1>
            <div className="flex gap-2 items-center flex-wrap">
              <LanguageSelector />
              <button
                onClick={() => setShowPricingSettings(true)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                {t('pricing.title')}
              </button>
              <button
                onClick={() => setShowAISettings(true)}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                {t('admin.aiSettings')}
              </button>
              <button
                onClick={() => setShowNotificationSettings(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {t('admin.notificationSettings')}
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                {t('app.logout')}
              </button>
            </div>
          </div>
          
          {message && (
            <div className={`mb-6 p-4 rounded-md ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              {t('admin.pendingUsers')} ({pendingUsers.length})
            </h2>
            
            {pendingUsers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">{t('admin.noPendingUsers')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('auth.username')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('auth.clinicName')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('auth.therapistName')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('auth.licenseNo')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.joinDate')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.clinicName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.therapistName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.therapistLicenseNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleApprove(user.id, user.username)}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            {t('admin.approve')}
                          </button>
                          <button
                            onClick={() => handleReject(user.id, user.username)}
                            className="text-red-600 hover:text-red-900"
                          >
                            {t('admin.reject')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              {t('admin.allUsers')} ({allUsers.length})
            </h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('auth.username')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('auth.clinicName')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('auth.therapistName')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.status')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.joinDate')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.approvedDate')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.clinicName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.therapistName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isApproved 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user.isApproved ? t('admin.approved') : t('admin.waiting')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.approvedAt ? formatDate(user.approvedAt) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => handleDeleteUser(user.id, user.username)}
                          className="text-red-600 hover:text-red-900 font-medium"
                        >
                          {t('admin.delete')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      {showNotificationSettings && (
        <NotificationSettings onClose={() => setShowNotificationSettings(false)} />
      )}
      
      {showAISettings && (
        <AISettings onClose={() => setShowAISettings(false)} />
      )}
      
      {showPricingSettings && (
        <PricingSettings onClose={() => setShowPricingSettings(false)} />
      )}
    </div>
  );
};
