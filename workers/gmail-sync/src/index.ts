// Gmail sync cron Worker — runs every 15 minutes.
// Refreshes OAuth token, queries Gmail, upserts matching threads/messages into D1.

interface Env {
  DB: D1Database;
  GMAIL_CLIENT_ID: string;
  GMAIL_CLIENT_SECRET: string;
  GMAIL_REFRESH_TOKEN: string;
}

// ---------------------------------------------------------------------------
// Types for Gmail API responses
// ---------------------------------------------------------------------------

interface GmailHeader {
  name: string;
  value: string;
}

interface GmailMessagePart {
  mimeType: string;
  body: { data?: string; size: number };
  parts?: GmailMessagePart[];
}

interface GmailMessage {
  id: string;
  threadId: string;
  payload: {
    headers: GmailHeader[];
    mimeType: string;
    body: { data?: string; size: number };
    parts?: GmailMessagePart[];
  };
  snippet: string;
  internalDate: string; // epoch ms as string
}

interface GmailThread {
  id: string;
  snippet: string;
  messages: GmailMessage[];
}

interface GmailThreadListItem {
  id: string;
  snippet: string;
}

interface GmailThreadListResponse {
  threads?: GmailThreadListItem[];
  nextPageToken?: string;
}

// ---------------------------------------------------------------------------
// OAuth helpers
// ---------------------------------------------------------------------------

