#!/usr/bin/env tsx
// One-time script to mint a Gmail OAuth refresh token for the sync Worker.
// Run: npm run oauth:gmail
// Requires env vars: GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET

import * as http from 'http';
import * as https from 'https';
import * as url from 'url';

const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/callback';
const SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';

if (!CLIENT_ID) {
  console.error('ERROR: GMAIL_CLIENT_ID environment variable is not set.');
  process.exit(1);
}
if (!CLIENT_SECRET) {
  console.error('ERROR: GMAIL_CLIENT_SECRET environment variable is not set.');
  process.exit(1);
}

function httpsPost(postUrl: string, body: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(postUrl);
    const options: https.RequestOptions = {
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
      res.on('end', () => resolve(data));
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function exchangeCode(code: string): Promise<void> {
  const params = new URLSearchParams({
    code,
    client_id: CLIENT_ID!,
    client_secret: CLIENT_SECRET!,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code',
  });

  const raw = await httpsPost('https://oauth2.googleapis.com/token', params.toString());
  const data = JSON.parse(raw) as {
    refresh_token?: string;
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (data.error) {
    console.error(`\nERROR from Google: ${data.error} — ${data.error_description ?? ''}`);
    process.exit(1);
  }

  if (!data.refresh_token) {
    console.error('\nERROR: No refresh_token in response. Make sure you added access_type=offline and prompted for consent.');
    console.error('Full response:', raw);
    process.exit(1);
  }

  console.log('\n✅  Success! Here is your refresh token:\n');
  console.log(data.refresh_token);
  console.log('\nNow run the following wrangler commands to store the secrets:\n');
  console.log(`  wrangler secret put GMAIL_CLIENT_ID --name gmail-sync`);
  console.log(`  # (paste your client ID when prompted)`);
  console.log(`  wrangler secret put GMAIL_CLIENT_SECRET --name gmail-sync`);
  console.log(`  # (paste your client secret when prompted)`);
  console.log(`  wrangler secret put GMAIL_REFRESH_TOKEN --name gmail-sync`);
  console.log(`  # (paste the refresh token above when prompted)`);
  console.log('');
}

async function main(): Promise<void> {
  const consentUrl =
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${encodeURIComponent(CLIENT_ID!)}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(SCOPE)}` +
    `&access_type=offline` +
    `&prompt=consent`;

  console.log('\n📧  Gmail OAuth helper — Monmouth Show Runner\n');
  console.log('Open this URL in your browser to grant access:\n');
  console.log(consentUrl);
  console.log('\nWaiting for the OAuth callback on http://localhost:3000/callback …\n');

  await new Promise<void>((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      const parsed = url.parse(req.url ?? '', true);

      if (parsed.pathname !== '/callback') {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const code = parsed.query['code'];
      const error = parsed.query['error'];

      if (error) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(`<h1>OAuth Error</h1><p>${String(error)}</p><p>You can close this tab.</p>`);
        server.close();
        reject(new Error(`OAuth error: ${String(error)}`));
        return;
      }

      if (!code || typeof code !== 'string') {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end('<h1>Missing code parameter</h1><p>You can close this tab.</p>');
        server.close();
        reject(new Error('Missing code parameter in callback'));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<h1>✅ Authorization granted!</h1><p>You can close this tab and return to your terminal.</p>');

      server.close();
      try {
        await exchangeCode(code);
        resolve();
      } catch (err) {
        reject(err);
      }
    });

    server.on('error', (err) => {
      reject(new Error(`Failed to start local server: ${err.message}`));
    });

    server.listen(3000, '127.0.0.1');
  });
}

main().catch((err) => {
  console.error('\nFATAL:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
