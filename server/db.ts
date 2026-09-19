import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const STORE_PATH = path.join(DATA_DIR, 'db_store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface StoredMonitor {
  id: string;
  userId: string;
  name: string;
  url: string;
  type: 'http' | 'cloudflare_worker' | 'ssl' | 'port' | 'ping';
  status: 'operational' | 'degraded' | 'down' | 'paused';
  intervalSeconds: number;
  timeoutMs: number;
  expectedStatus: number;
  group: string;
  tags: string[];
  isPaused: boolean;
  uptime24h: number;
  uptime30d: number;
  avgLatencyMs: number;
  lastCheckedAt: number;
  notes?: string;
  sslDomain?: string;
  sslIssuer?: string;
  sslDaysRemaining?: number;
  createdAt: number;
  updatedAt: number;
}

export interface StoredCheckResult {
  id: number;
  monitorId: string;
  timestamp: number;
  status: 'operational' | 'degraded' | 'down';
  latencyMs: number;
  statusCode: number;
  region: string;
  errorMessage?: string | null;
}

export interface StoredIncidentUpdate {
  timestamp: number;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  message: string;
}

export interface StoredIncident {
  id: string;
  monitorId?: string;
  monitorName: string;
  title: string;
  severity: 'critical' | 'major' | 'minor';
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  summary?: string;
  createdAt: number;
  resolvedAt?: number;
  aiDiagnosed?: boolean;
  updates: StoredIncidentUpdate[];
}

export interface StoredEdgeNode {
  code: string;
  name: string;
  city: string;
  country: string;
  flag: string;
  region: string;
  ip: string;
  maskedIp: string;
  provider: string;
  avgLatencyMs: number;
  status: 'operational' | 'degraded' | 'offline';
  cpuUsage: number;
  memUsage: number;
  loadAvg: string;
  uptimeDays: number;
  probeVersion: string;
  lastSyncAt: number;
  probeSecret: string;
  probeType: string;
}

export interface StoredStatusPageConfig {
  id: string;
  title: string;
  slug: string;
  description: string;
  isPublic: boolean;
  announcement: string;
  monitorIds: string[];
  supportEmail: string;
  updatedAt: number;
}

export interface StoredDatabase {
  version: number;
  monitors: StoredMonitor[];
  checkResults: StoredCheckResult[];
  incidents: StoredIncident[];
  edgeNodes: StoredEdgeNode[];
  statusPageConfig: StoredStatusPageConfig;
  kvStore: Record<string, { value: any; expiresAt?: number }>;
  systemConfig: Record<string, string>;
}

