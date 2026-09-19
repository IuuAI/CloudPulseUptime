import { Monitor, Incident, GlobalNode, StatusPageConfig, AlertWebhookConfig, SlaBar, CheckHistoryPoint, EdgeLatency } from '../types';

// Helper to generate 90-day SLA bars with realistic uptime data
export function generate90DaySlaBars(overallUptimePct: number = 99.95, avgLat: number = 42): SlaBar[] {
  const bars: SlaBar[] = [];
  const now = new Date();

  for (let i = 89; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];

    // Introduce random minor variance or rare outage
    const isDegraded = i === 12 || i === 45;
    const isOutage = i === 68 && overallUptimePct < 99.8;

    let status: 'operational' | 'degraded' | 'down' | 'no_data' = 'operational';
    let uptimePct = 100;
    let avgLatency = Math.round(avgLat + (Math.random() * 10 - 5));

    if (isOutage) {
      status = 'down';
      uptimePct = 82.5;
      avgLatency = Math.round(avgLat * 4.2);
    } else if (isDegraded) {
      status = 'degraded';
      uptimePct = 96.8;
      avgLatency = Math.round(avgLat * 2.8);
    }

    bars.push({
      date: dateStr,
      status,
      uptimePct,
      avgLatency,
      checksCount: 1440,
    });
  }

  return bars;
}

// Helper to generate 24-hour check history points
export function generateCheckHistory(pointsCount = 30, baseLatency = 38): CheckHistoryPoint[] {
  const points: CheckHistoryPoint[] = [];
  const now = Date.now();
  const interval = (24 * 60 * 60 * 1000) / pointsCount;

  for (let i = pointsCount - 1; i >= 0; i--) {
    const timestamp = now - i * interval;
    const spike = i === 5 ? 180 : (i === 18 ? 120 : 0);
    const latencyMs = Math.round(baseLatency + Math.random() * 12 + spike);
    const isDown = latencyMs > 300;

    points.push({
      timestamp,
      latencyMs,
      statusCode: isDown ? 502 : 200,
      status: isDown ? 'degraded' : 'operational',
    });
  }

  return points;
}

