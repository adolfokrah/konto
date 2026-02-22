import { Banner } from '@payloadcms/ui/elements/Banner'
import React from 'react'

import './index.scss'

const baseClass = 'before-dashboard'

const BeforeDashboard: React.FC = () => {
  return (
    <div className={baseClass}>
      <Banner className={`${baseClass}__banner`} type="success">
        <h4>Welcome to Konto Admin</h4>
      </Banner>
      <a
        href="/dashboard"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 20px',
          backgroundColor: '#222',
          color: '#fff',
          borderRadius: '6px',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: 500,
          marginTop: '12px',
        }}
      >
        Open Analytics Dashboard &rarr;
      </a>
    </div>
  )
}

export default BeforeDashboard
