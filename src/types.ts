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
  summary?: string;
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
  name?: string;
  city: string;
  country: string;
  flag: string;
  region: string;
  avgLatencyMs: number;
  status: 'operational' | 'degraded' | 'offline';
  ip?: string;
  maskedIp?: string;
  provider?: string;
  cpuUsage?: number;
  memUsage?: number;
  loadAvg?: string;
  uptimeDays?: number;
  probeVersion?: string;
  lastSyncAt?: number;
  probeSecret?: string;
  probeType?: 'cloudflare_worker' | 'docker' | 'linux_systemd';
}

export interface CloudflareQuotaItem {
  name: string;
  used: number;
  total: number;
  unit: string;
  period: 'daily' | 'monthly';
  description: string;
}

export interface CloudflareQuotaInfo {
  accountId: string;
  accountName?: string;
  lastCheckedAt?: number;
  status: 'valid' | 'invalid' | 'unchecked';
  quotas: {
    workers: CloudflareQuotaItem;
    kvReads: CloudflareQuotaItem;
    kvWrites: CloudflareQuotaItem;
    d1Reads: CloudflareQuotaItem;
    d1Writes: CloudflareQuotaItem;
    pagesBuilds: CloudflareQuotaItem;
  };
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

export interface ApiKeysConfig {
  tgBotToken: string;
  tgChatId: string;
  geminiApiKey: string;
  cfApiToken: string;
  cfAccountId?: string;
  customWebhookUrl?: string;
}

export interface DatabaseCleanupConfig {
  enabled: boolean;
  retentionDays: number;
  lastCleanedAt?: number;
  cleanedRowsCount?: number;
}

export interface AiAutoIncidentRuleConfig {
  enabled: boolean;
  minDownCount: number; // 触发宕机站点数 (例如 >= 1)
  latencyThresholdMs: number; // 触发异常高延迟阈值 (例如 >= 500ms)
  offlineNodeRatioPct: number; // 节点离线占比阈值 (例如 >= 25%)
  autoPublishSeverity: 'auto_ai' | 'critical' | 'major' | 'minor';
  requireApproval: boolean; // 是否需要管理员人工审批再公开
  notifyTelegram: boolean; // 是否同步发送 Telegram 告警
  notifyWebhooks: boolean; // 是否同步触发通用 Webhook
  customAiInstruction?: string; // 自定义 AI 诊断指导指令
  lastEvaluatedAt?: number;
  lastGeneratedIncidentId?: string;
}

