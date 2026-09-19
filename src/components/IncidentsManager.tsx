import React, { useState } from 'react';
import { Incident } from '../types';
import {
  AlertOctagon,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  ShieldCheck,
  Activity,
  Layers,
} from 'lucide-react';

interface IncidentsManagerProps {
  incidents: Incident[];
  onAddIncident?: (incident: Incident) => void;
  onUpdateIncidentStatus?: (
    incidentId: string,
    status: 'investigating' | 'identified' | 'monitoring' | 'resolved',
    message: string
  ) => void;
}

export const IncidentsManager: React.FC<IncidentsManagerProps> = ({
  incidents,
}) => {
  const [filter, setFilter] = useState<'all' | 'ongoing' | 'resolved'>('all');

  const filteredIncidents = incidents.filter((inc) => {
    if (filter === 'ongoing') return inc.status !== 'resolved';
    if (filter === 'resolved') return inc.status === 'resolved';
    return true;
  });

  const ongoingCount = incidents.filter((i) => i.status !== 'resolved').length;

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            重大中断 (Critical)
          </span>
        );
      case 'major':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            服务受损 (Major)
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            轻微波动 (Minor)
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'investigating':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 uppercase">
            调查中 (Investigating)
          </span>
        );
      case 'identified':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase">
            原因确认 (Identified)
          </span>
        );
      case 'monitoring':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 uppercase">
            监控观察 (Monitoring)
          </span>
        );
      case 'resolved':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase">
            已恢复 (Resolved)
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Telemetry Header */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
            <AlertOctagon className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                故障与维护事件日志 (Incidents & Maintenance)
              </h3>
              {ongoingCount === 0 ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  所有系统运行正常
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  <AlertTriangle className="w-3 h-3 text-rose-500" />
                  {ongoingCount} 起活跃事件处理中
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              记录并公开系统异常排查时间线与解决进展，保障 SLA 服务透明度与可靠性。
            </p>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/70 dark:border-slate-700/60 text-xs">
          {[
            { id: 'all', label: `全部 (${incidents.length})` },
            { id: 'ongoing', label: `进行中 (${ongoingCount})` },
            { id: 'resolved', label: `已解决 (${incidents.length - ongoingCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                filter === tab.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Incident List Timeline */}
      <div className="space-y-4">
        {filteredIncidents.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              未发现相关故障通告
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              当前没有正在发生或符合条件的故障事件，所有核心节点与 API 均保持健康运行。
            </p>
          </div>
        ) : (
          filteredIncidents.map((inc) => (
            <div
              key={inc.id}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs space-y-4"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  {getStatusBadge(inc.status)}
                  {getSeverityBadge(inc.severity)}
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {inc.title}
                  </h4>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <span>影响组件: <strong className="text-slate-700 dark:text-slate-300">{inc.monitorName}</strong></span>
                  <span>•</span>
                  <span>{new Date(inc.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Updates list */}
              <div className="space-y-3 pl-3 border-l-2 border-slate-200 dark:border-slate-800 ml-1">
                {inc.updates.map((upd, idx) => (
                  <div key={idx} className="text-xs space-y-1">
                    <div className="flex items-center gap-2 text-slate-400 text-[11px] font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(upd.timestamp).toLocaleString()}</span>
                      <span className="uppercase font-bold text-sky-500">[{upd.status}]</span>
                    </div>
                    <p className="text-slate-800 dark:text-slate-200 text-xs leading-relaxed bg-slate-50/70 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60 font-sans">
                      {upd.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
