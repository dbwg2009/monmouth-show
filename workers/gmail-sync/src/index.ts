// Gmail sync cron Worker — full implementation in Phase 5.
// Runs every 15 minutes, refreshes OAuth token, queries Gmail,
// upserts matching threads/messages into D1.

interface Env {
  DB: D1Database;
  GMAIL_CLIENT_ID: string;
  GMAIL_CLIENT_SECRET: string;
  GMAIL_REFRESH_TOKEN: string;
}

export default {
  async scheduled(_event: ScheduledController, env: Env, _ctx: ExecutionContext): Promise<void> {
    console.log('[gmail-sync] cron triggered at', new Date().toISOString());
    // TODO Phase 5: refresh token → query Gmail → upsert D1
    void env; // suppress unused warning until Phase 5
  },
} satisfies ExportedHandler<Env>;
