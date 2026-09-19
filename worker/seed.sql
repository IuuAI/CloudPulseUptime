-- =========================================================
-- CloudPulse-UPtime Initial Seed Data for Cloudflare D1
-- =========================================================

-- Seed Monitors
INSERT OR REPLACE INTO monitors (
  id, user_id, name, url, type, status, interval_seconds, timeout_ms,
  expected_status_code, group_name, tags, is_paused, uptime_24h, uptime_30d,
  avg_latency_ms, last_checked_at, notes, ssl_domain, ssl_issuer, ssl_days_remaining,
  created_at, updated_at
) VALUES 
(
  'mon-1', 'default_admin', 'Cloudflare Worker Gateway API',
  'https://api.cloudflare.com/client/v4/health', 'cloudflare_worker',
  'operational', 30, 5000, 200, 'Edge Core API',
  '["Cloudflare", "Serverless", "Critical"]', 0, 100.0, 99.98,
  24, unixepoch() * 1000 - 15000,
  'Primary Edge API Worker routing global authentication & key-value cache tokens.',
  'api.cloudflare.com', 'Cloudflare Inc ECC CA-3', 106,
  unixepoch() * 1000 - 86400000 * 30, unixepoch() * 1000
),
(
  'mon-2', 'default_admin', 'CloudPulse Main Web Console',
  'https://cloudpulse-uptime.internal.app', 'http',
  'operational', 60, 5000, 200, 'Web Dashboards',
  '["React", "Frontend", "Dashboard"]', 0, 99.95, 99.91,
  45, unixepoch() * 1000 - 25000,
  'React Single Page App hosting global status monitors and admin management portal.',
  'cloudpulse-uptime.internal.app', 'Let''s Encrypt Authority X3', 58,
  unixepoch() * 1000 - 86400000 * 20, unixepoch() * 1000
),
(
  'mon-3', 'default_admin', 'Cloudflare D1 Primary DB Cluster',
  'https://d1-database.cloudpulse.net/healthz', 'cloudflare_worker',
  'operational', 15, 3000, 200, 'Edge Core API',
  '["D1", "Database", "Cloudflare"]', 0, 100.0, 99.99,
  19, unixepoch() * 1000 - 8000,
  'Cloudflare D1 SQLite database query coordinator and edge read-replica status.',
  NULL, NULL, NULL,
  unixepoch() * 1000 - 86400000 * 15, unixepoch() * 1000
),
(
  'mon-4', 'default_admin', 'SSL Cert Monitor - cloudpulse.net',
  'https://cloudpulse.net', 'ssl',
  'operational', 300, 5000, 200, 'SSL Protection',
  '["Security", "SSL", "TLS 1.3"]', 0, 100.0, 100.0,
  31, unixepoch() * 1000 - 40000,
  'Automated TLS/SSL certificate lifecycle and SAN domain validity inspector.',
  'cloudpulse.net', 'GTS CA 1P3 (Google Trust Services)', 165,
  unixepoch() * 1000 - 86400000 * 45, unixepoch() * 1000
),
(
  'mon-5', 'default_admin', 'GitHub REST & Webhook Node',
  'https://api.github.com/zen', 'http',
  'operational', 60, 5000, 200, 'Third Party Integrations',
  '["GitHub", "API", "Webhook"]', 0, 99.88, 99.82,
  82, unixepoch() * 1000 - 12000,
  'Upstream GitHub event bus and automated deployment webhook endpoint.',
  'api.github.com', 'DigiCert TLS RSA SHA256 2020 CA1', 145,
  unixepoch() * 1000 - 86400000 * 60, unixepoch() * 1000
),
(
  'mon-6', 'default_admin', 'PostgreSQL Relational DB Port (5432)',
  'db.cloudpulse.net:5432', 'port',
  'operational', 60, 5000, 200, 'Edge Core API',
  '["TCP", "Database", "Port 5432"]', 0, 100.0, 99.96,
  34, unixepoch() * 1000 - 50000,
  'TCP handshake & socket latency probe for backend transactional database.',
  NULL, NULL, NULL,
  unixepoch() * 1000 - 86400000 * 10, unixepoch() * 1000
);