// Global Cloudflare Edge Nodes telemetry
export const initialGlobalNodes: GlobalNode[] = [
  {
    code: 'SJC',
    name: 'San Jose Silicon Valley POP',
    city: 'San Jose',
    country: 'United States',
    flag: '🇺🇸',
    region: 'North America',
    avgLatencyMs: 18,
    status: 'operational',
    ip: '104.28.19.42',
    maskedIp: '104.28.***.***',
    provider: 'Cloudflare Anycast POP (SJC-01)',
    cpuUsage: 14,
    memUsage: 32,
    loadAvg: '0.18, 0.12, 0.08',
    uptimeDays: 248,
    probeVersion: 'v1.5.2-edge',
    lastSyncAt: Date.now() - 6000,
    probeSecret: 'cp_probe_sjc_9941a',
    probeType: 'cloudflare_worker',
  },
  {
    code: 'HKG',
    name: 'Hong Kong Chai Wan Edge Node',
    city: 'Hong Kong',
    country: 'Hong Kong SAR',
    flag: '🇭🇰',
    region: 'Asia Pacific',
    avgLatencyMs: 24,
    status: 'operational',
    ip: '103.21.244.68',
    maskedIp: '103.21.***.***',
    provider: 'Cloudflare Anycast POP (HKG-02)',
    cpuUsage: 22,
    memUsage: 41,
    loadAvg: '0.34, 0.28, 0.21',
    uptimeDays: 186,
    probeVersion: 'v1.5.2-edge',
    lastSyncAt: Date.now() - 4000,
    probeSecret: 'cp_probe_hkg_8120b',
    probeType: 'cloudflare_worker',
  },
  {
    code: 'TYO',
    name: 'Tokyo Otemachi Core Node',
    city: 'Tokyo',
    country: 'Japan',
    flag: '🇯🇵',
    region: 'Asia Pacific',
    avgLatencyMs: 36,
    status: 'operational',
    ip: '141.101.120.15',
    maskedIp: '141.101.***.***',
    provider: 'Cloudflare Anycast POP (TYO-03)',
    cpuUsage: 19,
    memUsage: 38,
    loadAvg: '0.22, 0.19, 0.15',
    uptimeDays: 312,
    probeVersion: 'v1.5.2-edge',
    lastSyncAt: Date.now() - 9000,
    probeSecret: 'cp_probe_tyo_7233c',
    probeType: 'cloudflare_worker',
  },
  {
    code: 'SIN',
    name: 'Singapore Jurong POP',
    city: 'Singapore',
    country: 'Singapore',
    flag: '🇸🇬',
    region: 'Asia Pacific',
    avgLatencyMs: 32,
    status: 'operational',
    ip: '108.162.238.102',
    maskedIp: '108.162.***.***',
    provider: 'Cloudflare Anycast POP (SIN-01)',
    cpuUsage: 16,
    memUsage: 29,
    loadAvg: '0.15, 0.11, 0.09',
    uptimeDays: 195,
    probeVersion: 'v1.5.2-edge',
    lastSyncAt: Date.now() - 8000,
    probeSecret: 'cp_probe_sin_3389d',
    probeType: 'cloudflare_worker',
  },
  {
    code: 'FRA',
    name: 'Frankfurt Main Data Center',
    city: 'Frankfurt',
    country: 'Germany',
    flag: '🇩🇪',
    region: 'Europe',
    avgLatencyMs: 29,
    status: 'operational',
    ip: '172.67.180.95',
    maskedIp: '172.67.***.***',
    provider: 'Cloudflare Anycast POP (FRA-02)',
    cpuUsage: 18,
    memUsage: 35,
    loadAvg: '0.24, 0.18, 0.14',
    uptimeDays: 280,
    probeVersion: 'v1.5.2-edge',
    lastSyncAt: Date.now() - 11000,
    probeSecret: 'cp_probe_fra_4412e',
    probeType: 'cloudflare_worker',
  },
  {
    code: 'LHR',
    name: 'London Docklands Gateway',
    city: 'London',
    country: 'United Kingdom',
    flag: '🇬🇧',
    region: 'Europe',
    avgLatencyMs: 26,
    status: 'operational',
    ip: '104.16.132.8',
    maskedIp: '104.16.***.***',
    provider: 'Cloudflare Anycast POP (LHR-01)',
    cpuUsage: 15,
    memUsage: 31,
    loadAvg: '0.19, 0.14, 0.11',
    uptimeDays: 164,
    probeVersion: 'v1.5.2-edge',
    lastSyncAt: Date.now() - 5000,
    probeSecret: 'cp_probe_lhr_5581f',
    probeType: 'cloudflare_worker',
  },
  {
    code: 'SYD',
    name: 'Sydney Alexandria POP',
    city: 'Sydney',
    country: 'Australia',
    flag: '🇦🇺',
    region: 'Oceania',
    avgLatencyMs: 105,
    status: 'operational',
    ip: '162.158.88.23',
    maskedIp: '162.158.***.***',
    provider: 'Cloudflare Anycast POP (SYD-01)',
    cpuUsage: 12,
    memUsage: 27,
    loadAvg: '0.10, 0.08, 0.05',
    uptimeDays: 142,
    probeVersion: 'v1.5.2-edge',
    lastSyncAt: Date.now() - 15000,
    probeSecret: 'cp_probe_syd_6620g',
    probeType: 'cloudflare_worker',
  },
  {
    code: 'GRU',
    name: 'São Paulo Tamboré POP',
    city: 'São Paulo',
    country: 'Brazil',
    flag: '🇧🇷',
    region: 'South America',
    avgLatencyMs: 132,
    status: 'operational',
    ip: '198.41.214.19',
    maskedIp: '198.41.***.***',
    provider: 'Cloudflare Anycast POP (GRU-01)',
    cpuUsage: 25,
    memUsage: 44,
    loadAvg: '0.38, 0.29, 0.22',
    uptimeDays: 98,
    probeVersion: 'v1.5.2-edge',
    lastSyncAt: Date.now() - 14000,
    probeSecret: 'cp_probe_gru_7739h',
    probeType: 'cloudflare_worker',
  },
];

