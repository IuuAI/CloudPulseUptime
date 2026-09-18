export type ThemeMode = 'light' | 'dark' | 'system';

export type MonitorStatus = 'operational' | 'degraded' | 'down' | 'maintenance' | 'paused';

export type MonitorType = 'http' | 'cloudflare_worker' | 'port' | 'ping' | 'ssl';

export type CheckInterval = 15 | 30 | 60 | 300 | 900; // in seconds

export interface CheckHistoryPoint {
  timestamp: number;
  latencyMs: number;
  statusCode: number;
  status: 'operational' | 'degraded' | 'down';
  errorMessage?: string;
}

export interface SlaBar {
  date: string;
  status: 'operational' | 'degraded' | 'down' | 'no_data';
  uptimePct: number;
  avgLatency: number;
  checksCount: number;
}

export interface SSLCertificate {
  issuer: string;
  validFrom: string;
  validTo: string;
  daysRemaining: number;
  isValid: boolean;
  domain: string;
  serialNumber?: string;
}

export interface EdgeLatency {
  nodeCode: string;
  location: string;
  flag: string;
  latencyMs: number;
  status: 'ok' | 'slow' | 'fail';
}

export interface Monitor {
  id: string;
  name: string;
  url: string;
  type: MonitorType;
  status: MonitorStatus;
  uptime24h: number;
  uptime30d: number;
  avgLatencyMs: number;
  lastCheckedAt: number;
  intervalSeconds: CheckInterval;
  expectedStatus?: number;
  method?: 'GET' | 'POST' | 'HEAD';
  headers?: Record<string, string>;
  sslInfo?: SSLCertificate;
  history: CheckHistoryPoint[];
  slaBars: SlaBar[];
  edgeNodes: EdgeLatency[];
  group?: string;
  tags?: string[];
  isPaused?: boolean;
  alertWebhook?: string;
  notes?: string;
}

export interface Incident {
  id: string;
  monitorId: string;
  monitorName: string;
  title: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  severity: 'critical' | 'major' | 'minor';
  createdAt: number;
  resolvedAt?: number;
  updates: {
    timestamp: number;
    message: string;
    status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  }[];
}

export interface GlobalNode {
  code: string;
  city: string;
  country: string;
  flag: string;
  region: string;
  avgLatencyMs: number;
  status: 'operational' | 'degraded' | 'offline';
}

export interface StatusPageConfig {
  title: string;
  slug: string;
  description: string;
  logoUrl?: string;
  announcement?: string;
  isPublic: boolean;
  monitorIds: string[];
  supportEmail?: string;
}

export interface AlertWebhookConfig {
  id: string;
  name: string;
  type: 'discord' | 'telegram' | 'slack' | 'custom_webhook';
  url: string;
  enabled: boolean;
  lastTriggeredAt?: number;
}
