#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('🚀 Starting Konto Development Environment...\n');

// Start CMS in background with minimal output
console.log('📱 Starting CMS Backend...');
const cms = spawn('pnpm', ['--filter', 'cms', 'dev'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true
});

let cmsReady = false;

// Monitor CMS output for ready state
cms.stdout.on('data', (data) => {
  const output = data.toString();
  if (output.includes('Ready') || output.includes('Local:')) {
    if (!cmsReady) {
      console.log('✅ CMS Backend is ready at http://localhost:3000\n');
      cmsReady = true;
      startMobileApp();
    }
  }
});

cms.stderr.on('data', (data) => {
  const error = data.toString();
  if (!error.includes('WARN')) {
    console.error('🔴 CMS Error:', error);
  }
});

function startMobileApp() {
  console.log('📱 Starting Mobile App with QR Code...\n');
  console.log('=' .repeat(60));
  
  // Start mobile app and show its full output (including QR code)
  const mobile = spawn('pnpm', ['--filter', 'mobile-app', 'dev'], {
    stdio: 'inherit',
    shell: true
  });

  mobile.on('close', (code) => {
    console.log(`\n📱 Mobile app exited with code ${code}`);
    cms.kill();
    process.exit(code);
  });
}

cms.on('close', (code) => {
  console.log(`\n🛑 CMS exited with code ${code}`);
  process.exit(code);
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development servers...');
  cms.kill();
  process.exit(0);
});

// Fallback: start mobile app after 5 seconds if CMS doesn't signal ready
setTimeout(() => {
  if (!cmsReady) {
    console.log('⏰ Starting mobile app (CMS taking longer than expected)...\n');
    startMobileApp();
  }
}, 5000);
