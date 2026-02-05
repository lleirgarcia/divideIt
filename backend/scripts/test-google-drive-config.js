#!/usr/bin/env node

/**
 * Script to test Google Drive configuration
 * Checks if all required environment variables are set
 */

require('dotenv').config();

console.log('🔍 Testing Google Drive Configuration\n');
console.log('=====================================\n');

const requiredVars = {
  'GOOGLE_DRIVE_CLIENT_ID': process.env.GOOGLE_DRIVE_CLIENT_ID,
  'GOOGLE_DRIVE_CLIENT_SECRET': process.env.GOOGLE_DRIVE_CLIENT_SECRET,
  'GOOGLE_DRIVE_REDIRECT_URI': process.env.GOOGLE_DRIVE_REDIRECT_URI || 'http://localhost:3051/api/google-drive/oauth/callback',
  'GOOGLE_DRIVE_REFRESH_TOKEN': process.env.GOOGLE_DRIVE_REFRESH_TOKEN
};

let allConfigured = true;

console.log('Environment Variables:\n');
for (const [key, value] of Object.entries(requiredVars)) {
  const isSet = value && value.trim() !== '';
  const status = isSet ? '✅' : '❌';
  const displayValue = isSet 
    ? (key.includes('SECRET') || key.includes('TOKEN') 
        ? `${value.substring(0, 20)}...` 
        : value)
    : '(not set)';
  
  console.log(`${status} ${key}: ${displayValue}`);
  
  if (!isSet && key !== 'GOOGLE_DRIVE_REFRESH_TOKEN') {
    allConfigured = false;
  }
}

console.log('\n=====================================\n');

if (!allConfigured) {
  console.log('❌ Configuration incomplete!');
  console.log('\nMissing required variables:');
  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value || value.trim() === '') {
      if (key !== 'GOOGLE_DRIVE_REFRESH_TOKEN') {
        console.log(`  - ${key}`);
      }
    }
  }
  console.log('\n⚠️  Note: GOOGLE_DRIVE_REFRESH_TOKEN is optional for initial setup');
  console.log('   You can get it after completing the OAuth flow.\n');
  process.exit(1);
}

if (!requiredVars.GOOGLE_DRIVE_REFRESH_TOKEN) {
  console.log('⚠️  Warning: Refresh Token not set');
  console.log('   The service will work, but you need to complete OAuth flow to upload files.\n');
  console.log('📝 Next steps:');
  console.log('   1. Start your backend server: npm run dev');
  console.log('   2. Visit: http://localhost:3051/api/google-drive/auth-url');
  console.log('   3. Follow the OAuth flow to get refresh token\n');
} else {
  console.log('✅ All credentials configured!');
  console.log('\n📝 Next steps:');
  console.log('   1. Restart your backend server to load the configuration');
  console.log('   2. Test the connection: curl http://localhost:3051/api/google-drive/status');
  console.log('   3. You should see: "initialized": true, "configured": true, "authenticated": true\n');
}

process.exit(0);
