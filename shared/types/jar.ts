import { User } from './user';
import { Media } from './user';

export interface JarGroup {
  id: string;
  /**
   * Name of the jar group
   */
  name: string;
  updatedAt: string;
  createdAt: string;
}

export interface Jar {
  id: string;
  /**
   * Name of the jar
   */
  name: string;
  /**
   * Description of the jar
   */
  description?: string | null;
  jarGroup?: (string | null) | JarGroup;
  /**
   * Upload an image for the jar
   */
  image?: (string | null) | Media;
  /**
   * Whether the jar is currently active
   */
  isActive?: boolean | null;
  /**
   * Whether the contribution amount is fixed
   */
  isFixedContribution?: boolean | null;
  /**
   * Accepted contribution amount for fixed contributions
   */
  acceptedContributionAmount?: number | null;
  /**
   * Target amount for the jar
   */
  goalAmount?: number | null;
  /**
   * Deadline for contributions to this jar
   */
  deadline?: string | null;
  currency: 'ghc' | 'ngn';
  /**
   * User who created the jar
   */
  creator: string | User;
  /**
   * Users who can contribute to this jar (excluding the creator)
   */
  collectors?: (string | User)[] | null;
  paymentLink?: string | null;
  /**
   * Allow anonymous contributions to this jar
   */
  acceptAnonymousContributions?: boolean | null;
  /**
   * Payment methods accepted for contributions to this jar
   */
  acceptedPaymentMethods: ('mobile-money' | 'bank-transfer' | 'cash')[];
  updatedAt: string;
  createdAt: string;
}
