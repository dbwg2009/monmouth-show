#!/usr/bin/env tsx
// One-time script to mint a Gmail OAuth refresh token for the sync Worker.
// Run: npm run oauth:gmail
// Requires env vars: GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET
// Full implementation in Phase 5.

console.log('Gmail OAuth script — implemented in Phase 5.');
console.log('This will:');
console.log('  1. Open a local auth server on http://localhost:3000/callback');
console.log('  2. Print a consent URL for Dan to open in his browser');
console.log('  3. Exchange the code for a refresh token');
console.log('  4. Print the wrangler secret put command to store it safely');
