import React from 'react';
import {
  LayoutDashboard,
  Activity,
  Globe,
  AlertOctagon,
  ExternalLink,
  Bell,
  X,
  ShieldCheck,
  Server,
  Zap,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  monitorsCount: number;
  incidentsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpenMobile,
  onCloseMobile,
  monitorsCount,
  incidentsCount,
}) => {
  const navItems = [
    {
      id: 'overview',
      label: '监控概览',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'monitors',
      label: '站点与服务列表',
      icon: Activity,
      badge: monitorsCount > 0 ? monitorsCount : null,
    },
    {
      id: 'edge_map',
      label: 'Cloudflare 边缘节点',
      icon: Globe,
      badge: '8 POPs',
    },
    {
      id: 'incidents',
      label: '故障与维护日志',
      icon: AlertOctagon,
      badge: incidentsCount > 0 ? incidentsCount : null,
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
    {
      id: 'status_page',
      label: '公共 Status 页',
      icon: ExternalLink,
      badge: 'Public',
    },
    {
      id: 'alerts',
      label: '告警与 Webhook',
      icon: Bell,
      badge: null,
    },
  ];

  const handleSelect = (id: string) => {
    setActiveTab(id);
    onCloseMobile();
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full py-4 px-3">
      {/* Mobile drawer header */}
      <div className="flex items-center justify-between px-2 mb-4 md:hidden">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
          CloudPulse-UPtime
        </span>
        <button
          onClick={onCloseMobile}
          className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Navigation links */}
      <div className="space-y-1">
        <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          核心功能
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold border border-sky-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-500' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                    item.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Cloudflare Edge status card footer */}
      <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800 px-2">
        <div className="rounded-xl p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium mb-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Cloudflare Edge Check</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-2">
            利用全球 300+ 边缘 POP 节点做自适应毫秒级 Ping/HTTP 健康度感知。
          </p>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Interval: 15s - 5m</span>
            <span className="text-emerald-500 font-semibold">Active</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop / Tablet Sidebar */}
      <aside className="hidden md:block w-60 shrink-0 border-r border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 min-h-[calc(100vh-4rem)]">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Sliding Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl md:hidden transition-transform duration-300 ease-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </div>
    </>
  );
};