-- Seed Edge Nodes
INSERT OR REPLACE INTO edge_nodes (
  code, name, city, country, flag, region, ip, masked_ip, provider,
  avg_latency_ms, status, cpu_usage, mem_usage, load_avg, uptime_days,
  probe_version, last_sync_at, probe_secret, probe_type
) VALUES
('SJC', 'San Jose Silicon Valley POP', 'San Jose', 'United States', '🇺🇸', 'North America', '104.28.19.42', '104.28.***.***', 'Cloudflare Anycast POP (SJC-01)', 18, 'operational', 14, 32, '0.18, 0.12, 0.08', 248, 'v2.0-cf-worker', unixepoch() * 1000 - 6000, 'cp_probe_sjc_9941a', 'cloudflare_worker'),
('HKG', 'Hong Kong Chai Wan Edge Node', 'Hong Kong', 'Hong Kong SAR', '🇭🇰', 'Asia Pacific', '103.21.244.68', '103.21.***.***', 'Cloudflare Anycast POP (HKG-02)', 24, 'operational', 22, 41, '0.34, 0.28, 0.21', 186, 'v2.0-cf-worker', unixepoch() * 1000 - 4000, 'cp_probe_hkg_8120b', 'cloudflare_worker'),
('TYO', 'Tokyo Otemachi Core Node', 'Tokyo', 'Japan', '🇯🇵', 'Asia Pacific', '141.101.120.15', '141.101.***.***', 'Cloudflare Anycast POP (TYO-03)', 36, 'operational', 19, 38, '0.22, 0.19, 0.15', 312, 'v2.0-cf-worker', unixepoch() * 1000 - 9000, 'cp_probe_tyo_7233c', 'cloudflare_worker'),
('SIN', 'Singapore Jurong POP', 'Singapore', 'Singapore', '🇸🇬', 'Asia Pacific', '108.162.238.102', '108.162.***.***', 'Cloudflare Anycast POP (SIN-01)', 32, 'operational', 16, 29, '0.15, 0.11, 0.09', 195, 'v2.0-cf-worker', unixepoch() * 1000 - 8000, 'cp_probe_sin_3389d', 'cloudflare_worker'),
('FRA', 'Frankfurt Main Data Center', 'Frankfurt', 'Germany', '🇩🇪', 'Europe', '172.67.180.95', '172.67.***.***', 'Cloudflare Anycast POP (FRA-02)', 29, 'operational', 18, 35, '0.24, 0.18, 0.14', 280, 'v2.0-cf-worker', unixepoch() * 1000 - 11000, 'cp_probe_fra_4412e', 'cloudflare_worker'),
('LHR', 'London Docklands Gateway', 'London', 'United Kingdom', '🇬🇧', 'Europe', '104.16.132.8', '104.16.***.***', 'Cloudflare Anycast POP (LHR-01)', 26, 'operational', 15, 31, '0.19, 0.14, 0.11', 164, 'v2.0-cf-worker', unixepoch() * 1000 - 5000, 'cp_probe_lhr_5581f', 'cloudflare_worker'),
('SYD', 'Sydney Alexandria POP', 'Sydney', 'Australia', '🇦🇺', 'Oceania', '162.158.88.23', '162.158.***.***', 'Cloudflare Anycast POP (SYD-01)', 105, 'operational', 12, 27, '0.10, 0.08, 0.05', 142, 'v2.0-cf-worker', unixepoch() * 1000 - 15000, 'cp_probe_syd_6620g', 'cloudflare_worker'),
('GRU', 'São Paulo Tamboré POP', 'São Paulo', 'Brazil', '🇧🇷', 'South America', '198.41.214.19', '198.41.***.***', 'Cloudflare Anycast POP (GRU-01)', 132, 'operational', 25, 44, '0.38, 0.29, 0.22', 98, 'v2.0-cf-worker', unixepoch() * 1000 - 14000, 'cp_probe_gru_7739h', 'cloudflare_worker');

-- Seed Incident
INSERT OR REPLACE INTO incidents (
  id, monitor_id, monitor_name, title, severity, status, summary, created_at, resolved_at, ai_diagnosed
) VALUES (
  'inc-101', 'mon-5', 'GitHub REST & Webhook Node',
  'Upstream Rate Limiting & Brief Latency Spike', 'minor', 'resolved',
  '由于上游服务发生临时 BGP 重新收敛，造成部分区域 Webhook 响应延迟波动。已完全恢复。',
  unixepoch() * 1000 - 10000000, unixepoch() * 1000 - 8200000, 1
);

INSERT OR REPLACE INTO incident_updates (incident_id, timestamp, status, message) VALUES
('inc-101', unixepoch() * 1000 - 10000000, 'investigating', '发现 GitHub API 部分 Webhook 回调响应延迟攀升至 450ms。团队正在分析。'),
('inc-101', unixepoch() * 1000 - 9000000, 'identified', '因 GitHub 节点发生短时 BGP 路由再收敛，造成部分区域抖动。'),
('inc-101', unixepoch() * 1000 - 8200000, 'resolved', '网络丢包率已恢复正常，所有 HTTP 请求 Latency 降低至 80ms 基础水平。');

-- Seed Status Page Config
INSERT OR REPLACE INTO status_page_config (
  id, title, slug, description, is_public, announcement, monitor_ids, support_email, updated_at
) VALUES (
  'default', 'CloudPulse-UPtime 统一服务状态页', 'global-status',
  '实时监测 Cloudflare Edge Workers、全网 API 及核心基础设施 SLA 运行状态。', 1,
  '🟢 所有核心云服务与 Edge Workers 节点当前正常运转，100% SLA 达标。',
  '["mon-1", "mon-2", "mon-3", "mon-4", "mon-5", "mon-6"]',
  'ops@cloudpulse.net', unixepoch() * 1000
);

-- Seed Webhooks
INSERT OR REPLACE INTO webhooks (id, name, type, url, enabled, created_at) VALUES
('wh-1', 'Discord 运维告警频道', 'discord', 'https://discord.com/api/webhooks/12345/cloudpulse-alerts', 1, unixepoch() * 1000),
('wh-2', 'Telegram 机器人推送', 'telegram', 'https://api.telegram.org/bot123456:ABC/sendMessage?chat_id=-100', 1, unixepoch() * 1000);
