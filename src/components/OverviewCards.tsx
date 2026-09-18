import React from 'react';
import { Monitor, Incident } from '../types';
import { ShieldCheck, Clock, CheckCircle2, AlertTriangle, ShieldAlert, Cpu } from 'lucide-react';

interface OverviewCardsProps {
  monitors: Monitor[];
  incidents: Incident[];
  onSelectFilter?: (status: string | null) => void;
}

export const OverviewCards: React.FC<OverviewCardsProps> = ({
  monitors,
  incidents,
  onSelectFilter,
}) => {
  const totalMonitors = monitors.length;
  const operationalCount = monitors.filter((m) => m.status === 'operational').length;
  const degradedCount = monitors.filter((m) => m.status === 'degraded').length;
  const downCount = monitors.filter((m) => m.status === 'down').length;
  const pausedCount = monitors.filter((m) => m.isPaused || m.status === 'paused').length;

  // Average Uptime %
  const avgUptime24h = totalMonitors > 0
    ? (monitors.reduce((acc, m) => acc + m.uptime24h, 0) / totalMonitors).toFixed(2)
    : '100.00';

  // Average Latency
  const avgLatency = totalMonitors > 0
    ? Math.round(monitors.reduce((acc, m) => acc + m.avgLatencyMs, 0) / totalMonitors)
    : 0;

  // SSL expiries (<30 days)
  const expiringSslCount = monitors.filter(
    (m) => m.sslInfo && m.sslInfo.daysRemaining < 30
  ).length;

  const activeIncidents = incidents.filter((i) => i.status !== 'resolved').length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Card 1: Overall SLA Uptime */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            24H 平均 SLA 可用率
          </span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
            {avgUptime24h}%
          </span>
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            SLA 达标
          </span>
        </div>
        <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, parseFloat(avgUptime24h)))}%` }}
          />
        </div>
      </div>

      {/* Card 2: Avg Latency */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            平均响应延迟 Latency
          </span>
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
            {avgLatency}
            <span className="text-sm font-normal text-slate-500 ml-1">ms</span>
          </span>
          <span className="text-[11px] font-medium text-sky-600 dark:text-sky-400">
            Edge 测速
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
          <span>采样自全球 Cloudflare Edge 节点</span>
        </div>
      </div>

      {/* Card 3: Active Monitors Status Breakdown */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            监控服务状态 ({totalMonitors})
          </span>
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
            <Cpu className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-center gap-2 my-1">
          <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
            {operationalCount}
          </span>
          <span className="text-xs text-slate-500">/ {totalMonitors} 正常</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono mt-1">
          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> {operationalCount} 正常
          </span>
          {degradedCount > 0 && (
            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> {degradedCount} 慢
            </span>
          )}
          {downCount > 0 && (
            <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> {downCount} 故障
            </span>
          )}
        </div>
      </div>

      {/* Card 4: Active Incidents & SSL Health */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            故障事件与 SSL 证书
          </span>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-extrabold font-mono ${activeIncidents > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
            {activeIncidents}
          </span>
          <span className="text-xs text-slate-500">起未解决 Incident</span>
        </div>
        <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>SSL 证书即将过期:</span>
          <span className={`font-mono font-semibold ${expiringSslCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
            {expiringSslCount} 个
          </span>
        </div>
      </div>
    </div>
  );
};
