import { Hono } from 'hono';
import { cors } from 'hono/cors';

// Cloudflare Worker & D1/KV ambient type definitions
export interface D1Database {
  prepare(query: string): {
    bind(...values: any[]): any;
    all<T = any>(): Promise<{ results: T[] }>;
    first<T = any>(colName?: string): Promise<T | null>;
    run(): Promise<{ success: boolean; meta: any }>;
  };
  batch(statements: any[]): Promise<any[]>;
  exec(query: string): Promise<any>;
}

export interface KVNamespace {
  get(key: string, type?: string): Promise<any>;
  put(key: string, value: string | ArrayBuffer | ReadableStream, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface ScheduledEvent {
  cron: string;
  scheduledTime: number;
}

export interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  AI_QUEUE?: any;
  GEMINI_API_KEY?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  CF_API_TOKEN?: string;
  ADMIN_PASSWORD_HASH?: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

// SSRF Safety Filter
function isSafeUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname === '169.254.169.254' ||
      (hostname.startsWith('172.') && parseInt(hostname.split('.')[1] || '0', 10) >= 16 && parseInt(hostname.split('.')[1] || '0', 10) <= 31)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// 1. Health check endpoint
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    runtime: 'Cloudflare Workers (Edge Engine)',
    timestamp: Date.now(),
  });
});

// 2. Fetch all monitors (Cached by KV with D1 fallback)
app.get('/api/monitors', async (c) => {
  // Check KV cache first for high speed read
  const cached = await c.env.KV?.get('status:monitors_overview', 'json');
  if (cached) {
    return c.json(cached);
  }

  const { results: monitors } = await c.env.DB.prepare(
    'SELECT * FROM monitors ORDER BY created_at DESC'
  ).all();

  // Parse JSON fields
  const formatted = (monitors || []).map((m: any) => ({
    ...m,
    tags: typeof m.tags === 'string' ? JSON.parse(m.tags || '[]') : m.tags,
    isPaused: Boolean(m.is_paused),
    expectedStatus: m.expected_status_code,
    uptime24h: m.uptime_24h,
    uptime30d: m.uptime_30d,
    avgLatencyMs: m.avg_latency_ms,
    lastCheckedAt: m.last_checked_at,
    intervalSeconds: m.interval_seconds,
  }));

  const payload = { success: true, monitors: formatted };
  await c.env.KV?.put('status:monitors_overview', JSON.stringify(payload), { expirationTtl: 15 });
  return c.json(payload);
});

// 3. Create or update monitor
app.post('/api/monitors', async (c) => {
  const body = await c.req.json();
  const { id, name, url, type = 'http', intervalSeconds = 60, timeoutMs = 5000, expectedStatus = 200, group = 'Default', tags = [], notes = '' } = body;

  if (!name || !url) {
    return c.json({ success: false, error: '监控名称与目标 URL 不能为空' }, 400);
  }

  if (!isSafeUrl(url)) {
    return c.json({ success: false, error: '安全限制: 目标 URL 禁止指向私有内网或保留地址 (SSRF Protection)' }, 400);
  }

  const monitorId = id || `mon-${Date.now()}`;
  const now = Date.now();

  await c.env.DB.prepare(`
    INSERT INTO monitors (
      id, name, url, type, status, interval_seconds, timeout_ms, expected_status_code,
      group_name, tags, is_paused, uptime_24h, uptime_30d, avg_latency_ms, last_checked_at,
      notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 'operational', ?, ?, ?, ?, ?, 0, 100.0, 100.0, 30, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      url = excluded.url,
      type = excluded.type,
      interval_seconds = excluded.interval_seconds,
      timeout_ms = excluded.timeout_ms,
      expected_status_code = excluded.expected_status_code,
      group_name = excluded.group_name,
      tags = excluded.tags,
      notes = excluded.notes,
      updated_at = excluded.updated_at
  `).bind(
    monitorId, name, url, type, intervalSeconds, timeoutMs, expectedStatus,
    group, JSON.stringify(tags), now, notes, now, now
  ).run();

  await c.env.KV?.delete('status:monitors_overview');
  return c.json({ success: true, monitorId });
});

// 4. Delete monitor
app.delete('/api/monitors/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM monitors WHERE id = ?').bind(id).run();
  await c.env.DB.prepare('DELETE FROM check_results WHERE monitor_id = ?').bind(id).run();
  await c.env.KV?.delete('status:monitors_overview');
  return c.json({ success: true });
});

