import React, { useMemo } from 'react';
import { Monitor, Incident } from '../types';

interface OverviewCardsProps {
  monitors: Monitor[];
  incidents: Incident[];
  onSelectFilter?: (status: string | null) => void;
}

export const OverviewCards: React.FC<OverviewCardsProps> = ({
  monitors,
  incidents,
}) => {
  const metrics = useMemo(() => {
    const totalMonitors = monitors.length;
    const operationalCount = monitors.filter((m) => m.status === 'operational').length;
    const degradedCount = monitors.filter((m) => m.status === 'degraded').length;
    const downCount = monitors.filter((m) => m.status === 'down').length;

    const avgUptime24h =
      totalMonitors > 0
        ? (monitors.reduce((acc, m) => acc + m.uptime24h, 0) / totalMonitors).toFixed(2)
        : '100.00';

    const avgLatency =
      totalMonitors > 0
        ? Math.round(monitors.reduce((acc, m) => acc + m.avgLatencyMs, 0) / totalMonitors)
        : 0;

    const activeIncidents = incidents.filter((i) => i.status !== 'resolved').length;

    return {
      totalMonitors,
      operationalCount,
      degradedCount,
      downCount,
      avgUptime24h,
      avgLatency,
      activeIncidents,
    };
  }, [monitors, incidents]);

  const isAllGood = metrics.downCount === 0 && metrics.degradedCount === 0;

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 p-4 sm:p-5 shadow-xs transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Overall Status Banner */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center shrink-0">
            {isAllGood ? (
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
            ) : metrics.downCount > 0 ? (
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
              </span>
            ) : (
              <span className="relative flex h-3.5 w-3.5">
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                {isAllGood
                  ? '所有服务运行正常'
                  : metrics.downCount > 0
                  ? `${metrics.downCount} 个服务检测到异常`
                  : `${metrics.degradedCount} 个服务出现性能降级`}
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                {metrics.avgUptime24h}% SLA
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              全球 Cloudflare 边缘节点实时持续监测中
            </p>
          </div>
        </div>

        {/* Right: Inline Key Stats */}
        <div className="flex items-center gap-4 sm:gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <div className="text-slate-400 dark:text-slate-500 text-[11px]">正常监控</div>
            <div className="font-semibold font-mono text-slate-900 dark:text-slate-100 text-sm mt-0.5">
              {metrics.operationalCount}
              <span className="text-slate-400 font-normal text-xs">/{metrics.totalMonitors}</span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200/60 dark:bg-slate-800" />

          <div>
            <div className="text-slate-400 dark:text-slate-500 text-[11px]">平均延时</div>
            <div className="font-semibold font-mono text-slate-900 dark:text-slate-100 text-sm mt-0.5">
              {metrics.avgLatency}
              <span className="text-slate-400 font-normal text-xs ml-0.5">ms</span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200/60 dark:bg-slate-800" />

          <div>
            <div className="text-slate-400 dark:text-slate-500 text-[11px]">未解决事件</div>
            <div className="font-semibold font-mono text-slate-900 dark:text-slate-100 text-sm mt-0.5">
              {metrics.activeIncidents > 0 ? (
                <span className="text-rose-500 font-bold">{metrics.activeIncidents}</span>
              ) : (
                '0'
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
