import React, { useState, useEffect } from 'react';

export type AIProvider = 'openai' | 'gemini' | 'claude';

interface ProviderConfig {
  apiKey: string;
  model: string;
}

interface AIConfig {
  provider: AIProvider;
  maxTokens: number;
  isEnabled: boolean;
  openai: ProviderConfig;
  gemini: ProviderConfig;
  claude: ProviderConfig;
}

const OPENAI_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o (추천)' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini (경제적)' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
];

const GEMINI_MODELS = [
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (추천)' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
  { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro' },
];

const CLAUDE_MODELS = [
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4 (추천)' },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
  { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku (경제적)' },
];

const AI_CONFIG_KEY = 'ai_config';

const DEFAULT_CONFIG: AIConfig = {
  provider: 'openai',
  maxTokens: 1000,
  isEnabled: false,
  openai: { apiKey: '', model: 'gpt-4o-mini' },
  gemini: { apiKey: '', model: 'gemini-2.0-flash' },
  claude: { apiKey: '', model: 'claude-sonnet-4-20250514' },
};

export const AISettings: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [config, setConfig] = useState<AIConfig>(DEFAULT_CONFIG);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    const savedConfig = localStorage.getItem(AI_CONFIG_KEY);
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        if (parsed.apiKey && !parsed.openai) {
          setConfig({
            ...DEFAULT_CONFIG,
            provider: 'openai',
            maxTokens: parsed.maxTokens || 1000,
            isEnabled: parsed.isEnabled || false,
            openai: { apiKey: parsed.apiKey, model: parsed.model || 'gpt-4o-mini' },
          });
        } else {
          setConfig({ ...DEFAULT_CONFIG, ...parsed });
        }
      } catch (e) {
        console.error('AI 설정 로드 실패:', e);
      }
    }
  }, []);

  const getCurrentProvider = () => config[config.provider];
  const getCurrentModels = () => {
    switch (config.provider) {
      case 'openai': return OPENAI_MODELS;
      case 'gemini': return GEMINI_MODELS;
      case 'claude': return CLAUDE_MODELS;
    }
  };

  const updateProviderConfig = (key: keyof ProviderConfig, value: string) => {
    setConfig({
      ...config,
      [config.provider]: { ...config[config.provider], [key]: value },
    });
  };

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
    const providerConfig = getCurrentProvider();
    if (!providerConfig.apiKey) {
      setMessage({ type: 'error', text: 'API 키를 입력해주세요.' });
      return;
    }

    setIsTesting(true);
    setMessage({ type: 'info', text: 'API 연결 테스트 중...' });

    try {
      let response: Response;
      
      if (config.provider === 'openai') {
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${providerConfig.apiKey}`,
          },
          body: JSON.stringify({
            model: providerConfig.model,
            messages: [{ role: 'user', content: 'Hello' }],
            max_tokens: 5,
          }),
        });
      } else if (config.provider === 'gemini') {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${providerConfig.model}:generateContent?key=${providerConfig.apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: 'Hello' }] }],
              generationConfig: { maxOutputTokens: 5 },
            }),
          }
        );
      } else {
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': providerConfig.apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: providerConfig.model,
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Hello' }],
          }),
        });
      }

      if (response.ok) {
        setMessage({ type: 'success', text: 'API 연결 테스트 성공! API 키가 유효합니다.' });
      } else {
        const error = await response.json();
        const errorMsg = error.error?.message || error.message || '알 수 없는 오류';
        setMessage({ type: 'error', text: `API 오류: ${errorMsg}` });
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
      setConfig(DEFAULT_CONFIG);
      setMessage({ type: 'success', text: 'AI 설정이 삭제되었습니다.' });
    }
  };

  const getProviderName = (provider: AIProvider) => {
    switch (provider) {
      case 'openai': return 'OpenAI';
      case 'gemini': return 'Google Gemini';
      case 'claude': return 'Anthropic Claude';
    }
  };

  const getProviderLink = (provider: AIProvider) => {
    switch (provider) {
      case 'openai': return 'https://platform.openai.com/api-keys';
      case 'gemini': return 'https://aistudio.google.com/apikey';
      case 'claude': return 'https://console.anthropic.com/settings/keys';
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
              <label className="block text-sm font-medium text-gray-700 mb-2">AI 제공자 선택</label>
              <div className="flex gap-2">
                {(['openai', 'gemini', 'claude'] as AIProvider[]).map((provider) => (
                  <button
                    key={provider}
                    onClick={() => setConfig({ ...config, provider })}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      config.provider === provider
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {getProviderName(provider)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {getProviderName(config.provider)} API 키
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={getCurrentProvider().apiKey}
                  onChange={(e) => updateProviderConfig('apiKey', e.target.value)}
                  placeholder={config.provider === 'openai' ? 'sk-...' : config.provider === 'gemini' ? 'AIza...' : 'sk-ant-...'}
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
                {getProviderName(config.provider)}에서 발급받은 API 키를 입력하세요.
                <a 
                  href={getProviderLink(config.provider)}
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
                value={getCurrentProvider().model}
                onChange={(e) => updateProviderConfig('model', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {getCurrentModels().map((model) => (
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
                <li>• API 사용량에 따라 {getProviderName(config.provider)} 요금이 부과됩니다</li>
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
                disabled={isTesting || !getCurrentProvider().apiKey}
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
      const parsed = JSON.parse(saved);
      if (parsed.apiKey && !parsed.openai) {
        return {
          ...DEFAULT_CONFIG,
          provider: 'openai',
          maxTokens: parsed.maxTokens || 1000,
          isEnabled: parsed.isEnabled || false,
          openai: { apiKey: parsed.apiKey, model: parsed.model || 'gpt-4o-mini' },
        };
      }
      return { ...DEFAULT_CONFIG, ...parsed };
    } catch {
      return null;
    }
  }
  return null;
};

export const getCurrentAIProvider = (): { provider: AIProvider; apiKey: string; model: string; maxTokens: number } | null => {
  const config = getAIConfig();
  if (!config || !config.isEnabled) return null;
  
  const providerConfig = config[config.provider];
  if (!providerConfig.apiKey) return null;
  
  return {
    provider: config.provider,
    apiKey: providerConfig.apiKey,
    model: providerConfig.model,
    maxTokens: config.maxTokens,
  };
};
