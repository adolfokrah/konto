import { User } from './user';
import { Jar } from './jar';

export interface Contribution {
  id: string;
  /**
   * Select the jar to contribute to
   */
  jar: string | Jar;
  contributor?: string | null;
  contributorPhoneNumber: string;
  paymentMethod?: ('mobile-money' | 'bank-transfer' | 'cash') | null;
  amountContributed: number;
  paymentStatus?: ('pending' | 'completed' | 'failed' | 'transferred') | null;
  /**
   * User who collected the contribution
   */
  collector: string | User;
  /**
   * Check if this contribution was made via a payment link
   */
  viaPaymentLink?: boolean | null;
  updatedAt: string;
  createdAt: string;
}
