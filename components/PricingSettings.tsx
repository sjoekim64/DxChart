import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import Toast from './Toast';

export interface PricingTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  stripePriceId?: string;
  isPopular?: boolean;
}

interface PricingSettingsProps {
  onClose: () => void;
}

const defaultTiers: PricingTier[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 9.99,
    currency: 'USD',
    interval: 'month',
    features: ['Up to 50 patient charts', 'Basic chart templates', 'Email support'],
    isPopular: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 29.99,
    currency: 'USD',
    interval: 'month',
    features: ['Up to 500 patient charts', 'All chart templates', 'AI assistance', 'Priority email support'],
    isPopular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99.99,
    currency: 'USD',
    interval: 'month',
    features: ['Unlimited patient charts', 'All features', 'AI assistance (unlimited)', 'Phone & email support', 'Custom integrations'],
    isPopular: false,
  },
];

export const PricingSettings: React.FC<PricingSettingsProps> = ({ onClose }) => {
  const { t } = useLanguage();
  const [tiers, setTiers] = useState<PricingTier[]>(defaultTiers);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    loadPricingSettings();
  }, []);

  const loadPricingSettings = () => {
    const saved = localStorage.getItem('pricingTiers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTiers(parsed);
      } catch (e) {
        console.error('Failed to load pricing settings:', e);
      }
    }
  };

  const savePricingSettings = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('pricingTiers', JSON.stringify(tiers));
      setMessage({ type: 'success', text: t('pricing.saveSuccess') });
      setToastMessage(t('pricing.saveSuccess'));
      setShowToast(true);
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: t('pricing.saveFailed') });
    } finally {
      setIsSaving(false);
    }
  };

  const updateTier = (tierId: string, field: keyof PricingTier, value: any) => {
    setTiers(prev => prev.map(tier => 
      tier.id === tierId ? { ...tier, [field]: value } : tier
    ));
  };

  const updateFeature = (tierId: string, featureIndex: number, value: string) => {
    setTiers(prev => prev.map(tier => {
      if (tier.id === tierId) {
        const newFeatures = [...tier.features];
        newFeatures[featureIndex] = value;
        return { ...tier, features: newFeatures };
      }
      return tier;
    }));
  };

  const addFeature = (tierId: string) => {
    setTiers(prev => prev.map(tier => {
      if (tier.id === tierId) {
        return { ...tier, features: [...tier.features, ''] };
      }
      return tier;
    }));
  };

  const removeFeature = (tierId: string, featureIndex: number) => {
    setTiers(prev => prev.map(tier => {
      if (tier.id === tierId) {
        const newFeatures = tier.features.filter((_, i) => i !== featureIndex);
        return { ...tier, features: newFeatures };
      }
      return tier;
    }));
  };

  return (
    <>
      <Toast 
        message={toastMessage}
        type="success"
        show={showToast}
        onClose={() => setShowToast(false)}
      />
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">{t('pricing.title')}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((tier) => (
              <div 
                key={tier.id} 
                className={`border rounded-lg p-4 ${tier.isPopular ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-gray-200'}`}
              >
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('pricing.tierName')}
                  </label>
                  <input
                    type="text"
                    value={tier.name}
                    onChange={(e) => updateTier(tier.id, 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('pricing.price')}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={tier.price}
                      onChange={(e) => updateTier(tier.id, 'price', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('pricing.currency')}
                    </label>
                    <select
                      value={tier.currency}
                      onChange={(e) => updateTier(tier.id, 'currency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="USD">USD</option>
                      <option value="KRW">KRW</option>
                      <option value="JPY">JPY</option>
                      <option value="EUR">EUR</option>
                      <option value="CNY">CNY</option>
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('pricing.interval')}
                  </label>
                  <select
                    value={tier.interval}
                    onChange={(e) => updateTier(tier.id, 'interval', e.target.value as 'month' | 'year')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="month">{t('pricing.monthly')}</option>
                    <option value="year">{t('pricing.yearly')}</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stripe Price ID
                  </label>
                  <input
                    type="text"
                    value={tier.stripePriceId || ''}
                    onChange={(e) => updateTier(tier.id, 'stripePriceId', e.target.value)}
                    placeholder="price_..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={tier.isPopular || false}
                      onChange={(e) => updateTier(tier.id, 'isPopular', e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{t('pricing.markPopular')}</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('pricing.features')}
                  </label>
                  {tier.features.map((feature, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateFeature(tier.id, index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                      <button
                        onClick={() => removeFeature(tier.id, index)}
                        className="px-2 py-1 text-red-600 hover:text-red-800"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addFeature(tier.id)}
                    className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {t('pricing.addFeature')}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={savePricingSettings}
              disabled={isSaving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSaving ? t('common.saving') : t('common.save')}
            </button>
          </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const getPricingTiers = (): PricingTier[] => {
  const saved = localStorage.getItem('pricingTiers');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load pricing tiers:', e);
    }
  }
  return defaultTiers;
};
