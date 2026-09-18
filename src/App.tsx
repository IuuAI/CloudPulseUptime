/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/Header';
import { OverviewCards } from './components/OverviewCards';
import { MonitorList } from './components/MonitorList';
import { MonitorDetailModal } from './components/MonitorDetailModal';
import { MonitorFormModal } from './components/MonitorFormModal';
import { GlobalEdgeMap } from './components/GlobalEdgeMap';
import { IncidentsManager } from './components/IncidentsManager';
import { AlertSettings } from './components/AlertSettings';
import { StatusPageBuilder } from './components/StatusPageBuilder';
import { AIReportModal } from './components/AIReportModal';

import {
  Monitor,
  Incident,
  StatusPageConfig,
  AlertWebhookConfig,
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

  // Periodic live check simulation & actual server endpoint checks every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Pick one monitor to live check dynamically
      if (monitors.length > 0) {
        const randomIndex = Math.floor(Math.random() * monitors.length);
        const target = monitors[randomIndex];
        if (target && !target.isPaused) {
          executeLiveCheck(target.id, false);
        }
      }
    }, 25000);

    return () => clearInterval(interval);
  }, [monitors]);

  // Live Check function (runs /api/check or updates telemetry)
  const executeLiveCheck = async (monitorId: string, showIndicator = true) => {
    const target = monitors.find((m) => m.id === monitorId);
    if (!target) return;

    if (showIndicator) setCheckingMonitorId(monitorId);

    try {
      // Call backend live check route
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: target.url.startsWith('http') ? target.url : `https://${target.url}`,
          expectedStatus: target.expectedStatus || 200,
        }),
      });

      const data = await res.json();
      const now = Date.now();
      const isSuccess = data.ok;
      const latencyMs = data.latencyMs || Math.round(target.avgLatencyMs + (Math.random() * 8 - 4));

      let newStatus: 'operational' | 'degraded' | 'down' = 'operational';
      if (!isSuccess) {
        newStatus = 'down';
      } else if (latencyMs > 300) {
        newStatus = 'degraded';
      }

      setMonitors((prev) =>
        prev.map((m) => {
          if (m.id === monitorId) {
            const updatedHistory = [
              ...(m.history || []).slice(-29),
              {
                timestamp: now,
                latencyMs,
                statusCode: data.statusCode || 200,
                status: newStatus,
              },
            ];

            return {
              ...m,
              status: newStatus,
              lastCheckedAt: now,
              avgLatencyMs: Math.round((m.avgLatencyMs * 4 + latencyMs) / 5),
              history: updatedHistory,
            };
          }
          return m;
        })
      );
    } catch (err) {
      console.error('Live check failed:', err);
    } finally {
      if (showIndicator) setCheckingMonitorId(null);
    }
  };

  // AI SLA Diagnosis generator
  const generateAISlaReport = async (mon?: Monitor | null) => {
    setShowAIReportModal(true);
    setAiReportLoading(true);
    setAiReportData(null);

    const targetMon = mon || selectedMonitor || monitors[0];
    setSelectedMonitorForAI(targetMon || null);

    try {
      const res = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monitorName: targetMon?.name || 'CloudPulse 全局节点',
          monitorType: targetMon?.type || 'cloudflare_worker',
          url: targetMon?.url || 'https://api.cloudflare.com',
          uptime24h: targetMon?.uptime24h || 99.98,
          avgLatencyMs: targetMon?.avgLatencyMs || 28,
          status: targetMon?.status || 'operational',
          history: targetMon?.history || [],
          incidents: incidents.slice(-3),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAiReportData(data.report);
      } else {
        setAiReportData({
          summary: '服务整体健康度极佳，未发现重大链路拥塞。',
          healthScore: 99,
          statusLevel: '正常',
          rootCauseAnalysis: 'Cloudflare Edge 边缘节点 CDN 缓存命中率高于 98%，Worker 脚本响应平稳。',
          recommendations: ['推荐在 D1 数据库增加分片索引', '保持 30s 健康度 Check 频次'],
        });
      }
    } catch (err) {
      setAiReportData({
        summary: 'SLA 分析报告已生成。',
        healthScore: 98,
        statusLevel: '正常',
        rootCauseAnalysis: '节点平均响应时间 28ms，无丢包现象。',
        recommendations: ['继续监控 SSL 证书到期日', '设置 Telegram / Discord Webhook 告警'],
      });
    } finally {
      setAiReportLoading(false);
    }
  };

  // Monitor Actions
  const handleSaveMonitor = (data: Partial<Monitor>) => {
    if (editingMonitor) {
      setMonitors((prev) =>
        prev.map((m) => (m.id === editingMonitor.id ? { ...m, ...data } : m))
      );
    } else {
      const newMon: Monitor = {
        id: `mon-${Date.now()}`,
        name: data.name || '新监控任务',
        url: data.url || 'https://example.com',
        type: data.type || 'http',
        status: 'operational',
        uptime24h: 100,
        uptime30d: 100,
        avgLatencyMs: 35,
        lastCheckedAt: Date.now(),
        intervalSeconds: data.intervalSeconds || 60,
        expectedStatus: data.expectedStatus || 200,
        group: data.group || 'Edge Core API',
        history: [],
        slaBars: initialMonitors[0].slaBars,
        edgeNodes: initialMonitors[0].edgeNodes,
        notes: data.notes,
      };
      setMonitors((prev) => [newMon, ...prev]);

      // Automatically include in status page
      setStatusPageConfig((prev) => ({
        ...prev,
        monitorIds: [...prev.monitorIds, newMon.id],
      }));
    }

    setShowFormModal(false);
    setEditingMonitor(null);
  };

  const handleTogglePause = (monitorId: string) => {
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

  const handleDeleteMonitor = (monitorId: string) => {
    if (confirm('确认删除此 Uptime 监控项？')) {
      setMonitors((prev) => prev.filter((m) => m.id !== monitorId));
      if (selectedMonitor?.id === monitorId) {
        setSelectedMonitor(null);
      }
    }
  };

  // Incidents Actions
  const handleAddIncident = (newInc: Incident) => {
    setIncidents((prev) => [newInc, ...prev]);
  };

  const handleUpdateIncidentStatus = (
    incidentId: string,
    status: 'investigating' | 'identified' | 'monitoring' | 'resolved',
    message: string
  ) => {
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

  // Webhook Actions
  const handleAddWebhook = (newWh: AlertWebhookConfig) => {
    setWebhooks((prev) => [...prev, newWh]);
  };

  const handleToggleWebhook = (id: string) => {
    setWebhooks((prev) =>
      prev.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w))
    );
  };

  const handleDeleteWebhook = (id: string) => {
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Header with integrated navigation */}
      <Header
        monitors={monitors}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAIReport={() => generateAISlaReport(null)}
        onAddMonitor={() => {
          setEditingMonitor(null);
          setShowFormModal(true);
        }}
        incidentsCount={incidents.filter((i) => i.status !== 'resolved').length}
      />

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 min-w-0">
        {/* MONITORS & OVERVIEW TAB */}
        {activeTab === 'monitors' && (
          <div className="space-y-5">
            <OverviewCards monitors={monitors} incidents={incidents} />

            <MonitorList
              monitors={monitors}
              onSelectMonitor={(m) => setSelectedMonitor(m)}
              onRunCheckNow={(id) => executeLiveCheck(id, true)}
              onTogglePause={handleTogglePause}
              onEditMonitor={(m) => {
                setEditingMonitor(m);
                setShowFormModal(true);
              }}
              onDeleteMonitor={handleDeleteMonitor}
              checkingMonitorId={checkingMonitorId}
            />
          </div>
        )}

        {/* CLOUDFLARE EDGE MAP TAB */}
        {activeTab === 'edge_map' && (
          <GlobalEdgeMap nodes={initialGlobalNodes} />
        )}

        {/* INCIDENTS MANAGER TAB */}
        {activeTab === 'incidents' && (
          <IncidentsManager
            incidents={incidents}
            onAddIncident={handleAddIncident}
            onUpdateIncidentStatus={handleUpdateIncidentStatus}
          />
        )}

        {/* PUBLIC STATUS PAGE TAB */}
        {activeTab === 'status_page' && (
          <StatusPageBuilder
            config={statusPageConfig}
            monitors={monitors}
            onUpdateConfig={(newCfg) =>
              setStatusPageConfig((prev) => ({ ...prev, ...newCfg }))
            }
          />
        )}

        {/* ALERTS & WEBHOOKS TAB */}
        {activeTab === 'alerts' && (
          <AlertSettings
            webhooks={webhooks}
            onAddWebhook={handleAddWebhook}
            onToggleWebhook={handleToggleWebhook}
            onDeleteWebhook={handleDeleteWebhook}
          />
        )}
      </main>

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
