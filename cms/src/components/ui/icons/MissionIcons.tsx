import React from 'react'

interface IconProps {
  className?: string
  size?: number
}

export const LightbulbIcon: React.FC<IconProps> = ({ className, size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M10 2C7.24 2 5 4.24 5 7C5 8.85 5.92 10.48 7.33 11.42C7.75 11.7 8 12.17 8 12.67V15C8 15.55 8.45 16 9 16H11C11.55 16 12 15.55 12 15V12.67C12 12.17 12.25 11.7 12.67 11.42C14.08 10.48 15 8.85 15 7C15 4.24 12.76 2 10 2ZM9 18H11V17H9V18Z"
      fill="currentColor"
    />
  </svg>
)

export const BullseyeIcon: React.FC<IconProps> = ({ className, size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M10 2C5.58 2 2 5.58 2 10C2 14.42 5.58 18 10 18C14.42 18 18 14.42 18 10C18 5.58 14.42 2 10 2ZM10 16C6.69 16 4 13.31 4 10C4 6.69 6.69 4 10 4C13.31 4 16 6.69 16 10C16 13.31 13.31 16 10 16Z"
      fill="currentColor"
    />
    <path
      d="M10 6C7.79 6 6 7.79 6 10C6 12.21 7.79 14 10 14C12.21 14 14 12.21 14 10C14 7.79 12.21 6 10 6ZM10 12C8.9 12 8 11.1 8 10C8 8.9 8.9 8 10 8C11.1 8 12 8.9 12 10C12 11.1 11.1 12 10 12Z"
      fill="currentColor"
    />
  </svg>
)

export const GemIcon: React.FC<IconProps> = ({ className, size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M5 9L10 17L15 9H5Z"
      fill="currentColor"
    />
    <path
      d="M3.5 9L6.5 3H13.5L16.5 9H3.5Z"
      fill="currentColor"
      opacity="0.7"
    />
    <path
      d="M6.5 3H13.5L15 9H5L6.5 3Z"
      fill="currentColor"
      opacity="0.5"
    />
  </svg>
)

export const HeartIcon: React.FC<IconProps> = ({ className, size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M10 17.5C9.7 17.5 9.4 17.4 9.2 17.2C8.9 16.9 2.5 11.3 2.5 7C2.5 4.5 4.5 2.5 7 2.5C8.4 2.5 9.6 3.1 10 4.1C10.4 3.1 11.6 2.5 13 2.5C15.5 2.5 17.5 4.5 17.5 7C17.5 11.3 11.1 16.9 10.8 17.2C10.6 17.4 10.3 17.5 10 17.5Z"
      fill="currentColor"
    />
  </svg>
)

export const TargetIcon: React.FC<IconProps> = ({ className, size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M10 2C5.58 2 2 5.58 2 10C2 14.42 5.58 18 10 18C14.42 18 18 14.42 18 10C18 5.58 14.42 2 10 2ZM10 16C6.69 16 4 13.31 4 10C4 6.69 6.69 4 10 4C13.31 4 16 6.69 16 10C16 13.31 13.31 16 10 16Z"
      fill="currentColor"
    />
    <circle cx="10" cy="10" r="3" fill="currentColor" />
  </svg>
)

export const StarIcon: React.FC<IconProps> = ({ className, size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M10 1.5L12.09 7.26L18.18 8.03L14.09 11.97L15.18 18.04L10 15.77L4.82 18.04L5.91 11.97L1.82 8.03L7.91 7.26L10 1.5Z"
      fill="currentColor"
    />
  </svg>
)