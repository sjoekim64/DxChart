import React, { useState, useEffect } from 'react';
import { database } from '../lib/database';
import type { User } from '../types/auth';
import { NotificationSettings } from './NotificationSettings';

export const AdminDashboard: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  const loadUsers = async () => {
    try {
      await database.initialize();
      const pending = await database.getPendingUsers();
      const all = await database.getAllUsers();
      setPendingUsers(pending);
      setAllUsers(all);
    } catch (error) {
      console.error('사용자 목록 로드 실패:', error);
      setMessage({ type: 'error', text: '사용자 목록을 불러오는데 실패했습니다.' });
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
      setMessage({ type: 'success', text: `${username} 사용자를 승인했습니다.` });
      loadUsers(); // 목록 새로고침
    } catch (error) {
      console.error('사용자 승인 실패:', error);
      setMessage({ type: 'error', text: '사용자 승인에 실패했습니다.' });
    }
  };

  const handleReject = async (userId: string, username: string) => {
    if (!confirm(`${username} 사용자의 가입을 거부하시겠습니까?`)) {
      return;
    }
    
    try {
      await database.rejectUser(userId);
      setMessage({ type: 'success', text: `${username} 사용자를 거부했습니다.` });
      loadUsers(); // 목록 새로고침
    } catch (error) {
      console.error('사용자 거부 실패:', error);
      setMessage({ type: 'error', text: '사용자 거부에 실패했습니다.' });
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`${username} 사용자를 완전히 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }
    
    try {
      await database.deleteUser(userId);
      setMessage({ type: 'success', text: `${username} 사용자를 삭제했습니다.` });
      loadUsers(); // 목록 새로고침
    } catch (error) {
      console.error('사용자 삭제 실패:', error);
      setMessage({ type: 'error', text: '사용자 삭제에 실패했습니다.' });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">관리자 대시보드</h1>
            <button
              onClick={() => setShowNotificationSettings(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              알림 설정
            </button>
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

          {/* 승인 대기 중인 사용자 */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              승인 대기 중인 사용자 ({pendingUsers.length}명)
            </h2>
            
            {pendingUsers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">승인 대기 중인 사용자가 없습니다.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사용자명</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">한의원명</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">치료사명</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">면허번호</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가입일</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
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
                            승인
                          </button>
                          <button
                            onClick={() => handleReject(user.id, user.username)}
                            className="text-red-600 hover:text-red-900"
                          >
                            거부
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 전체 사용자 목록 */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              전체 사용자 목록 ({allUsers.length}명)
            </h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사용자명</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">한의원명</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">치료사명</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가입일</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">승인일</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
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
                          {user.isApproved ? '승인됨' : '대기중'}
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
                          삭제
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
      
      {/* 알림 설정 모달 */}
      {showNotificationSettings && (
        <NotificationSettings onClose={() => setShowNotificationSettings(false)} />
      )}
    </div>
  );
};
