import React, { useState } from 'react';
import { GlobalNode } from '../types';
import {
  Globe,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Terminal,
  Copy,
  Check,
  Download,
  Shield,
  ShieldCheck,
  Edit2,
  Plus,
  Cpu,
  Activity,
  HardDrive,
  Clock,
  Radio,
  Eye,
  EyeOff,
  X,
  FileDown,
  Server,
  Lock,
} from 'lucide-react';

interface GlobalEdgeMapProps {
  nodes: GlobalNode[];
  isAdminAuthenticated: boolean;
  onRequestAuth: (actionReason?: string) => void;
  onUpdateNode: (node: GlobalNode) => void;
  onAddNode?: (node: GlobalNode) => void;
}

export const GlobalEdgeMap: React.FC<GlobalEdgeMapProps> = ({
  nodes,
  isAdminAuthenticated,
  onRequestAuth,
  onUpdateNode,
  onAddNode,
}) => {
  // Probe Script Modal State
  const [selectedProbeNode, setSelectedProbeNode] = useState<GlobalNode | null>(null);
  const [probeType, setProbeType] = useState<'shell' | 'docker' | 'cf_worker'>('shell');
  const [copiedScript, setCopiedScript] = useState(false);
  const [downloadedScript, setDownloadedScript] = useState(false);

  // Edit Node Modal State
  const [editingNode, setEditingNode] = useState<GlobalNode | null>(null);
  const [editForm, setEditForm] = useState<Partial<GlobalNode>>({});

  // Create Node Modal State
  const [isCreatingNode, setIsCreatingNode] = useState(false);
  const [newNodeForm, setNewNodeForm] = useState<Partial<GlobalNode>>({
    code: '',
    name: '',
    city: '',
    country: '',
    flag: '🌐',
    region: 'Asia Pacific',
    avgLatencyMs: 32,
    status: 'operational',
    ip: '',
    provider: 'Cloudflare Anycast POP',
  });

  // Show unmasked IP temporarily (per node code) for admin inspection
  const [revealedIpCodes, setRevealedIpCodes] = useState<Record<string, boolean>>({});

  // Compute aggregate stats
  const totalNodes = nodes.length;
  const operationalCount = nodes.filter((n) => n.status === 'operational').length;
  const avgLatency = Math.round(
    nodes.reduce((acc, n) => acc + (n.avgLatencyMs || 0), 0) / (totalNodes || 1)
  );

  const toggleRevealIp = (code: string) => {
    if (!isAdminAuthenticated) {
      onRequestAuth('查看完整未脱敏节点真实 IP 需要管理员密码授权');
      return;
    }
    setRevealedIpCodes((prev) => ({
      ...prev,
      [code]: !prev[code],
    }));
  };

  const handleOpenEdit = (node: GlobalNode) => {
    if (!isAdminAuthenticated) {
      onRequestAuth('编辑节点基础配置与网络信息需要管理员密码授权');
      return;
    }
    setEditingNode(node);
    setEditForm({
      code: node.code,
      name: node.name || `${node.city} Edge Node`,
      city: node.city,
      country: node.country,
      region: node.region,
      provider: node.provider || 'Cloudflare Anycast POP',
      status: node.status,
      ip: node.ip || '104.28.1.1',
      avgLatencyMs: node.avgLatencyMs,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNode) return;

    const rawIp = editForm.ip || editingNode.ip || '104.28.1.1';
    const ipParts = rawIp.split('.');
    const maskedIp =
      ipParts.length === 4
        ? `${ipParts[0]}.${ipParts[1]}.***.***`
        : '***.***.***.***';

    const updated: GlobalNode = {
      ...editingNode,
      ...editForm,
      ip: rawIp,
      maskedIp,
      code: editForm.code || editingNode.code,
      city: editForm.city || editingNode.city,
      country: editForm.country || editingNode.country,
      region: editForm.region || editingNode.region,
      status: (editForm.status as any) || editingNode.status,
    };

    onUpdateNode(updated);
    setEditingNode(null);
  };

  const handleOpenCreateNode = () => {
    if (!isAdminAuthenticated) {
      onRequestAuth('新建边缘测速节点需要系统管理员授权');
      return;
    }
    setNewNodeForm({
      code: '',
      name: '',
      city: '',
      country: '',
      flag: '🌐',
      region: 'Asia Pacific',
      avgLatencyMs: 32,
      status: 'operational',
      ip: '',
      provider: 'Cloudflare Anycast POP',
    });
    setIsCreatingNode(true);
  };

  const handleSaveNewNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeForm.code || !newNodeForm.city) return;

    const rawIp = newNodeForm.ip?.trim() || '104.28.1.1';
    const ipParts = rawIp.split('.');
    const maskedIp =
      ipParts.length === 4
        ? `${ipParts[0]}.${ipParts[1]}.***.***`
        : '***.***.***.***';

    const nodeCode = newNodeForm.code.trim().toUpperCase();
    const created: GlobalNode = {
      code: nodeCode,
      name: newNodeForm.name?.trim() || `${newNodeForm.city} Edge POP`,
      city: newNodeForm.city.trim(),
      country: newNodeForm.country?.trim() || 'Global',
      flag: newNodeForm.flag?.trim() || '🌐',
      region: newNodeForm.region || 'Asia Pacific',
      avgLatencyMs: Number(newNodeForm.avgLatencyMs) || 30,
      status: (newNodeForm.status as any) || 'operational',
      ip: rawIp,
      maskedIp,
      provider: newNodeForm.provider?.trim() || 'Cloudflare Anycast POP',
      cpuUsage: Math.floor(Math.random() * 20) + 10,
      memUsage: Math.floor(Math.random() * 25) + 25,
      loadAvg: '0.18, 0.14, 0.10',
      uptimeDays: Math.floor(Math.random() * 150) + 30,
      probeVersion: 'v1.5.2-edge',
      lastSyncAt: Date.now(),
      probeSecret: `cp_probe_${nodeCode.toLowerCase()}_${Math.random().toString(36).substring(2, 7)}`,
      probeType: 'cloudflare_worker',
    };

    if (onAddNode) {
      onAddNode(created);
    }
    setIsCreatingNode(false);
  };

  // Generate Probe Code for node
  const getProbeCode = (node: GlobalNode, type: 'shell' | 'docker' | 'cf_worker') => {
    const endpoint = window.location.origin;
    const secret = node.probeSecret || `cp_probe_${node.code.toLowerCase()}_auto98`;

    if (type === 'shell') {
      return `#!/usr/bin/env bash
# =========================================================
# CloudPulse-UPtime Node Probe Daemon Agent (Linux Systemd)
# Target Node: ${node.code} (${node.city}, ${node.country})
# =========================================================

curl -fsSL ${endpoint}/install-probe.sh | sudo bash -s -- \\
  --endpoint "${endpoint}" \\
  --node-code "${node.code}" \\
  --secret "${secret}" \\
  --interval 30 \\
  --daemon`;
    }

    if (type === 'docker') {
      return `# =========================================================
# CloudPulse-UPtime Node Probe Agent (Docker Container)
# Target Node: ${node.code} (${node.city}, ${node.country})
# =========================================================

docker run -d \\
  --name cloudpulse-probe-${node.code.toLowerCase()} \\
  --restart always \\
  --network host \\
  -e ENDPOINT="${endpoint}" \\
  -e NODE_CODE="${node.code}" \\
  -e PROBE_SECRET="${secret}" \\
  -e REPORT_INTERVAL=30 \\
  cloudpulse/uptime-probe:latest`;
    }

    return `// =========================================================
// Cloudflare Worker Serverless Edge POP Latency Reporter
// Target Node: ${node.code} (${node.city})
// =========================================================

export default {
  async scheduled(event, env, ctx) {
    const reportPayload = {
      nodeCode: '${node.code}',
      secret: '${secret}',
      timestamp: Date.now(),
      colo: event.cron || 'EDGE_POP',
      edgeLatencyMs: 24,
      status: 'operational',
    };

    await fetch('${endpoint}/api/node/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportPayload),
    });
  }
};`;
  };

  const handleCopyScript = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleDownloadScript = (node: GlobalNode, type: 'shell' | 'docker' | 'cf_worker') => {
    const code = getProbeCode(node, type);
    const filename =
      type === 'shell'
        ? `install-probe-${node.code.toLowerCase()}.sh`
        : type === 'docker'
        ? `docker-run-${node.code.toLowerCase()}.sh`
        : `probe-worker-${node.code.toLowerCase()}.js`;

    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    setDownloadedScript(true);
    setTimeout(() => setDownloadedScript(false), 2500);
  };

  return (
    <div className="space-y-4">
      {/* Top Telemetry & Network Security Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-sky-500/10 text-sky-500 border border-sky-500/20">
            <Globe className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Cloudflare 全球分布式 Edge POPs 探针节点网络
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                IP 已安全脱敏
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              全球边缘多点测速，真实节点物理 IP 已自动脱敏防扫描；管理员授权后可编辑节点或部署自建探针。
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
              {operationalCount}/{totalNodes} 节点在线
            </span>
            <span className="hidden sm:inline px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60">
              全网平均: {avgLatency} ms
            </span>
          </div>

          <button
            onClick={handleOpenCreateNode}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新建节点</span>
          </button>

          {!isAdminAuthenticated && (
            <button
              onClick={() => onRequestAuth('解锁节点修改与自建探针管理')}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span>管理授权</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Edge Nodes Detailed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {nodes.map((node) => {
          const isOperational = node.status === 'operational';
          const isDegraded = node.status === 'degraded';
          const isRevealed = revealedIpCodes[node.code];
          const displayIp = isRevealed && node.ip ? node.ip : (node.maskedIp || '104.28.***.***');

          return (
            <div
              key={node.code}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-sky-500/40 transition-all flex flex-col justify-between space-y-3"
            >
              {/* Card Header: Node Code, Flag, City, Latency */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl shrink-0 select-none">{node.flag}</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs font-mono text-slate-900 dark:text-white">
                        {node.code}
                      </span>
                      <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium truncate max-w-[120px]">
                        {node.city}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {node.country} • {node.region}
                    </span>
                  </div>
                </div>

                <div className="text-right font-mono shrink-0">
                  <span
                    className={`text-xs font-bold block ${
                      node.avgLatencyMs < 45
                        ? 'text-emerald-500 dark:text-emerald-400'
                        : node.avgLatencyMs < 100
                        ? 'text-amber-500 dark:text-amber-400'
                        : 'text-rose-500'
                    }`}
                  >
                    {node.avgLatencyMs} ms
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-500 font-sans font-medium">
                    {isOperational ? (
                      <>
                        <CheckCircle2 className="w-2.5 h-2.5" /> 正常
                      </>
                    ) : isDegraded ? (
                      <>
                        <AlertTriangle className="w-2.5 h-2.5 text-amber-500" /> 慢速
                      </>
                    ) : (
                      <>
                        <XCircle className="w-2.5 h-2.5 text-rose-500" /> 离线
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Masked IP & Security Info */}
              <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-mono">
                  <span className="flex items-center gap-1 text-[10px]">
                    <Shield className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span>节点 IP (脱敏保护):</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {displayIp}
                    </span>
                    {isAdminAuthenticated && (
                      <button
                        type="button"
                        onClick={() => toggleRevealIp(node.code)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5 cursor-pointer"
                        title={isRevealed ? '隐藏真实IP' : '查看完整真实IP (管理员特权)'}
                      >
                        {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="truncate max-w-[160px]">
                    {node.provider || 'Cloudflare Anycast POP'}
                  </span>
                  <span className="font-mono">版本: {node.probeVersion || 'v1.5.2'}</span>
                </div>
              </div>

              {/* Hardware & Telemetry Bar: CPU & Mem */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-500">
                <div className="p-2 rounded-lg bg-slate-50/60 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1 text-slate-400 font-sans">
                      <Cpu className="w-3 h-3 text-sky-500" /> CPU
                    </span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {node.cpuUsage || 15}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-sky-500 h-full rounded-full"
                      style={{ width: `${node.cpuUsage || 15}%` }}
                    />
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-50/60 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1 text-slate-400 font-sans">
                      <Activity className="w-3 h-3 text-emerald-500" /> 内存
                    </span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {node.memUsage || 32}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${node.memUsage || 32}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Node Uptime & Action Buttons */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>连续运行 {node.uptimeDays || 180} 天</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* View Probe Code Button */}
                  <button
                    onClick={() => setSelectedProbeNode(node)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/30 hover:bg-sky-100 dark:hover:bg-sky-900/40 text-sky-600 dark:text-sky-400 font-medium text-[11px] transition-colors cursor-pointer"
                    title="查看此节点的探针一键部署代码"
                  >
                    <Terminal className="w-3 h-3" />
                    <span>探针代码</span>
                  </button>

                  {/* Edit Node Info (Requires Admin Auth) */}
                  <button
                    onClick={() => handleOpenEdit(node)}
                    className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                      isAdminAuthenticated ? 'hover:text-emerald-500' : 'opacity-70'
                    }`}
                    title={isAdminAuthenticated ? '编辑节点信息' : '需要管理密码授权以编辑节点'}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* PROBE CODE DRAWER / MODAL */}
      {selectedProbeNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20 flex items-center justify-center shrink-0">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      探针代理代码部署
                    </h3>
                    <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60 font-semibold">
                      {selectedProbeNode.code} · {selectedProbeNode.city}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    轻量探针 Agent，向 CloudPulse 实时上报边缘延迟与系统指标
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedProbeNode(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="关闭"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Probe Type Switcher Tabs */}
            <div className="px-4 sm:px-5 pt-3 pb-2 bg-slate-50/40 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => setProbeType('shell')}
                title="Linux Systemd (一键 Shell)"
                aria-label="Linux Systemd (一键 Shell)"
                className={`flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap min-w-[36px] sm:min-w-0 ${
                  probeType === 'shell'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <Terminal className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Linux Systemd (一键 Shell)</span>
              </button>

              <button
                onClick={() => setProbeType('docker')}
                title="Docker 容器运行"
                aria-label="Docker 容器运行"
                className={`flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap min-w-[36px] sm:min-w-0 ${
                  probeType === 'docker'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <Server className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Docker 容器运行</span>
              </button>

              <button
                onClick={() => setProbeType('cf_worker')}
                title="Cloudflare Worker 脚本"
                aria-label="Cloudflare Worker 脚本"
                className={`flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap min-w-[36px] sm:min-w-0 ${
                  probeType === 'cf_worker'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <Globe className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Cloudflare Worker 脚本</span>
              </button>
            </div>

            {/* Code Display Area */}
            <div className="p-5 overflow-y-auto flex-1 space-y-3.5">
              {/* Code Box with Dedicated Top Header */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-md">
                {/* Code Top Bar */}
                <div className="px-3.5 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 pl-1.5 border-l border-slate-700/60">
                      {probeType === 'shell'
                        ? `install-probe-${selectedProbeNode.code.toLowerCase()}.sh`
                        : probeType === 'docker'
                        ? `docker-compose-${selectedProbeNode.code.toLowerCase()}.sh`
                        : `worker-${selectedProbeNode.code.toLowerCase()}.js`}
                    </span>
                  </div>

                  {/* Pure Icon Action Buttons */}
                  <div className="flex items-center gap-1">
                    {/* Copy Icon Button */}
                    <button
                      onClick={() => handleCopyScript(getProbeCode(selectedProbeNode, probeType))}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
                        copiedScript
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                          : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                      }`}
                      title={copiedScript ? '已成功复制到剪贴板' : '复制探针代码'}
                      aria-label="复制探针代码"
                    >
                      {copiedScript ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Download Icon Button */}
                    <button
                      onClick={() => handleDownloadScript(selectedProbeNode, probeType)}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
                        downloadedScript
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                          : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                      }`}
                      title={downloadedScript ? '已下载脚本文件' : '下载探针脚本文件'}
                      aria-label="下载探针脚本文件"
                    >
                      {downloadedScript ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Code Content */}
                <pre className="p-4 text-slate-200 font-mono text-[12px] sm:text-[12.5px] leading-relaxed overflow-x-auto whitespace-pre selection:bg-sky-500/30 selection:text-sky-200">
                  {getProbeCode(selectedProbeNode, probeType)}
                </pre>
              </div>

              {/* Security & Communication Notice */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
                <div className="font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>探针通信安全协议</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  探针通过私有 Token 建立出站单向心跳上报，无需在目标服务器开放任何入站端口，物理 IP 地址与宿主主机环境全程隔离保护。
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                <span className="text-[11px]">节点通信密钥:</span>
                <code className="bg-slate-200/80 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-800 dark:text-slate-200 font-semibold">
                  {selectedProbeNode.probeSecret || `cp_probe_${selectedProbeNode.code.toLowerCase()}_auto`}
                </code>
              </div>
              <button
                onClick={() => setSelectedProbeNode(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-medium text-xs shadow-xs transition-colors cursor-pointer"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT NODE MODAL (FOR AUTHENTICATED ADMIN) */}
      {editingNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                    编辑节点信息 ({editingNode.code})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    管理员授权模式：编辑后真实 IP 将自动同步脱敏显示
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEditingNode(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-3.5 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    节点编号 (POP Code)
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.code || ''}
                    onChange={(e) => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-1.5 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    城市 (City)
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.city || ''}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    国家或地区 (Country)
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.country || ''}
                    onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    所属大区 (Region)
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.region || ''}
                    onChange={(e) => setEditForm({ ...editForm, region: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  真实物理 IP 地址 (系统将自动隐藏并显示脱敏格式)
                </label>
                <input
                  type="text"
                  required
                  placeholder="例如 104.28.19.42"
                  value={editForm.ip || ''}
                  onChange={(e) => setEditForm({ ...editForm, ip: e.target.value })}
                  className="w-full px-3 py-1.5 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  🛡️ 安全防护：前台公开看板上该 IP 将自动显示为脱敏格式（如 104.28.***.***）
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  服务提供商 / 运营商描述
                </label>
                <input
                  type="text"
                  value={editForm.provider || ''}
                  onChange={(e) => setEditForm({ ...editForm, provider: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    当前状态 (Status)
                  </label>
                  <select
                    value={editForm.status || 'operational'}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="operational">正常 (Operational)</option>
                    <option value="degraded">延迟高 (Degraded)</option>
                    <option value="offline">离线 (Offline)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    平均链路延迟 (ms)
                  </label>
                  <input
                    type="number"
                    value={editForm.avgLatencyMs || 25}
                    onChange={(e) => setEditForm({ ...editForm, avgLatencyMs: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingNode(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-xs transition-colors cursor-pointer"
                >
                  保存修改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW NODE MODAL */}
      {isCreatingNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    新建全球边缘测速节点 (Add POP)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    登记 Cloudflare Anycast POP 或 Linux/Docker 自建测速探针
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingNode(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewNode} className="p-4 space-y-3.5 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    机场代码 / POP Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="例如 TYO"
                    value={newNodeForm.code || ''}
                    onChange={(e) =>
                      setNewNodeForm({ ...newNodeForm, code: e.target.value.toUpperCase().slice(0, 5) })
                    }
                    className="w-full px-3 py-1.5 font-mono text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    城市 (City)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="例如 Tokyo"
                    value={newNodeForm.city || ''}
                    onChange={(e) => setNewNodeForm({ ...newNodeForm, city: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    国旗 (Flag Emoji)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="🇯🇵 或 🌐"
                    value={newNodeForm.flag || ''}
                    onChange={(e) => setNewNodeForm({ ...newNodeForm, flag: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    国家 / 地区 (Country)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="例如 Japan"
                    value={newNodeForm.country || ''}
                    onChange={(e) => setNewNodeForm({ ...newNodeForm, country: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    区域大洲 (Region)
                  </label>
                  <select
                    value={newNodeForm.region || 'Asia Pacific'}
                    onChange={(e) => setNewNodeForm({ ...newNodeForm, region: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400"
                  >
                    <option value="Asia Pacific">Asia Pacific (亚太)</option>
                    <option value="North America">North America (北美)</option>
                    <option value="Europe">Europe (欧洲)</option>
                    <option value="Latin America">Latin America (拉美)</option>
                    <option value="Middle East">Middle East (中东)</option>
                    <option value="Oceania">Oceania (大洋洲)</option>
                    <option value="Africa">Africa (非洲)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  真实物理 IP 地址 (公开展示时将自动掩码脱敏)
                </label>
                <input
                  type="text"
                  required
                  placeholder="例如 141.101.120.55"
                  value={newNodeForm.ip || ''}
                  onChange={(e) => setNewNodeForm({ ...newNodeForm, ip: e.target.value })}
                  className="w-full px-3 py-1.5 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  🛡️ 系统将自动显示为脱敏格式（如 141.101.***.***），仅管理员授权后可查验真实物理 IP。
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  基础设施提供商 / 运营商描述
                </label>
                <input
                  type="text"
                  placeholder="例如 Cloudflare Anycast POP (TYO-03)"
                  value={newNodeForm.provider || ''}
                  onChange={(e) => setNewNodeForm({ ...newNodeForm, provider: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    初始状态
                  </label>
                  <select
                    value={newNodeForm.status || 'operational'}
                    onChange={(e) => setNewNodeForm({ ...newNodeForm, status: e.target.value as any })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400"
                  >
                    <option value="operational">正常 (Operational)</option>
                    <option value="degraded">延迟高 (Degraded)</option>
                    <option value="offline">离线 (Offline)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    基准网络延迟 (ms)
                  </label>
                  <input
                    type="number"
                    value={newNodeForm.avgLatencyMs || 30}
                    onChange={(e) => setNewNodeForm({ ...newNodeForm, avgLatencyMs: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingNode(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-medium shadow-xs transition-colors cursor-pointer"
                >
                  确认添加节点
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
