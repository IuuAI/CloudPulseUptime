import React from 'react';
import { Sparkles, X, ShieldCheck, AlertTriangle, Cpu, CheckCircle2, RefreshCw } from 'lucide-react';

interface AIReportModalProps {
  report: {
    summary?: string;
    healthScore?: number;
    statusLevel?: string;
    bottlenecks?: string[];
    rootCauseAnalysis?: string;
    recommendations?: string[];
    slaReportText?: string;
  } | null;
  loading: boolean;
  onClose: () => void;
  onRefresh: () => void;
  monitorName?: string;
}

export const AIReportModal: React.FC<AIReportModalProps> = ({
  report,
  loading,
  onClose,
  onRefresh,
  monitorName,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-purple-500/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-500">
              <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-mono">
                Gemini AI SLA 智能健康诊断报告
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {monitorName ? `针对 [${monitorName}] 节点的 Telemetry 分析` : '全网 Monitor 节点综合 SLA 诊断'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="重新生成 AI 诊断"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {loading ? (
            <div className="p-12 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-indigo-500 animate-bounce mx-auto" />
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                正在分析 Cloudflare Edge Telemetry 与 SLA 历史...
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Gemini 模型正比对近 24 小时 Latency 响应曲线、丢包率及错误状态码，请稍候。
              </p>
            </div>
          ) : report ? (
            <div className="space-y-5">
              {/* Health Score Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block font-mono">SLA 综合健康评分</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                      {report.healthScore ?? 98}
                    </span>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      [{report.statusLevel ?? '正常'}]
                    </span>
                  </div>
                </div>

                <div className="max-w-xs text-right">
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    {report.summary || '系统运行稳健，无关键阻塞性故障。'}
                  </p>
                </div>
              </div>

              {/* Root Cause Analysis */}
              {report.rootCauseAnalysis && (
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                    链路归因分析 Root Cause
                  </h4>
                  <p className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-mono">
                    {report.rootCauseAnalysis}
                  </p>
                </div>
              )}

              {/* Bottlenecks */}
              {report.bottlenecks && report.bottlenecks.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                    识别到的潜在瓶颈点 Bottlenecks
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300 font-mono">
                    {report.bottlenecks.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {report.recommendations && report.recommendations.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                    优化建议 Recommendations
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300 font-mono">
                    {report.recommendations.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Report Summary markdown */}
              {report.slaReportText && (
                <div className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono leading-relaxed border border-slate-800 whitespace-pre-wrap">
                  {report.slaReportText}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              点击上方刷新按钮，生成此站点的 AI SLA 分析。
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
