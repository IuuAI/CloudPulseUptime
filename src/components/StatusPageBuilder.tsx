import React, { useState } from 'react';
import { StatusPageConfig, Monitor } from '../types';
import {
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Globe,
  Activity,
  Shield,
  Zap,
} from 'lucide-react';

interface StatusPageBuilderProps {
  config: StatusPageConfig;
  monitors: Monitor[];
  onUpdateConfig: (newConfig: Partial<StatusPageConfig>) => void;
}

export const StatusPageBuilder: React.FC<StatusPageBuilderProps> = ({
  config,
  monitors,
  onUpdateConfig,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [title, setTitle] = useState(config.title);
  const [description, setDescription] = useState(config.description);
  const [announcement, setAnnouncement] = useState(config.announcement || '');

  const filteredMonitors = monitors.filter((m) => config.monitorIds.includes(m.id));

  const downCount = filteredMonitors.filter((m) => m.status === 'down').length;
  const degradedCount = filteredMonitors.filter((m) => m.status === 'degraded').length;

  let bannerBg = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
  let bannerText = '所有核心系统与 Edge 节点全部运行正常 (All Systems Operational)';
  let BannerIcon = CheckCircle2;

  if (downCount > 0) {
    bannerBg = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    bannerText = `检测到 ${downCount} 个服务故障 outage detected`;
    BannerIcon = XCircle;
  } else if (degradedCount > 0) {
    bannerBg = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    bannerText = `检测到 ${degradedCount} 个服务 Latency 响应高`;
    BannerIcon = AlertTriangle;
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig({ title, description, announcement });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Bar Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-sky-500/10 text-sky-500">
            <ExternalLink className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              公共 Status 页面与实时看板
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              面向团队与客户提供无侵入、高可用的实时 SLA 验证看板。
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors"
          >
            {isEditing ? '取消编辑' : '自定义 Status 页设置'}
          </button>

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '已复制链接' : '复制 Status 页公开链接'}</span>
          </button>
        </div>
      </div>

      {/* Edit Form Drawer */}
      {isEditing && (
        <form
          onSubmit={handleSaveEdit}
          className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-md space-y-3"
        >
          <h4 className="text-xs font-bold text-slate-900 dark:text-white font-mono">
            编辑 Status 看板元数据
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Status 看板标题
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                一句话描述
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              顶部公告 (Announcement Banner)
            </label>
            <input
              type="text"
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-sm"
            >
              保存公告设置
            </button>
          </div>
        </form>
      )}

      {/* Public Status Page Live Preview Frame */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
        {/* Status Page Brand Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 p-0.5 shadow-md shadow-sky-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Activity className="w-5 h-5 text-sky-400" />
              </div>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-mono">
                {title}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Globe className="w-4 h-4 text-sky-500" />
            <span>实时 SLA 刷新中</span>
          </div>
        </div>

        {/* Big Overall Health Banner */}
        <div className={`p-4 rounded-2xl border flex items-center gap-3 ${bannerBg}`}>
          <BannerIcon className="w-6 h-6 shrink-0" />
          <span className="font-bold text-sm sm:text-base">{bannerText}</span>
        </div>

        {/* Announcement Banner if present */}
        {announcement && (
          <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-mono">
            📢 <strong>系统公告:</strong> {announcement}
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
                className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white font-mono">
                      {m.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">({m.group || 'Core'})</span>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    m.status === 'operational'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  }`}>
                    {m.status.toUpperCase()}
                  </span>
                </div>

                {/* 90-day SLA bars */}
                <div className="flex items-center gap-[2px] h-5 py-0.5">
                  {m.slaBars.slice(-60).map((bar, i) => {
                    let barBg = 'bg-emerald-500';
                    if (bar.status === 'down') barBg = 'bg-rose-500';
                    if (bar.status === 'degraded') barBg = 'bg-amber-500';
                    return (
                      <div
                        key={i}
                        title={`${bar.date} | ${bar.uptimePct}% SLA`}
                        className={`flex-1 h-full rounded-[1px] ${barBg}`}
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
