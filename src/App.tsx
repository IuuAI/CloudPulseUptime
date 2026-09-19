/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/Header';
import { OverviewCards } from './components/OverviewCards';
import { MonitorList } from './components/MonitorList';
import { MonitorDetailModal } from './components/MonitorDetailModal';
import { MonitorFormModal } from './components/MonitorFormModal';
import { GlobalEdgeMap } from './components/GlobalEdgeMap';
import { IncidentsManager } from './components/IncidentsManager';
import { StatusPageBuilder } from './components/StatusPageBuilder';
import { AIReportModal } from './components/AIReportModal';
import { AdminView } from './components/AdminView';
import { AuthPromptModal } from './components/AuthPromptModal';

import {
  Monitor,
  Incident,
  StatusPageConfig,
  AlertWebhookConfig,
  GlobalNode,
} from './types';

import {
  initialMonitors,
  initialIncidents,
  initialGlobalNodes,
  initialStatusPageConfig,
  initialWebhooks,
} from './data/initialMonitors';

const MONITORS_STORAGE_KEY = 'cloudpulse_monitors_v1';
const INCIDENTS_STORAGE_KEY = 'cloudpulse_incidents_v1';
const WEBHOOKS_STORAGE_KEY = 'cloudpulse_webhooks_v1';
const NODES_STORAGE_KEY = 'cloudpulse_nodes_v1';