export const initialMonitors: Monitor[] = [
  {
    id: 'mon-1',
    name: 'Cloudflare Worker Gateway API',
    url: 'https://api.cloudflare.com/client/v4/health',
    type: 'cloudflare_worker',
    status: 'operational',
    uptime24h: 100,
    uptime30d: 99.98,
    avgLatencyMs: 24,
    lastCheckedAt: Date.now() - 15000,
    intervalSeconds: 30,
    expectedStatus: 200,
    group: 'Edge Core API',
    tags: ['Cloudflare', 'Serverless', 'Critical'],
    history: generateCheckHistory(24, 22),
    slaBars: generate90DaySlaBars(99.98, 24),
    sslInfo: {
      domain: 'api.cloudflare.com',
      issuer: 'Cloudflare Inc ECC CA-3',
      validFrom: '2026-01-01',
      validTo: '2027-01-01',
      daysRemaining: 106,
      isValid: true,
    },
    edgeNodes: [
      { nodeCode: 'SJC', location: 'San Jose, USA', flag: '🇺🇸', latencyMs: 14, status: 'ok' },
      { nodeCode: 'FRA', location: 'Frankfurt, GER', flag: '🇩🇪', latencyMs: 26, status: 'ok' },
      { nodeCode: 'SIN', location: 'Singapore', flag: '🇸🇬', latencyMs: 32, status: 'ok' },
      { nodeCode: 'TYO', location: 'Tokyo, JPN', flag: '🇯🇵', latencyMs: 28, status: 'ok' },
    ],
    notes: 'Primary Edge API Worker routing global authentication & key-value cache tokens.',
  },
  {
    id: 'mon-2',
    name: 'CloudPulse Main Web Console',
    url: 'https://cloudpulse-uptime.internal.app',
    type: 'http',
    status: 'operational',
    uptime24h: 99.95,
    uptime30d: 99.91,
    avgLatencyMs: 45,
    lastCheckedAt: Date.now() - 25000,
    intervalSeconds: 60,
    expectedStatus: 200,
    group: 'Web Dashboards',
    tags: ['React', 'Frontend', 'Dashboard'],
    history: generateCheckHistory(24, 42),
    slaBars: generate90DaySlaBars(99.91, 45),
    sslInfo: {
      domain: 'cloudpulse-uptime.internal.app',
      issuer: "Let's Encrypt Authority X3",
      validFrom: '2026-06-15',
      validTo: '2026-11-15',
      daysRemaining: 58,
      isValid: true,
    },
    edgeNodes: [
      { nodeCode: 'SJC', location: 'San Jose, USA', flag: '🇺🇸', latencyMs: 22, status: 'ok' },
      { nodeCode: 'LHR', location: 'London, UK', flag: '🇬🇧', latencyMs: 38, status: 'ok' },
      { nodeCode: 'HKG', location: 'Hong Kong', flag: '🇭🇰', latencyMs: 52, status: 'ok' },
    ],
    notes: 'React Single Page App hosting global status monitors and admin management portal.',
  },
  {
    id: 'mon-3',
    name: 'Cloudflare D1 Primary DB Cluster',
    url: 'https://d1-database.cloudpulse.net/healthz',
    type: 'cloudflare_worker',
    status: 'operational',
    uptime24h: 100,
    uptime30d: 99.99,
    avgLatencyMs: 19,
    lastCheckedAt: Date.now() - 8000,
    intervalSeconds: 15,
    expectedStatus: 200,
    group: 'Edge Core API',
    tags: ['D1', 'Database', 'Cloudflare'],
    history: generateCheckHistory(24, 18),
    slaBars: generate90DaySlaBars(99.99, 19),
    edgeNodes: [
      { nodeCode: 'SJC', location: 'San Jose, USA', flag: '🇺🇸', latencyMs: 12, status: 'ok' },
      { nodeCode: 'FRA', location: 'Frankfurt, GER', flag: '🇩🇪', latencyMs: 20, status: 'ok' },
      { nodeCode: 'SIN', location: 'Singapore', flag: '🇸🇬', latencyMs: 24, status: 'ok' },
    ],
  },
  {
    id: 'mon-4',
    name: 'SSL Cert Monitor - cloudpulse.net',
    url: 'https://cloudpulse.net',
    type: 'ssl',
    status: 'operational',
    uptime24h: 100,
    uptime30d: 100,
    avgLatencyMs: 31,
    lastCheckedAt: Date.now() - 40000,
    intervalSeconds: 300,
    group: 'SSL Protection',
    tags: ['Security', 'SSL', 'TLS 1.3'],
    history: generateCheckHistory(24, 30),
    slaBars: generate90DaySlaBars(100, 31),
    sslInfo: {
      domain: 'cloudpulse.net',
      issuer: 'GTS CA 1P3 (Google Trust Services)',
      validFrom: '2026-03-01',
      validTo: '2027-03-01',
      daysRemaining: 165,
      isValid: true,
    },
    edgeNodes: [
      { nodeCode: 'SJC', location: 'San Jose, USA', flag: '🇺🇸', latencyMs: 18, status: 'ok' },
    ],
  },
  {
    id: 'mon-5',
    name: 'GitHub REST & Webhook Node',
    url: 'https://api.github.com/zen',
    type: 'http',
    status: 'operational',
    uptime24h: 99.88,
    uptime30d: 99.82,
    avgLatencyMs: 82,
    lastCheckedAt: Date.now() - 12000,
    intervalSeconds: 60,
    expectedStatus: 200,
    group: 'Third Party Integrations',
    tags: ['GitHub', 'API', 'Webhook'],
    history: generateCheckHistory(24, 80),
    slaBars: generate90DaySlaBars(99.82, 82),
    sslInfo: {
      domain: 'api.github.com',
      issuer: 'DigiCert TLS RSA SHA256 2020 CA1',
      validFrom: '2026-02-10',
      validTo: '2027-02-10',
      daysRemaining: 145,
      isValid: true,
    },
    edgeNodes: [
      { nodeCode: 'SJC', location: 'San Jose, USA', flag: '🇺🇸', latencyMs: 42, status: 'ok' },
      { nodeCode: 'LHR', location: 'London, UK', flag: '🇬🇧', latencyMs: 88, status: 'ok' },
      { nodeCode: 'TYO', location: 'Tokyo, JPN', flag: '🇯🇵', latencyMs: 110, status: 'ok' },
    ],
  },
  {
    id: 'mon-6',
    name: 'PostgreSQL Relational DB Port (5432)',
    url: 'db.cloudpulse.net:5432',
    type: 'port',
    status: 'operational',
    uptime24h: 100,
    uptime30d: 99.96,
    avgLatencyMs: 34,
    lastCheckedAt: Date.now() - 50000,
    intervalSeconds: 60,
    group: 'Edge Core API',
    tags: ['TCP', 'Database', 'Port 5432'],
    history: generateCheckHistory(24, 32),
    slaBars: generate90DaySlaBars(99.96, 34),
    edgeNodes: [
      { nodeCode: 'SJC', location: 'San Jose, USA', flag: '🇺🇸', latencyMs: 18, status: 'ok' },
      { nodeCode: 'FRA', location: 'Frankfurt, GER', flag: '🇩🇪', latencyMs: 48, status: 'ok' },
    ],
  },
];

