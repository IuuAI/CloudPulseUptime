import React, { useState } from 'react';
import { Monitor, MonitorType, CheckInterval } from '../types';
import { X, RotateCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface MonitorFormModalProps {
  initialData?: Monitor | null;
  onSave: (monitorData: Partial<Monitor>) => void;
  onClose: () => void;
}

export const MonitorFormModal: React.FC<MonitorFormModalProps> = ({
  initialData,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [url, setUrl] = useState(initialData?.url || '');
  const [type, setType] = useState<MonitorType>(initialData?.type || 'http');
  const [group, setGroup] = useState(initialData?.group || 'Edge Core API');
  const [intervalSeconds, setIntervalSeconds] = useState<CheckInterval>(
    initialData?.intervalSeconds || 60
  );
  const [expectedStatus, setExpectedStatus] = useState(
    initialData?.expectedStatus || 200
  );
  const [notes, setNotes] = useState(initialData?.notes || '');

  // Live test check state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    latencyMs: number;
    statusCode: number;
    message: string;
  } | null>(null);

  const handleTestCheck = async () => {
    if (!url) return;
    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.startsWith('http') ? url : `https://${url}`,
          expectedStatus,
        }),
      });
      const data = await response.json();
      setTestResult({
        ok: data.ok,
        latencyMs: data.latencyMs || 0,
        statusCode: data.statusCode || 0,
        message: data.ok ? '响应正常，Edge 连通度极佳！' : `连接状态: ${data.statusText || '异常'}`,
      });
    } catch (err: any) {
      setTestResult({
        ok: false,
        latencyMs: 0,
        statusCode: 0,
        message: err.message || '网络无法连通',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) return;

    onSave({
      name,
      url: url.startsWith('http') || type === 'port' ? url : `https://${url}`,
      type,
      group,
      intervalSeconds,
      expectedStatus,
      notes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white font-mono">
            {initialData ? '编辑监控任务 Edit Monitor' : '新建 Uptime 监控任务'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Monitor Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              监控任务名称 *
            </label>
            <input
              type="text"
              required
              placeholder="如: Cloudflare Worker API 网关"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-mono"
            />
          </div>

          {/* URL / Endpoint */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              目标 Endpoint / URL / Host *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="https://api.example.com/health"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-mono"
              />
              <button
                type="button"
                onClick={handleTestCheck}
                disabled={isTesting || !url}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sky-600 dark:text-sky-400 font-medium text-xs border border-slate-200 dark:border-slate-700/80 transition-colors flex items-center gap-1 shrink-0 disabled:opacity-50"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>实时测试</span>
              </button>
            </div>

            {/* Test result banner */}
            {testResult && (
              <div
                className={`mt-2 p-2.5 rounded-xl border text-xs font-mono flex items-center justify-between ${
                  testResult.ok
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  {testResult.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{testResult.message}</span>
                </div>
                {testResult.ok && <span>{testResult.latencyMs} ms</span>}
              </div>
            )}
          </div>

          {/* Monitor Type & Group */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                监控类型
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as MonitorType)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="http">HTTP / HTTPS Web 站点</option>
                <option value="cloudflare_worker">Cloudflare Worker Edge</option>
                <option value="port">TCP Port (如 5432, 443)</option>
                <option value="ping">Ping / ICMP</option>
                <option value="ssl">SSL 证书到期监测</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                分组 Group
              </label>
              <input
                type="text"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                placeholder="Edge Core API"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Check Frequency & Expected Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                检测频率
              </label>
              <select
                value={intervalSeconds}
                onChange={(e) => setIntervalSeconds(Number(e.target.value) as CheckInterval)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
              >
                <option value={15}>15 秒 (极速 Check)</option>
                <option value={30}>30 秒</option>
                <option value={60}>60 秒 (标准 1分钟)</option>
                <option value={300}>5 分钟</option>
                <option value={900}>15 分钟</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                预期 HTTP Status Code
              </label>
              <input
                type="number"
                value={expectedStatus}
                onChange={(e) => setExpectedStatus(Number(e.target.value))}
                placeholder="200"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              备注说明 (可选)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="例如: 部署在 Cloudflare Worker 的全局 Token 鉴权中间件..."
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-sm transition-all"
            >
              保存监控项
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
