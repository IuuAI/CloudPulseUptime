import React, { useState } from 'react';
import { Monitor } from '../types';
import {
  X,
  RotateCw,
  Sparkles,
  ShieldCheck,
  Lock,
  Globe,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Zap,
} from 'lucide-react';

interface MonitorDetailModalProps {
  monitor: Monitor;
  onClose: () => void;
  onRunCheckNow: (monitorId: string) => void;
  onOpenAIReportForMonitor: (monitor: Monitor) => void;
  isChecking: boolean;
}

export const MonitorDetailModal: React.FC<MonitorDetailModalProps> = ({
  monitor,
  onClose,
  onRunCheckNow,
  onOpenAIReportForMonitor,
  isChecking,
}) => {
  const [activeTab, setActiveTab] = useState<'latency' | 'ssl' | 'nodes' | 'logs'>('latency');

  // Compute SVG Points for 24h latency chart
  const historyPoints = monitor.history || [];
  const maxLatency = Math.max(...historyPoints.map((p) => p.latencyMs), 100);
  const minLatency = Math.min(...historyPoints.map((p) => p.latencyMs), 10);

  const chartHeight = 120;
  const chartWidth = 500;

  const pointsSvgStr = historyPoints
    .map((p, index) => {
      const x = (index / Math.max(1, historyPoints.length - 1)) * chartWidth;
      const normalizedY = (p.latencyMs - minLatency) / (maxLatency - minLatency || 1);
      const y = chartHeight - normalizedY * (chartHeight - 20) - 10;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-mono">
                {monitor.name}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                monitor.status === 'operational'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
              }`}>
                {monitor.status.toUpperCase()}
              </span>
            </div>
            <a
              href={monitor.url.startsWith('http') ? monitor.url : `https://${monitor.url}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400 hover:underline mt-1 font-mono"
            >
              <span>{monitor.url}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onRunCheckNow(monitor.id)}
              disabled={isChecking}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              <span>实时测试</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 sm:p-6 space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <div>
              <span className="text-[11px] text-slate-400 block font-mono">24H 可用率</span>
              <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {monitor.uptime24h}%
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-mono">30D SLA</span>
              <span className="text-base font-bold font-mono text-slate-800 dark:text-slate-200">
                {monitor.uptime30d}%
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-mono">平均 Latency</span>
              <span className="text-base font-bold font-mono text-sky-600 dark:text-sky-400">
                {monitor.avgLatencyMs} ms
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-mono">检测间隔</span>
              <span className="text-base font-bold font-mono text-slate-800 dark:text-slate-200">
                {monitor.intervalSeconds}s
              </span>
            </div>
          </div>

          {/* AI SLA Analysis Banner Trigger */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-purple-500/10 border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-500 shrink-0">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Gemini AI 智能 SLA 故障分析引擎
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  针对当前站点的 Latency 波动趋势与 Edge 节点响应进行深度智能诊断与归因分析。
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenAIReportForMonitor(monitor)}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all whitespace-nowrap cursor-pointer"
            >
              生成此站点 AI 诊断报告
            </button>
          </div>

          {/* Tab Navigation inside Modal */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 text-xs font-medium">
            <button
              onClick={() => setActiveTab('latency')}
              className={`pb-2.5 px-1 border-b-2 transition-colors ${
                activeTab === 'latency'
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              24H 延迟趋势 Chart
            </button>
            <button
              onClick={() => setActiveTab('nodes')}
              className={`pb-2.5 px-1 border-b-2 transition-colors ${
                activeTab === 'nodes'
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Cloudflare 全球 POPs ({monitor.edgeNodes?.length || 0})
            </button>
            {monitor.sslInfo && (
              <button
                onClick={() => setActiveTab('ssl')}
                className={`pb-2.5 px-1 border-b-2 transition-colors ${
                  activeTab === 'ssl'
                    ? 'border-sky-500 text-sky-600 dark:text-sky-400 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                SSL / TLS 证书信息
              </button>
            )}
            <button
              onClick={() => setActiveTab('logs')}
              className={`pb-2.5 px-1 border-b-2 transition-colors ${
                activeTab === 'logs'
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              最近 Check 日志 ({historyPoints.length})
            </button>
          </div>

          {/* TAB 1: Latency Chart & 90-Day SLA Bars */}
          {activeTab === 'latency' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900 text-white font-mono shadow-inner border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>24H Response Latency Curve (ms)</span>
                  <span className="text-emerald-400">Min: {minLatency}ms / Max: {maxLatency}ms</span>
                </div>

                <div className="w-full overflow-hidden">
                  <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="w-full h-28 overflow-visible"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <polygon
                      points={`0,${chartHeight} ${pointsSvgStr} ${chartWidth},${chartHeight}`}
                      fill="url(#latencyGradient)"
                    />
                    <polyline
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2"
                      points={pointsSvgStr}
                    />
                  </svg>
                </div>
              </div>

              {/* 90-day SLA Pulse Bars */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-2">
                  <span>近 90 天 SLA 历史 Heatmap</span>
                  <span className="text-emerald-500">100% Operational</span>
                </div>
                <div className="flex items-center gap-[2px] h-8 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800">
                  {monitor.slaBars.map((bar, i) => {
                    let barBg = 'bg-emerald-500';
                    if (bar.status === 'down') barBg = 'bg-rose-500';
                    if (bar.status === 'degraded') barBg = 'bg-amber-500';
                    if (bar.status === 'no_data') barBg = 'bg-slate-300 dark:bg-slate-700';

                    return (
                      <div
                        key={i}
                        title={`${bar.date} | SLA: ${bar.uptimePct}% | ${bar.avgLatency}ms`}
                        className={`flex-1 h-full rounded-[1px] hover:scale-125 transition-transform cursor-pointer ${barBg}`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Cloudflare Global Edge POPs */}
          {activeTab === 'nodes' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(monitor.edgeNodes || []).map((node, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{node.flag}</span>
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        {node.nodeCode} - {node.location}
                      </span>
                      <span className="text-[10px] text-slate-400">Cloudflare Edge POP</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sky-600 dark:text-sky-400 block">
                      {node.latencyMs} ms
                    </span>
                    <span className="text-[10px] text-emerald-500">Pass</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: SSL Details */}
          {activeTab === 'ssl' && monitor.sslInfo && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-2">
                <span className="text-slate-500">证书域名 Domain:</span>
                <span className="font-bold text-slate-900 dark:text-white">{monitor.sslInfo.domain}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-2">
                <span className="text-slate-500">颁发机构 Issuer:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{monitor.sslInfo.issuer}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-2">
                <span className="text-slate-500">剩余有效天数 Countdown:</span>
                <span className={`font-bold ${monitor.sslInfo.daysRemaining < 30 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {monitor.sslInfo.daysRemaining} 天
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">有效期 Validity Period:</span>
                <span className="text-slate-700 dark:text-slate-300">
                  {monitor.sslInfo.validFrom} ~ {monitor.sslInfo.validTo}
                </span>
              </div>
            </div>
          )}

          {/* TAB 4: Logs */}
          {activeTab === 'logs' && (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {historyPoints.map((pt, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${pt.status === 'operational' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span className="text-slate-600 dark:text-slate-300">
                      {new Date(pt.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">HTTP {pt.statusCode}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{pt.latencyMs} ms</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
