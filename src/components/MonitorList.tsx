import React, { useState } from 'react';
import { Monitor } from '../types';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  PauseCircle,
  Play,
  RotateCw,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  Shield,
  Server,
  Globe,
  Zap,
  Lock,
  LayoutGrid,
  List,
  Sparkles,
} from 'lucide-react';

interface MonitorListProps {
  monitors: Monitor[];
  onSelectMonitor: (monitor: Monitor) => void;
  onRunCheckNow: (monitorId: string) => void;
  onTogglePause: (monitorId: string) => void;
  onEditMonitor: (monitor: Monitor) => void;
  onDeleteMonitor: (monitorId: string) => void;
  checkingMonitorId: string | null;
}

export const MonitorList: React.FC<MonitorListProps> = ({
  monitors,
  onSelectMonitor,
  onRunCheckNow,
  onTogglePause,
  onEditMonitor,
  onDeleteMonitor,
  checkingMonitorId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [hoveredBar, setHoveredBar] = useState<{ monitorId: string; date: string; uptimePct: number; avgLatency: number } | null>(null);

  // Extract unique groups
  const groups = ['all', ...Array.from(new Set(monitors.map((m) => m.group || '其他')))];

  // Filter monitors
  const filteredMonitors = monitors.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.tags && m.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesGroup = selectedGroup === 'all' || (m.group || '其他') === selectedGroup;

    return matchesSearch && matchesGroup;
  });

  const getStatusBadge = (status: string, isPaused?: boolean) => {
    if (isPaused || status === 'paused') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-500/10 text-slate-500 border border-slate-500/20">
          <PauseCircle className="w-3 h-3" />
          <span>已暂停</span>
        </span>
      );
    }
    if (status === 'operational') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          <span>正常 Operational</span>
        </span>
      );
    }
    if (status === 'degraded') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <AlertTriangle className="w-3 h-3 text-amber-500" />
          <span>延迟高 Degraded</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
        <XCircle className="w-3 h-3 text-rose-500" />
        <span>服务故障 Down</span>
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'cloudflare_worker':
        return <Zap className="w-4 h-4 text-amber-500" />;
      case 'ssl':
        return <Lock className="w-4 h-4 text-indigo-500" />;
      case 'port':
        return <Server className="w-4 h-4 text-sky-500" />;
      case 'ping':
        return <Globe className="w-4 h-4 text-emerald-500" />;
      default:
        return <Globe className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar: Search, Group filter tabs, View mode switch */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索站点名称、URL 或 Tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
          />
        </div>

        {/* Group Tabs & View Mode */}
        <div className="flex items-center justify-between md:justify-end gap-3">
          <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-xs sm:max-w-md scrollbar-none">
            {groups.map((group) => (
              <button
                key={group}
                onClick={() => setSelectedGroup(group)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedGroup === group
                    ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold border border-sky-500/20'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {group === 'all' ? '全部服务' : group}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/50">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="列表视图"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="网格视图"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Monitor Items Render */}
      {filteredMonitors.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl">
          <Server className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">未找到符合条件的监控项</h3>
          <p className="text-xs text-slate-500 mt-1">尝试修改搜索关键字，或新建一个监控任务。</p>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-200/60 dark:divide-slate-800">
            {filteredMonitors.map((m) => {
              const isCheckingThis = checkingMonitorId === m.id;
              return (
                <div
                  key={m.id}
                  className="p-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left Column: Title & URL */}
                  <div className="flex items-start gap-3 min-w-0 md:w-1/3">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shrink-0 mt-0.5">
                      {getTypeIcon(m.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          onClick={() => onSelectMonitor(m)}
                          className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white hover:text-sky-500 dark:hover:text-sky-400 cursor-pointer truncate"
                        >
                          {m.name}
                        </span>
                        {getStatusBadge(m.status, m.isPaused)}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        <span className="truncate max-w-[200px] sm:max-w-xs">{m.url}</span>
                        <span>•</span>
                        <span>{m.intervalSeconds}s 频次</span>
                      </div>
                    </div>
                  </div>

                  {/* Center Column: 90-Day SLA Heatmap Bar */}
                  <div className="flex flex-col justify-center gap-1.5 md:w-1/3">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>90天 SLA: <strong className="text-slate-800 dark:text-slate-200">{m.uptime30d}%</strong></span>
                      <span>Avg Latency: <strong className="text-slate-800 dark:text-slate-200">{m.avgLatencyMs}ms</strong></span>
                    </div>

                    {/* Bars Container */}
                    <div className="relative group">
                      <div className="flex items-center gap-[2px] h-6 py-1 bg-slate-100/60 dark:bg-slate-800/60 px-1.5 rounded-lg border border-slate-200/40 dark:border-slate-800">
                        {m.slaBars.slice(-45).map((bar, i) => {
                          let barBg = 'bg-emerald-500';
                          if (bar.status === 'down') barBg = 'bg-rose-500';
                          if (bar.status === 'degraded') barBg = 'bg-amber-500';
                          if (bar.status === 'no_data') barBg = 'bg-slate-300 dark:bg-slate-700';

                          return (
                            <div
                              key={i}
                              onMouseEnter={() => setHoveredBar({ monitorId: m.id, date: bar.date, uptimePct: bar.uptimePct, avgLatency: bar.avgLatency })}
                              onMouseLeave={() => setHoveredBar(null)}
                              className={`flex-1 h-full rounded-[1px] hover:scale-125 transition-transform cursor-pointer ${barBg}`}
                            />
                          );
                        })}
                      </div>

                      {/* Tooltip hover */}
                      {hoveredBar && hoveredBar.monitorId === m.id && (
                        <div className="absolute left-1/2 -top-10 -translate-x-1/2 px-2.5 py-1 rounded-md bg-slate-900 text-white text-[10px] font-mono shadow-lg whitespace-nowrap z-20 pointer-events-none">
                          {hoveredBar.date} | SLA: {hoveredBar.uptimePct}% | {hoveredBar.avgLatency}ms
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center justify-end gap-1.5 shrink-0 pt-2 md:pt-0 border-t md:border-0 border-slate-100 dark:border-slate-800/60">
                    <button
                      onClick={() => onRunCheckNow(m.id)}
                      disabled={isCheckingThis}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-600 dark:text-sky-400 font-medium text-xs transition-colors border border-sky-500/20 disabled:opacity-50"
                      title="立即触发 Edge 实时 Check 测速"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${isCheckingThis ? 'animate-spin text-sky-500' : ''}`} />
                      <span className="hidden sm:inline">Check</span>
                    </button>

                    <button
                      onClick={() => onSelectMonitor(m)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors"
                    >
                      详情
                    </button>

                    <button
                      onClick={() => onTogglePause(m.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title={m.isPaused ? '恢复监控' : '暂停监控'}
                    >
                      {m.isPaused ? <Play className="w-3.5 h-3.5 text-emerald-500" /> : <PauseCircle className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => onEditMonitor(m)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="编辑监控项"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDeleteMonitor(m.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="删除监控"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMonitors.map((m) => {
            const isCheckingThis = checkingMonitorId === m.id;
            return (
              <div
                key={m.id}
                className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                        {getTypeIcon(m.type)}
                      </div>
                      <span
                        onClick={() => onSelectMonitor(m)}
                        className="font-semibold text-sm text-slate-900 dark:text-white hover:text-sky-500 cursor-pointer truncate max-w-[160px]"
                      >
                        {m.name}
                      </span>
                    </div>
                    {getStatusBadge(m.status, m.isPaused)}
                  </div>

                  <p className="text-xs font-mono text-slate-500 truncate mb-3">{m.url}</p>

                  <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-xs font-mono mb-3">
                    <div>
                      <span className="text-slate-400 block text-[10px]">24H SLA</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{m.uptime24h}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Avg Latency</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{m.avgLatencyMs}ms</span>
                    </div>
                  </div>

                  {/* SLA Heatmap bar preview */}
                  <div className="flex items-center gap-[1px] h-3 my-2">
                    {m.slaBars.slice(-24).map((bar, i) => {
                      let barBg = 'bg-emerald-500';
                      if (bar.status === 'down') barBg = 'bg-rose-500';
                      if (bar.status === 'degraded') barBg = 'bg-amber-500';
                      return <div key={i} className={`flex-1 h-full rounded-[1px] ${barBg}`} />;
                    })}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 mt-2 text-xs">
                  <button
                    onClick={() => onRunCheckNow(m.id)}
                    disabled={isCheckingThis}
                    className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-medium hover:underline disabled:opacity-50"
                  >
                    <RotateCw className={`w-3 h-3 ${isCheckingThis ? 'animate-spin' : ''}`} />
                    <span>Check Now</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onSelectMonitor(m)}
                      className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-[11px]"
                    >
                      详情
                    </button>
                    <button
                      onClick={() => onEditMonitor(m)}
                      className="p-1 text-slate-400 hover:text-sky-500"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteMonitor(m.id)}
                      className="p-1 text-slate-400 hover:text-rose-500"
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
