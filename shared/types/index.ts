// Re-export all types for easy importing
export * from './user';
export * from './jar';
export * from './contribution';

// Common enums and constants
export type Currency = 'ghc' | 'ngn';
export type Country = 'gh' | 'ng';
export type Language = 'en' | 'fr';
export type PaymentMethod = 'mobile-money' | 'bank-transfer' | 'cash';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'transferred';

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  docs: T[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
