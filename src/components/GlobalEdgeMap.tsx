import React from 'react';
import { GlobalNode } from '../types';
import { Globe, Cpu, CheckCircle2, Zap } from 'lucide-react';

interface GlobalEdgeMapProps {
  nodes: GlobalNode[];
}

export const GlobalEdgeMap: React.FC<GlobalEdgeMapProps> = ({ nodes }) => {
  return (
    <div className="space-y-4">
      {/* Top Info Banner */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-sky-500/10 text-sky-500">
            <Globe className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Cloudflare 全球 Edge POPs 网络状态
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              通过边缘节点多路测速，全网毫秒级链路延迟监控。
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
            100% POPs 在线
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            全网平均: 42ms
          </span>
        </div>
      </div>

      {/* Edge Nodes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {nodes.map((node) => (
          <div
            key={node.code}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-sky-500/40 transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{node.flag}</span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-slate-900 dark:text-white font-mono">
                    {node.code}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">({node.city})</span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                  {node.country} • {node.region}
                </span>
              </div>
            </div>

            <div className="text-right font-mono">
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400 block">
                {node.avgLatencyMs} ms
              </span>
              <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-500">
                <CheckCircle2 className="w-2.5 h-2.5" /> Normal
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
