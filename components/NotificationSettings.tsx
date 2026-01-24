import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface NotificationConfig {
  email: string;
  phoneNumber: string;
  enableEmailNotifications: boolean;
  enableSMSNotifications: boolean;
  enableTeamsNotifications: boolean;
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
  teams: {
    webhookUrl: string;
  };
}

const NOTIFICATION_CONFIG_KEY = 'notificationConfig';

const DEFAULT_CONFIG: NotificationConfig = {
  email: '',
  phoneNumber: '',
  enableEmailNotifications: true,
  enableSMSNotifications: false,
  enableTeamsNotifications: false,
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
  teams: {
    webhookUrl: '',
  },
};

export const NotificationSettings: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t, tArray, language } = useLanguage();
  const [config, setConfig] = useState<NotificationConfig>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState<'email' | 'sms' | 'teams'>('email');
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(NOTIFICATION_CONFIG_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConfig({ ...DEFAULT_CONFIG, ...parsed });
      } catch (e) {
        console.error('Failed to load notification settings:', e);
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
      enableTeamsNotifications: config.enableTeamsNotifications,
    }));
    setMessage({ type: 'success', text: t('notification.saved') });
  };

  const handleTestEmail = async () => {
    if (!config.email) {
      setMessage({ type: 'error', text: `${t('notification.recipientEmail')} ${t('notification.required')}` });
      return;
    }
    if (!config.emailjs.publicKey) {
      setMessage({ type: 'error', text: `${t('notification.publicKey')} ${t('notification.required')}` });
      return;
    }

    setIsTesting(true);
    setMessage({ type: 'info', text: t('notification.sending') });

    try {
      const emailjs = await import('@emailjs/browser');
      emailjs.default.init(config.emailjs.publicKey);

      const locale = language === 'ko' ? 'ko-KR' : language === 'zh-TW' ? 'zh-TW' : language === 'ja' ? 'ja-JP' : language === 'es' ? 'es-ES' : 'en-US';
      const templateParams = {
        subject: t('notification.testEmailSubject'),
        name: 'Admin',
        email: config.email,
        time: new Date().toLocaleString(locale),
        message: t('notification.testEmailBody'),
      };

      await emailjs.default.send(
        config.emailjs.serviceId,
        config.emailjs.templateId,
        templateParams
      );

      setMessage({ type: 'success', text: t('notification.testSuccess') });
    } catch (error: any) {
      console.error('Email send failed:', error);
      setMessage({ 
        type: 'error', 
        text: `${t('notification.sendFailed')}: ${error?.text || error?.message || t('notification.unknownError')}` 
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestSMS = async () => {
    if (!config.phoneNumber) {
      setMessage({ type: 'error', text: `${t('notification.recipientPhone')} ${t('notification.required')}` });
      return;
    }
    if (!config.twilio.accountSid || !config.twilio.authToken || !config.twilio.fromNumber) {
      setMessage({ type: 'error', text: t('notification.twilioSettingsRequired') });
      return;
    }

    setIsTesting(true);
    setMessage({ type: 'info', text: t('notification.sending') });

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
          Body: t('notification.testSMSBody'),
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: t('notification.testSuccess') });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: `${t('notification.sendFailed')}: ${error.message || t('notification.unknownError')}` });
      }
    } catch (error: any) {
      console.error('SMS send failed:', error);
      setMessage({ type: 'error', text: `${t('notification.sendFailed')}: ${error?.message || t('notification.networkError')}` });
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestTeams = async () => {
    if (!config.teams.webhookUrl) {
      setMessage({ type: 'error', text: `${t('notification.webhookUrl')} ${t('notification.required')}` });
      return;
    }

    setIsTesting(true);
    setMessage({ type: 'info', text: t('notification.sending') });

    try {
      const locale = language === 'ko' ? 'ko-KR' : language === 'zh-TW' ? 'zh-TW' : language === 'ja' ? 'ja-JP' : language === 'es' ? 'es-ES' : 'en-US';
      const teamsMessage = {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        "themeColor": "0076D7",
        "summary": t('notification.testTeamsSummary'),
        "sections": [{
          "activityTitle": t('notification.testTeamsTitle'),
          "activitySubtitle": new Date().toLocaleString(locale),
          "activityImage": "https://cdn-icons-png.flaticon.com/512/3774/3774299.png",
          "facts": [{
            "name": t('notification.statusLabel'),
            "value": t('notification.testTeamsStatus')
          }, {
            "name": t('notification.messageLabel'),
            "value": t('notification.testTeamsMessage')
          }],
          "markdown": true
        }]
      };

      const response = await fetch(config.teams.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamsMessage),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: t('notification.testSuccess') });
      } else {
        const errorText = await response.text();
        setMessage({ type: 'error', text: `${t('notification.sendFailed')}: ${errorText || t('notification.unknownError')}` });
      }
    } catch (error: any) {
      console.error('Teams send failed:', error);
      setMessage({ type: 'error', text: `${t('notification.sendFailed')}: ${error?.message || t('notification.networkError')}` });
    } finally {
      setIsTesting(false);
    }
  };

  const twilioNotes = tArray('notification.twilioNoteItems');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">{t('notification.title')}</h2>
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
              {t('notification.emailTab')}
            </button>
            <button
              onClick={() => setActiveTab('sms')}
              className={`px-4 py-2 font-medium ${activeTab === 'sms' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            >
              {t('notification.smsTab')}
            </button>
            <button
              onClick={() => setActiveTab('teams')}
              className={`px-4 py-2 font-medium ${activeTab === 'teams' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            >
              {t('notification.teamsTab')}
            </button>
          </div>

          {activeTab === 'email' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">{t('notification.enableEmail')}</h3>
                  <p className="text-sm text-gray-500">{t('notification.enableEmailDesc')}</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('notification.recipientEmail')}</label>
                <input
                  type="email"
                  value={config.email}
                  onChange={(e) => setConfig({ ...config, email: e.target.value })}
                  placeholder="admin@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium text-gray-800 mb-3">{t('notification.emailjsSettings')}</h4>
                <p className="text-sm text-gray-500 mb-4">
                  <a href="https://www.emailjs.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    EmailJS
                  </a> - {t('notification.emailjsDesc')}
                </p>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('notification.serviceId')}</label>
                    <input
                      type="text"
                      value={config.emailjs.serviceId}
                      onChange={(e) => setConfig({ ...config, emailjs: { ...config.emailjs, serviceId: e.target.value } })}
                      placeholder="service_xxxxxxx"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('notification.templateId')}</label>
                    <input
                      type="text"
                      value={config.emailjs.templateId}
                      onChange={(e) => setConfig({ ...config, emailjs: { ...config.emailjs, templateId: e.target.value } })}
                      placeholder="template_xxxxxxx"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('notification.publicKey')}</label>
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
                {isTesting ? t('notification.sending') : t('notification.testEmail')}
              </button>
            </div>
          )}

          {activeTab === 'sms' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">{t('notification.enableSMS')}</h3>
                  <p className="text-sm text-gray-500">{t('notification.enableSMSDesc')}</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('notification.recipientPhone')}</label>
                <input
                  type="tel"
                  value={config.phoneNumber}
                  onChange={(e) => setConfig({ ...config, phoneNumber: e.target.value })}
                  placeholder="+821012345678"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">{t('notification.phoneFormat')}</p>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium text-gray-800 mb-3">{t('notification.twilioSettings')}</h4>
                <p className="text-sm text-gray-500 mb-4">
                  <a href="https://www.twilio.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Twilio
                  </a> - {t('notification.twilioDesc')}
                </p>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('notification.accountSid')}</label>
                    <input
                      type="text"
                      value={config.twilio.accountSid}
                      onChange={(e) => setConfig({ ...config, twilio: { ...config.twilio, accountSid: e.target.value } })}
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('notification.authToken')}</label>
                    <input
                      type="password"
                      value={config.twilio.authToken}
                      onChange={(e) => setConfig({ ...config, twilio: { ...config.twilio, authToken: e.target.value } })}
                      placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('notification.fromNumber')}</label>
                    <input
                      type="tel"
                      value={config.twilio.fromNumber}
                      onChange={(e) => setConfig({ ...config, twilio: { ...config.twilio, fromNumber: e.target.value } })}
                      placeholder="+1234567890"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">{t('notification.fromNumberDesc')}</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">{t('notification.twilioNote')}</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {twilioNotes.map((note, i) => (
                    <li key={i}>• {note}</li>
                  ))}
                </ul>
              </div>

              <button
                onClick={handleTestSMS}
                disabled={isTesting}
                className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isTesting ? t('notification.sending') : t('notification.testSMS')}
              </button>
            </div>
          )}

          {activeTab === 'teams' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">{t('notification.enableTeams')}</h3>
                  <p className="text-sm text-gray-500">{t('notification.enableTeamsDesc')}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enableTeamsNotifications}
                    onChange={(e) => setConfig({ ...config, enableTeamsNotifications: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium text-gray-800 mb-3">{t('notification.teamsWebhook')}</h4>
                <p className="text-sm text-gray-500 mb-4">{t('notification.teamsWebhookDesc')}</p>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('notification.webhookUrl')}</label>
                  <input
                    type="url"
                    value={config.teams.webhookUrl}
                    onChange={(e) => setConfig({ ...config, teams: { ...config.teams, webhookUrl: e.target.value } })}
                    placeholder="https://outlook.office.com/webhook/..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">{t('notification.webhookSetup')}</h4>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>{t('notification.webhookStep1')}</li>
                  <li>{t('notification.webhookStep2')}</li>
                  <li>{t('notification.webhookStep3')}</li>
                  <li>{t('notification.webhookStep4')}</li>
                  <li>{t('notification.webhookStep5')}</li>
                </ol>
              </div>

              <button
                onClick={handleTestTeams}
                disabled={isTesting}
                className="w-full mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {isTesting ? t('notification.sending') : t('notification.testTeams')}
              </button>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {t('common.save')}
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
