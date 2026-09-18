import React, { useState } from 'react';
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'operational' | 'issues' | 'paused'>('all');
  const [hoveredBar, setHoveredBar] = useState<{ monitorId: string; date: string; uptimePct: number; avgLatency: number } | null>(null);

  // Filter monitors
  const filteredMonitors = monitors.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.url.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'operational') return m.status === 'operational' && !m.isPaused;
    if (statusFilter === 'issues') return (m.status === 'down' || m.status === 'degraded') && !m.isPaused;
    if (statusFilter === 'paused') return m.isPaused || m.status === 'paused';

    return true;
  });

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

  return (
    <div className="space-y-3">
      {/* Clean Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 py-1">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="搜索站点名称或域名..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs">
          {[
            { id: 'all', label: '全部' },
            { id: 'operational', label: '正常' },
            { id: 'issues', label: '异常' },
            { id: 'paused', label: '暂停' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                statusFilter === tab.id
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Monitor Rows */}
      {filteredMonitors.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl">
          <p className="text-xs text-slate-500">未找到匹配的监控项</p>
        </div>
      ) : (
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
                      className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                        isChecking ? 'animate-spin text-emerald-500' : ''
                      }`}
                      title="立即测速"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>

                    {/* Pause / Resume */}
                    <button
                      onClick={() => onTogglePause(m.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title={m.isPaused ? '恢复检测' : '暂停检测'}
                    >
                      {m.isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => onEditMonitor(m)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="编辑配置"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => onDeleteMonitor(m.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="删除监控"
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