async function getAccessToken(env: Env): Promise<string> {
  const params = new URLSearchParams({
    client_id: env.GMAIL_CLIENT_ID,
    client_secret: env.GMAIL_CLIENT_SECRET,
    refresh_token: env.GMAIL_REFRESH_TOKEN,
    grant_type: 'refresh_token',
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to refresh access token (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { access_token?: string; error?: string };
  if (!data.access_token) {
    throw new Error(`No access_token in token response: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

// ---------------------------------------------------------------------------
// Gmail API helpers
// ---------------------------------------------------------------------------

async function gmailGet<T>(path: string, accessToken: string): Promise<T> {
  const res = await fetch(`https://gmail.googleapis.com${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gmail API error ${res.status} for ${path}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Message parsing helpers
// ---------------------------------------------------------------------------

const MAX_BODY_BYTES = 50_000;

function decodeBase64Url(data: string): string {
  // base64url → base64
  const b64 = data.replace(/-/g, '+').replace(/_/g, '/');
  try {
    return atob(b64);
  } catch {
    return '';
  }
}

function extractBodies(
  part: GmailMessagePart | GmailMessage['payload'],
  result: { text: string; html: string },
): void {
  if (part.mimeType === 'text/plain' && part.body.data && result.text.length < MAX_BODY_BYTES) {
    result.text += decodeBase64Url(part.body.data).slice(0, MAX_BODY_BYTES - result.text.length);
  } else if (part.mimeType === 'text/html' && part.body.data && result.html.length < MAX_BODY_BYTES) {
    result.html += decodeBase64Url(part.body.data).slice(0, MAX_BODY_BYTES - result.html.length);
  }

  if ('parts' in part && part.parts) {
    for (const child of part.parts) {
      extractBodies(child, result);
    }
  }
}

function getHeader(headers: GmailHeader[], name: string): string {
  const lower = name.toLowerCase();
  return headers.find((h) => h.name.toLowerCase() === lower)?.value ?? '';
}

function parseAddresses(raw: string): string[] {
  // Very simple — split on comma, strip display names, extract email-like tokens
  return raw
    .split(',')
    .map((part) => {
      const match = part.match(/<([^>]+)>/) ?? part.match(/([^\s,]+@[^\s,]+)/);
      return match ? (match[1] ?? '').trim().toLowerCase() : '';
    })
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// D1 upsert helpers
// ---------------------------------------------------------------------------

async function upsertThread(
  db: D1Database,
  gmailThreadId: string,
  subject: string,
  participants: string[],
  lastMessageAt: string,
  snippet: string,
): Promise<number> {
  const now = new Date().toISOString();
  const participantsJson = JSON.stringify(participants);

  // Try insert; on conflict update
  await db
    .prepare(
      `INSERT INTO email_threads (gmail_thread_id, subject, participants, last_message_at, snippet, synced_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(gmail_thread_id) DO UPDATE SET
         subject = excluded.subject,
         participants = excluded.participants,
         last_message_at = excluded.last_message_at,
         snippet = excluded.snippet,
         synced_at = excluded.synced_at`,
    )
    .bind(gmailThreadId, subject, participantsJson, lastMessageAt, snippet, now)
    .run();

  const row = await db
    .prepare(`SELECT id FROM email_threads WHERE gmail_thread_id = ?`)
    .bind(gmailThreadId)
    .first<{ id: number }>();

  if (!row) throw new Error(`Thread row missing after upsert: ${gmailThreadId}`);
  return row.id;
}

async function upsertMessage(
  db: D1Database,
  threadId: number,
  gmailMessageId: string,
  fromAddr: string,
  toAddrs: string[],
  subject: string,
  bodyHtml: string | null,
  bodyText: string | null,
  sentAt: string,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO email_messages (thread_id, gmail_message_id, from_addr, to_addrs, subject, body_html, body_text, sent_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(gmail_message_id) DO UPDATE SET
         from_addr = excluded.from_addr,
         to_addrs = excluded.to_addrs,
         subject = excluded.subject,
         body_html = excluded.body_html,
         body_text = excluded.body_text,
         sent_at = excluded.sent_at`,
    )
    .bind(
      threadId,
      gmailMessageId,
      fromAddr,
      JSON.stringify(toAddrs),
      subject,
      bodyHtml,
      bodyText,
      sentAt,
    )
    .run();
}

// ---------------------------------------------------------------------------
// Main sync logic
// ---------------------------------------------------------------------------

async function sync(env: Env): Promise<void> {
  // 1. Read settings from D1
  const labelRow = await env.DB.prepare(`SELECT value FROM settings WHERE key = 'gmail_label'`)
    .first<{ value: string }>();
  const contactsRow = await env.DB.prepare(`SELECT value FROM settings WHERE key = 'gmail_contacts'`)
    .first<{ value: string }>();

  const gmailLabel: string = labelRow?.value ?? '';
  const contacts: string[] = contactsRow?.value
    ? (JSON.parse(contactsRow.value) as string[])
    : [];

  // 2. Build search query
  const queryParts: string[] = [];
  if (gmailLabel) queryParts.push(`label:${gmailLabel}`);
  for (const contact of contacts) {
    queryParts.push(`from:${contact}`);
  }

  if (queryParts.length === 0) {
    console.log('[gmail-sync] No gmail_label or gmail_contacts configured — skipping sync.');
    return;
  }

  const query = queryParts.join(' OR ');
  console.log(`[gmail-sync] Search query: ${query}`);

  // 3. Get access token
  const accessToken = await getAccessToken(env);

  // 4. List threads
  const listPath = `/gmail/v1/users/me/threads?q=${encodeURIComponent(query)}&maxResults=50`;
  const listResponse = await gmailGet<GmailThreadListResponse>(listPath, accessToken);

  const threadItems = listResponse.threads ?? [];
  console.log(`[gmail-sync] Found ${threadItems.length} threads to sync`);

  let syncedThreads = 0;
  let syncedMessages = 0;

  // 5. Process each thread
  for (const item of threadItems) {
    try {
      const thread = await gmailGet<GmailThread>(
        `/gmail/v1/users/me/threads/${item.id}?format=full`,
        accessToken,
      );

      const messages = thread.messages ?? [];

      // Collect thread-level metadata
      const allParticipants = new Set<string>();
      let subject = '';
      let lastMessageAt = new Date(0).toISOString();

      for (const msg of messages) {
        const headers = msg.payload?.headers ?? [];
        const fromHeader = getHeader(headers, 'From');
        const toHeader = getHeader(headers, 'To');

        for (const addr of parseAddresses(fromHeader)) allParticipants.add(addr);
        for (const addr of parseAddresses(toHeader)) allParticipants.add(addr);

        const msgSubject = getHeader(headers, 'Subject');
        if (msgSubject && !subject) subject = msgSubject;

        // internalDate is epoch ms
        const msgDate = new Date(Number(msg.internalDate)).toISOString();
        if (msgDate > lastMessageAt) lastMessageAt = msgDate;
      }

      // Upsert thread
      const threadId = await upsertThread(
        env.DB,
        thread.id,
        subject || '(no subject)',
        Array.from(allParticipants),
        lastMessageAt,
        thread.snippet ?? '',
      );

      syncedThreads++;

      // 6. Upsert each message
      for (const msg of messages) {
        const headers = msg.payload?.headers ?? [];
        const fromAddr = getHeader(headers, 'From');
        const toAddrs = parseAddresses(getHeader(headers, 'To'));
        const msgSubject = getHeader(headers, 'Subject') || subject || '(no subject)';

        // Parse body
        const bodies = { text: '', html: '' };
        if (msg.payload) {
          extractBodies(msg.payload, bodies);
        }

        // sentAt from Date header, fallback to internalDate
        const dateHeader = getHeader(headers, 'Date');
        let sentAt: string;
        if (dateHeader) {
          const parsed = new Date(dateHeader);
          sentAt = isNaN(parsed.getTime()) ? new Date(Number(msg.internalDate)).toISOString() : parsed.toISOString();
        } else {
          sentAt = new Date(Number(msg.internalDate)).toISOString();
        }

        await upsertMessage(
          env.DB,
          threadId,
          msg.id,
          fromAddr,
          toAddrs,
          msgSubject,
          bodies.html || null,
          bodies.text || null,
          sentAt,
        );

        syncedMessages++;
      }
    } catch (threadErr) {
      console.error(`[gmail-sync] Error processing thread ${item.id}:`, threadErr);
      // Continue with next thread
    }
  }

  console.log(`[gmail-sync] synced ${syncedThreads} threads, ${syncedMessages} messages`);
}

// ---------------------------------------------------------------------------
// Worker export
// ---------------------------------------------------------------------------

export default {
  async scheduled(_event: ScheduledController, env: Env, _ctx: ExecutionContext): Promise<void> {
    console.log('[gmail-sync] cron triggered at', new Date().toISOString());
    try {
      await sync(env);
    } catch (err) {
      console.error('[gmail-sync] Sync failed:', err instanceof Error ? err.message : String(err));
    }
  },
} satisfies ExportedHandler<Env>;
