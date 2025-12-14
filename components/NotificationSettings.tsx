import React, { useState, useEffect } from 'react';
import type { AdminNotificationSettings } from '../lib/emailService';

interface NotificationSettingsProps {
  onClose: () => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onClose }) => {
  const [settings, setSettings] = useState<AdminNotificationSettings>({
    email: 'stjoe1004@gmail.com',
    phoneNumber: '',
    enableEmailNotifications: true,
    enableSMSNotifications: false,
  });

  useEffect(() => {
    // 로컬 스토리지에서 설정 로드
    const savedSettings = localStorage.getItem('adminNotificationSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSave = () => {
    // 로컬 스토리지에 설정 저장
    localStorage.setItem('adminNotificationSettings', JSON.stringify(settings));
    alert('알림 설정이 저장되었습니다.');
    onClose();
  };

  const handleTestEmail = async () => {
    try {
      // 테스트 이메일 발송
      const { sendRegistrationNotification } = await import('../lib/emailService');
      const testData = {
        username: '테스트사용자',
        clinicName: '테스트한의원',
        therapistName: '테스트치료사',
        therapistLicenseNo: 'TEST12345',
        registrationTime: new Date().toLocaleString('ko-KR'),
        userAgent: navigator.userAgent,
        ipAddress: '테스트IP'
      };
      
      const success = await sendRegistrationNotification(testData);
      if (success) {
        alert('테스트 이메일이 발송되었습니다.');
      } else {
        alert('테스트 이메일 발송에 실패했습니다. EmailJS 설정을 확인해주세요.');
      }
    } catch (error) {
      console.error('테스트 이메일 발송 실패:', error);
      alert('테스트 이메일 발송에 실패했습니다.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">알림 설정</h2>
        
        <div className="space-y-4">
          {/* 이메일 알림 설정 */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium">이메일 알림</label>
              <input
                type="checkbox"
                checked={settings.enableEmailNotifications}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  enableEmailNotifications: e.target.checked
                }))}
                className="w-4 h-4"
              />
            </div>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
              placeholder="이메일 주소"
              className="w-full p-2 border rounded"
              disabled={!settings.enableEmailNotifications}
            />
            <button
              onClick={handleTestEmail}
              disabled={!settings.enableEmailNotifications}
              className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm disabled:bg-gray-300"
            >
              테스트 이메일 발송
            </button>
          </div>

          {/* SMS 알림 설정 */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium">SMS 알림</label>
              <input
                type="checkbox"
                checked={settings.enableSMSNotifications}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  enableSMSNotifications: e.target.checked
                }))}
                className="w-4 h-4"
              />
            </div>
            <input
              type="tel"
              value={settings.phoneNumber}
              onChange={(e) => setSettings(prev => ({ ...prev, phoneNumber: e.target.value }))}
              placeholder="전화번호 (예: +821012345678)"
              className="w-full p-2 border rounded"
              disabled={!settings.enableSMSNotifications}
            />
            <p className="text-xs text-gray-500 mt-1">
              SMS 알림은 Twilio 서비스 연동이 필요합니다.
            </p>
          </div>

          {/* 알림 내용 미리보기 */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-medium mb-2">알림 내용 미리보기</h3>
            <div className="text-sm space-y-1">
              <p><strong>회원가입 알림:</strong></p>
              <p className="text-gray-600">새 회원가입: 사용자명 (한의원명)</p>
              <p><strong>로그인 알림:</strong></p>
              <p className="text-gray-600">로그인: 사용자명 (한의원명)</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};



