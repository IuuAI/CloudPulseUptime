import React from 'react';
import { StatusPageConfig, Monitor } from '../types';
import {
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Globe,
  Activity,
  Shield,
  Zap,
} from 'lucide-react';

interface StatusPageBuilderProps {
  config: StatusPageConfig;
  monitors: Monitor[];
  onUpdateConfig?: (newConfig: Partial<StatusPageConfig>) => void;
}

export const StatusPageBuilder: React.FC<StatusPageBuilderProps> = ({
  config,
  monitors,
}) => {
  const filteredMonitors = monitors.filter(
    (m) => !config.monitorIds || config.monitorIds.length === 0 || config.monitorIds.includes(m.id)
  );

  const downCount = filteredMonitors.filter((m) => m.status === 'down').length;
  const degradedCount = filteredMonitors.filter((m) => m.status === 'degraded').length;

  let bannerBg = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
  let bannerText = '所有核心系统与全球 Edge 节点运行正常 (All Systems Operational)';
  let BannerIcon = CheckCircle2;

  if (downCount > 0) {
    bannerBg = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    bannerText = `检测到 ${downCount} 个服务故障 (Service Outage Detected)`;
    BannerIcon = XCircle;
  } else if (degradedCount > 0) {
    bannerBg = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    bannerText = `检测到 ${degradedCount} 个服务响应延迟偏高 (Degraded Performance)`;
    BannerIcon = AlertTriangle;
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-sky-500/10 text-sky-500 border border-sky-500/20 shrink-0">
            <ExternalLink className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              公共 Status 页面与全网实时看板
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              面向团队与全球终端用户提供权威、透明的实时 SLA 运行状态与服务健康报告。
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Globe className="w-4 h-4 text-sky-500" />
          <span>全网实时公开看板</span>
        </div>
      </div>

      {/* Public Status Page View */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
        {/* Status Page Brand Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 p-0.5 shadow-md shadow-sky-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Activity className="w-5 h-5 text-sky-400" />
              </div>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">
                {config.title || 'CloudPulse-UPtime System Status'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {config.description || '实时高可用监控与 SLA 运行健康度看板'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>自动实时同步</span>
          </div>
        </div>

        {/* Big Overall Health Banner */}
        <div className={`p-4 rounded-2xl border flex items-center gap-3.5 ${bannerBg}`}>
          <BannerIcon className="w-6 h-6 shrink-0" />
          <span className="font-bold text-sm sm:text-base">{bannerText}</span>
        </div>

        {/* Announcement Banner if present */}
        {config.announcement && (
          <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-mono">
            📢 <strong>系统公告:</strong> {config.announcement}
          </div>
        )}

        {/* Public Monitor Status List */}
        <div className="space-y-4 pt-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
            核心服务列表与 90 天 SLA Heatmap
          </h2>

          <div className="space-y-3">
            {filteredMonitors.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white font-mono">
                      {m.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">({m.group || 'Core'})</span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                      m.status === 'operational'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {m.status.toUpperCase()}
                  </span>
                </div>

                {/* 90-day SLA bars */}
                <div className="flex items-center gap-[2px] h-5 py-0.5">
                  {m.slaBars.slice(-60).map((bar, i) => {
                    let barBg = 'bg-emerald-500';
                    if (bar.status === 'down') barBg = 'bg-rose-500';
                    if (bar.status === 'degraded') barBg = 'bg-amber-500';
                    if (bar.status === 'no_data') barBg = 'bg-slate-200 dark:bg-slate-800';
                    return (
                      <div
                        key={i}
                        title={`${bar.date} | ${bar.uptimePct}% SLA`}
                        className={`flex-1 h-full rounded-[1px] ${barBg} opacity-90 hover:opacity-100 transition-opacity`}
                      />
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>90天前</span>
                  <span>90天可用率: <strong className="text-slate-800 dark:text-slate-200">{m.uptime30d}%</strong></span>
                  <span>今天</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Powered by CloudPulse-UPtime</span>
          <span>SLA Target: 99.9%</span>
        </div>
      </div>
    </div>
  );
};
