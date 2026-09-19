import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { ThemeMode, Monitor } from '../types';
import {
  Activity,
  Sun,
  Moon,
  Monitor as MonitorIcon,
  Sparkles,
  Layers,
  Globe,
  AlertOctagon,
  ExternalLink,
  Lock,
  Sliders,
} from 'lucide-react';

interface HeaderProps {
  monitors: Monitor[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAIReport: () => void;
  incidentsCount?: number;
  onOpenAdmin: () => void;
  isAdminAuthenticated: boolean;
  hasAdminPassword: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  monitors,
  activeTab,
  setActiveTab,
  onOpenAIReport,
  incidentsCount = 0,
  onOpenAdmin,
  isAdminAuthenticated,
  hasAdminPassword,
}) => {
  const { theme, setTheme } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const themeOptions: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'light', label: '明亮模式', icon: <Sun className="w-3.5 h-3.5 text-amber-500" /> },
    { mode: 'dark', label: '暗黑模式', icon: <Moon className="w-3.5 h-3.5 text-slate-300" /> },
    { mode: 'system', label: '跟随系统', icon: <MonitorIcon className="w-3.5 h-3.5 text-slate-400" /> },
  ];

  // Navigation Items without API Keys as requested
  const navItems = [
    { id: 'monitors', label: '服务监控', icon: Layers, badge: monitors.length },
    { id: 'edge_map', label: '全球节点', icon: Globe },
    { id: 'incidents', label: '故障事件', icon: AlertOctagon, badge: incidentsCount > 0 ? incidentsCount : null },
    { id: 'status_page', label: '公开看板', icon: ExternalLink },
  ];

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-3 sm:px-6">
        {/* Main Header Bar */}
        <div className="h-14 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand Logo & Name */}
          <div
            onClick={() => setActiveTab('monitors')}
            className="flex items-center gap-2 cursor-pointer select-none shrink-0"
            title="CloudPulse-UPtime 首页"
          >
            <div className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight leading-none">
                CloudPulse
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium leading-none">
                UPtime
              </span>
            </div>
          </div>

          {/* Desktop Nav Tabs (lg: screen >= 1024px) */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800 shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap leading-none transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">{item.label}</span>
                  {item.badge !== undefined && item.badge !== null && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full leading-none shrink-0 ${
                        isActive
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* AI Diagnose Button */}
            <button
              onClick={onOpenAIReport}
              className="h-8 flex items-center gap-1 px-2.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Gemini AI 智能健康诊断"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap leading-none">AI 诊断</span>
            </button>

            {/* Admin Management Portal Button (Icon-Only Header Entry) */}
            <button
              onClick={onOpenAdmin}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium border transition-all shrink-0 cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                  : isAdminAuthenticated
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                  : hasAdminPassword
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="后台管理"
              aria-label="后台管理"
            >
              {hasAdminPassword && !isAdminAuthenticated ? (
                <Lock className="w-4 h-4 text-amber-500" />
              ) : (
                <Sliders className="w-4 h-4" />
              )}
            </button>

            {/* Theme Selector Button */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={`当前主题模式: ${theme === 'light' ? '明亮' : theme === 'dark' ? '暗黑' : '跟随系统'} (点击切换)`}
              >
                {theme === 'light' ? (
                  <Sun className="w-4 h-4 text-amber-500" />
                ) : theme === 'dark' ? (
                  <Moon className="w-4 h-4 text-slate-200" />
                ) : (
                  <MonitorIcon className="w-4 h-4 text-slate-500" />
                )}
              </button>

              {showThemeMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowThemeMenu(false)} />
                  <div className="absolute right-0 mt-1.5 w-32 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-20 py-1 text-xs">
                    {themeOptions.map((opt) => (
                      <button
                        key={opt.mode}
                        onClick={() => {
                          setTheme(opt.mode);
                          setShowThemeMenu(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                          theme === opt.mode
                            ? 'font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {opt.icon}
                        <span className="whitespace-nowrap">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tablet & Mobile Nav Tabs Bar (< 1024px) */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-100 dark:border-slate-800 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge !== null && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full leading-none ${
                      isActive
                        ? 'bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900 font-bold'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
