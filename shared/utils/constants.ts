import { Currency, Country } from '../types';

// App constants
export const APP_CONSTANTS = {
  // API endpoints (you'll update these with your actual endpoints)
  API_BASE_URL: 'http://localhost:3000/api', // This will be configured in each app separately
  
  // Currencies
  SUPPORTED_CURRENCIES: ['ghc', 'ngn'] as Currency[],
  
  // Countries
  SUPPORTED_COUNTRIES: ['gh', 'ng'] as Country[],
  
  // Payment methods
  PAYMENT_METHODS: ['mobile-money', 'bank-transfer', 'cash'] as const,
  
  // Languages
  SUPPORTED_LANGUAGES: ['en', 'fr'] as const,
  
  // Validation rules
  VALIDATION: {
    MIN_CONTRIBUTION_AMOUNT: 1,
    MAX_CONTRIBUTION_AMOUNT: 1000000,
    MIN_JAR_NAME_LENGTH: 3,
    MAX_JAR_NAME_LENGTH: 50,
    MIN_DESCRIPTION_LENGTH: 10,
    MAX_DESCRIPTION_LENGTH: 500,
  },
  
  // UI constants
  UI: {
    PAGINATION_LIMIT: 20,
    SEARCH_DEBOUNCE_MS: 300,
    TOAST_DURATION: 3000,
  }
};

// Country information
export const COUNTRY_INFO = {
  gh: {
    name: 'Ghana',
    currency: 'ghc' as Currency,
    currencySymbol: 'GH₵',
    flag: '🇬🇭',
    phonePrefix: '+233'
  },
  ng: {
    name: 'Nigeria',
    currency: 'ngn' as Currency,
    currencySymbol: '₦',
    flag: '🇳🇬',
    phonePrefix: '+234'
  }
};

// Currency information
export const CURRENCY_INFO = {
  ghc: {
    name: 'Ghana Cedi',
    symbol: 'GH₵',
    code: 'GHS'
  },
  ngn: {
    name: 'Nigerian Naira',
    symbol: '₦',
    code: 'NGN'
  }
};

// Payment method labels
export const PAYMENT_METHOD_LABELS = {
  'mobile-money': 'Mobile Money',
  'bank-transfer': 'Bank Transfer',
  'cash': 'Cash'
};

// Payment status labels
export const PAYMENT_STATUS_LABELS = {
  'pending': 'Pending',
  'completed': 'Completed',
  'failed': 'Failed',
  'transferred': 'Transferred'
};

// Language labels
export const LANGUAGE_LABELS = {
  'en': 'English',
  'fr': 'Français'
};
