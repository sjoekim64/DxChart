import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

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
  { id: 'gpt-4o', name: 'GPT-4o' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
];

const GEMINI_MODELS = [
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
  { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro' },
];

const CLAUDE_MODELS = [
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
  { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
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
  const { t, tArray } = useLanguage();
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
        console.error('Failed to load AI settings:', e);
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
      setMessage({ type: 'success', text: t('ai.saved') });
    } catch (e) {
      setMessage({ type: 'error', text: t('ai.saveFailed') });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    const providerConfig = getCurrentProvider();
    if (!providerConfig.apiKey) {
      setMessage({ type: 'error', text: t('ai.apiKeyRequired') });
      return;
    }

    setIsTesting(true);
    setMessage({ type: 'info', text: t('ai.testing') });

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
        setMessage({ type: 'success', text: t('ai.testSuccess') });
      } else {
        const error = await response.json();
        const errorMsg = error.error?.message || error.message || t('ai.unknownError');
        setMessage({ type: 'error', text: `${t('ai.apiError')}: ${errorMsg}` });
      }
    } catch (e) {
      setMessage({ type: 'error', text: t('ai.connectionFailed') });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDelete = () => {
    if (confirm(t('ai.deleteConfirm'))) {
      localStorage.removeItem(AI_CONFIG_KEY);
      setConfig(DEFAULT_CONFIG);
      setMessage({ type: 'success', text: t('ai.deleted') });
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

  const aiNotes = tArray('ai.noteItems');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">{t('ai.title')}</h2>
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
                <h3 className="font-medium text-gray-900">{t('ai.enableAI')}</h3>
                <p className="text-sm text-gray-500">{t('ai.enableAIDesc')}</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('ai.selectProvider')}</label>
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
                {getProviderName(config.provider)} {t('ai.apiKey')}
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
                  {showApiKey ? t('ai.hideKey') : t('ai.showKey')}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                <a 
                  href={getProviderLink(config.provider)}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {t('ai.getApiKey')}
                </a>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('ai.model')}
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
                {t('ai.maxTokens')}
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
                {t('ai.maxTokensDesc')}
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">{t('ai.note')}</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {aiNotes.map((note, i) => (
                  <li key={i}>• {note}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-red-600 hover:text-red-800 font-medium"
            >
              {t('ai.deleteSettings')}
            </button>
            <div className="flex gap-3">
              <button
                onClick={handleTest}
                disabled={isTesting || !getCurrentProvider().apiKey}
                className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTesting ? t('ai.testing') : t('ai.testConnection')}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? t('common.loading') : t('common.save')}
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
