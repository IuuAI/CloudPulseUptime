import React, { useState } from 'react';
import { Incident } from '../types';
import {
  AlertOctagon,
  CheckCircle2,
  Clock,
  Plus,
  AlertTriangle,
  Send,
  Calendar,
} from 'lucide-react';

interface IncidentsManagerProps {
  incidents: Incident[];
  onAddIncident: (incident: Incident) => void;
  onUpdateIncidentStatus: (incidentId: string, status: 'investigating' | 'identified' | 'monitoring' | 'resolved', message: string) => void;
}

export const IncidentsManager: React.FC<IncidentsManagerProps> = ({
  incidents,
  onAddIncident,
  onUpdateIncidentStatus,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [monitorName, setMonitorName] = useState('');
  const [severity, setSeverity] = useState<'critical' | 'major' | 'minor'>('minor');
  const [initialMsg, setInitialMsg] = useState('');

  // Update incident popup state
  const [updatingIncId, setUpdatingIncId] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState<'investigating' | 'identified' | 'monitoring' | 'resolved'>('resolved');
  const [updateMessage, setUpdateMessage] = useState('');

  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !initialMsg) return;

    const newInc: Incident = {
      id: `inc-${Date.now()}`,
      monitorId: 'mon-manual',
      monitorName: monitorName || '全局服务组件',
      title,
      severity,
      status: 'investigating',
      createdAt: Date.now(),
      updates: [
        {
          timestamp: Date.now(),
          message: initialMsg,
          status: 'investigating',
        },
      ],
    };

    onAddIncident(newInc);
    setTitle('');
    setMonitorName('');
    setInitialMsg('');
    setShowAddForm(false);
  };

  const handleSendUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingIncId || !updateMessage) return;

    onUpdateIncidentStatus(updatingIncId, updateStatus, updateMessage);
    setUpdatingIncId(null);
    setUpdateMessage('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              故障与维护事件日志 Incidents & Maintenance
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              记录和公布系统异常排查状态，保持透明无缝沟通。
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs shadow-sm transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>新建故障通告</span>
        </button>
      </div>

      {/* Add Incident Form Modal */}
      {showAddForm && (
        <form
          onSubmit={handleCreateIncident}
          className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-md space-y-3"
        >
          <h4 className="text-xs font-bold text-slate-900 dark:text-white font-mono">
            发布新 Incident 故障通告
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              placeholder="通告标题 (例: 部分 POP 节点 Latency 抖动)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
            <input
              type="text"
              placeholder="影响的服务名称 (如: GitHub API Webhook)"
              value={monitorName}
              onChange={(e) => setMonitorName(e.target.value)}
              className="px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <textarea
            required
            rows={2}
            placeholder="详细故障说明与初查情况..."
            value={initialMsg}
            onChange={(e) => setInitialMsg(e.target.value)}
            className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white resize-none"
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-sm"
            >
              发布故障事件
            </button>
          </div>
        </form>
      )}

      {/* Incident List Timeline */}
      <div className="space-y-4">
        {incidents.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">当前没有发生的故障事件</p>
          </div>
        ) : (
          incidents.map((inc) => (
            <div
              key={inc.id}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase font-mono ${
                      inc.status === 'resolved'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {inc.status}
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {inc.title}
                  </h4>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
                  <span>组件: {inc.monitorName}</span>
                  {inc.status !== 'resolved' && (
                    <button
                      onClick={() => {
                        setUpdatingIncId(inc.id);
                        setUpdateStatus('resolved');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px]"
                    >
                      + 更新处理进展
                    </button>
                  )}
                </div>
              </div>

              {/* Updates list */}
              <div className="space-y-2 pl-2 border-l-2 border-slate-200 dark:border-slate-800">
                {inc.updates.map((upd, idx) => (
                  <div key={idx} className="text-xs font-mono space-y-0.5">
                    <div className="flex items-center gap-2 text-slate-400 text-[10px]">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(upd.timestamp).toLocaleString()}</span>
                      <span className="uppercase text-sky-500 font-bold">[{upd.status}]</span>
                    </div>
                    <p className="text-slate-800 dark:text-slate-200 text-xs font-sans">
                      {upd.message}
                    </p>
                  </div>
                ))}
              </div>

              {/* Status Update Inline Modal Form */}
              {updatingIncId === inc.id && (
                <form
                  onSubmit={handleSendUpdate}
                  className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      选择最新状态:
                    </label>
                    <select
                      value={updateStatus}
                      onChange={(e) => setUpdateStatus(e.target.value as any)}
                      className="text-xs px-2 py-1 rounded bg-white dark:bg-slate-900 border"
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
                    placeholder="例如: 路由节点重新收敛完成，网络丢包与 Latency 已完全平稳。"
                    value={updateMessage}
                    onChange={(e) => setUpdateMessage(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setUpdatingIncId(null)}
                      className="text-xs text-slate-500"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold"
                    >
                      提交更新
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