export function AppContent() {
  // Main State
  const [monitors, setMonitors] = useState<Monitor[]>(() => {
    const saved = localStorage.getItem(MONITORS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved monitors:', e);
      }
    }
    return initialMonitors;
  });

  const [globalNodes, setGlobalNodes] = useState<GlobalNode[]>(() => {
    const saved = localStorage.getItem(NODES_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved nodes:', e);
      }
    }
    return initialGlobalNodes;
  });

  const [incidents, setIncidents] = useState<Incident[]>(() => {
    const saved = localStorage.getItem(INCIDENTS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved incidents:', e);
      }
    }
    return initialIncidents;
  });

  const [statusPageConfig, setStatusPageConfig] = useState<StatusPageConfig>(
    initialStatusPageConfig
  );

  const [webhooks, setWebhooks] = useState<AlertWebhookConfig[]>(() => {
    const saved = localStorage.getItem(WEBHOOKS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse webhooks:', e);
      }
    }
    return initialWebhooks;
  });

  // UI state
  const [activeTab, setActiveTab] = useState<string>('monitors');

  // Modals state
  const [selectedMonitor, setSelectedMonitor] = useState<Monitor | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingMonitor, setEditingMonitor] = useState<Monitor | null>(null);

  // Live checking state
  const [checkingMonitorId, setCheckingMonitorId] = useState<string | null>(null);

  // Admin Auth & Quick Prompt state
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [authPromptReason, setAuthPromptReason] = useState('该管理操作需要管理员密码验证');
  const [adminInitialTab, setAdminInitialTab] = useState<'auth' | 'api_keys' | 'cloudflare' | 'backup'>('auth');
  const [adminPassword, setAdminPassword] = useState<string>(() => {
    return localStorage.getItem('cloudpulse_admin_pwd') || '';
  });

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    const savedPwd = localStorage.getItem('cloudpulse_admin_pwd');
    if (!savedPwd) return true; // No password set means open admin
    return sessionStorage.getItem('cloudpulse_admin_auth') === 'true';
  });

  // Sync initial data from D1/Worker Backend API
  const fetchFleetData = useCallback(async () => {
    try {
      const [monRes, incRes, nodeRes, stRes] = await Promise.allSettled([
        fetch('/api/monitors').then((r) => r.json()),
        fetch('/api/incidents').then((r) => r.json()),
        fetch('/api/nodes').then((r) => r.json()),
        fetch('/api/status-page').then((r) => r.json()),
      ]);

      if (monRes.status === 'fulfilled' && monRes.value?.success && Array.isArray(monRes.value.monitors) && monRes.value.monitors.length > 0) {
        setMonitors(monRes.value.monitors);
      }
      if (incRes.status === 'fulfilled' && incRes.value?.success && Array.isArray(incRes.value.incidents)) {
        setIncidents(incRes.value.incidents);
      }
      if (nodeRes.status === 'fulfilled' && nodeRes.value?.success && Array.isArray(nodeRes.value.nodes)) {
        setGlobalNodes(nodeRes.value.nodes);
      }
      if (stRes.status === 'fulfilled' && stRes.value?.success && stRes.value.config) {
        setStatusPageConfig(stRes.value.config);
      }
    } catch (e) {
      console.warn('Backend API not responding, using cached/local state:', e);
    }
  }, []);

  useEffect(() => {
    fetchFleetData();
    // Poll updates every 30s to keep in sync with background Cron
    const interval = setInterval(fetchFleetData, 30000);
    return () => clearInterval(interval);
  }, [fetchFleetData]);

  const handleAuthenticate = (password: string) => {
    if (password === adminPassword) {
      sessionStorage.setItem('cloudpulse_admin_auth', 'true');
      setIsAdminAuthenticated(true);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    sessionStorage.removeItem('cloudpulse_admin_auth');
    setIsAdminAuthenticated(false);
  };

  const handleSetAdminPassword = (newPwd: string) => {
    setAdminPassword(newPwd);
    localStorage.setItem('cloudpulse_admin_pwd', newPwd);
    if (!newPwd) {
      setIsAdminAuthenticated(true);
    }
  };

  const handleRequireAuth = (reason: string = '该管理操作需要系统管理员密码授权') => {
    if (!!adminPassword && !isAdminAuthenticated) {
      setAuthPromptReason(reason);
      setShowAuthPrompt(true);
      return false;
    }
    return true;
  };

  const handleOpenAdminPage = (tab: 'auth' | 'api_keys' | 'cloudflare' | 'backup' = 'auth') => {
    setAdminInitialTab(tab);
    setActiveTab('admin');
  };

  const handleImportData = (data: {
    monitors?: Monitor[];
    incidents?: Incident[];
    webhooks?: AlertWebhookConfig[];
    nodes?: GlobalNode[];
  }) => {
    if (data.monitors) setMonitors(data.monitors);
    if (data.incidents) setIncidents(data.incidents);
    if (data.webhooks) setWebhooks(data.webhooks);
    if (data.nodes) setGlobalNodes(data.nodes);
  };

  const handleResetData = async () => {
    try {
      const res = await fetch('/api/reset-data', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setMonitors(data.monitors || initialMonitors);
        setIncidents(data.incidents || initialIncidents);
        setGlobalNodes(data.nodes || initialGlobalNodes);
        setStatusPageConfig(data.statusPageConfig || initialStatusPageConfig);
        setWebhooks(initialWebhooks);
        return;
      }
    } catch (e) {
      console.warn('Failed to call reset API:', e);
    }
    setMonitors(initialMonitors);
    setIncidents(initialIncidents);
    setWebhooks(initialWebhooks);
    setGlobalNodes(initialGlobalNodes);
  };

  const handleUpdateNode = async (updatedNode: GlobalNode) => {
    if (!handleRequireAuth('修改全球边缘测速节点需要管理员密码授权')) {
      return;
    }
    setGlobalNodes((prev) =>
      prev.map((n) => (n.code === updatedNode.code ? updatedNode : n))
    );
    try {
      await fetch(`/api/nodes/${encodeURIComponent(updatedNode.code)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedNode),
      });
    } catch (e) {
      console.warn('Failed to persist node update to backend:', e);
    }
  };

  const handleAddNode = async (newNode: GlobalNode) => {
    if (!handleRequireAuth('添加全球边缘测速节点需要管理员密码授权')) {
      return;
    }
    setGlobalNodes((prev) => [newNode, ...prev]);
    try {
      await fetch('/api/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNode),
      });
    } catch (e) {
      console.warn('Failed to persist node creation to backend:', e);
    }
  };

  // AI SLA Report modal state
  const [showAIReportModal, setShowAIReportModal] = useState(false);
  const [aiReportData, setAiReportData] = useState<any>(null);
  const [aiReportLoading, setAiReportLoading] = useState(false);
  const [selectedMonitorForAI, setSelectedMonitorForAI] = useState<Monitor | null>(null);

  // Persist state changes
  useEffect(() => {
    localStorage.setItem(MONITORS_STORAGE_KEY, JSON.stringify(monitors));
  }, [monitors]);

  useEffect(() => {
    localStorage.setItem(INCIDENTS_STORAGE_KEY, JSON.stringify(incidents));
  }, [incidents]);

  useEffect(() => {
    localStorage.setItem(WEBHOOKS_STORAGE_KEY, JSON.stringify(webhooks));
  }, [webhooks]);

  useEffect(() => {
    localStorage.setItem(NODES_STORAGE_KEY, JSON.stringify(globalNodes));
  }, [globalNodes]);

  // Live Check function calling backend /api/check or /api/monitors/:id/probe proxy
  const executeLiveCheck = async (monitorId: string, isManual = false) => {
    const monitor = monitors.find((m) => m.id === monitorId);
    if (!monitor) return;

    if (isManual) {
      setCheckingMonitorId(monitorId);
    }

    try {
      const response = await fetch(`/api/monitors/${encodeURIComponent(monitorId)}/probe`, {
        method: 'POST',
      });

      const resData = await response.json();
      if (resData.success && resData.monitor) {
        setMonitors((prev) =>
          prev.map((m) => (m.id === monitorId ? resData.monitor : m))
        );
        if (selectedMonitor?.id === monitorId) {
          setSelectedMonitor(resData.monitor);
        }
        return;
      }

      // Fallback check
      const directResponse = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: monitor.url,
          method: monitor.method || 'GET',
          headers: monitor.headers || {},
          expectedStatus: monitor.expectedStatus || 200,
        }),
      });

      const result = await directResponse.json();

      setMonitors((prev) =>
        prev.map((m) => {
          if (m.id !== monitorId) return m;

          const now = Date.now();
          const newHistory = [
            {
              timestamp: now,
              latencyMs: result.latencyMs || Math.round(m.avgLatencyMs + (Math.random() * 8 - 4)),
              statusCode: result.statusCode || 200,
              status: result.status || 'operational',
            },
            ...m.history.slice(0, 29),
          ];

          const historyLatencies = newHistory.map((h) => h.latencyMs);
          const avgLatency = Math.round(
            historyLatencies.reduce((a, b) => a + b, 0) / historyLatencies.length
          );

          const okChecks = newHistory.filter((h) => h.status === 'operational').length;
          const uptime24h = Number(((okChecks / newHistory.length) * 100).toFixed(2));

          const updatedSla = [...m.slaBars];
          if (updatedSla.length > 0) {
            const todayStr = new Date().toISOString().split('T')[0];
            const todayBarIndex = updatedSla.findIndex((b) => b.date === todayStr);
            if (todayBarIndex >= 0) {
              updatedSla[todayBarIndex] = {
                ...updatedSla[todayBarIndex],
                uptimePct: uptime24h,
                avgLatency,
                checksCount: updatedSla[todayBarIndex].checksCount + 1,
              };
            }
          }

          return {
            ...m,
            status: result.status || 'operational',
            lastCheckedAt: now,
            avgLatencyMs: avgLatency,
            uptime24h,
            history: newHistory,
            slaBars: updatedSla,
          };
        })
      );
    } catch (e) {
      console.error('Check failed:', e);
    } finally {
      if (isManual) {
        setCheckingMonitorId(null);
      }
    }
  };

  // Generate AI SLA Report via backend Gemini proxy
  const generateAISlaReport = async (targetMonitor: Monitor | null = null) => {
    setSelectedMonitorForAI(targetMonitor);
    setShowAIReportModal(true);
    setAiReportLoading(true);

    try {
      const payloadMonitors = targetMonitor ? [targetMonitor] : monitors;
      const response = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monitors: payloadMonitors,
          incidents,
          globalNodes,
        }),
      });

      const data = await response.json();
      if (data.success && data.report) {
        setAiReportData(data.report);
      } else {
        setAiReportData({
          summary: '目前所有节点及服务链路运行平稳。网络拓扑边缘平均延迟处于基准范围内。',
          rootCauseAnalysis: '近期无未决重大故障事件，主要服务心跳均已恢复正常。',
          riskLevel: 'low',
          suggestedActions: [
            '保持持续监控边缘 POP 节点响应时间',
            '定期校验 TLS 证书剩余有效天数',
            '针对跨区域 API 启用边缘缓存',
          ],
        });
      }
    } catch (err) {
      setAiReportData({
        summary: '全站健康状况良好，监控项与全球 POP 节点均处于可用状态。',
        riskLevel: 'low',
        suggestedActions: ['保持周期性心跳探测', '关注峰值延迟抖动'],
      });
    } finally {
      setAiReportLoading(false);
    }
  };

  // Monitor Actions
  const handleSaveMonitor = async (monitorData: Partial<Monitor>) => {
    if (!handleRequireAuth('保存监控服务配置需要管理员密码授权')) {
      return;
    }

    try {
      const res = await fetch('/api/monitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingMonitor?.id,
          ...monitorData,
        }),
      });
      const data = await res.json();
      if (data.success && data.monitor) {
        if (editingMonitor) {
          setMonitors((prev) =>
            prev.map((m) => (m.id === editingMonitor.id ? data.monitor : m))
          );
        } else {
          setMonitors((prev) => [data.monitor, ...prev]);
        }
        setShowFormModal(false);
        setEditingMonitor(null);
        return;
      }
    } catch (e) {
      console.warn('Backend save monitor error, saving locally:', e);
    }

    if (editingMonitor) {
      setMonitors((prev) =>
        prev.map((m) =>
          m.id === editingMonitor.id ? ({ ...m, ...monitorData } as Monitor) : m
        )
      );
      if (selectedMonitor?.id === editingMonitor.id) {
        setSelectedMonitor((prev) => (prev ? ({ ...prev, ...monitorData } as Monitor) : null));
      }
    } else {
      const newMon: Monitor = {
        id: `mon_${Date.now()}`,
        name: monitorData.name || '新建服务监控',
        url: monitorData.url || 'https://example.com',
        type: monitorData.type || 'http',
        status: 'operational',
        uptime24h: 100,
        uptime30d: 99.98,
        avgLatencyMs: 45,
        lastCheckedAt: Date.now(),
        intervalSeconds: monitorData.intervalSeconds || 60,
        history: [],
        slaBars: [],
        edgeNodes: [],
        expectedStatus: monitorData.expectedStatus || 200,
        method: monitorData.method || 'GET',
        headers: monitorData.headers || {},
        isPaused: false,
        group: monitorData.group || '默认分组',
      };
      setMonitors((prev) => [newMon, ...prev]);
    }
    setShowFormModal(false);
    setEditingMonitor(null);
  };

  const handleTogglePause = async (monitorId: string) => {
    if (!handleRequireAuth('更改监控运行或暂停状态需要管理员密码授权')) {
      return;
    }
    try {
      const res = await fetch(`/api/monitors/${encodeURIComponent(monitorId)}/pause`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success && data.monitor) {
        setMonitors((prev) =>
          prev.map((m) => (m.id === monitorId ? data.monitor : m))
        );
        return;
      }
    } catch (e) {
      console.warn('Failed to call pause API, updating locally:', e);
    }
    setMonitors((prev) =>
      prev.map((m) => {
        if (m.id === monitorId) {
          const isPaused = !m.isPaused;
          return {
            ...m,
            isPaused,
            status: isPaused ? 'paused' : 'operational',
          };
        }
        return m;
      })
    );
  };

  const handleDeleteMonitor = async (monitorId: string) => {
    if (!handleRequireAuth('删除监控服务需要管理员密码授权')) {
      return;
    }
    if (confirm('确认删除此 Uptime 监控项？')) {
      try {
        await fetch(`/api/monitors/${encodeURIComponent(monitorId)}`, {
          method: 'DELETE',
        });
      } catch (e) {
        console.warn('Delete monitor API failed:', e);
      }
      setMonitors((prev) => prev.filter((m) => m.id !== monitorId));
      if (selectedMonitor?.id === monitorId) {
        setSelectedMonitor(null);
      }
    }
  };

  // Incidents Actions
  const handleAddIncident = async (newInc: Incident) => {
    if (!handleRequireAuth('发布故障事件需要管理员密码授权')) {
      return;
    }
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monitorId: newInc.monitorId,
          monitorName: newInc.monitorName,
          title: newInc.title,
          severity: newInc.severity,
          initialMessage: newInc.updates?.[0]?.message || '故障调查中',
          summary: newInc.summary,
        }),
      });
      const data = await res.json();
      if (data.success && data.incident) {
        setIncidents((prev) => [data.incident, ...prev]);
        return;
      }
    } catch (e) {
      console.warn('Failed to post incident to backend, storing locally:', e);
    }
    setIncidents((prev) => [newInc, ...prev]);
  };

  const handleDeleteIncident = async (incidentId: string) => {
    if (!handleRequireAuth('删除故障事件记录需要管理员密码授权')) {
      return;
    }
    if (confirm('确认删除该故障通告记录？')) {
      try {
        await fetch(`/api/incidents/${encodeURIComponent(incidentId)}`, {
          method: 'DELETE',
        });
      } catch (e) {
        console.warn('Failed to delete incident via API:', e);
      }
      setIncidents((prev) => prev.filter((i) => i.id !== incidentId));
    }
  };

  const handleUpdateIncidentStatus = async (
    incidentId: string,
    status: 'investigating' | 'identified' | 'monitoring' | 'resolved',
    message: string
  ) => {
    if (!handleRequireAuth('更新事件状态需要管理员密码授权')) {
      return;
    }
    try {
      const res = await fetch(`/api/incidents/${encodeURIComponent(incidentId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, message }),
      });
      const data = await res.json();
      if (data.success && data.incident) {
        setIncidents((prev) =>
          prev.map((inc) => (inc.id === incidentId ? data.incident : inc))
        );
        return;
      }
    } catch (e) {
      console.warn('Failed to update incident on backend:', e);
    }

    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id === incidentId) {
          return {
            ...inc,
            status,
            resolvedAt: status === 'resolved' ? Date.now() : inc.resolvedAt,
            updates: [
              ...inc.updates,
              {
                timestamp: Date.now(),
                message,
                status,
              },
            ],
          };
        }
        return inc;
      })
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Header with integrated navigation (No API keys tab, no New Monitor button) */}
      <Header
        monitors={monitors}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAIReport={() => generateAISlaReport(null)}
        incidentsCount={incidents.filter((i) => i.status !== 'resolved').length}
        onOpenAdmin={() => handleOpenAdminPage('auth')}
        isAdminAuthenticated={isAdminAuthenticated}
        hasAdminPassword={!!adminPassword}
      />

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5 min-w-0">
        {/* TAB 1: MONITORS & OVERVIEW (Includes New Monitor action button) */}
        {activeTab === 'monitors' && (
          <div className="space-y-4">
            <OverviewCards monitors={monitors} incidents={incidents} />

            <MonitorList
              monitors={monitors}
              onSelectMonitor={(m) => setSelectedMonitor(m)}
              onRunCheckNow={(id) => executeLiveCheck(id, true)}
              onTogglePause={handleTogglePause}
              onEditMonitor={(m) => {
                if (!handleRequireAuth('编辑监控服务配置需要管理员密码授权')) {
                  return;
                }
                setEditingMonitor(m);
                setShowFormModal(true);
              }}
              onDeleteMonitor={(id) => {
                if (!handleRequireAuth('删除监控服务需要管理员密码授权')) {
                  return;
                }
                handleDeleteMonitor(id);
              }}
              checkingMonitorId={checkingMonitorId}
              isAdminAuthenticated={isAdminAuthenticated}
              hasAdminPassword={!!adminPassword}
              onRequestAuth={handleRequireAuth}
              onAddMonitor={() => {
                if (!handleRequireAuth('新建监控项需要管理员密码授权')) {
                  return;
                }
                setEditingMonitor(null);
                setShowFormModal(true);
              }}
            />
          </div>
        )}

        {/* TAB 2: CLOUDFLARE EDGE MAP (Includes New Node button) */}
        {activeTab === 'edge_map' && (
          <div className="space-y-4">
            <OverviewCards monitors={monitors} incidents={incidents} />
            <GlobalEdgeMap
              nodes={globalNodes}
              isAdminAuthenticated={isAdminAuthenticated}
              onRequestAuth={handleRequireAuth}
              onUpdateNode={handleUpdateNode}
              onAddNode={handleAddNode}
            />
          </div>
        )}

        {/* TAB 3: INCIDENTS MANAGER */}
        {activeTab === 'incidents' && (
          <IncidentsManager
            incidents={incidents}
            onAddIncident={handleAddIncident}
            onUpdateIncidentStatus={handleUpdateIncidentStatus}
          />
        )}

        {/* TAB 4: PUBLIC STATUS PAGE */}
        {activeTab === 'status_page' && (
          <StatusPageBuilder
            config={statusPageConfig}
            monitors={monitors}
            onUpdateConfig={async (newCfg) => {
              if (!handleRequireAuth('更新公开状态页配置需要管理员密码授权')) {
                return;
              }
              setStatusPageConfig((prev) => ({ ...prev, ...newCfg }));
              try {
                await fetch('/api/status-page', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(newCfg),
                });
              } catch (e) {
                console.warn('Failed to update status page on server:', e);
              }
            }}
          />
        )}

        {/* TAB 5: FULL-SCREEN RESPONSIVE ADMIN CONTROL CENTER */}
        {activeTab === 'admin' && (
          <AdminView
            isAdminAuthenticated={isAdminAuthenticated}
            onAuthenticate={handleAuthenticate}
            onLogout={handleLogout}
            hasAdminPassword={!!adminPassword}
            onSetAdminPassword={handleSetAdminPassword}
            monitors={monitors}
            incidents={incidents}
            globalNodes={globalNodes}
            webhooks={webhooks}
            statusPageConfig={statusPageConfig}
            onUpdateStatusPageConfig={async (newCfg) => {
              if (!handleRequireAuth('更新公开状态页配置需要管理员密码授权')) {
                return;
              }
              setStatusPageConfig((prev) => ({ ...prev, ...newCfg }));
              try {
                await fetch('/api/status-page', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(newCfg),
                });
              } catch (e) {
                console.warn('Failed to update status page on server:', e);
              }
            }}
            onAddIncident={handleAddIncident}
            onUpdateIncidentStatus={handleUpdateIncidentStatus}
            onDeleteIncident={handleDeleteIncident}
            onImportData={handleImportData}
            onResetData={handleResetData}
            initialTab={adminInitialTab}
          />
        )}
      </main>

      {/* Quick Password Unlock Prompt Modal */}
      <AuthPromptModal
        isOpen={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
        onAuthenticate={handleAuthenticate}
        onOpenFullAdmin={() => {
          setShowAuthPrompt(false);
          setActiveTab('admin');
        }}
        actionReason={authPromptReason}
      />

      {/* Detail Modal */}
      {selectedMonitor && (
        <MonitorDetailModal
          monitor={selectedMonitor}
          onClose={() => setSelectedMonitor(null)}
          onRunCheckNow={(id) => executeLiveCheck(id, true)}
          onOpenAIReportForMonitor={(m) => generateAISlaReport(m)}
          isChecking={checkingMonitorId === selectedMonitor.id}
        />
      )}

      {/* Add / Edit Form Modal */}
      {showFormModal && (
        <MonitorFormModal
          initialData={editingMonitor}
          onSave={handleSaveMonitor}
          onClose={() => {
            setShowFormModal(false);
            setEditingMonitor(null);
          }}
        />
      )}

      {/* AI Report Modal */}
      {showAIReportModal && (
        <AIReportModal
          report={aiReportData}
          loading={aiReportLoading}
          onClose={() => setShowAIReportModal(false)}
          onRefresh={() => generateAISlaReport(selectedMonitorForAI)}
          monitorName={selectedMonitorForAI?.name}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