// 5. Active probe check single URL endpoint
app.post('/api/check', async (c) => {
  const { url, timeoutMs = 8000, expectedStatus = 200 } = await c.req.json();

  if (!url || !isSafeUrl(url)) {
    return c.json({ success: false, error: '目标 URL 不合法或命中了 SSRF 防护策略' }, 400);
  }

  const startTime = Date.now();
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'CloudPulse-UPtime/2.0 (Cloudflare Edge Worker)',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    const latencyMs = Date.now() - startTime;
    const isExpected = response.status === expectedStatus || (response.status >= 200 && response.status < 400);

    let status: 'operational' | 'degraded' | 'down' = 'operational';
    if (!isExpected) {
      status = 'down';
    } else if (latencyMs > 800) {
      status = 'degraded';
    }

    return c.json({
      ok: isExpected,
      statusCode: response.status,
      statusText: response.statusText,
      latencyMs,
      status,
      url,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return c.json({
      ok: false,
      statusCode: 0,
      statusText: err.message || 'Connection Timeout',
      latencyMs,
      status: 'down',
      url,
      timestamp: Date.now(),
      error: err.message,
    });
  }
});

// 6. Incident Management APIs
app.get('/api/incidents', async (c) => {
  const { results: incidents } = await c.env.DB.prepare(`
    SELECT * FROM incidents ORDER BY created_at DESC LIMIT 50
  `).all();

  const incidentIds = (incidents || []).map((i: any) => i.id);
  let allUpdates: any[] = [];
  if (incidentIds.length > 0) {
    const placeholders = incidentIds.map(() => '?').join(',');
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM incident_updates WHERE incident_id IN (${placeholders}) ORDER BY timestamp ASC
    `).bind(...incidentIds).all();
    allUpdates = results || [];
  }

  const formatted = (incidents || []).map((inc: any) => ({
    id: inc.id,
    monitorId: inc.monitor_id,
    monitorName: inc.monitor_name,
    title: inc.title,
    severity: inc.severity,
    status: inc.status,
    summary: inc.summary,
    createdAt: inc.created_at,
    resolvedAt: inc.resolved_at,
    updates: allUpdates.filter((u: any) => u.incident_id === inc.id).map((u: any) => ({
      timestamp: u.timestamp,
      status: u.status,
      message: u.message,
    })),
  }));

  return c.json({ success: true, incidents: formatted });
});

// 7. Edge Nodes Telemetry
app.get('/api/nodes', async (c) => {
  const { results: nodes } = await c.env.DB.prepare('SELECT * FROM edge_nodes').all();
  const formatted = (nodes || []).map((n: any) => ({
    code: n.code,
    name: n.name,
    city: n.city,
    country: n.country,
    flag: n.flag,
    region: n.region,
    ip: n.ip,
    maskedIp: n.masked_ip,
    provider: n.provider,
    avgLatencyMs: n.avg_latency_ms,
    status: n.status,
    cpuUsage: n.cpu_usage,
    memUsage: n.mem_usage,
    loadAvg: n.load_avg,
    uptimeDays: n.uptime_days,
    probeVersion: n.probe_version,
    lastSyncAt: n.last_sync_at,
    probeSecret: n.probe_secret,
    probeType: n.probe_type,
  }));
  return c.json({ success: true, nodes: formatted });
});

// Single active monitor probe execution logic
async function runProbeForMonitor(monitor: any, env: Env) {
  if (!monitor.url || !isSafeUrl(monitor.url)) return;

  const startTime = Date.now();
  let status: 'operational' | 'degraded' | 'down' = 'operational';
  let latencyMs = 0;
  let statusCode = 0;
  let errorMsg = null;

  try {
    const res = await fetch(monitor.url, {
      method: 'GET',
      headers: { 'User-Agent': 'CloudPulse-UPtime/2.0 (Cloudflare Edge Worker)' },
      signal: AbortSignal.timeout(monitor.timeout_ms || 5000),
    });
    latencyMs = Date.now() - startTime;
    statusCode = res.status;

    if (statusCode >= 400 || (monitor.expected_status_code && statusCode !== monitor.expected_status_code)) {
      status = 'down';
    } else if (latencyMs > 800) {
      status = 'degraded';
    }
  } catch (err: any) {
    latencyMs = Date.now() - startTime;
    status = 'down';
    errorMsg = err.message || 'Connection Timeout';
  }

  // Record to D1 check_results
  await env.DB.prepare(`
    INSERT INTO check_results (monitor_id, timestamp, status, latency_ms, status_code, region, error_message)
    VALUES (?, ?, ?, ?, ?, 'CF-EDGE', ?)
  `).bind(monitor.id, startTime, status, latencyMs, statusCode, errorMsg).run();

  // Update current monitor status & latency in D1
  await env.DB.prepare(`
    UPDATE monitors SET
      status = ?,
      avg_latency_ms = ROUND((avg_latency_ms * 0.7) + (? * 0.3)),
      last_checked_at = ?
    WHERE id = ?
  `).bind(status, latencyMs, startTime, monitor.id).run();

  // Alert with KV Debounce lock
  if (status === 'down' && env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    const lockKey = `alert_lock:${monitor.id}:down`;
    const isLocked = await env.KV?.get(lockKey);
    if (!isLocked) {
      await env.KV?.put(lockKey, 'locked', { expirationTtl: 900 }); // 15 mins lock
      try {
        await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: env.TELEGRAM_CHAT_ID,
            text: `🚨 <b>[CloudPulse 边缘告警] 节点异常告警</b>\n\n• <b>服务</b>: ${monitor.name}\n• <b>地址</b>: ${monitor.url}\n• <b>状态</b>: 🔴 离线 (HTTP ${statusCode || 'Timeout'})\n• <b>延迟</b>: ${latencyMs}ms\n• <b>时间</b>: ${new Date().toISOString()}`,
            parse_mode: 'HTML',
          }),
        });
      } catch (e) {
        console.error('Telegram push failed', e);
      }
    }
  }
}

export default {
  fetch: app.fetch,

  // Workers Cron Trigger (Triggered every minute by Cloudflare)
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil((async () => {
      const { results: activeMonitors } = await env.DB.prepare(
        'SELECT * FROM monitors WHERE is_paused = 0'
      ).all();

      if (activeMonitors && activeMonitors.length > 0) {
        await Promise.allSettled(
          activeMonitors.map((m: any) => runProbeForMonitor(m, env))
        );
        await env.KV?.delete('status:monitors_overview');
      }
    })());
  },
};
