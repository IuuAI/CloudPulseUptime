-- =========================================================
-- CloudPulse-UPtime Cloudflare D1 Database Schema
-- Designed for Cloudflare Workers + D1 SQLite Engine
-- =========================================================

-- 1. 监控服务配置表 (Monitors)
CREATE TABLE IF NOT EXISTS monitors (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default_admin',
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'http' CHECK(type IN ('http', 'cloudflare_worker', 'ssl', 'port', 'ping')),
  status TEXT NOT NULL DEFAULT 'operational' CHECK(status IN ('operational', 'degraded', 'down', 'paused')),
  interval_seconds INTEGER NOT NULL DEFAULT 60,
  timeout_ms INTEGER NOT NULL DEFAULT 5000,
  expected_status_code INTEGER DEFAULT 200,
  group_name TEXT DEFAULT 'Default',
  tags TEXT DEFAULT '[]', -- JSON array of strings: e.g. ["api", "cloudflare"]
  is_paused INTEGER NOT NULL DEFAULT 0,
  uptime_24h REAL NOT NULL DEFAULT 100.0,
  uptime_30d REAL NOT NULL DEFAULT 100.0,
  avg_latency_ms INTEGER NOT NULL DEFAULT 35,
  last_checked_at INTEGER,
  notes TEXT,
  ssl_domain TEXT,
  ssl_issuer TEXT,
  ssl_days_remaining INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_monitors_paused ON monitors(is_paused);
CREATE INDEX IF NOT EXISTS idx_monitors_status ON monitors(status);

-- 2. 边缘探测历史流水表 (Check Results)
CREATE TABLE IF NOT EXISTS check_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  monitor_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('operational', 'degraded', 'down')),
  latency_ms INTEGER NOT NULL,
  status_code INTEGER,
  region TEXT NOT NULL DEFAULT 'CF-EDGE',
  error_message TEXT,
  FOREIGN KEY (monitor_id) REFERENCES monitors(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_checks_monitor_time ON check_results(monitor_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_checks_time ON check_results(timestamp);

-- 3. 故障通告与事件记录表 (Incidents)
CREATE TABLE IF NOT EXISTS incidents (
  id TEXT PRIMARY KEY,
  monitor_id TEXT,
  monitor_name TEXT NOT NULL,
  title TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'major' CHECK(severity IN ('critical', 'major', 'minor')),
  status TEXT NOT NULL DEFAULT 'investigating' CHECK(status IN ('investigating', 'identified', 'monitoring', 'resolved')),
  summary TEXT,
  created_at INTEGER NOT NULL,
  resolved_at INTEGER,
  ai_diagnosed INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_created ON incidents(created_at DESC);

-- 4. 故障通告时间线进展更新表 (Incident Updates)
CREATE TABLE IF NOT EXISTS incident_updates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  status TEXT NOT NULL,
  message TEXT NOT NULL,
  FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_updates_incident ON incident_updates(incident_id, timestamp ASC);

-- 5. 全球边缘 POP 探针注册表 (Edge Nodes)
CREATE TABLE IF NOT EXISTS edge_nodes (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  flag TEXT NOT NULL DEFAULT '🌐',
  region TEXT NOT NULL,
  ip TEXT NOT NULL,
  masked_ip TEXT NOT NULL,
  provider TEXT NOT NULL,
  avg_latency_ms INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'operational' CHECK(status IN ('operational', 'degraded', 'offline')),
  cpu_usage INTEGER DEFAULT 15,
  mem_usage INTEGER DEFAULT 30,
  load_avg TEXT DEFAULT '0.15, 0.12, 0.08',
  uptime_days INTEGER DEFAULT 180,
  probe_version TEXT DEFAULT 'v2.0-cf-worker',
  last_sync_at INTEGER NOT NULL,
  probe_secret TEXT,
  probe_type TEXT DEFAULT 'cloudflare_worker'
);

-- 6. 公开状态看板配置 (Status Page Config)
CREATE TABLE IF NOT EXISTS status_page_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  is_public INTEGER NOT NULL DEFAULT 1,
  announcement TEXT,
  monitor_ids TEXT DEFAULT '[]', -- JSON array of monitor IDs
  support_email TEXT,
  updated_at INTEGER NOT NULL
);

-- 7. 告警推送通道配置 (Webhooks)
CREATE TABLE IF NOT EXISTS webhooks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('telegram', 'discord', 'slack', 'webhook')),
  url TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);

-- 8. 系统键值对与配置表 (System Config)
CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 9. 监控每日聚合历史统计表 (Daily Aggregated SLA Stats)
CREATE TABLE IF NOT EXISTS monitor_daily_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  monitor_id TEXT NOT NULL,
  date TEXT NOT NULL, -- 'YYYY-MM-DD'
  uptime_percentage REAL NOT NULL DEFAULT 100.0,
  avg_latency_ms INTEGER NOT NULL DEFAULT 0,
  total_checks INTEGER NOT NULL DEFAULT 0,
  failed_checks INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (monitor_id) REFERENCES monitors(id) ON DELETE CASCADE,
  UNIQUE(monitor_id, date)
);
CREATE INDEX IF NOT EXISTS idx_daily_stats_mon_date ON monitor_daily_stats(monitor_id, date DESC);

-- 10. 管理员 Edge 会话 Token 表 (Worker Admin Sessions)
CREATE TABLE IF NOT EXISTS admin_sessions (
  token TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON admin_sessions(expires_at);
