import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { ThemeMode, Monitor } from '../types';
import {
  Activity,
  Sun,
  Moon,
  Monitor as MonitorIcon,
  Menu,
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
} from 'lucide-react';

interface HeaderProps {
  monitors: Monitor[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenMobileMenu: () => void;
  onOpenAIReport: () => void;
  onAddMonitor: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  monitors,
  activeTab,
  setActiveTab,
  onOpenMobileMenu,
  onOpenAIReport,
  onAddMonitor,
}) => {
  const { theme, setTheme, actualTheme } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  // Calculate overall status
  const downCount = monitors.filter((m) => m.status === 'down').length;
  const degradedCount = monitors.filter((m) => m.status === 'degraded').length;

  let overallStatusText = '所有服务正常运行';
  let overallBadgeClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
  let StatusIcon = CheckCircle2;

  if (downCount > 0) {
    overallStatusText = `${downCount} 个节点检测到故障`;
    overallBadgeClass = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    StatusIcon = XCircle;
  } else if (degradedCount > 0) {
    overallStatusText = `${degradedCount} 个节点性能降级`;
    overallBadgeClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    StatusIcon = AlertTriangle;
  }

  const themeOptions: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'light', label: '明亮模式', icon: <Sun className="w-4 h-4 text-amber-500" /> },
    { mode: 'dark', label: '暗黑模式', icon: <Moon className="w-4 h-4 text-indigo-400" /> },
    { mode: 'system', label: '跟随系统', icon: <MonitorIcon className="w-4 h-4 text-slate-500" /> },
  ];

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left Branding & Mobile Hamburger */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={() => setActiveTab('overview')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 p-0.5 shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Activity className="w-5 h-5 text-sky-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white font-mono">
                  CloudPulse
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                  UPtime
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Overall System Health Status Badge (Hidden on small mobile) */}
        <div className="hidden sm:flex items-center">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${overallBadgeClass}`}>
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${downCount > 0 ? 'bg-rose-400' : 'bg-emerald-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${downCount > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
            </span>
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{overallStatusText}</span>
          </div>
        </div>

        {/* Right Controls: AI Assistant Button, Theme Switcher, Add Monitor */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* AI SLA Analysis Trigger Button */}
          <button
            onClick={onOpenAIReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/60 transition-colors"
            title="生成 AI SLA 智能诊断与健康报告"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-spin" style={{ animationDuration: '4s' }} />
            <span className="hidden xs:inline">AI SLA 诊断</span>
          </button>

          {/* Theme Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center border border-slate-200/60 dark:border-slate-800"
              title={`当前主题: ${theme === 'light' ? '明亮' : theme === 'dark' ? '暗黑' : '跟随系统'}`}
            >
              {theme === 'light' ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : theme === 'dark' ? (
                <Moon className="w-4 h-4 text-indigo-400" />
              ) : (
                <MonitorIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              )}
            </button>

            {showThemeMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowThemeMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-36 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-20 py-1 text-xs">
                  {themeOptions.map((opt) => (
                    <button
                      key={opt.mode}
                      onClick={() => {
                        setTheme(opt.mode);
                        setShowThemeMenu(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                        theme === opt.mode
                          ? 'font-semibold text-sky-600 dark:text-sky-400 bg-sky-50/50 dark:bg-sky-950/30'
                          : 'text-slate-700 dark:text-slate-300'
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

          {/* Add Monitor Button */}
          <button
            onClick={onAddMonitor}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-medium text-xs shadow-sm shadow-sky-600/20 transition-all cursor-pointer"
          >
            <span>+ 新建监控</span>
          </button>
        </div>
      </div>
    </header>
  );
};