export const initialIncidents: Incident[] = [
  {
    id: 'inc-101',
    monitorId: 'mon-5',
    monitorName: 'GitHub REST & Webhook Node',
    title: 'Upstream Rate Limiting & Brief Latency Spike',
    status: 'resolved',
    severity: 'minor',
    createdAt: Date.now() - 10000000,
    resolvedAt: Date.now() - 8200000,
    updates: [
      {
        timestamp: Date.now() - 10000000,
        message: '发现 GitHub API 部分 Webhook 回调响应延迟攀升至 450ms。团队正在分析。',
        status: 'investigating',
      },
      {
        timestamp: Date.now() - 9000000,
        message: '因 GitHub 节点发生短时 BGP 路由再收敛，造成部分区域抖动。',
        status: 'identified',
      },
      {
        timestamp: Date.now() - 8200000,
        message: '网络丢包率已恢复正常，所有 HTTP 请求 Latency 降低至 80ms 基础水平。',
        status: 'resolved',
      },
    ],
  },
];

export const initialStatusPageConfig: StatusPageConfig = {
  title: 'CloudPulse-UPtime 统一服务状态页',
  slug: 'global-status',
  description: '实时监测 Cloudflare Edge Workers、全网 API 及核心基础设施 SLA 运行状态。',
  isPublic: true,
  announcement: '🟢 所有核心云服务与 Edge Workers 节点当前正常运转，100% SLA 达标。',
  monitorIds: ['mon-1', 'mon-2', 'mon-3', 'mon-4', 'mon-5', 'mon-6'],
  supportEmail: 'ops@cloudpulse.net',
};

export const initialWebhooks: AlertWebhookConfig[] = [
  {
    id: 'wh-1',
    name: 'Discord 运维告警频道',
    type: 'discord',
    url: 'https://discord.com/api/webhooks/12345/cloudpulse-alerts',
    enabled: true,
  },
  {
    id: 'wh-2',
    name: 'Telegram 机器人推送',
    type: 'telegram',
    url: 'https://api.telegram.org/bot123456:ABC/sendMessage?chat_id=-100',
    enabled: true,
  },
];
