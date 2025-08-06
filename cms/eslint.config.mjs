import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

// Import shared config
const { baseConfig } = require('../eslint.config.js')

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  baseConfig,
  {
    rules: {
      // Next.js specific overrides
      '@next/next/no-img-element': 'warn',
      
      // Additional CMS-specific rules
      'react/display-name': 'off', // PayloadCMS components often don't need display names
      
      // Import rules for better organization
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
    },
  },
  {
    ignores: [
      '.next/',
      'node_modules/',
      'build/',
      'dist/',
      'coverage/',
      'test-results/',
      'playwright-report/',
      'payload-types.ts',
      'next-env.d.ts',
    ],
  },
]

export default eslintConfig
