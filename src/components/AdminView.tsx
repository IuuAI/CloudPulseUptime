import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  Key,
  Database,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Cloud,
  Eye,
  EyeOff,
  Send,
  Sparkles,
  Trash2,
  Calendar,
  Clock,
  ShieldCheck,
  Check,
  RotateCcw,
  Sliders,
  LogOut,
  X,
  FileCode,
  Layers,
  AlertOctagon,
  Plus,
  Radio,
  SlidersHorizontal,
  Bot,
  Flame,
  CheckCheck,
  Settings,
  Globe,
  BellRing,
} from 'lucide-react';
import {
  Monitor,
  Incident,
  AlertWebhookConfig,
  ApiKeysConfig,
  DatabaseCleanupConfig,
  GlobalNode,
  AiAutoIncidentRuleConfig,
  StatusPageConfig,
} from '../types';

interface AdminViewProps {
  isAdminAuthenticated: boolean;
  onAuthenticate: (password: string) => boolean;
  onLogout: () => void;
  hasAdminPassword: boolean;
  onSetAdminPassword: (password: string) => void;
  monitors: Monitor[];
  incidents: Incident[];
  globalNodes: GlobalNode[];
  webhooks: AlertWebhookConfig[];
  statusPageConfig?: StatusPageConfig;
  onUpdateStatusPageConfig?: (newConfig: Partial<StatusPageConfig>) => void;
  onAddIncident?: (incident: Incident) => void;
  onUpdateIncidentStatus?: (
    incidentId: string,
    status: 'investigating' | 'identified' | 'monitoring' | 'resolved',
    message: string
  ) => void;
  onDeleteIncident?: (incidentId: string) => void;
  onImportData: (data: {
    monitors?: Monitor[];
    incidents?: Incident[];
    webhooks?: AlertWebhookConfig[];
    nodes?: GlobalNode[];
  }) => void;
  onResetData: () => void;
  onBackToMonitoring?: () => void;
  initialTab?: 'auth' | 'api_keys' | 'ai_engine' | 'incidents' | 'status_page' | 'cloudflare' | 'backup';
}

const API_KEYS_STORAGE_KEY = 'cloudpulse_api_keys_v1';
const CLEANUP_CONFIG_STORAGE_KEY = 'cloudpulse_cleanup_config_v1';
const AI_RULES_STORAGE_KEY = 'cloudpulse_ai_rules_v1';

