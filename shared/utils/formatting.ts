import { Currency, Country } from '../types';

// Currency formatting utilities
export const formatCurrency = (amount: number, currency: Currency): string => {
  const currencySymbols = {
    ghc: 'GH₵',
    ngn: '₦'
  };

  return `${currencySymbols[currency]} ${amount.toLocaleString()}`;
};

// Phone number validation
export const validatePhoneNumber = (phoneNumber: string, country: Country): boolean => {
  const patterns = {
    gh: /^(\+233|0)(20|21|23|24|26|27|28|29|50|53|54|55|56|57|59)\d{7}$/, // Ghana
    ng: /^(\+234|0)(70|80|81|90|91|80|81|70|90|91)\d{8}$/ // Nigeria
  };

  return patterns[country].test(phoneNumber);
};

// Format phone number for display
export const formatPhoneNumber = (phoneNumber: string, country: Country): string => {
  // Remove any existing formatting
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  if (country === 'gh') {
    // Ghana format: +233 XX XXX XXXX
    if (cleaned.startsWith('233')) {
      return `+233 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
    }
    if (cleaned.startsWith('0')) {
      return `+233 ${cleaned.slice(1, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
  }
  
  if (country === 'ng') {
    // Nigeria format: +234 XXX XXX XXXX
    if (cleaned.startsWith('234')) {
      return `+234 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
    }
    if (cleaned.startsWith('0')) {
      return `+234 ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    }
  }
  
  return phoneNumber; // Return original if no pattern matches
};

// Date formatting utilities
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Time remaining utility
export const getTimeRemaining = (deadline: string): string => {
  const now = new Date().getTime();
  const deadlineTime = new Date(deadline).getTime();
  const difference = deadlineTime - now;

  if (difference <= 0) {
    return 'Expired';
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} remaining`;
  }
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
  }
  return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
};
