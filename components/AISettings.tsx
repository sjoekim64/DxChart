import React, { useState, useEffect } from 'react';

interface AIConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  isEnabled: boolean;
}

const AI_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o (추천)' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini (경제적)' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
];

const AI_CONFIG_KEY = 'ai_config';

export const AISettings: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [config, setConfig] = useState<AIConfig>({
    apiKey: '',
    model: 'gpt-4o-mini',
    maxTokens: 1000,
    isEnabled: false,
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    const savedConfig = localStorage.getItem(AI_CONFIG_KEY);
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error('AI 설정 로드 실패:', e);
      }
    }
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    try {
      localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config));
      setMessage({ type: 'success', text: 'AI 설정이 저장되었습니다.' });
    } catch (e) {
      setMessage({ type: 'error', text: '설정 저장에 실패했습니다.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!config.apiKey) {
      setMessage({ type: 'error', text: 'API 키를 입력해주세요.' });
      return;
    }

    setIsTesting(true);
    setMessage({ type: 'info', text: 'API 연결 테스트 중...' });

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 5,
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'API 연결 테스트 성공! API 키가 유효합니다.' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: `API 오류: ${error.error?.message || '알 수 없는 오류'}` });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'API 연결 실패. 네트워크를 확인해주세요.' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDelete = () => {
    if (confirm('AI API 설정을 삭제하시겠습니까?')) {
      localStorage.removeItem(AI_CONFIG_KEY);
      setConfig({
        apiKey: '',
        model: 'gpt-4o-mini',
        maxTokens: 1000,
        isEnabled: false,
      });
      setMessage({ type: 'success', text: 'AI 설정이 삭제되었습니다.' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">AI API 설정</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
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

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">AI 기능 활성화</h3>
                <p className="text-sm text-gray-500">환자 차트에서 AI 기능을 사용합니다</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.isEnabled}
                  onChange={(e) => setConfig({ ...config, isEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OpenAI API 키
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-20"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700"
                >
                  {showApiKey ? '숨기기' : '보기'}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                OpenAI에서 발급받은 API 키를 입력하세요. 
                <a 
                  href="https://platform.openai.com/api-keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline ml-1"
                >
                  API 키 발급받기
                </a>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI 모델
              </label>
              <select
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {AI_MODELS.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                최대 토큰 수
              </label>
              <input
                type="number"
                value={config.maxTokens}
                onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) || 1000 })}
                min="100"
                max="4000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                AI 응답의 최대 길이를 설정합니다 (100-4000)
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">주의사항</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• API 키는 브라우저에 안전하게 저장됩니다</li>
                <li>• API 사용량에 따라 OpenAI 요금이 부과됩니다</li>
                <li>• 환자 정보가 AI에 전송될 수 있으니 개인정보 보호에 유의하세요</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-red-600 hover:text-red-800 font-medium"
            >
              설정 삭제
            </button>
            <div className="flex gap-3">
              <button
                onClick={handleTest}
                disabled={isTesting || !config.apiKey}
                className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTesting ? '테스트 중...' : '연결 테스트'}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const getAIConfig = (): AIConfig | null => {
  const saved = localStorage.getItem(AI_CONFIG_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }
  return null;
};
