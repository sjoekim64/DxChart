import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSubscription, SubscriptionTier } from '../contexts/SubscriptionContext';
import { useAuth } from '../contexts/AuthContext';
import { getPricingTiers, PricingTier } from './PricingSettings';
import { LanguageSelector } from './LanguageSelector';

interface PricingPageProps {
  onBack?: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onBack }) => {
  const { t } = useLanguage();
  const { subscription, setSubscription } = useSubscription();
  const { user } = useAuth();
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setTiers(getPricingTiers());
  }, []);

  const handleSubscribe = async (tier: PricingTier) => {
    if (!user) {
      setMessage({ type: 'error', text: t('pricing.loginRequired') });
      return;
    }

    setIsProcessing(tier.id);
    
    try {
      if (tier.stripePriceId) {
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            priceId: tier.stripePriceId,
            userId: user.id,
            tierId: tier.id,
            successUrl: `${window.location.origin}/payment-success?tier=${tier.id}`,
            cancelUrl: `${window.location.origin}/pricing`,
          }),
        });

        if (response.ok) {
          const { url } = await response.json();
          if (url) {
            window.location.href = url;
            return;
          }
        }
      }

      const oneMonthFromNow = new Date();
      oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
      
      setSubscription({
        tier: tier.id as SubscriptionTier,
        expiresAt: oneMonthFromNow.toISOString(),
      });
      
      setMessage({ type: 'success', text: t('pricing.subscriptionSuccess') });
    } catch (error) {
      console.error('Subscription error:', error);
      setMessage({ type: 'error', text: t('pricing.subscriptionFailed') });
    } finally {
      setIsProcessing(null);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('common.back')}
            </button>
          )}
          <LanguageSelector />
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('pricing.pageTitle')}</h1>
          <p className="text-xl text-gray-600">{t('pricing.pageSubtitle')}</p>
          {subscription.tier !== 'free' && (
            <div className="mt-4 inline-block px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full">
              {t('pricing.currentPlan')}: <strong>{subscription.tier.toUpperCase()}</strong>
            </div>
          )}
        </div>

        {message && (
          <div className={`mb-8 p-4 rounded-md max-w-md mx-auto ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 ${
                tier.isPopular ? 'ring-2 ring-emerald-500 relative' : ''
              }`}
            >
              {tier.isPopular && (
                <div className="absolute top-0 left-0 right-0 bg-emerald-500 text-white text-center py-1 text-sm font-medium">
                  {t('pricing.mostPopular')}
                </div>
              )}
              
              <div className={`p-8 ${tier.isPopular ? 'pt-10' : ''}`}>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    {formatPrice(tier.price, tier.currency)}
                  </span>
                  <span className="text-gray-500">
                    /{tier.interval === 'month' ? t('pricing.month') : t('pricing.year')}
                  </span>
                </div>

                <ul className="space-y-4 mb-8">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(tier)}
                  disabled={isProcessing !== null || subscription.tier === tier.id}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                    subscription.tier === tier.id
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : tier.isPopular
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {isProcessing === tier.id ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('common.processing')}
                    </span>
                  ) : subscription.tier === tier.id ? (
                    t('pricing.currentPlan')
                  ) : (
                    t('pricing.subscribe')
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center text-gray-500">
          <p>{t('pricing.cancelAnytime')}</p>
        </div>
      </div>
    </div>
  );
};
