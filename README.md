# CloudPulse-UPtime ⚡
> 基于 **Cloudflare Pages + Cloudflare Workers + D1 Database + KV Storage** 现代化全栈架构打造的极简、高可用全球站点与边缘 API 实时 Uptime 监控系统。

---

## 🌟 核心特性

- **⚡ 多协议与边缘服务监控**：支持 HTTP/HTTPS 状态码、Cloudflare Worker 边缘节点、TCP 端口检测以及 SSL 证书到期倒计时预警。
- **📊 90 天 SLA Heatmap & 延迟度量**：直观展示近 90 天 SLA 脉冲热力色块，内置 P95 / P99 高分位响应时间计算及平均可用率统计。
- **🌍 Cloudflare 全球 POPs 测速**：涵盖东京、新加坡、法兰克福、圣何塞、悉尼等全球边缘节点毫秒级连通度与拓扑监测。
- **🤖 Gemini AI SLA 智能诊断**：一键对特定服务或全网节点生成智能归因分析报告，具备数据源透明度、检测样本统计与置信度量化展示。
- **📢 公开 Status 页面 (Status Page Builder)**：一键发布面向团队与终端客户的免登透明 SLA 状态面板，支持自定义标题与系统公告。
- **🚨 故障与维护事件日志 (Incidents Manager)**：支持排查中（Investigating）、已确认（Identified）、观察中（Monitoring）、已解决（Resolved）全生命周期跟踪。
- **🔔 告警推送与安全保护**：支持 Discord、Telegram、Slack 及自定义 Webhook，敏感 URL 自动脱敏并进行加密存储。

---

## 🏗️ 架构拓扑 (Cloudflare Full-Stack Architecture)

```
                     ┌───────────────────────────────┐
                     │     Cloudflare Edge CDN       │
                     └───────────────┬───────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
┌─────────────────────┐                             ┌─────────────────────┐
│  Cloudflare Pages   │ (静态前端资源托管)            │ Cloudflare Workers  │ (Serverless API 路由)
│  React 18 + Vite    │                             │  - /api/check       │
│  Tailwind CSS       │                             │  - /api/ai-analyze  │
└─────────────────────┘                             └──────────┬──────────┘
                                                               │
                             ┌─────────────────────────────────┴───────────────────┐
                             ▼                                                     ▼
                  ┌──────────────────────┐                              ┌──────────────────────┐
                  │ Cloudflare D1 (SQL)  │                              │ Cloudflare KV        │
                  │ - 监控项表 (monitors) │                              │ - 边缘测速热缓存     │
                  │ - 探测日志 (history)  │                              │ - 实时节点状态与 Token │
                  │ - 故障事件 (incidents)│                              │ - AI SLA 报告临时缓存 │
                  └──────────────────────┘                              └──────────────────────┘
```

---

## 🚀 Cloudflare 详细部署教程

本项目既支持通过 **Wrangler 命令行**（推荐，全自动化）一键部署，也支持通过 **Cloudflare 控制台 Web UI** 进行部署。

### 方式一：通过 Wrangler 命令行快速部署（推荐）

#### 步骤 1：准备环境与登录 Cloudflare

确保本地已安装 Node.js (>= 18.0.0)，进入项目根目录：

```bash
# 安装依赖
npm install

# 登录 Cloudflare 账号
npx wrangler login
```

#### 步骤 2：创建 Cloudflare D1 边缘数据库

```bash
# 创建 D1 数据库，例如命名为 cloudpulse_uptime_db
npx wrangler d1 create cloudpulse_uptime_db
```

命令输出将包含数据库信息，类似如下：
```text
[[d1_databases]]
binding = "DB"
database_name = "cloudpulse_uptime_db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

将生成的 `database_id` 填入项目根目录下的 `wrangler.jsonc` 中对应的 `database_id` 字段。

#### 步骤 3：初始化 D1 数据库表结构

运行我们内置的 `schema.sql` 脚本，在远程 D1 数据库中创建所需的数据表：

```bash
# 对远程生产数据库执行 SQL 初始化
npx wrangler d1 execute cloudpulse_uptime_db --remote --file=./schema.sql
```

#### 步骤 4：创建 Cloudflare KV 命名空间

```bash
# 创建用于边缘缓存和热数据的 KV 命名空间
npx wrangler kv:namespace create "CACHE_KV"
```

控制台会返回类似：
```text
{ binding = "CACHE_KV", id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }
```
将对应的 `id` 更新至 `wrangler.jsonc` 的 `kv_namespaces` 节点中。

#### 步骤 5：配置环境变量与密钥

若需要启用 Gemini AI 智能 SLA 诊断，可在 Cloudflare Worker 中设置密钥：

```bash
# 设置 Gemini API 密钥
npx wrangler secret put GEMINI_API_KEY
# 终端提示输入时粘贴你的密钥即可
```

#### 步骤 6：构建与部署

```bash
# 构建前端静态产物
npm run build

