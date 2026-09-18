import React, { useState } from 'react';
import { AlertWebhookConfig } from '../types';
import { Bell, Plus, CheckCircle2, Send, Trash2, ShieldCheck, Zap } from 'lucide-react';

interface AlertSettingsProps {
  webhooks: AlertWebhookConfig[];
  onAddWebhook: (webhook: AlertWebhookConfig) => void;
  onToggleWebhook: (id: string) => void;
  onDeleteWebhook: (id: string) => void;
}

export const AlertSettings: React.FC<AlertSettingsProps> = ({
  webhooks,
  onAddWebhook,
  onToggleWebhook,
  onDeleteWebhook,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'discord' | 'telegram' | 'slack' | 'custom_webhook'>('discord');
  const [url, setUrl] = useState('');

  // Simulation feedback state
  const [testSentId, setTestSentId] = useState<string | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) return;

    onAddWebhook({
      id: `wh-${Date.now()}`,
      name,
      type,
      url,
      enabled: true,
    });

    setName('');
    setUrl('');
    setShowAddModal(false);
  };

  const handleTestTrigger = (whId: string) => {
    setTestSentId(whId);
    setTimeout(() => {
      setTestSentId(null);
    }, 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-500">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              告警与 Webhook 推送 Channels
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              当服务发生 SLA 降级或 Down 故障时，秒级触发 Discord, Telegram, Slack 告警通知。
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs shadow-sm transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>添加 Webhook 告警渠道</span>
        </button>
      </div>

      {/* Test Notification Success Feedback Toast */}
      {testSentId && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-mono flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>[CloudPulse-UPtime Alert] 告警 Payload 测试数据已成功模拟推送至目标 Webhook!</span>
          </div>
          <span className="text-[10px] opacity-80">HTTP 200 OK</span>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <form
          onSubmit={handleAdd}
          className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-md space-y-3"
        >
          <h4 className="text-xs font-bold text-slate-900 dark:text-white font-mono">
            新建告警 Channel
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Channel 名称
              </label>
              <input
                type="text"
                required
                placeholder="例如: 运维 Discord 紧急群"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                渠道类型
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                <option value="discord">Discord Webhook</option>
                <option value="telegram">Telegram Bot</option>
                <option value="slack">Slack Incoming Webhook</option>
                <option value="custom_webhook">Custom HTTP POST JSON</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Webhook Target URL
            </label>
            <input
              type="text"
              required
              placeholder="https://discord.com/api/webhooks/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-3 py-1.5 text-xs text-slate-500"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-sm"
            >
              保存 Webhook
            </button>
          </div>
        </form>
      )}

      {/* Webhooks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {webhooks.map((wh) => (
          <div
            key={wh.id}
            className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col justify-between gap-3"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-indigo-500 font-mono text-xs uppercase font-bold">
                    {wh.type}
                  </span>
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{wh.name}</span>
                </div>

                {/* Enable Switch */}
                <button
                  onClick={() => onToggleWebhook(wh.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                    wh.enabled
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {wh.enabled ? '已启用 Active' : '已禁用 Disabled'}
                </button>
              </div>

              <p className="text-xs font-mono text-slate-400 truncate bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                {wh.url}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <button
                onClick={() => handleTestTrigger(wh.id)}
                className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-medium hover:underline cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>测试发送告警</span>
              </button>

              <button
                onClick={() => onDeleteWebhook(wh.id)}
                className="p-1 text-slate-400 hover:text-rose-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
