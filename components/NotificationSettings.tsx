import React, { useState, useEffect } from 'react';

interface NotificationConfig {
  email: string;
  phoneNumber: string;
  enableEmailNotifications: boolean;
  enableSMSNotifications: boolean;
  emailjs: {
    serviceId: string;
    templateId: string;
    publicKey: string;
  };
  twilio: {
    accountSid: string;
    authToken: string;
    fromNumber: string;
  };
}

const NOTIFICATION_CONFIG_KEY = 'notificationConfig';

const DEFAULT_CONFIG: NotificationConfig = {
  email: '',
  phoneNumber: '',
  enableEmailNotifications: true,
  enableSMSNotifications: false,
  emailjs: {
    serviceId: 'service_l4jlrhr',
    templateId: 'template_g0mc9fr',
    publicKey: 'rA7woIdCuPRzaiuAF',
  },
  twilio: {
    accountSid: '',
    authToken: '',
    fromNumber: '',
  },
};

export const NotificationSettings: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [config, setConfig] = useState<NotificationConfig>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState<'email' | 'sms'>('email');
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(NOTIFICATION_CONFIG_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConfig({ ...DEFAULT_CONFIG, ...parsed });
      } catch (e) {
        console.error('알림 설정 로드 실패:', e);
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(NOTIFICATION_CONFIG_KEY, JSON.stringify(config));
    localStorage.setItem('adminNotificationSettings', JSON.stringify({
      email: config.email,
      phoneNumber: config.phoneNumber,
      enableEmailNotifications: config.enableEmailNotifications,
      enableSMSNotifications: config.enableSMSNotifications,
    }));
    setMessage({ type: 'success', text: '알림 설정이 저장되었습니다.' });
  };

  const handleTestEmail = async () => {
    if (!config.email) {
      setMessage({ type: 'error', text: '수신 이메일 주소를 입력해주세요.' });
      return;
    }
    if (!config.emailjs.publicKey) {
      setMessage({ type: 'error', text: 'EmailJS Public Key를 입력해주세요.' });
      return;
    }

    setIsTesting(true);
    setMessage({ type: 'info', text: '테스트 이메일 발송 중...' });

    try {
      const emailjs = await import('@emailjs/browser');
      emailjs.default.init(config.emailjs.publicKey);

      const templateParams = {
        subject: '[환자차트시스템] 테스트 이메일',
        name: '관리자',
        email: config.email,
        time: new Date().toLocaleString('ko-KR'),
        message: '이것은 테스트 이메일입니다. 알림 설정이 정상적으로 작동합니다.',
      };

      await emailjs.default.send(
        config.emailjs.serviceId,
        config.emailjs.templateId,
        templateParams
      );

      setMessage({ type: 'success', text: '테스트 이메일이 발송되었습니다! 이메일을 확인해주세요.' });
    } catch (error: any) {
      console.error('이메일 발송 실패:', error);
      setMessage({ 
        type: 'error', 
        text: `이메일 발송 실패: ${error?.text || error?.message || '알 수 없는 오류'}` 
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestSMS = async () => {
    if (!config.phoneNumber) {
      setMessage({ type: 'error', text: '수신 전화번호를 입력해주세요.' });
      return;
    }
    if (!config.twilio.accountSid || !config.twilio.authToken || !config.twilio.fromNumber) {
      setMessage({ type: 'error', text: 'Twilio 설정을 모두 입력해주세요.' });
      return;
    }

    setIsTesting(true);
    setMessage({ type: 'info', text: '테스트 SMS 발송 중...' });

    try {
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(`${config.twilio.accountSid}:${config.twilio.authToken}`),
        },
        body: new URLSearchParams({
          To: config.phoneNumber,
          From: config.twilio.fromNumber,
          Body: '[환자차트시스템] 테스트 SMS입니다. 알림 설정이 정상적으로 작동합니다.',
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: '테스트 SMS가 발송되었습니다! 문자를 확인해주세요.' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: `SMS 발송 실패: ${error.message || '알 수 없는 오류'}` });
      }
    } catch (error: any) {
      console.error('SMS 발송 실패:', error);
      setMessage({ type: 'error', text: `SMS 발송 실패: ${error?.message || '네트워크 오류'}` });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">알림 설정</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
          </div>

          {message && (
            <div className={`mb-4 p-3 rounded-md text-sm ${
              message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
              message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
              'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              {message.text}
            </div>
          )}

          <div className="flex border-b mb-6">
            <button
              onClick={() => setActiveTab('email')}
              className={`px-4 py-2 font-medium ${activeTab === 'email' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            >
              이메일 설정
            </button>
            <button
              onClick={() => setActiveTab('sms')}
              className={`px-4 py-2 font-medium ${activeTab === 'sms' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            >
              SMS 설정
            </button>
          </div>

          {activeTab === 'email' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">이메일 알림 활성화</h3>
                  <p className="text-sm text-gray-500">회원가입, 로그인 시 이메일 알림을 받습니다</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enableEmailNotifications}
                    onChange={(e) => setConfig({ ...config, enableEmailNotifications: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">수신 이메일 주소</label>
                <input
                  type="email"
                  value={config.email}
                  onChange={(e) => setConfig({ ...config, email: e.target.value })}
                  placeholder="admin@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium text-gray-800 mb-3">EmailJS 설정</h4>
                <p className="text-sm text-gray-500 mb-4">
                  <a href="https://www.emailjs.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    EmailJS
                  </a>에서 무료 계정을 만들고 설정값을 입력하세요.
                </p>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service ID</label>
                    <input
                      type="text"
                      value={config.emailjs.serviceId}
                      onChange={(e) => setConfig({ ...config, emailjs: { ...config.emailjs, serviceId: e.target.value } })}
                      placeholder="service_xxxxxxx"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Template ID</label>
                    <input
                      type="text"
                      value={config.emailjs.templateId}
                      onChange={(e) => setConfig({ ...config, emailjs: { ...config.emailjs, templateId: e.target.value } })}
                      placeholder="template_xxxxxxx"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Public Key</label>
                    <input
                      type="text"
                      value={config.emailjs.publicKey}
                      onChange={(e) => setConfig({ ...config, emailjs: { ...config.emailjs, publicKey: e.target.value } })}
                      placeholder="xxxxxxxxxxxxxxx"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleTestEmail}
                disabled={isTesting}
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isTesting ? '발송 중...' : '테스트 이메일 발송'}
              </button>
            </div>
          )}

          {activeTab === 'sms' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">SMS 알림 활성화</h3>
                  <p className="text-sm text-gray-500">회원가입, 로그인 시 SMS 알림을 받습니다</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enableSMSNotifications}
                    onChange={(e) => setConfig({ ...config, enableSMSNotifications: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">수신 전화번호</label>
                <input
                  type="tel"
                  value={config.phoneNumber}
                  onChange={(e) => setConfig({ ...config, phoneNumber: e.target.value })}
                  placeholder="+821012345678"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">국제 형식으로 입력 (예: +821012345678)</p>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium text-gray-800 mb-3">Twilio 설정</h4>
                <p className="text-sm text-gray-500 mb-4">
                  <a href="https://www.twilio.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Twilio
                  </a>에서 계정을 만들고 설정값을 입력하세요.
                </p>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account SID</label>
                    <input
                      type="text"
                      value={config.twilio.accountSid}
                      onChange={(e) => setConfig({ ...config, twilio: { ...config.twilio, accountSid: e.target.value } })}
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Auth Token</label>
                    <input
                      type="password"
                      value={config.twilio.authToken}
                      onChange={(e) => setConfig({ ...config, twilio: { ...config.twilio, authToken: e.target.value } })}
                      placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">발신 전화번호</label>
                    <input
                      type="tel"
                      value={config.twilio.fromNumber}
                      onChange={(e) => setConfig({ ...config, twilio: { ...config.twilio, fromNumber: e.target.value } })}
                      placeholder="+1234567890"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Twilio에서 구매한 전화번호</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">참고사항</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Twilio 무료 체험 계정은 인증된 번호로만 SMS 발송 가능</li>
                  <li>• 유료 계정 사용 시 모든 번호로 발송 가능</li>
                  <li>• SMS 발송 비용은 Twilio 계정에서 청구됩니다</li>
                </ul>
              </div>

              <button
                onClick={handleTestSMS}
                disabled={isTesting}
                className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isTesting ? '발송 중...' : '테스트 SMS 발송'}
              </button>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const getNotificationConfig = (): NotificationConfig | null => {
  const saved = localStorage.getItem(NOTIFICATION_CONFIG_KEY);
  if (saved) {
    try {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    } catch {
      return null;
    }
  }
  return DEFAULT_CONFIG;
};