# 部署至 Cloudflare Workers / Pages
npx wrangler deploy
```

部署完成后，终端将输出你的线上访问网址（例如：`https://cloudpulse-uptime.<your-subdomain>.workers.dev`）。

---

### 方式二：通过 Cloudflare Pages 控制台集成 Git 自动部署

1. **推送代码到 GitHub / GitLab**。
2. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com/)，点击左侧导航栏中的 **Workers & Pages** -> **Create application** -> 选择 **Pages**。
3. 点击 **Connect to Git** 并选择刚刚推送的仓库。
4. 在构建配置（Build configuration）中填写：
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. **绑定 D1 和 KV**：
   - 部署完成后，进入该项目的 **Settings** -> **Functions** -> **D1 Database bindings**：
     - Variable name: `DB`
     - D1 database: 选择在 D1 控制台创建的 `cloudpulse_uptime_db`。
   - 在 **KV namespace bindings** 下：
     - Variable name: `CACHE_KV`
     - KV namespace: 选择对应的 KV 命名空间。
   - 在 **Environment variables** 中添加 `GEMINI_API_KEY`。
6. 点击 **Save and Deploy** 重新构建即可生效。

---

## 💻 本地开发指南

在本地开发调试模式下，应用支持自动本地模拟与快速反馈：

```bash
# 启动本地开发服务 (默认运行在 http://localhost:3000)
npm run dev
```

构建生产环境验证：
```bash
# 生产编译打包检查
npm run build

# 语法及类型检查
npm run lint
```

---

## 📁 目录结构说明

```
├── schema.sql                     # Cloudflare D1 数据库建表语句 (Monitors, History, Incidents, Webhooks)
├── wrangler.jsonc                 # Cloudflare Workers / Pages 核心部署配置文件
├── server.ts                      # 后端 Server / Edge Handler (/api/check, /api/ai-analyze)
├── src/
│   ├── types/                     # 领域驱动拆分的 TypeScript 规范
│   │   ├── monitor.types.ts       # 监控项、SLA 脉冲、SSL 及全球 POP 节点定义
│   │   ├── incident.types.ts      # 故障与维护生命周期事件
│   │   ├── alert.types.ts         # 告警 Webhook 配置
│   │   ├── report.types.ts        # Gemini AI 诊断报告与数据透明度模型
│   │   └── index.ts
│   ├── context/                   # 全局上下文
│   │   ├── ThemeContext.tsx       # 明亮 / 暗黑 / 跟随系统三模态切换
│   │   ├── ToastContext.tsx       # 全局统一通知吐司系统
│   │   └── ErrorBoundary.tsx      # 渲染错误边界熔断处理
│   ├── hooks/                     # 业务状态管理与解耦 Hooks
│   │   ├── useMonitors.ts         # 监控项增删改查及秒级测速触发
│   │   ├── useIncidents.ts        # 故障生命周期管理与 MTTR 统计
│   │   ├── useAlerts.ts           # 告警通道脱敏与测试推送
│   │   └── useAiReport.ts         # Gemini AI 链路归因诊断与分析缓存
│   ├── components/
│   │   ├── monitor-detail/        # 模块化细粒度弹窗组件
│   │   │   ├── MonitorHeader.tsx
│   │   │   ├── LatencyChart.tsx   # SVG 延迟曲线与 90 天色块 Heatmap
│   │   │   ├── SSLPanel.tsx       # 证书有效期倒计时面板
│   │   │   ├── NodeStatusPanel.tsx# 全球 POP 测速细项
│   │   │   └── MonitorLogsList.tsx# 探测日志列表
│   │   ├── Header.tsx             # 导航条与状态筛选
│   │   ├── Sidebar.tsx            # 侧边栏与移动端自适应抽屉
│   │   ├── OverviewCards.tsx      # 缓存计算的 KPI 指标 (P95/P99, SLA, MTTR)
│   │   ├── MonitorList.tsx        # 监控卡片与列表展示
│   │   ├── MonitorFormModal.tsx   # 新建 / 编辑监控任务
│   │   ├── GlobalEdgeMap.tsx      # 全球 POP 拓扑节点
│   │   ├── IncidentsManager.tsx   # 故障排查通报
│   │   ├── StatusPageBuilder.tsx  # 公开 Status 看板生成器
│   │   ├── AlertSettings.tsx      # 告警集成配置
│   │   └── AIReportModal.tsx      # AI SLA 诊断结果模态框
│   ├── App.tsx                    # 视图组合入口
│   └── main.tsx
```

---

## 🔒 安全与生产建议

1. **敏感地址脱敏**：前端默认展示已脱敏的 Webhook URL，如需修改建议重新输入生成。
2. **频率与并发控制**：在生产部署时，可以在 Cloudflare WAF 中配置 Rate Limiting 规则，针对 `/api/check` 进行频次限制，避免被第三方恶意滥用为扫描代理。
3. **数据冷热分离**：长期历史数据存储于 D1，高频实时监控状态优先写入 KV，兼顾低延迟与成本控制。
