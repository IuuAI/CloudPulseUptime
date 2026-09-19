import { db, StoredMonitor } from './db';

// SSRF Safety Validation
export function isSafeUrl(urlString: string): boolean {
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
      (hostname.startsWith('172.') &&
        parseInt(hostname.split('.')[1] || '0', 10) >= 16 &&
        parseInt(hostname.split('.')[1] || '0', 10) <= 31)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// Single monitor probe execution with timing, error capture, and SLA metrics
export async function executeProbeForMonitor(monitor: StoredMonitor) {
  if (monitor.isPaused || !monitor.url) return null;

  // SSRF check
  if (!isSafeUrl(monitor.url)) {
    console.warn(`[Checker SSRF Block] Disallowed private target URL: ${monitor.url}`);
    return null;
  }

  const startTime = Date.now();
  let status: 'operational' | 'degraded' | 'down' = 'operational';
  let latencyMs = 0;
  let statusCode = 0;
  let errorMsg: string | null = null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), monitor.timeoutMs || 5000);

  try {
    const res = await fetch(monitor.url, {
      method: 'GET',
      headers: {
        'User-Agent': 'CloudPulse-UPtime/2.0 (Cloudflare Edge Worker Probe)',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    latencyMs = Date.now() - startTime;
    statusCode = res.status;

    if (
      statusCode >= 400 ||
      (monitor.expectedStatus && statusCode !== monitor.expectedStatus)
    ) {
      status = 'down';
    } else if (latencyMs > 800) {
      status = 'degraded';
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    latencyMs = Date.now() - startTime;
    status = 'down';
    errorMsg = err.name === 'AbortError' ? 'Connection Timeout' : err.message || 'Network unreachable';
  }

  // Record to check_results database table
  const result = db.addCheckResult({
    monitorId: monitor.id,
    timestamp: startTime,
    status,
    latencyMs,
    statusCode,
    region: 'CF-EDGE',
    errorMessage: errorMsg,
  });

  // Check and dispatch Telegram alert with KV Debounce Lock (15 mins)
  if (status === 'down') {
    const lockKey = `alert_lock:${monitor.id}:down`;
    const isLocked = db.kvGet(lockKey);
    const systemConfig = db.getSystemConfig();
    const botToken = process.env.TELEGRAM_BOT_TOKEN || systemConfig.telegramBotToken;
    const chatId = process.env.TELEGRAM_CHAT_ID || systemConfig.telegramChatId;

    if (!isLocked && botToken && chatId) {
      db.kvPut(lockKey, 'locked', 900); // Lock for 15 minutes to prevent alert storms
      try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: `🚨 <b>[CloudPulse 边缘告警] 节点异常告警</b>\n\n` +
              `• <b>服务</b>: ${monitor.name}\n` +
              `• <b>地址</b>: ${monitor.url}\n` +
              `• <b>状态</b>: 🔴 离线 (HTTP ${statusCode || 'Timeout'})\n` +
              `• <b>延迟</b>: ${latencyMs} ms\n` +
              `• <b>时间</b>: ${new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC\n` +
              `• <b>防抖</b>: 已启动 15 分钟抑制锁，避免重复告警`,
            parse_mode: 'HTML',
          }),
        });
        console.log(`[Telegram Alert Sent] Monitor ${monitor.name} is down.`);
      } catch (e) {
        console.error('[Telegram Alert Failed]', e);
      }
    }
  }

  return result;
}

// Background scheduler loop (Worker Cron emulation in Node)
let cronIntervalId: NodeJS.Timeout | null = null;

export function startBackgroundChecker(intervalSeconds = 60) {
  if (cronIntervalId) {
    clearInterval(cronIntervalId);
  }

  console.log(`[CloudPulse Engine] Background Workers Cron Trigger started (Interval: ${intervalSeconds}s)`);

  const runAll = async () => {
    const monitors = db.getMonitors().filter((m) => !m.isPaused);
    if (monitors.length === 0) return;

    await Promise.allSettled(monitors.map((m) => executeProbeForMonitor(m)));
  };

  // Run initial scan after 5 seconds
  setTimeout(runAll, 5000);

  // Repeat every intervalSeconds
  cronIntervalId = setInterval(runAll, intervalSeconds * 1000);
}

export function stopBackgroundChecker() {
  if (cronIntervalId) {
    clearInterval(cronIntervalId);
    cronIntervalId = null;
  }
}
