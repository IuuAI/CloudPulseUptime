import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { ThemeMode, Monitor } from '../types';
import {
  Activity,
  Sun,
  Moon,
  Monitor as MonitorIcon,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Layers,
  Globe,
  AlertOctagon,
  ExternalLink,
  Bell,
} from 'lucide-react';

interface HeaderProps {
  monitors: Monitor[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenMobileMenu?: () => void;
  onOpenAIReport: () => void;
  onAddMonitor: () => void;
  incidentsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  monitors,
  activeTab,
  setActiveTab,
  onOpenAIReport,
  onAddMonitor,
  incidentsCount = 0,
}) => {
  const { theme, setTheme } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  // Overall status check
  const downCount = monitors.filter((m) => m.status === 'down').length;
  const degradedCount = monitors.filter((m) => m.status === 'degraded').length;

  const themeOptions: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'light', label: '明亮', icon: <Sun className="w-3.5 h-3.5 text-amber-500" /> },
    { mode: 'dark', label: '暗黑', icon: <Moon className="w-3.5 h-3.5 text-indigo-400" /> },
    { mode: 'system', label: '跟随系统', icon: <MonitorIcon className="w-3.5 h-3.5 text-slate-400" /> },
  ];

  const navItems = [
    { id: 'monitors', label: '监控服务', icon: Layers, badge: monitors.length },
    { id: 'edge_map', label: '全球节点', icon: Globe },
    { id: 'incidents', label: '故障事件', icon: AlertOctagon, badge: incidentsCount > 0 ? incidentsCount : null },
    { id: 'status_page', label: '公开看板', icon: ExternalLink },
    { id: 'alerts', label: '告警配置', icon: Bell },
  ];

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/70 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Top bar: Brand & Actions */}
        <div className="h-14 flex items-center justify-between gap-4">
          {/* Brand */}
          <div
            onClick={() => setActiveTab('monitors')}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Activity className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base text-slate-900 dark:text-white tracking-tight">
                CloudPulse
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                UPtime
              </span>
            </div>
          </div>

          {/* Nav Tabs for Desktop */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/70 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge !== null && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        : 'bg-slate-200/60 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* AI Diagnose */}
            <button
              onClick={onOpenAIReport}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Gemini AI 智能诊断"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden sm:inline">AI 诊断</span>
            </button>

            {/* Theme Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="切换主题"
              >
                {theme === 'light' ? (
                  <Sun className="w-4 h-4 text-amber-500" />
                ) : theme === 'dark' ? (
                  <Moon className="w-4 h-4 text-indigo-400" />
                ) : (
                  <MonitorIcon className="w-4 h-4" />
                )}
              </button>

              {showThemeMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowThemeMenu(false)} />
                  <div className="absolute right-0 mt-1.5 w-28 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg z-20 py-1 text-xs">
                    {themeOptions.map((opt) => (
                      <button
                        key={opt.mode}
                        onClick={() => {
                          setTheme(opt.mode);
                          setShowThemeMenu(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                          theme === opt.mode ? 'font-semibold text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {opt.icon}
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Add Monitor */}
            <button
              onClick={onAddMonitor}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium text-xs shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新建监控</span>
            </button>
          </div>
        </div>

        {/* Mobile Nav Tabs Bar */}
        <div className="md:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-100 dark:border-slate-800/80 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
