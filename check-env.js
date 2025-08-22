#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.error('ERROR: .env file not found! Create one from .env.example');
  process.exit(1);
}

// Read and parse .env file
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');
const envVars = {};

// Parse .env properly, ignoring comments and empty lines
lines.forEach(line => {
  const trimmed = line.trim();
  
  // Skip empty lines and comments
  if (!trimmed || trimmed.startsWith('#')) return;
  
  // Find the first = sign (values might contain = signs)
  const equalIndex = trimmed.indexOf('=');
  if (equalIndex === -1) return;
  
  const key = trimmed.substring(0, equalIndex).trim();
  const value = trimmed.substring(equalIndex + 1).trim();
  
  // Remove surrounding quotes if present
  const unquotedValue = value.replace(/^["']|["']$/g, '');
  
  if (key) {
    envVars[key] = unquotedValue;
  }
});

// Check required variables
const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
const missing = [];
const empty = [];

required.forEach(varName => {
  if (!(varName in envVars)) {
    missing.push(varName);
  } else if (envVars[varName] === '') {
    empty.push(varName);
  }
});

// Report errors
if (missing.length > 0) {
  console.error('ERROR: Missing required env vars: ' + missing.join(', '));
  console.error('Please add these variables to your .env file');
  process.exit(1);
}

if (empty.length > 0) {
  console.error('ERROR: Empty values for env vars: ' + empty.join(', '));
  console.error('Please provide values for these variables in your .env file');
  process.exit(1);
}

// Validate URL format for SUPABASE_URL
try {
  new URL(envVars['SUPABASE_URL']);
} catch (e) {
  console.error('ERROR: SUPABASE_URL is not a valid URL: ' + envVars['SUPABASE_URL']);
  process.exit(1);
}

// Basic validation for service key (should be non-trivial)
if (envVars['SUPABASE_SERVICE_KEY'].length < 10) {
  console.error('ERROR: SUPABASE_SERVICE_KEY appears to be invalid (too short)');
  process.exit(1);
}

console.log('Environment OK: SUPABASE_URL and SUPABASE_SERVICE_KEY found and validated.');