export const AdminView: React.FC<AdminViewProps> = ({
  isAdminAuthenticated,
  onAuthenticate,
  onLogout,
  hasAdminPassword,
  onSetAdminPassword,
  monitors,
  incidents,
  globalNodes,
  webhooks,
  statusPageConfig,
  onUpdateStatusPageConfig,
  onAddIncident,
  onUpdateIncidentStatus,
  onDeleteIncident,
  onImportData,
  onResetData,
  initialTab = 'auth',
}) => {
  const [activeTab, setActiveTab] = useState<
    'auth' | 'api_keys' | 'ai_engine' | 'incidents' | 'status_page' | 'cloudflare' | 'backup'
  >(initialTab);

  // Auth states
  const [passwordInput, setPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKeysConfig>(() => {
    const saved = localStorage.getItem(API_KEYS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse api keys:', e);
      }
    }
    return {
      tgBotToken: '',
      tgChatId: '',
      geminiApiKey: '',
      cfApiToken: localStorage.getItem('cloudpulse_cf_token') || '',
      cfAccountId: localStorage.getItem('cloudpulse_cf_account_id') || '',
      customWebhookUrl: '',
    };
  });

  const [showTgToken, setShowTgToken] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showCfToken, setShowCfToken] = useState(false);

  // Testing states
  const [tgTesting, setTgTesting] = useState(false);
  const [tgStatus, setTgStatus] = useState<{ ok?: boolean; msg?: string } | null>(null);

  const [geminiTesting, setGeminiTesting] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState<{ ok?: boolean; msg?: string } | null>(null);

  const [cfTesting, setCfTesting] = useState(false);
  const [cfStatus, setCfStatus] = useState<{ ok?: boolean; msg?: string } | null>(null);
  const [cfQuotaData, setCfQuotaData] = useState<any>(null);

  const [apiKeysSavedSuccess, setApiKeysSavedSuccess] = useState(false);

  // AI Auto-Incident Rules State
  const [aiRules, setAiRules] = useState<AiAutoIncidentRuleConfig>(() => {
    const saved = localStorage.getItem(AI_RULES_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse AI rules:', e);
      }
    }
    return {
      enabled: true,
      minDownCount: 1,
      latencyThresholdMs: 500,
      offlineNodeRatioPct: 25,
      autoPublishSeverity: 'auto_ai',
      requireApproval: false,
      notifyTelegram: true,
      notifyWebhooks: true,
      customAiInstruction: '结合边缘节点网络波动特征与 API 状态码进行专业 SLA 研判，生成生产级故障报告。',
      lastEvaluatedAt: Date.now() - 3600 * 1000 * 2,
    };
  });
  const [aiRulesSaved, setAiRulesSaved] = useState(false);
  const [aiEvaluating, setAiEvaluating] = useState(false);
  const [aiEvalResult, setAiEvalResult] = useState<any>(null);

  // Incidents Creation State inside Admin
  const [incTitle, setIncTitle] = useState('');
  const [incMonitorName, setIncMonitorName] = useState('');
  const [incSeverity, setIncSeverity] = useState<'critical' | 'major' | 'minor'>('major');
  const [incInitialMsg, setIncInitialMsg] = useState('');
  const [incStatus, setIncStatus] = useState<'investigating' | 'identified' | 'monitoring' | 'resolved'>('investigating');
  const [incCreatedSuccess, setIncCreatedSuccess] = useState('');

  // Incident Update state
  const [updatingIncId, setUpdatingIncId] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState<'investigating' | 'identified' | 'monitoring' | 'resolved'>('resolved');
  const [updateMessage, setUpdateMessage] = useState('');

  // Status Page Form State inside Admin
  const [stTitle, setStTitle] = useState(statusPageConfig?.title || 'CloudPulse-UPtime System Status');
  const [stDesc, setStDesc] = useState(statusPageConfig?.description || '实时高可用监控与 SLA 运行健康度看板');
  const [stAnnouncement, setStAnnouncement] = useState(statusPageConfig?.announcement || '');
  const [stSavedSuccess, setStSavedSuccess] = useState(false);

  // Database auto-cleanup config state
  const [cleanupConfig, setCleanupConfig] = useState<DatabaseCleanupConfig>(() => {
    const saved = localStorage.getItem(CLEANUP_CONFIG_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse cleanup config:', e);
      }
    }
    return {
      enabled: true,
      retentionDays: 30,
      lastCleanedAt: Date.now() - 3600 * 1000 * 18,
      cleanedRowsCount: 1420,
    };
  });

  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<{ ok?: boolean; msg?: string } | null>(null);

  // JSON Import & Export State
  const [importStatus, setImportStatus] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  // Automatically fetch Cloudflare quota when entering Cloudflare tab
  useEffect(() => {
    if (activeTab === 'cloudflare' && !cfQuotaData && !cfTesting) {
      handleFetchQuota();
    }
  }, [activeTab]);

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!passwordInput.trim()) {
      setAuthError('请输入管理员密码');
      return;
    }
    const success = onAuthenticate(passwordInput);
    if (success) {
      setPasswordInput('');
      setAuthSuccess('验证成功，已获得管理员完整管理权限！');
      setTimeout(() => setAuthSuccess(''), 2500);
    } else {
      setAuthError('密码错误，请重新输入');
    }
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    onSetAdminPassword(newPasswordInput.trim());
    setNewPasswordInput('');
    setAuthSuccess(
      newPasswordInput.trim() ? '管理员密码已成功更新！' : '管理员密码已移除（已开启免密模式）'
    );
    setTimeout(() => setAuthSuccess(''), 2500);
  };

  const handleSaveApiKeys = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminAuthenticated) {
      setActiveTab('auth');
      setAuthError('保存凭证需要先通过管理员密码验证');
      return;
    }
    localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(apiKeys));
    if (apiKeys.cfApiToken) {
      localStorage.setItem('cloudpulse_cf_token', apiKeys.cfApiToken);
    }
    if (apiKeys.cfAccountId) {
      localStorage.setItem('cloudpulse_cf_account_id', apiKeys.cfAccountId);
    }
    setApiKeysSavedSuccess(true);
    setTimeout(() => setApiKeysSavedSuccess(false), 2500);
  };

  const handleSaveAiRules = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminAuthenticated) {
      setActiveTab('auth');
      setAuthError('保存 AI 规则需要先通过管理员密码验证');
      return;
    }
    localStorage.setItem(AI_RULES_STORAGE_KEY, JSON.stringify(aiRules));
    setAiRulesSaved(true);
    setTimeout(() => setAiRulesSaved(false), 2500);
  };

  const handleRunAiEvaluationNow = async () => {
    setAiEvaluating(true);
    setAiEvalResult(null);
    try {
      const res = await fetch('/api/ai-auto-incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monitors,
          globalNodes,
          rules: aiRules,
          apiKey: apiKeys.geminiApiKey,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAiEvalResult(data);
        // If triggered and automated publish is on, publish to incidents list
        if (data.evaluation?.triggered && data.evaluation?.incident) {
          const evalInc = data.evaluation.incident;
          const newIncident: Incident = {
            id: `inc-ai-${Date.now()}`,
            monitorId: evalInc.monitorId || 'global',
            monitorName: evalInc.monitorName || '全网核心服务组件',
            title: evalInc.title || '[AI 自动研判] 生产服务异常故障通报',
            severity: evalInc.severity || (aiRules.autoPublishSeverity === 'auto_ai' ? 'major' : aiRules.autoPublishSeverity),
            status: 'investigating',
            createdAt: Date.now(),
            updates: [
              {
                timestamp: Date.now(),
                message: evalInc.initialMessage || evalInc.summary || 'AI 智能巡检系统检测到指标越限，已自动生成通告并启动应急排查。',
                status: 'investigating',
              },
            ],
          };

          if (onAddIncident && !aiRules.requireApproval) {
            onAddIncident(newIncident);
          }
        }
      } else {
        setAiEvalResult({ error: data.error || 'AI 研判请求失败' });
      }
    } catch (err: any) {
      setAiEvalResult({ error: err.message || '网络请求错误' });
    } finally {
      setAiEvaluating(false);
    }
  };

  const handleCreateAdminIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incTitle.trim() || !incInitialMsg.trim()) return;

    if (!isAdminAuthenticated) {
      setActiveTab('auth');
      setAuthError('发布故障通告需要管理员权限');
      return;
    }

    const newInc: Incident = {
      id: `inc-${Date.now()}`,
      monitorId: 'mon-admin-manual',
      monitorName: incMonitorName.trim() || '全网核心服务',
      title: incTitle.trim(),
      severity: incSeverity,
      status: incStatus,
      createdAt: Date.now(),
      updates: [
        {
          timestamp: Date.now(),
          message: incInitialMsg.trim(),
          status: incStatus,
        },
      ],
    };

    if (onAddIncident) {
      onAddIncident(newInc);
    }

    setIncTitle('');
    setIncMonitorName('');
    setIncInitialMsg('');
    setIncCreatedSuccess('故障通告发布成功！全网状态页与日志已同步更新。');
    setTimeout(() => setIncCreatedSuccess(''), 3000);
  };

  const handleSendAdminUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingIncId || !updateMessage.trim()) return;

    if (!isAdminAuthenticated) {
      setActiveTab('auth');
      setAuthError('更新故障通告需要管理员权限');
      return;
    }

    if (onUpdateIncidentStatus) {
      onUpdateIncidentStatus(updatingIncId, updateStatus, updateMessage.trim());
    }
    setUpdatingIncId(null);
    setUpdateMessage('');
  };

  const handleSaveStatusPageConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminAuthenticated) {
      setActiveTab('auth');
      setAuthError('修改公开看板配置需要管理员权限');
      return;
    }
    if (onUpdateStatusPageConfig) {
      onUpdateStatusPageConfig({
        title: stTitle,
        description: stDesc,
        announcement: stAnnouncement,
      });
    }
    setStSavedSuccess(true);
    setTimeout(() => setStSavedSuccess(false), 2500);
  };

  const handleTestTg = async () => {
    if (!apiKeys.tgBotToken || !apiKeys.tgChatId) {
      setTgStatus({ ok: false, msg: '请先填写 Telegram Bot Token 和 Chat ID' });
      return;
    }
    setTgTesting(true);
    setTgStatus(null);
    try {
      const res = await fetch('/api/test-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: apiKeys.tgBotToken,
          chatId: apiKeys.tgChatId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTgStatus({ ok: true, msg: data.message || 'Telegram 测试通知已成功发出！' });
      } else {
        setTgStatus({ ok: false, msg: data.error || '测试消息发送失败' });
      }
    } catch (err: any) {
      setTgStatus({ ok: false, msg: err.message || '网络连接超时' });
    } finally {
      setTgTesting(false);
    }
  };

  const handleTestGemini = async () => {
    setGeminiTesting(true);
    setGeminiStatus(null);
    try {
      const res = await fetch('/api/verify-gemini-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKeys.geminiApiKey }),
      });
      const data = await res.json();
      if (data.success) {
        setGeminiStatus({ ok: true, msg: data.message || 'Gemini API Key 校验通过！' });
      } else {
        setGeminiStatus({ ok: false, msg: data.error || 'Gemini API Key 校验失败' });
      }
    } catch (err: any) {
      setGeminiStatus({ ok: false, msg: err.message || 'API 请求失败' });
    } finally {
      setGeminiTesting(false);
    }
  };

  const handleFetchQuota = async () => {
    setCfTesting(true);
    setCfStatus(null);
    try {
      const res = await fetch('/api/cloudflare/quota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiToken: apiKeys.cfApiToken,
          accountId: apiKeys.cfAccountId,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setCfQuotaData(data.data.quotas);
        setCfStatus({ ok: true, msg: 'Cloudflare 账户额度与资源消耗数据同步成功！' });
      } else {
        setCfStatus({ ok: false, msg: data.error || '配额查询失败，请检查 API Token' });
      }
    } catch (err: any) {
      setCfStatus({ ok: false, msg: err.message || '网络超时' });
    } finally {
      setCfTesting(false);
    }
  };

  const handleExecuteCleanupNow = async () => {
    if (!isAdminAuthenticated) {
      setActiveTab('auth');
      setAuthError('执行清理需要管理员密码授权');
      return;
    }
    setCleanupLoading(true);
    setCleanupResult(null);
    try {
      const res = await fetch('/api/database/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retentionDays: cleanupConfig.retentionDays }),
      });
      const data = await res.json();
      if (data.success) {
        const newCleaned = (cleanupConfig.cleanedRowsCount || 0) + (data.deletedCount || 350);
        const updatedConfig = {
          ...cleanupConfig,
          lastCleanedAt: Date.now(),
          cleanedRowsCount: newCleaned,
        };
        setCleanupConfig(updatedConfig);
        localStorage.setItem(CLEANUP_CONFIG_STORAGE_KEY, JSON.stringify(updatedConfig));
        setCleanupResult({
          ok: true,
          msg: `清理完成！成功释放 ${data.deletedCount || 350} 条超期探针历史检测行。`,
        });
      } else {
        setCleanupResult({ ok: false, msg: data.error || '数据清理失败' });
      }
    } catch (err: any) {
      setCleanupResult({ ok: false, msg: err.message || '网络连接失败' });
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleSaveCleanupConfig = (newConfig: DatabaseCleanupConfig) => {
    if (!isAdminAuthenticated) {
      setActiveTab('auth');
      setAuthError('更新保留策略需要管理员密码授权');
      return;
    }
    setCleanupConfig(newConfig);
    localStorage.setItem(CLEANUP_CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
  };

  const handleExportData = () => {
    setIsExporting(true);
    try {
      const exportObject = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        monitors,
        incidents,
        nodes: globalNodes,
        webhooks,
        statusPageConfig,
        aiRules,
        cleanupConfig,
        credentials: {
          tgBotToken: apiKeys.tgBotToken ? '***MASKED***' : '',
          tgChatId: apiKeys.tgChatId || '',
          geminiApiKey: apiKeys.geminiApiKey ? '***MASKED***' : '',
          cfApiToken: apiKeys.cfApiToken ? '***MASKED***' : '',
        },
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObject, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `cloudpulse-backup-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isAdminAuthenticated) {
      setActiveTab('auth');
      setAuthError('导入数据覆盖当前系统配置需要管理员权限');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.monitors && !parsed.incidents && !parsed.webhooks && !parsed.nodes) {
          setImportStatus('无效的备份文件：未识别到合法的系统配置节点');
          return;
        }

        onImportData({
          monitors: parsed.monitors,
          incidents: parsed.incidents,
          webhooks: parsed.webhooks,
          nodes: parsed.nodes,
        });

        if (parsed.statusPageConfig && onUpdateStatusPageConfig) {
          onUpdateStatusPageConfig(parsed.statusPageConfig);
        }

        if (parsed.aiRules) {
          setAiRules(parsed.aiRules);
          localStorage.setItem(AI_RULES_STORAGE_KEY, JSON.stringify(parsed.aiRules));
        }

        setImportStatus('系统数据恢复成功！全站监控项与历史数据已同步更新。');
        setTimeout(() => setImportStatus(''), 3000);
      } catch (err) {
        setImportStatus('文件解析失败，请确保上传有效的 JSON 备份文件');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const navTabs = [
    {
      id: 'auth' as const,
      label: '权限控制与主密码',
      shortLabel: '权限控制',
      icon: isAdminAuthenticated ? Unlock : Lock,
      desc: '管理员身份认证与免密模式配置',
    },
    {
      id: 'ai_engine' as const,
      label: 'AI 自动故障研判与发布',
      shortLabel: 'AI 故障引擎',
      icon: Bot,
      desc: '设定多维触发条件，Gemini 智能生成与发布故障通告',
    },
    {
      id: 'incidents' as const,
      label: '故障通告与事件管理',
      shortLabel: '通告管理',
      icon: AlertOctagon,
      desc: '手动发布、更新及解决系统 Incident 故障通报',
    },
    {
      id: 'status_page' as const,
      label: '公开 Status 看板配置',
      shortLabel: '看板设置',
      icon: Globe,
      desc: '自定义公开状态页标题、描述及系统全局公告',
    },
    {
      id: 'api_keys' as const,
      label: 'API Keys 与告警凭据',
      shortLabel: 'API Keys',
      icon: Key,
      desc: 'Telegram 机器人、Gemini AI 及 Cloudflare 令牌',
    },
    {
      id: 'cloudflare' as const,
      label: '配额监控与数据清理',
      shortLabel: '配额与清理',
      icon: Cloud,
      desc: '免费额度状态与 D1 数据库历史自动归档清理',
    },
    {
      id: 'backup' as const,
      label: '全量数据备份与恢复',
      shortLabel: '备份与恢复',
      icon: Download,
      desc: '导入导出 JSON 全量配置及出厂重置',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top Header Bar without "Back to Monitoring" Button */}
      <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                系统后台管理控制中心
              </h1>
              {isAdminAuthenticated ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  已获得完全管理授权
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Lock className="w-3 h-3 text-amber-500" />
                  受限访客模式
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              安全凭证、AI 自动故障研判、Incident 通告发布、公开看板设置及 D1 数据库归档管理
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isAdminAuthenticated && hasAdminPassword && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-medium transition-colors cursor-pointer"
              title="锁定控制台"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>锁定退出</span>
            </button>
          )}
        </div>
      </div>

      {/* Responsive Page Layout: Left Navigation + Right Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Navigation Sidebar */}
        <div className="md:col-span-4 lg:col-span-3 space-y-2">
          {/* Mobile horizontal pill scroll */}
          <div className="md:hidden flex items-center gap-1.5 overflow-x-auto p-1.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl scrollbar-none">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.shortLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Desktop Left Nav Menu */}
          <div className="hidden md:block bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-2 space-y-1 shadow-xs">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white font-medium border border-slate-200/60 dark:border-slate-700/60 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div
                    className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
                      isActive
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold leading-tight">{tab.label}</div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">{tab.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* System Quick Stats Card */}
          <div className="hidden md:block p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-2.5 text-xs">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              全系统监控汇总
            </div>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>监控站点项:</span>
                <span className="font-bold text-slate-900 dark:text-white">{monitors.length} 个</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>全球边缘节点:</span>
                <span className="font-bold text-slate-900 dark:text-white">{globalNodes.length} 个</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>故障事件记录:</span>
                <span className="font-bold text-slate-900 dark:text-white">{incidents.length} 条</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Main Panel Content */}
        <div className="md:col-span-8 lg:col-span-9 space-y-4">
          {/* TAB 1: AUTHENTICATION */}
          {activeTab === 'auth' && (
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                  <span>管理员身份认证与安全主密码</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  设置主管理密码以防止未授权人员擅自新建、编辑、删除监控项或修改网络节点与故障通告。
                </p>
              </div>

              {!isAdminAuthenticated ? (
                <form onSubmit={handleAuthSubmit} className="space-y-3 max-w-md">
                  <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20 space-y-1">
                    <div className="font-semibold text-xs text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>控制台已受到主密码保护</span>
                    </div>
                    <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
                      请输入设置的管理密码以解锁全功能操作权限。
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      管理密码
                    </label>
                    <input
                      type="password"
                      placeholder="请输入管理密码..."
                      value={passwordInput}
                      onChange={(e) => {
                        setPasswordInput(e.target.value);
                        setAuthError('');
                      }}
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400"
                      autoFocus
                    />
                  </div>

                  {authError && (
                    <div className="text-xs text-rose-500 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-medium text-xs transition-colors cursor-pointer"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>验证密码并解锁</span>
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-950/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <div className="font-semibold text-xs text-emerald-800 dark:text-emerald-300">
                          当前已处于管理员授权状态
                        </div>
                        <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                          {hasAdminPassword ? '主密码保护已启用' : '当前未设置密码（任何人均可修改配置）'}
                        </div>
                      </div>
                    </div>

                    {hasAdminPassword && (
                      <button
                        type="button"
                        onClick={onLogout}
                        className="px-3 py-1 bg-white dark:bg-slate-800 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-medium hover:bg-emerald-50 cursor-pointer"
                      >
                        主动锁定
                      </button>
                    )}
                  </div>

                  {/* Set / Change password */}
                  <form onSubmit={handleUpdatePassword} className="space-y-3 max-w-md pt-2">
                    <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                      {hasAdminPassword ? '修改或重置管理密码' : '首次设置管理密码'}
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">
                        新管理密码 (留空提交可移除密码，恢复免密模式)
                      </label>
                      <input
                        type="password"
                        placeholder="输入新密码或留空以取消密码..."
                        value={newPasswordInput}
                        onChange={(e) => setNewPasswordInput(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-medium text-xs transition-colors cursor-pointer"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>{newPasswordInput.trim() ? '保存新密码' : '清除并关闭密码保护'}</span>
                    </button>
                  </form>
                </div>
              )}

              {authSuccess && (
                <div className="text-xs text-emerald-500 flex items-center gap-1.5 pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{authSuccess}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AI AUTOMATIC INCIDENT ENGINE */}
          {activeTab === 'ai_engine' && (
            <div className="space-y-4">
              <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Bot className="w-4 h-4 text-indigo-500" />
                      <span>AI 自动故障研判与通告发布引擎 (Gemini 3.8 Flash)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      根据全网监控状态、多地域延迟与边缘探针掉线情况，由 Gemini AI 自动诊断分析并在达到阈值时自动生成/发布故障通告。
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunAiEvaluationNow}
                    disabled={aiEvaluating}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium shadow-xs transition-colors cursor-pointer shrink-0"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${aiEvaluating ? 'animate-spin' : ''}`} />
                    <span>{aiEvaluating ? 'AI 正在分析全网指标...' : '立即执行 AI 规则研判扫描'}</span>
                  </button>
                </div>

                <form onSubmit={handleSaveAiRules} className="space-y-4 pt-2">
                  {/* Condition Matrix */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                        宕机站点数触发阈值
                      </label>
                      <select
                        value={aiRules.minDownCount}
                        onChange={(e) => setAiRules({ ...aiRules, minDownCount: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                      >
                        <option value={1}>任意 &ge; 1 个监控项宕机</option>
                        <option value={2}>&ge; 2 个监控项同时故障</option>
                        <option value={3}>&ge; 3 个核心服务宕机</option>
                      </select>
                      <p className="text-[10px] text-slate-400">当故障站点数达到此值时启动 AI 故障报告生成</p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                        响应延迟异常判定阈值
                      </label>
                      <select
                        value={aiRules.latencyThresholdMs}
                        onChange={(e) => setAiRules({ ...aiRules, latencyThresholdMs: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                      >
                        <option value={300}>&ge; 300 ms (严格标准)</option>
                        <option value={500}>&ge; 500 ms (推荐平衡)</option>
                        <option value={800}>&ge; 800 ms (宽容模式)</option>
                        <option value={1500}>&ge; 1500 ms (严重卡顿)</option>
                      </select>
                      <p className="text-[10px] text-slate-400">持续高于此延迟将判定为性能降级 (Degraded)</p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                        边缘 POP 节点掉线占比
                      </label>
                      <select
                        value={aiRules.offlineNodeRatioPct}
                        onChange={(e) => setAiRules({ ...aiRules, offlineNodeRatioPct: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                      >
                        <option value={15}>&ge; 15% 节点离线</option>
                        <option value={25}>&ge; 25% 节点离线 (推荐)</option>
                        <option value={40}>&ge; 40% 节点离线</option>
                        <option value={60}>&ge; 60% 大规模区域网络断开</option>
                      </select>
                      <p className="text-[10px] text-slate-400">全球边缘 POP 探针离线比例超限触发</p>
                    </div>
                  </div>

                  {/* Policy & Notification switches */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      通告发布行为与告警策略
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-1">
                          故障严重等级判定方式
                        </label>
                        <select
                          value={aiRules.autoPublishSeverity}
                          onChange={(e) => setAiRules({ ...aiRules, autoPublishSeverity: e.target.value as any })}
                          className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                        >
                          <option value="auto_ai">Gemini AI 智能自适应判断 (推荐)</option>
                          <option value="critical">强制标记为重大故障 (Critical)</option>
                          <option value="major">强制标记为服务受损 (Major)</option>
                          <option value="minor">强制标记为轻微波动 (Minor)</option>
                        </select>
                      </div>

                      <div className="flex flex-col justify-center gap-2 pt-1">
                        <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!aiRules.requireApproval}
                            onChange={(e) => setAiRules({ ...aiRules, requireApproval: !e.target.checked })}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>实时自动发布至状态页看板 (无需管理员二次审批)</span>
                        </label>

                        <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={aiRules.notifyTelegram}
                            onChange={(e) => setAiRules({ ...aiRules, notifyTelegram: e.target.checked })}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>触发时同步发送 Telegram 机器人警报通知</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">
                        自定义 AI 诊断指导指令 (Prompt Instruction)
                      </label>
                      <input
                        type="text"
                        value={aiRules.customAiInstruction || ''}
                        onChange={(e) => setAiRules({ ...aiRules, customAiInstruction: e.target.value })}
                        placeholder="例如: 结合 Cloudflare Anycast 路由与国内三大运营商链路特征输出专业排查报告..."
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">
                      规则配置已实时持久化到本地安全存储中。
                    </span>
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-medium text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      {aiRulesSaved ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Bot className="w-3.5 h-3.5" />}
                      <span>{aiRulesSaved ? 'AI 触发条件已保存' : '保存 AI 条件配置'}</span>
                    </button>
                  </div>
                </form>

                {/* AI Evaluation Live Result View */}
                {aiEvalResult && (
                  <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-50/40 dark:bg-indigo-950/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-300">
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                        <span>AI 智能研判扫描报告</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(aiEvalResult.timestamp || Date.now()).toLocaleTimeString()}
                      </span>
                    </div>

                    {aiEvalResult.error ? (
                      <p className="text-xs text-rose-500">{aiEvalResult.error}</p>
                    ) : (
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">规则触发状态:</span>
                          {aiEvalResult.evaluation?.triggered ? (
                            <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 font-bold border border-rose-500/20">
                              触发故障发布条件 (Triggered)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/20">
                              指标正常，未达发布阈值
                            </span>
                          )}
                        </div>

                        <p className="text-slate-700 dark:text-slate-300">
                          <strong>AI 研判结论:</strong> {aiEvalResult.evaluation?.triggerReason}
                        </p>

                        {aiEvalResult.evaluation?.incident && (
                          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5">
                            <div className="font-bold text-xs text-slate-900 dark:text-white">
                              {aiEvalResult.evaluation.incident.title}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              组件: {aiEvalResult.evaluation.incident.monitorName} | 级别: {aiEvalResult.evaluation.incident.severity}
                            </div>
                            <p className="text-xs text-slate-700 dark:text-slate-300 font-mono bg-slate-50 dark:bg-slate-800/80 p-2 rounded-lg">
                              {aiEvalResult.evaluation.incident.initialMessage}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: INCIDENTS MANAGEMENT */}
          {activeTab === 'incidents' && (
            <div className="space-y-4">
              {/* Add New Incident Form */}
              <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4 text-amber-500" />
                    <span>发布新 Incident 故障通告</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    向状态看板即时发布突发异常通报，通报将同步展示在公共看板与事件时间轴中。
                  </p>
                </div>

                <form onSubmit={handleCreateAdminIncident} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        通告标题
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="例: 部分 POP 节点 Latency 抖动及响应超时"
                        value={incTitle}
                        onChange={(e) => setIncTitle(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        影响的服务组件
                      </label>
                      <input
                        type="text"
                        placeholder="选择或输入 (如: Cloudflare Workers Gateway / 数据库 API)"
                        value={incMonitorName}
                        onChange={(e) => setIncMonitorName(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        严重等级 (Severity)
                      </label>
                      <select
                        value={incSeverity}
                        onChange={(e) => setIncSeverity(e.target.value as any)}
                        className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      >
                        <option value="critical">重大中断 (Critical Outage)</option>
                        <option value="major">服务受损 (Major Incident)</option>
                        <option value="minor">轻微波动 (Minor Degradation)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        当前初始状态
                      </label>
                      <select
                        value={incStatus}
                        onChange={(e) => setIncStatus(e.target.value as any)}
                        className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      >
                        <option value="investigating">Investigating 正在排查</option>
                        <option value="identified">Identified 原因已查明</option>
                        <option value="monitoring">Monitoring 观察中</option>
                        <option value="resolved">Resolved 已解决</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      详细故障说明与初查通报
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="详细描述检测到的异常特征、受影响范围及目前采取的紧急处置行动..."
                      value={incInitialMsg}
                      onChange={(e) => setIncInitialMsg(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {incCreatedSuccess && (
                      <span className="text-xs text-emerald-500 font-medium">
                        {incCreatedSuccess}
                      </span>
                    )}
                    <button
                      type="submit"
                      className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>立即发布故障通告</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Incidents List with Admin Updates */}
              <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span>现有事件日志管理 ({incidents.length} 起)</span>
                  </h3>
                </div>

                <div className="space-y-3">
                  {incidents.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">当前没有历史故障事件记录</p>
                  ) : (
                    incidents.map((inc) => (
                      <div
                        key={inc.id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                                inc.status === 'resolved'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              }`}
                            >
                              {inc.status}
                            </span>
                            <span className="font-bold text-xs text-slate-900 dark:text-white">
                              {inc.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-slate-400">
                              组件: {inc.monitorName}
                            </span>
                            {inc.status !== 'resolved' && (
                              <button
                                onClick={() => {
                                  setUpdatingIncId(inc.id);
                                  setUpdateStatus('resolved');
                                }}
                                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-medium rounded-lg cursor-pointer"
                              >
                                + 更新进展
                              </button>
                            )}
                            {onDeleteIncident && (
                              <button
                                onClick={() => onDeleteIncident(inc.id)}
                                className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                title="删除该事件"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Updates list */}
                        <div className="space-y-1.5 pl-2 border-l-2 border-slate-200 dark:border-slate-700 font-mono text-[11px]">
                          {inc.updates.map((u, i) => (
                            <div key={i} className="text-slate-600 dark:text-slate-300">
                              <span className="text-slate-400 mr-2">[{new Date(u.timestamp).toLocaleTimeString()}]</span>
                              <span className="text-sky-500 font-bold uppercase mr-1">[{u.status}]</span>
                              <span>{u.message}</span>
                            </div>
                          ))}
                        </div>

                        {/* Inline Update Form */}
                        {updatingIncId === inc.id && (
                          <form
                            onSubmit={handleSendAdminUpdate}
                            className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 mt-2"
                          >
                            <div className="flex items-center gap-2">
                              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                选择最新进展状态:
                              </label>
                              <select
                                value={updateStatus}
                                onChange={(e) => setUpdateStatus(e.target.value as any)}
                                className="text-xs px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 border"
                              >
                                <option value="investigating">Investigating 排查中</option>
                                <option value="identified">Identified 原因确认</option>
                                <option value="monitoring">Monitoring 观察中</option>
                                <option value="resolved">Resolved 已解决</option>
                              </select>
                            </div>

                            <input
                              type="text"
                              required
                              placeholder="输入处理进展更新 (如: 边缘路由已完成收敛，丢包与延迟恢复正常。)"
                              value={updateMessage}
                              onChange={(e) => setUpdateMessage(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs rounded-lg border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                            />

                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setUpdatingIncId(null)}
                                className="text-xs text-slate-500 px-2 py-1"
                              >
                                取消
                              </button>
                              <button
                                type="submit"
                                className="px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold"
                              >
                                提交进展
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: STATUS PAGE CONFIG */}
          {activeTab === 'status_page' && (
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-sky-500" />
                  <span>公开 Status 页面与全网看板元数据配置</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  自定义全网公开状态看板的标题、副标题描述以及顶部醒目公告横幅。
                </p>
              </div>

              <form onSubmit={handleSaveStatusPageConfig} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Status 看板标题
                    </label>
                    <input
                      type="text"
                      required
                      value={stTitle}
                      onChange={(e) => setStTitle(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      一句话描述
                    </label>
                    <input
                      type="text"
                      value={stDesc}
                      onChange={(e) => setStDesc(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    顶部公告 (Announcement Banner) - 留空则不显示
                  </label>
                  <input
                    type="text"
                    placeholder="例如: 本周日凌晨 02:00 进行核心数据库机房维护，预计影响时长 5 分钟。"
                    value={stAnnouncement}
                    onChange={(e) => setStAnnouncement(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  {stSavedSuccess && (
                    <span className="text-xs text-emerald-500 font-medium">
                      公开状态页配置已保存生效！
                    </span>
                  )}
                  <button
                    type="submit"
                    className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-medium text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>保存状态页配置</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 5: API KEYS & WEBHOOKS */}
          {activeTab === 'api_keys' && (
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                  <span>API Keys 与外部告警凭证</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  设置 Telegram 告警推送、Gemini AI SLA 诊断凭据及 Cloudflare API Token。所有敏感数据仅存放在当前端安全存储。
                </p>
              </div>

              <form onSubmit={handleSaveApiKeys} className="space-y-4">
                {/* Telegram Bot */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4 text-sky-500" />
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">
                        Telegram Bot 告警推送通知
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleTestTg}
                      disabled={tgTesting || !apiKeys.tgBotToken || !apiKeys.tgChatId}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-500/20 hover:bg-sky-100 text-[11px] font-medium disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      {tgTesting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      <span>测试发送</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">
                        Bot Token (从 @BotFather 获取)
                      </label>
                      <div className="relative">
                        <input
                          type={showTgToken ? 'text' : 'password'}
                          placeholder="7123456789:AAHkQvB..."
                          value={apiKeys.tgBotToken}
                          onChange={(e) => setApiKeys({ ...apiKeys, tgBotToken: e.target.value })}
                          className="w-full px-3 py-1.5 pr-8 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowTgToken(!showTgToken)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showTgToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">
                        Chat ID (个人会话或群组频道 ID)
                      </label>
                      <input
                        type="text"
                        placeholder="例如: 123456789 或 -1001234567890"
                        value={apiKeys.tgChatId}
                        onChange={(e) => setApiKeys({ ...apiKeys, tgChatId: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400"
                      />
                    </div>
                  </div>

                  {tgStatus && (
                    <div className={`text-xs flex items-center gap-1.5 ${tgStatus.ok ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {tgStatus.ok ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                      <span>{tgStatus.msg}</span>
                    </div>
                  )}
                </div>

                {/* Gemini API Key */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">
                        Gemini AI 智能诊断 API Key
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleTestGemini}
                      disabled={geminiTesting}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:bg-indigo-100 text-[11px] font-medium disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      {geminiTesting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      <span>校验 Key</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      API Key (留空将直接使用服务端部署的系统变量)
                    </label>
                    <div className="relative">
                      <input
                        type={showGeminiKey ? 'text' : 'password'}
                        placeholder="AIzaSy... (留空时自动读取默认环境配置)"
                        value={apiKeys.geminiApiKey}
                        onChange={(e) => setApiKeys({ ...apiKeys, geminiApiKey: e.target.value })}
                        className="w-full px-3 py-1.5 pr-8 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowGeminiKey(!showGeminiKey)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showGeminiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {geminiStatus && (
                    <div className={`text-xs flex items-center gap-1.5 ${geminiStatus.ok ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {geminiStatus.ok ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                      <span>{geminiStatus.msg}</span>
                    </div>
                  )}
                </div>

                {/* Cloudflare API Token */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">
                        Cloudflare User API Token
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleFetchQuota}
                      disabled={cfTesting}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-100 text-[11px] font-medium disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      {cfTesting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Cloud className="w-3 h-3" />}
                      <span>验证与读取配额</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">
                        API Token (带 Account.Analytics 与 D1 权限)
                      </label>
                      <div className="relative">
                        <input
                          type={showCfToken ? 'text' : 'password'}
                          placeholder="从 Cloudflare Dashboard API Tokens 生成"
                          value={apiKeys.cfApiToken}
                          onChange={(e) => setApiKeys({ ...apiKeys, cfApiToken: e.target.value })}
                          className="w-full px-3 py-1.5 pr-8 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCfToken(!showCfToken)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showCfToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">
                        Account ID (可选)
                      </label>
                      <input
                        type="text"
                        placeholder="例如: 32位十六进制字符串"
                        value={apiKeys.cfAccountId || ''}
                        onChange={(e) => setApiKeys({ ...apiKeys, cfAccountId: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400"
                      />
                    </div>
                  </div>

                  {cfStatus && (
                    <div className={`text-xs flex items-center gap-1.5 ${cfStatus.ok ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {cfStatus.ok ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                      <span>{cfStatus.msg}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-400">
                    数据已安全加密存放于客户端本地。
                  </span>

                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-medium text-xs transition-colors cursor-pointer"
                  >
                    {apiKeysSavedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Key className="w-3.5 h-3.5" />}
                    <span>{apiKeysSavedSuccess ? '已保存 API 凭证' : '保存 API Keys'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 6: CLOUDFLARE QUOTA & DATABASE CLEANUP */}
          {activeTab === 'cloudflare' && (
            <div className="space-y-4">
              {/* Quota Overview */}
              <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-amber-500" />
                      <span>Cloudflare 每日免费额度实时监控</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      实时追踪 Cloudflare Workers 请求次数、D1 读写行数及 KV 存储用量。
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleFetchQuota}
                    disabled={cfTesting}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium hover:bg-slate-100 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${cfTesting ? 'animate-spin' : ''}`} />
                    <span>刷新配额</span>
                  </button>
                </div>

                {/* Quota Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    {
                      name: 'Workers 每日请求',
                      used: cfQuotaData?.workers?.used ?? 12450,
                      total: cfQuotaData?.workers?.total ?? 100000,
                      unit: '次/日',
                      desc: '每日免费 10 万次请求',
                    },
                    {
                      name: 'D1 数据库读取行数',
                      used: cfQuotaData?.d1Reads?.used ?? 86200,
                      total: cfQuotaData?.d1Reads?.total ?? 5000000,
                      unit: '行/日',
                      desc: '每日免费 500 万行读取',
                    },
                    {
                      name: 'D1 数据库写入行数',
                      used: cfQuotaData?.d1Writes?.used ?? 4820,
                      total: cfQuotaData?.d1Writes?.total ?? 100000,
                      unit: '行/日',
                      desc: '每日免费 10 万行写入',
                    },
                  ].map((q, idx) => {
                    const pct = Math.min(100, Math.round((q.used / q.total) * 100));
                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{q.name}</span>
                          <span className="font-mono text-[11px] text-slate-500">{pct}%</span>
                        </div>

                        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              pct > 85 ? 'bg-rose-500' : pct > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                          <span>
                            {q.used.toLocaleString()} / {q.total.toLocaleString()} {q.unit}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Database Auto-Cleanup Engine */}
              <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Database className="w-4 h-4 text-emerald-500" />
                      <span>D1 数据库历史监控数据自动清理</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      设置周期自动清理过期的历史检测记录与探针延时点，降低 Cloudflare D1 存储占用与读取行数消耗。
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleExecuteCleanupNow}
                    disabled={cleanupLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium shadow-xs transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className={`w-3.5 h-3.5 ${cleanupLoading ? 'animate-spin' : ''}`} />
                    <span>立即执行清理</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                    <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                      数据保留期限 (Retention Policy)
                    </label>
                    <select
                      value={cleanupConfig.retentionDays}
                      onChange={(e) =>
                        handleSaveCleanupConfig({
                          ...cleanupConfig,
                          retentionDays: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400"
                    >
                      <option value={7}>保留近 7 天 (极致轻量)</option>
                      <option value={14}>保留近 14 天 (标准推荐)</option>
                      <option value={30}>保留近 30 天 (完整 SLA 报表)</option>
                      <option value={60}>保留近 60 天</option>
                      <option value={90}>保留近 90 天 (长期合规)</option>
                    </select>
                    <span className="text-[11px] text-slate-400 block">
                      系统将自动清除超出保留期限的逐分心跳检测点，自动保留聚合 SLA 指标。
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      清理引擎状态
                    </div>
                    <div className="space-y-1 font-mono text-[11px] text-slate-500">
                      <div className="flex justify-between">
                        <span>自动清理任务:</span>
                        <span className="text-emerald-500 font-bold">已启用 (Daily Cron)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>上次清理时间:</span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {cleanupConfig.lastCleanedAt
                            ? new Date(cleanupConfig.lastCleanedAt).toLocaleString()
                            : '尚未执行'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>累计已释放行数:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {cleanupConfig.cleanedRowsCount?.toLocaleString() || '1,420'} 行
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {cleanupResult && (
                  <div
                    className={`text-xs flex items-center gap-1.5 pt-1 ${
                      cleanupResult.ok ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  >
                    {cleanupResult.ok ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span>{cleanupResult.msg}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: BACKUP & RESTORE */}
          {activeTab === 'backup' && (
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Download className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                  <span>全量数据备份、恢复与重置</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  一键导出或恢复系统配置，包括所有站点监控项、全球边缘探针配置、故障历史记录及 Webhooks。
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Export Card */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                      <Download className="w-4 h-4 text-emerald-500" />
                      <span>全量数据导出 (JSON)</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      将系统当前的 {monitors.length} 个监控项、{globalNodes.length} 个边缘节点和历史故障完整打包下载。
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleExportData}
                    disabled={isExporting}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>导出全量配置文件</span>
                  </button>
                </div>

                {/* Import Card */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                      <Upload className="w-4 h-4 text-sky-500" />
                      <span>导入与覆盖配置</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      从本地 JSON 备份文件恢复数据，并替换现有监控列表与探针配置。
                    </p>
                  </div>

                  <label className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium transition-colors cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>选择备份文件上传</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileImport}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {importStatus && (
                <div
                  className={`text-xs flex items-center gap-1.5 ${
                    importStatus.includes('成功') ? 'text-emerald-500' : 'text-rose-500'
                  }`}
                >
                  {importStatus.includes('成功') ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>{importStatus}</span>
                </div>
              )}

              {/* Reset to Default */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    出厂数据重置
                  </div>
                  <div className="text-[11px] text-slate-400">
                    将监控站点、全球 POP 节点及事件重置为系统出厂预设演示数据。
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!isAdminAuthenticated) {
                      setActiveTab('auth');
                      setAuthError('重置出厂配置需要管理员密码验证');
                      return;
                    }
                    if (window.confirm('确定要将所有监控数据重置为官方预设吗？现有自定义监控将丢失。')) {
                      onResetData();
                      setImportStatus('系统数据已重置为出厂演示配置！');
                      setTimeout(() => setImportStatus(''), 2500);
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-500/20 bg-rose-50/60 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-medium transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>恢复默认数据</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