// Initial seed generators
function getInitialDatabase(): StoredDatabase {
  const now = Date.now();
  return {
    version: 1,
    monitors: [
      {
        id: 'mon-1',
        userId: 'default_admin',
        name: 'Cloudflare Worker Gateway API',
        url: 'https://api.cloudflare.com/client/v4/health',
        type: 'cloudflare_worker',
        status: 'operational',
        intervalSeconds: 30,
        timeoutMs: 5000,
        expectedStatus: 200,
        group: 'Edge Core API',
        tags: ['Cloudflare', 'Serverless', 'Critical'],
        isPaused: false,
        uptime24h: 100.0,
        uptime30d: 99.98,
        avgLatencyMs: 24,
        lastCheckedAt: now - 15000,
        notes: 'Primary Edge API Worker routing global authentication & key-value cache tokens.',
        sslDomain: 'api.cloudflare.com',
        sslIssuer: 'Cloudflare Inc ECC CA-3',
        sslDaysRemaining: 106,
        createdAt: now - 86400000 * 30,
        updatedAt: now,
      },
      {
        id: 'mon-2',
        userId: 'default_admin',
        name: 'CloudPulse Main Web Console',
        url: 'https://cloudpulse-uptime.internal.app',
        type: 'http',
        status: 'operational',
        intervalSeconds: 60,
        timeoutMs: 5000,
        expectedStatus: 200,
        group: 'Web Dashboards',
        tags: ['React', 'Frontend', 'Dashboard'],
        isPaused: false,
        uptime24h: 99.95,
        uptime30d: 99.91,
        avgLatencyMs: 45,
        lastCheckedAt: now - 25000,
        notes: 'React Single Page App hosting global status monitors and admin management portal.',
        sslDomain: 'cloudpulse-uptime.internal.app',
        sslIssuer: "Let's Encrypt Authority X3",
        sslDaysRemaining: 58,
        createdAt: now - 86400000 * 20,
        updatedAt: now,
      },
      {
        id: 'mon-3',
        userId: 'default_admin',
        name: 'Cloudflare D1 Primary DB Cluster',
        url: 'https://d1-database.cloudpulse.net/healthz',
        type: 'cloudflare_worker',
        status: 'operational',
        intervalSeconds: 15,
        timeoutMs: 3000,
        expectedStatus: 200,
        group: 'Edge Core API',
        tags: ['D1', 'Database', 'Cloudflare'],
        isPaused: false,
        uptime24h: 100.0,
        uptime30d: 99.99,
        avgLatencyMs: 19,
        lastCheckedAt: now - 8000,
        notes: 'Cloudflare D1 SQLite database query coordinator and edge read-replica status.',
        createdAt: now - 86400000 * 15,
        updatedAt: now,
      },
      {
        id: 'mon-4',
        userId: 'default_admin',
        name: 'SSL Cert Monitor - cloudpulse.net',
        url: 'https://cloudpulse.net',
        type: 'ssl',
        status: 'operational',
        intervalSeconds: 300,
        timeoutMs: 5000,
        expectedStatus: 200,
        group: 'SSL Protection',
        tags: ['Security', 'SSL', 'TLS 1.3'],
        isPaused: false,
        uptime24h: 100.0,
        uptime30d: 100.0,
        avgLatencyMs: 31,
        lastCheckedAt: now - 40000,
        notes: 'Automated TLS/SSL certificate lifecycle and SAN domain validity inspector.',
        sslDomain: 'cloudpulse.net',
        sslIssuer: 'GTS CA 1P3 (Google Trust Services)',
        sslDaysRemaining: 165,
        createdAt: now - 86400000 * 45,
        updatedAt: now,
      },
      {
        id: 'mon-5',
        userId: 'default_admin',
        name: 'GitHub REST & Webhook Node',
        url: 'https://api.github.com/zen',
        type: 'http',
        status: 'operational',
        intervalSeconds: 60,
        timeoutMs: 5000,
        expectedStatus: 200,
        group: 'Third Party Integrations',
        tags: ['GitHub', 'API', 'Webhook'],
        isPaused: false,
        uptime24h: 99.88,
        uptime30d: 99.82,
        avgLatencyMs: 82,
        lastCheckedAt: now - 12000,
        notes: 'Upstream GitHub event bus and automated deployment webhook endpoint.',
        sslDomain: 'api.github.com',
        sslIssuer: 'DigiCert TLS RSA SHA256 2020 CA1',
        sslDaysRemaining: 145,
        createdAt: now - 86400000 * 60,
        updatedAt: now,
      },
      {
        id: 'mon-6',
        userId: 'default_admin',
        name: 'PostgreSQL Relational DB Port (5432)',
        url: 'db.cloudpulse.net:5432',
        type: 'port',
        status: 'operational',
        intervalSeconds: 60,
        timeoutMs: 5000,
        expectedStatus: 200,
        group: 'Edge Core API',
        tags: ['TCP', 'Database', 'Port 5432'],
        isPaused: false,
        uptime24h: 100.0,
        uptime30d: 99.96,
        avgLatencyMs: 34,
        lastCheckedAt: now - 50000,
        notes: 'TCP handshake & socket latency probe for backend transactional database.',
        createdAt: now - 86400000 * 10,
        updatedAt: now,
      },
    ],
    checkResults: [],
    incidents: [
      {
        id: 'inc-101',
        monitorId: 'mon-5',
        monitorName: 'GitHub REST & Webhook Node',
        title: 'Upstream Rate Limiting & Brief Latency Spike',
        severity: 'minor',
        status: 'resolved',
        summary: '发现 GitHub API 部分 Webhook 回调响应延迟攀升至 450ms。已完全恢复。',
        createdAt: now - 10000000,
        resolvedAt: now - 8200000,
        aiDiagnosed: true,
        updates: [
          {
            timestamp: now - 10000000,
            status: 'investigating',
            message: '发现 GitHub API 部分 Webhook 回调响应延迟攀升至 450ms。团队正在分析。',
          },
          {
            timestamp: now - 9000000,
            status: 'identified',
            message: '因 GitHub 节点发生短时 BGP 路由再收敛，造成部分区域抖动。',
          },
          {
            timestamp: now - 8200000,
            status: 'resolved',
            message: '网络丢包率已恢复正常，所有 HTTP 请求 Latency 降低至 80ms 基础水平。',
          },
        ],
      },
    ],
    edgeNodes: [
      { code: 'SJC', name: 'San Jose Silicon Valley POP', city: 'San Jose', country: 'United States', flag: '🇺🇸', region: 'North America', ip: '104.28.19.42', maskedIp: '104.28.***.***', provider: 'Cloudflare Anycast POP (SJC-01)', avgLatencyMs: 18, status: 'operational', cpuUsage: 14, memUsage: 32, loadAvg: '0.18, 0.12, 0.08', uptimeDays: 248, probeVersion: 'v2.0-cf-worker', lastSyncAt: now - 6000, probeSecret: 'cp_probe_sjc_9941a', probeType: 'cloudflare_worker' },
      { code: 'HKG', name: 'Hong Kong Chai Wan Edge Node', city: 'Hong Kong', country: 'Hong Kong SAR', flag: '🇭🇰', region: 'Asia Pacific', ip: '103.21.244.68', maskedIp: '103.21.***.***', provider: 'Cloudflare Anycast POP (HKG-02)', avgLatencyMs: 24, status: 'operational', cpuUsage: 22, memUsage: 41, loadAvg: '0.34, 0.28, 0.21', uptimeDays: 186, probeVersion: 'v2.0-cf-worker', lastSyncAt: now - 4000, probeSecret: 'cp_probe_hkg_8120b', probeType: 'cloudflare_worker' },
      { code: 'TYO', name: 'Tokyo Otemachi Core Node', city: 'Tokyo', country: 'Japan', flag: '🇯🇵', region: 'Asia Pacific', ip: '141.101.120.15', maskedIp: '141.101.***.***', provider: 'Cloudflare Anycast POP (TYO-03)', avgLatencyMs: 36, status: 'operational', cpuUsage: 19, memUsage: 38, loadAvg: '0.22, 0.19, 0.15', uptimeDays: 312, probeVersion: 'v2.0-cf-worker', lastSyncAt: now - 9000, probeSecret: 'cp_probe_tyo_7233c', probeType: 'cloudflare_worker' },
      { code: 'SIN', name: 'Singapore Jurong POP', city: 'Singapore', country: 'Singapore', flag: '🇸🇬', region: 'Asia Pacific', ip: '108.162.238.102', maskedIp: '108.162.***.***', provider: 'Cloudflare Anycast POP (SIN-01)', avgLatencyMs: 32, status: 'operational', cpuUsage: 16, memUsage: 29, loadAvg: '0.15, 0.11, 0.09', uptimeDays: 195, probeVersion: 'v2.0-cf-worker', lastSyncAt: now - 8000, probeSecret: 'cp_probe_sin_3389d', probeType: 'cloudflare_worker' },
      { code: 'FRA', name: 'Frankfurt Main Data Center', city: 'Frankfurt', country: 'Germany', flag: '🇩🇪', region: 'Europe', ip: '172.67.180.95', maskedIp: '172.67.***.***', provider: 'Cloudflare Anycast POP (FRA-02)', avgLatencyMs: 29, status: 'operational', cpuUsage: 18, memUsage: 35, loadAvg: '0.24, 0.18, 0.14', uptimeDays: 280, probeVersion: 'v2.0-cf-worker', lastSyncAt: now - 11000, probeSecret: 'cp_probe_fra_4412e', probeType: 'cloudflare_worker' },
      { code: 'LHR', name: 'London Docklands Gateway', city: 'London', country: 'United Kingdom', flag: '🇬🇧', region: 'Europe', ip: '104.16.132.8', maskedIp: '104.16.***.***', provider: 'Cloudflare Anycast POP (LHR-01)', avgLatencyMs: 26, status: 'operational', cpuUsage: 15, memUsage: 31, loadAvg: '0.19, 0.14, 0.11', uptimeDays: 164, probeVersion: 'v2.0-cf-worker', lastSyncAt: now - 5000, probeSecret: 'cp_probe_lhr_5581f', probeType: 'cloudflare_worker' },
      { code: 'SYD', name: 'Sydney Alexandria POP', city: 'Sydney', country: 'Australia', flag: '🇦🇺', region: 'Oceania', ip: '162.158.88.23', maskedIp: '162.158.***.***', provider: 'Cloudflare Anycast POP (SYD-01)', avgLatencyMs: 105, status: 'operational', cpuUsage: 12, memUsage: 27, loadAvg: '0.10, 0.08, 0.05', uptimeDays: 142, probeVersion: 'v2.0-cf-worker', lastSyncAt: now - 15000, probeSecret: 'cp_probe_syd_6620g', probeType: 'cloudflare_worker' },
      { code: 'GRU', name: 'São Paulo Tamboré POP', city: 'São Paulo', country: 'Brazil', flag: '🇧🇷', region: 'South America', ip: '198.41.214.19', maskedIp: '198.41.***.***', provider: 'Cloudflare Anycast POP (GRU-01)', avgLatencyMs: 132, status: 'operational', cpuUsage: 25, memUsage: 44, loadAvg: '0.38, 0.29, 0.22', uptimeDays: 98, probeVersion: 'v2.0-cf-worker', lastSyncAt: now - 14000, probeSecret: 'cp_probe_gru_7739h', probeType: 'cloudflare_worker' },
    ],
    statusPageConfig: {
      id: 'default',
      title: 'CloudPulse-UPtime 统一服务状态页',
      slug: 'global-status',
      description: '实时监测 Cloudflare Edge Workers、全网 API 及核心基础设施 SLA 运行状态。',
      isPublic: true,
      announcement: '🟢 所有核心云服务与 Edge Workers 节点当前正常运转，100% SLA 达标。',
      monitorIds: ['mon-1', 'mon-2', 'mon-3', 'mon-4', 'mon-5', 'mon-6'],
      supportEmail: 'ops@cloudpulse.net',
      updatedAt: now,
    },
    kvStore: {},
    systemConfig: {},
  };
}

