export interface User {
  id: string;
  /**
   * Upload a profile photo
   */
  photo?: (string | null) | Media;
  fullName: string;
  phoneNumber: string;
  country: 'gh' | 'ng';
  isKYCVerified?: boolean | null;
  appSettings?: {
    language?: ('en' | 'fr') | null;
    darkMode?: boolean | null;
    biometricAuthEnabled?: boolean | null;
    notificationsSettings?: {
      pushNotificationsEnabled?: boolean | null;
      emailNotificationsEnabled?: boolean | null;
      smsNotificationsEnabled?: boolean | null;
    };
  };
  updatedAt: string;
  createdAt: string;
  email: string;
  resetPasswordToken?: string | null;
  resetPasswordExpiration?: string | null;
  salt?: string | null;
  hash?: string | null;
  loginAttempts?: number | null;
  lockUntil?: string | null;
  sessions?:
    | {
        id: string;
        createdAt?: string | null;
        expiresAt: string;
      }[]
    | null;
  password?: string | null;
}

export interface Media {
  id: string;
  alt: string;
  updatedAt: string;
  createdAt: string;
  url?: string | null;
  thumbnailURL?: string | null;
  filename?: string | null;
  mimeType?: string | null;
  filesize?: number | null;
  width?: number | null;
  height?: number | null;
  focalX?: number | null;
  focalY?: number | null;
}
