import React, { useState, useMemo } from 'react';
import { Monitor } from '../types';
import {
  RotateCw,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  Pause,
  Play,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  PauseCircle,
  Plus,
  Lock,
  List,
  LayoutGrid,
  Layers,
  Activity,
  ShieldCheck,
  Globe,
  Clock,
  Zap,
  X,
} from 'lucide-react';

interface MonitorListProps {
  monitors: Monitor[];
  onSelectMonitor: (monitor: Monitor) => void;
  onRunCheckNow: (monitorId: string) => void;
  onTogglePause: (monitorId: string) => void;
  onEditMonitor: (monitor: Monitor) => void;
  onDeleteMonitor: (monitorId: string) => void;
  checkingMonitorId: string | null;
  isAdminAuthenticated?: boolean;
  hasAdminPassword?: boolean;
  onRequestAuth?: (reason?: string) => void;
  onAddMonitor?: () => void;
}

export const MonitorList: React.FC<MonitorListProps> = ({
  monitors,
  onSelectMonitor,
  onRunCheckNow,
  onTogglePause,
  onEditMonitor,
  onDeleteMonitor,
  checkingMonitorId,
  isAdminAuthenticated = true,
  hasAdminPassword = false,
  onRequestAuth,
  onAddMonitor,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'operational' | 'issues' | 'paused'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [hoveredBar, setHoveredBar] = useState<{ monitorId: string; date: string; uptimePct: number; avgLatency: number } | null>(null);

  // Compute aggregate stats
  const totalMonitors = monitors.length;
  const operationalCount = monitors.filter((m) => m.status === 'operational' && !m.isPaused).length;
  const avgLatency = Math.round(
    monitors.reduce((acc, m) => acc + (m.avgLatencyMs || 0), 0) / (totalMonitors || 1)
  );

  // Filter monitors
  const filteredMonitors = useMemo(() => {
    return monitors.filter((m) => {
      const matchesSearch =
        !searchTerm.trim() ||
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.group && m.group.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.tags && m.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())));

      if (!matchesSearch) return false;

      if (statusFilter === 'all') return true;
      if (statusFilter === 'operational') return m.status === 'operational' && !m.isPaused;
      if (statusFilter === 'issues') return (m.status === 'down' || m.status === 'degraded') && !m.isPaused;
      if (statusFilter === 'paused') return m.isPaused || m.status === 'paused';

      return true;
    });
  }, [monitors, searchTerm, statusFilter]);

  const getStatusDot = (status: string, isPaused?: boolean) => {
    if (isPaused || status === 'paused') {
      return <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-400" />;
    }
    if (status === 'operational') {
      return (
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
      );
    }
    if (status === 'degraded') {
      return <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500" />;
    }
    return (
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
      </span>
    );
  };

  const getStatusText = (status: string, isPaused?: boolean) => {
    if (isPaused || status === 'paused') return '已暂停';
    if (status === 'operational') return '正常';
    if (status === 'degraded') return '延迟高';
    return '故障';
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'cloudflare_worker':
        return 'Worker';
      case 'http':
        return 'HTTP(S)';
      case 'ssl':
        return 'SSL 证书';
      case 'port':
        return 'TCP 端口';
      case 'ping':
        return 'ICMP';
      default:
        return type.toUpperCase();
    }
  };

  const handleCreateClick = () => {
    if (hasAdminPassword && !isAdminAuthenticated) {
      onRequestAuth?.('新建监控项需要管理员密码授权');
      return;
    }
    onAddMonitor?.();
  };

  return (
    <div className="space-y-4">
      {/* Top Telemetry & Network Security Banner - Identical Layout to GlobalEdgeMap */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
            <Layers className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                CloudPulse 全球高可用服务监测中心
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Activity className="w-3 h-3 text-emerald-500" />
                SLA 实时监控中
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              实时追踪全网 HTTP/HTTPS、Cloudflare Workers、TCP 端口及 SSL 证书 SLA 运行指标；支持列表与卡片视图切换。
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
              {operationalCount}/{totalMonitors} 正常
            </span>
            <span className="hidden sm:inline px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60">
              全网平均: {avgLatency} ms
            </span>
          </div>

          {/* View Mode Toggle: List (Default) vs Grid */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="切换为列表视图"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">列表</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="切换为卡片网格"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">卡片</span>
            </button>
          </div>

          {onAddMonitor && (
            <button
              onClick={handleCreateClick}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新建监控</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 px-0.5">
        {/* Search Box */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索监控站点名称、域名或分组..."
            className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto text-xs">
          {[
            { id: 'all', label: '全部' },
            { id: 'operational', label: '正常' },
            { id: 'issues', label: '异常' },
            { id: 'paused', label: '已暂停' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1 rounded-xl font-medium transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Monitor Display: List View vs Grid View */}
      {filteredMonitors.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-3">
          <p className="text-xs text-slate-500">
            {searchTerm ? '未找到匹配的监控项' : '当前暂无监控项，点击新建按钮添加'}
          </p>
          {onAddMonitor && !searchTerm && (
            <button
              onClick={handleCreateClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新建监控项</span>
            </button>
          )}
        </div>
      ) : viewMode === 'list' ? (
        /* List View */
        <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80 shadow-xs">
          {filteredMonitors.map((m) => {
            const isChecking = checkingMonitorId === m.id;
            return (
              <div
                key={m.id}
                className="p-4 sm:px-5 sm:py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
              >
                {/* Left: Indicator, Name & URL */}
                <div className="flex items-center gap-3 min-w-0 md:w-5/12">
                  <div className="shrink-0">{getStatusDot(m.status, m.isPaused)}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        onClick={() => onSelectMonitor(m)}
                        className="font-semibold text-sm text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer truncate"
                      >
                        {m.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 border border-slate-200/60 dark:border-slate-700/60 px-1.5 py-0.2 rounded">
                        {m.intervalSeconds}s
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {getTypeLabel(m.type)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 font-mono truncate max-w-xs mt-0.5">
                      {m.url}
                    </div>
                  </div>
                </div>

                {/* Middle: Sleek 30-Day SLA Bar */}
                <div className="flex flex-col justify-center gap-1 md:w-4/12">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>{m.uptime30d}% 正常</span>
                    <span>{m.avgLatencyMs}ms</span>
                  </div>

                  <div className="relative group">
                    <div className="flex items-center gap-[2px] h-3.5 py-0.5">
                      {m.slaBars.slice(-30).map((bar, i) => {
                        let barBg = 'bg-emerald-500';
                        if (bar.status === 'down') barBg = 'bg-rose-500';
                        if (bar.status === 'degraded') barBg = 'bg-amber-500';
                        if (bar.status === 'no_data') barBg = 'bg-slate-200 dark:bg-slate-800';

                        return (
                          <div
                            key={i}
                            onMouseEnter={() =>
                              setHoveredBar({
                                monitorId: m.id,
                                date: bar.date,
                                uptimePct: bar.uptimePct,
                                avgLatency: bar.avgLatency,
                              })
                            }
                            onMouseLeave={() => setHoveredBar(null)}
                            className={`flex-1 h-full rounded-[1px] ${barBg} opacity-85 hover:opacity-100 transition-opacity cursor-pointer`}
                          />
                        );
                      })}
                    </div>

                    {hoveredBar && hoveredBar.monitorId === m.id && (
                      <div className="absolute left-1/2 -top-8 -translate-x-1/2 px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-mono shadow-md whitespace-nowrap z-20 pointer-events-none">
                        {hoveredBar.date}: {hoveredBar.uptimePct}% ({hoveredBar.avgLatency}ms)
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Status badge & Actions */}
                <div className="flex items-center justify-between md:justify-end gap-2 md:w-3/12 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800/60">
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                      m.isPaused || m.status === 'paused'
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        : m.status === 'operational'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : m.status === 'degraded'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {getStatusText(m.status, m.isPaused)}
                  </span>

                  <div className="flex items-center gap-1">
                    {/* Live Check Now */}
                    <button
                      onClick={() => onRunCheckNow(m.id)}
                      disabled={isChecking}
                      className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                        isChecking ? 'animate-spin text-emerald-500' : ''
                      }`}
                      title="立即测速"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>

                    {/* Pause / Resume */}
                    <button
                      onClick={() => {
                        if (hasAdminPassword && !isAdminAuthenticated) {
                          onRequestAuth?.('更改监控运行或暂停状态需管理密码授权');
                          return;
                        }
                        onTogglePause(m.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title={hasAdminPassword && !isAdminAuthenticated ? '需管理密码授权' : m.isPaused ? '恢复检测' : '暂停检测'}
                    >
                      {m.isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => {
                        if (hasAdminPassword && !isAdminAuthenticated) {
                          onRequestAuth?.('编辑监控服务配置需管理密码授权');
                          return;
                        }
                        onEditMonitor(m);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title={hasAdminPassword && !isAdminAuthenticated ? '需管理密码授权' : '编辑配置'}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => {
                        if (hasAdminPassword && !isAdminAuthenticated) {
                          onRequestAuth?.('删除监控服务需管理密码授权');
                          return;
                        }
                        onDeleteMonitor(m.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                      title={hasAdminPassword && !isAdminAuthenticated ? '需管理密码授权' : '删除监控'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Card / Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredMonitors.map((m) => {
            const isChecking = checkingMonitorId === m.id;
            return (
              <div
                key={m.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all group"
              >
                <div>
                  {/* Card Header: Status & Type */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusDot(m.status, m.isPaused)}
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {getTypeLabel(m.type)}
                      </span>
                      {m.group && (
                        <span className="text-[10px] text-slate-400 truncate max-w-[100px]">
                          {m.group}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                        m.isPaused || m.status === 'paused'
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          : m.status === 'operational'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : m.status === 'degraded'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {getStatusText(m.status, m.isPaused)}
                    </span>
                  </div>

                  {/* Title & URL */}
                  <h4
                    onClick={() => onSelectMonitor(m)}
                    className="font-bold text-sm text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer line-clamp-1"
                    title={m.name}
                  >
                    {m.name}
                  </h4>
                  <p className="text-xs font-mono text-slate-400 dark:text-slate-500 truncate mt-0.5" title={m.url}>
                    {m.url}
                  </p>

                  {/* Telemetry Metrics */}
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">24h SLA</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {m.uptime24h}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">平均响应</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {m.avgLatencyMs} ms
                      </span>
                    </div>
                  </div>

                  {/* 30-Day SLA Bars */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                      <span>30天可用率: {m.uptime30d}%</span>
                      <span>{m.intervalSeconds}s 巡检</span>
                    </div>
                    <div className="flex items-center gap-[2px] h-2.5">
                      {m.slaBars.slice(-30).map((bar, i) => {
                        let barBg = 'bg-emerald-500';
                        if (bar.status === 'down') barBg = 'bg-rose-500';
                        if (bar.status === 'degraded') barBg = 'bg-amber-500';
                        if (bar.status === 'no_data') barBg = 'bg-slate-200 dark:bg-slate-800';
                        return (
                          <div
                            key={i}
                            className={`flex-1 h-full rounded-[1px] ${barBg} opacity-85 hover:opacity-100 transition-opacity`}
                            title={`${bar.date}: ${bar.uptimePct}% (${bar.avgLatency}ms)`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                  <button
                    onClick={() => onSelectMonitor(m)}
                    className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium cursor-pointer"
                  >
                    查看详情 &rarr;
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onRunCheckNow(m.id)}
                      disabled={isChecking}
                      className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                        isChecking ? 'animate-spin text-emerald-500' : ''
                      }`}
                      title="立即测速"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        if (hasAdminPassword && !isAdminAuthenticated) {
                          onRequestAuth?.('更改监控运行或暂停状态需管理密码授权');
                          return;
                        }
                        onTogglePause(m.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title={hasAdminPassword && !isAdminAuthenticated ? '需管理密码授权' : m.isPaused ? '恢复' : '暂停'}
                    >
                      {m.isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => {
                        if (hasAdminPassword && !isAdminAuthenticated) {
                          onRequestAuth?.('编辑监控服务配置需管理密码授权');
                          return;
                        }
                        onEditMonitor(m);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title={hasAdminPassword && !isAdminAuthenticated ? '需管理密码授权' : '编辑'}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        if (hasAdminPassword && !isAdminAuthenticated) {
                          onRequestAuth?.('删除监控服务需管理密码授权');
                          return;
                        }
                        onDeleteMonitor(m.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                      title={hasAdminPassword && !isAdminAuthenticated ? '需管理密码授权' : '删除'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