class DatabaseManager {
  private db: StoredDatabase;

  constructor() {
    this.db = this.load();
  }

  private load(): StoredDatabase {
    try {
      if (fs.existsSync(STORE_PATH)) {
        const raw = fs.readFileSync(STORE_PATH, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to read db_store.json, creating initial store');
    }
    const initial = getInitialDatabase();
    this.save(initial);
    return initial;
  }

  private save(data: StoredDatabase = this.db) {
    try {
      fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving db_store.json', e);
    }
  }

  // --- KV Emulation Operations ---
  public kvGet<T = any>(key: string): T | null {
    const item = this.db.kvStore[key];
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      delete this.db.kvStore[key];
      this.save();
      return null;
    }
    return item.value as T;
  }

  public kvPut(key: string, value: any, ttlSeconds?: number) {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.db.kvStore[key] = { value, expiresAt };
    this.save();
  }

  public kvDelete(key: string) {
    if (this.db.kvStore[key]) {
      delete this.db.kvStore[key];
      this.save();
    }
  }

  // --- Monitors Operations ---
  public getMonitors(): StoredMonitor[] {
    return this.db.monitors;
  }

  public getMonitor(id: string): StoredMonitor | undefined {
    return this.db.monitors.find((m) => m.id === id);
  }

  public upsertMonitor(data: Partial<StoredMonitor> & { id?: string; name: string; url: string }): StoredMonitor {
    const now = Date.now();
    const id = data.id || `mon-${now}`;
    const existingIndex = this.db.monitors.findIndex((m) => m.id === id);

    let monitor: StoredMonitor;
    if (existingIndex >= 0) {
      monitor = {
        ...this.db.monitors[existingIndex],
        ...data,
        id,
        updatedAt: now,
      };
      this.db.monitors[existingIndex] = monitor;
    } else {
      monitor = {
        id,
        userId: data.userId || 'default_admin',
        name: data.name,
        url: data.url,
        type: data.type || 'http',
        status: data.status || 'operational',
        intervalSeconds: data.intervalSeconds || 60,
        timeoutMs: data.timeoutMs || 5000,
        expectedStatus: data.expectedStatus || 200,
        group: data.group || 'Default',
        tags: data.tags || [],
        isPaused: data.isPaused || false,
        uptime24h: data.uptime24h ?? 100.0,
        uptime30d: data.uptime30d ?? 100.0,
        avgLatencyMs: data.avgLatencyMs || 30,
        lastCheckedAt: now,
        notes: data.notes || '',
        sslDomain: data.sslDomain,
        sslIssuer: data.sslIssuer,
        sslDaysRemaining: data.sslDaysRemaining,
        createdAt: now,
        updatedAt: now,
      };
      this.db.monitors.unshift(monitor);
    }

    this.kvDelete('status:monitors_overview');
    this.save();
    return monitor;
  }

  public deleteMonitor(id: string): boolean {
    const beforeLen = this.db.monitors.length;
    this.db.monitors = this.db.monitors.filter((m) => m.id !== id);
    this.db.checkResults = this.db.checkResults.filter((c) => c.monitorId !== id);
    this.kvDelete('status:monitors_overview');
    this.save();
    return this.db.monitors.length < beforeLen;
  }

  public togglePauseMonitor(id: string): StoredMonitor | null {
    const monitor = this.getMonitor(id);
    if (!monitor) return null;
    monitor.isPaused = !monitor.isPaused;
    monitor.status = monitor.isPaused ? 'paused' : 'operational';
    monitor.updatedAt = Date.now();
    this.kvDelete('status:monitors_overview');
    this.save();
    return monitor;
  }

  // --- Check Results Operations ---
  public addCheckResult(res: Omit<StoredCheckResult, 'id'>) {
    const newId = this.db.checkResults.length > 0 ? Math.max(...this.db.checkResults.map((c) => c.id)) + 1 : 1;
    const item: StoredCheckResult = { ...res, id: newId };
    this.db.checkResults.unshift(item);

    // Keep max 5000 results in memory/disk
    if (this.db.checkResults.length > 5000) {
      this.db.checkResults = this.db.checkResults.slice(0, 5000);
    }

    // Update parent monitor telemetry
    const monitor = this.getMonitor(res.monitorId);
    if (monitor) {
      monitor.status = res.status;
      monitor.avgLatencyMs = Math.round((monitor.avgLatencyMs * 0.7) + (res.latencyMs * 0.3));
      monitor.lastCheckedAt = res.timestamp;
      monitor.updatedAt = Date.now();
    }

    this.save();
    return item;
  }

  public getCheckResults(monitorId?: string, limit = 50): StoredCheckResult[] {
    if (monitorId) {
      return this.db.checkResults.filter((c) => c.monitorId === monitorId).slice(0, limit);
    }
    return this.db.checkResults.slice(0, limit);
  }

  // --- Incidents Operations ---
  public getIncidents(): StoredIncident[] {
    return this.db.incidents;
  }

  public upsertIncident(data: StoredIncident): StoredIncident {
    const index = this.db.incidents.findIndex((i) => i.id === data.id);
    if (index >= 0) {
      this.db.incidents[index] = data;
    } else {
      this.db.incidents.unshift(data);
    }
    this.save();
    return data;
  }

  public deleteIncident(id: string): boolean {
    const before = this.db.incidents.length;
    this.db.incidents = this.db.incidents.filter((i) => i.id !== id);
    this.save();
    return this.db.incidents.length < before;
  }

  // --- Edge Nodes Operations ---
  public getEdgeNodes(): StoredEdgeNode[] {
    return this.db.edgeNodes;
  }

  public updateEdgeNode(code: string, patch: Partial<StoredEdgeNode>): StoredEdgeNode | null {
    const node = this.db.edgeNodes.find((n) => n.code === code);
    if (!node) return null;
    Object.assign(node, patch);
    this.save();
    return node;
  }

  public addEdgeNode(node: StoredEdgeNode): StoredEdgeNode {
    const existing = this.db.edgeNodes.findIndex((n) => n.code === node.code);
    if (existing >= 0) {
      this.db.edgeNodes[existing] = node;
    } else {
      this.db.edgeNodes.push(node);
    }
    this.save();
    return node;
  }

  // --- Status Page Operations ---
  public getStatusPageConfig(): StoredStatusPageConfig {
    return this.db.statusPageConfig;
  }

  public updateStatusPageConfig(config: Partial<StoredStatusPageConfig>): StoredStatusPageConfig {
    this.db.statusPageConfig = {
      ...this.db.statusPageConfig,
      ...config,
      updatedAt: Date.now(),
    };
    this.save();
    return this.db.statusPageConfig;
  }

  // --- System Config ---
  public getSystemConfig(): Record<string, string> {
    return this.db.systemConfig;
  }

  public setSystemConfig(key: string, value: string) {
    this.db.systemConfig[key] = value;
    this.save();
  }

  public resetAll() {
    this.db = getInitialDatabase();
    this.save();
    return this.db;
  }
}

export const db = new DatabaseManager();
