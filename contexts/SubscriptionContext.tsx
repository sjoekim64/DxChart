import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export type SubscriptionTier = 'free' | 'basic' | 'professional' | 'enterprise';

interface SubscriptionInfo {
  tier: SubscriptionTier;
  expiresAt?: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
}

interface SubscriptionContextType {
  subscription: SubscriptionInfo;
  isLoading: boolean;
  canAccess: (feature: string) => boolean;
  setSubscription: (info: SubscriptionInfo) => void;
  getMaxPatients: () => number;
  hasAIAccess: () => boolean;
  hasUnlimitedCharts: () => boolean;
}

const defaultSubscription: SubscriptionInfo = {
  tier: 'free',
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const featureAccess: Record<SubscriptionTier, string[]> = {
  free: ['basic_charts', 'view_patients'],
  basic: ['basic_charts', 'view_patients', 'export_pdf', 'email_support'],
  professional: ['basic_charts', 'view_patients', 'export_pdf', 'email_support', 'ai_assistance', 'all_templates', 'priority_support'],
  enterprise: ['basic_charts', 'view_patients', 'export_pdf', 'email_support', 'ai_assistance', 'all_templates', 'priority_support', 'unlimited_charts', 'custom_integrations', 'phone_support'],
};

const patientLimits: Record<SubscriptionTier, number> = {
  free: 10,
  basic: 50,
  professional: 500,
  enterprise: Infinity,
};

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [subscription, setSubscriptionState] = useState<SubscriptionInfo>(defaultSubscription);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSubscription(user.id);
    } else {
      setSubscriptionState(defaultSubscription);
      setIsLoading(false);
    }
  }, [user]);

  const loadSubscription = (userId: string) => {
    setIsLoading(true);
    try {
      const saved = localStorage.getItem(`subscription_${userId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.expiresAt && new Date(parsed.expiresAt) < new Date()) {
          setSubscriptionState(defaultSubscription);
          localStorage.removeItem(`subscription_${userId}`);
        } else {
          setSubscriptionState(parsed);
        }
      } else {
        setSubscriptionState(defaultSubscription);
      }
    } catch (e) {
      console.error('Failed to load subscription:', e);
      setSubscriptionState(defaultSubscription);
    } finally {
      setIsLoading(false);
    }
  };

  const setSubscription = (info: SubscriptionInfo) => {
    setSubscriptionState(info);
    if (user) {
      localStorage.setItem(`subscription_${user.id}`, JSON.stringify(info));
    }
  };

  const canAccess = (feature: string): boolean => {
    const allowedFeatures = featureAccess[subscription.tier];
    return allowedFeatures.includes(feature);
  };

  const getMaxPatients = (): number => {
    return patientLimits[subscription.tier];
  };

  const hasAIAccess = (): boolean => {
    return canAccess('ai_assistance');
  };

  const hasUnlimitedCharts = (): boolean => {
    return canAccess('unlimited_charts');
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        isLoading,
        canAccess,
        setSubscription,
        getMaxPatients,
        hasAIAccess,
        hasUnlimitedCharts,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
