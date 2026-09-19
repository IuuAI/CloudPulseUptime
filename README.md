# CloudPulse-UPtime ⚡

> **现代、高可用、跨平台的全球站点与边缘 API 实时 Uptime 监控系统**。
> 集成 90 天 SLA 脉冲热力图、全球边缘 POPs 测速节点、Gemini AI SLA 智能根因分析、全屏管理控制台以及面向公众的 Status 状态页构建器。

---

## 🌟 核心特性 (Features)

- **⚡ 全协议多维度健康探测**：支持 HTTP/HTTPS 状态码、响应耗时、PING/TCP 端口连通性及 SSL/TLS 证书到期倒计时预警。
- **📊 90 天 SLA 脉冲色块与度量**：直观展示 90 天可用率热力色块，精确计算 P95 / P99 高分位延迟、24h / 30d 可用率与平均响应时间。
- **🌍 全球边缘测速拓扑 (Global Edge POPs)**：实时监控东京、新加坡、法兰克福、圣何塞、悉尼等全球网络节点的延时与负载状态。
- **🛰️ 多端轻量探针 Agent 一键部署**：
  - **Linux Systemd Shell**：一键定时上报 CPU、内存与网络延时。
  - **Docker Compose**：隔离运行的轻量级测速容器。
  - **Cloudflare Worker**：依托全球 300+ 边缘数据中心的无服务器测速探针。
- **🤖 Gemini AI SLA 智能诊断**：一键调用大模型进行故障归因分析、风险评级评估与自愈调优建议，提供检测样本透明度与置信度量化。
- **📢 公开 Status 状态页 (Status Page Builder)**：面向团队与公众客户提供免登录的实时服务状态面板，支持自定义标题与系统公告。
- **🚨 故障与维护事件日志 (Incidents Manager)**：支持排查中（Investigating）、已确认（Identified）、观察中（Monitoring）、已解决（Resolved）全生命周期跟踪与通报。
- **🛡️ 独立响应式后台控制中心 (Admin Console)**：
  - **主密码访问控制**：保护敏感运维操作（新建/修改/删除监控项、探针配置与公开页发布）。
  - **API Keys 集中配置与校验**：在线测试 Telegram 机器人 Token & Chat ID 与 Gemini API Key。
  - **Cloudflare 免费配额监控**：实时展示 Workers / D1 / KV 每日请求量与存储配额。
  - **D1 数据库自动归档与清理引擎**：支持按保留周期一键归档历史探测日志。
  - **全站数据 JSON 备份与恢复**：快速导出与一键重置全站监控拓扑。

---

## 🏗️ 架构拓扑 (System Architecture)

```
                           ┌─────────────────────────────────────────┐
                           │           Client Browser / PWA          │
                           │   (React 19 + TypeScript + Tailwind)    │
                           └────────────────────┬────────────────────┘
                                                │
                     ┌──────────────────────────┴──────────────────────────┐
                     ▼                                                     ▼
        ┌─────────────────────────┐                           ┌─────────────────────────┐
        │   Public Status Page    │                           │  Admin Control Center   │
        │  (公开只读 SLA 状态看板)  │                           │  (主密码鉴权与配置中心)    │
        └─────────────────────────┘                           └─────────────────────────┘
                                                │
                                                ▼
                           ┌─────────────────────────────────────────┐
                           │      Express Edge Backend / Server      │
                           │  - /api/check (实时心跳代理 & 延时测速)    │
                           │  - /api/ai-analyze (Gemini AI 智能诊断)  │
                           │  - /api/notify/telegram (告警推送代理)   │
                           │  - /api/cloudflare/stats (配额状态监控)  │
                           └────────────────────┬────────────────────┘
                                                │
                     ┌──────────────────────────┼──────────────────────────┐
                     ▼                          ▼                          ▼
        ┌─────────────────────────┐┌─────────────────────────┐┌─────────────────────────┐
        │   Google Gemini API     ││ Distributed Edge Probes ││ Telegram / Discord API  │
        │  (Gemini 2.5 Flash 模型) ││ (Linux / Docker / CF)   ││      (告警通知通道)       │
        └─────────────────────────┘└─────────────────────────┘└─────────────────────────┘
```

---

## 📋 环境变量说明

在部署前，请准备好以下环境变量配置（可参考根目录 `.env.example`）：

| 环境变量 | 必填 | 默认值 | 说明 |
| :--- | :---: | :---: | :--- |
| `PORT` | 否 | `3000` | 后端服务监听端口 |
| `NODE_ENV` | 否 | `production` | 运行环境模式（`production` / `development`） |
| `GEMINI_API_KEY` | 否 | - | Google Gemini AI 密钥（用于 AI 根因分析与 SLA 智能报告） |
| `ADMIN_PASSWORD` | 否 | - | 系统后台初始访问主密码（也可在 Web 后台界面随时设置保存） |
| `APP_URL` | 否 | - | 站点公网访问 URL（用于生成探针通信地址与 Status Page 分享链接） |

---

## 🚀 详细部署教程 (Deployment Guide)

本项目提供多种便捷的部署方案，可根据你的服务器与基础设施环境自由选择：

---

### 方案一：Docker / Docker Compose 一键私有化部署（推荐 VPS / 独立服务器）

#### 1. 准备 Dockerfile

在项目根目录下确认或创建 `Dockerfile`：

```dockerfile
# ---- 阶段 1：构建阶段 ----
FROM node:20-alpine AS builder
WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci

# 复制源码并构建静态产物与服务端 bundle
COPY . .
RUN npm run build

# ---- 阶段 2：生产运行阶段 ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm ci --only=production

# 复制编译产物
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["npm", "start"]
```

#### 2. 准备 `docker-compose.yml`

在项目根目录创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  cloudpulse-uptime:
    image: cloudpulse-uptime:latest
    build:
      context: .
      dockerfile: Dockerfile
    container_name: cloudpulse-uptime
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - GEMINI_API_KEY=${GEMINI_API_KEY:-}
      - APP_URL=${APP_URL:-http://localhost:3000}
    # 数据持久化卷（如需要挂载自定义配置或 SQLite）
    volumes:
      - ./data:/app/data
```

#### 3. 启动容器

```bash
# 1. 复制环境变量文件
cp .env.example .env

# 2. 一键构建并后台启动
docker compose up -d --build

# 3. 查看运行日志
docker compose logs -f
```
启动成功后，即可通过浏览器访问 `http://<服务器IP>:3000`。

---

### 方案二：Node.js + PM2 生产环境部署（Linux VPS）

适用于已有 Node.js 运行环境的 Linux 服务器（Ubuntu / Debian / CentOS）：

#### 1. 安装 Node.js 18+ 与 PM2

```bash
# 安装 Node.js (以 Node 20 LTS 为例)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 全局安装 PM2 进程管理器
npm install -g pm2
```

#### 2. 克隆代码并安装依赖

```bash
# 克隆代码
git clone <你的仓库地址> cloudpulse-uptime
cd cloudpulse-uptime

# 安装项目所有依赖
npm install
```

#### 3. 编译打包与启动

```bash
# 执行前端构建与服务端打包
npm run build

# 使用 PM2 启动服务（支持故障自愈与集群模式）
pm2 start dist/server.cjs --name "cloudpulse-uptime" --env PORT=3000

# 保存 PM2 进程列表并设置开机自启
pm2 save
pm2 startup
```

#### 4. 配置 Nginx 反向代理与 SSL 证书（可选）

创建 Nginx 配置文件 `/etc/nginx/sites-available/uptime.example.com`：

```nginx
server {
    listen 80;
    server_name uptime.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用站点并申请免费 Let's Encrypt 证书：
```bash
sudo ln -s /etc/nginx/sites-available/uptime.example.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d uptime.example.com
```

---

### 方案三：Cloudflare Pages / Workers 边缘无服务器全栈部署

CloudPulse 支持部署在 Cloudflare 全球 300+ Anycast 边缘数据中心，享受 **0 服务器成本**、**毫秒级冷启动** 与 **永久免费额度**（每天 100,000 次免费 Worker 请求、D1 每日 500 万次免费行读取）。

---

#### 方式 A：Cloudflare Pages 控制台 Git 持续集成（最简单，推荐）

适合希望通过 GitHub / GitLab 仓库自动触发构建部署的用户：

1. **登录 Cloudflare Dashboard**：
   - 访问 [Cloudflare 仪表盘](https://dash.cloudflare.com/) 并进入 **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**。
2. **关联代码仓库并设置构建参数**：
   - **项目名称 (Project Name)**: `cloudpulse-uptime`
   - **生产分支 (Production Branch)**: `main`
   - **框架预设 (Framework Preset)**: `Vite`
   - **构建命令 (Build Command)**: `npm run build`
   - **构建输出目录 (Build Output Directory)**: `dist`
   - **Node.js 版本环境变量**: 在 **Environment Variables** 添加 `NODE_VERSION` = `20`
   - **依赖安装参数 (如遇到 ERESOLVE 冲突)**: 项目根目录已提供 `.npmrc`（开启 `legacy-peer-deps=true`）。如在 Cloudflare 后台自定义了安装命令，请使用 `npm install --legacy-peer-deps`。
3. **配置环境变量与密钥**：
   - 在 **Settings** -> **Environment variables** 中添加生产环境变量：
     - `GEMINI_API_KEY`: *(你的 Google Gemini API Key，可选)*
     - `ADMIN_PASSWORD`: *(你的后台管理员密码，可选)*
4. **绑定 D1 数据库与 KV 缓存（可选）**：
   - 在 Pages 项目设置中找到 **Functions** -> **D1 database bindings**，添加 `DB` 绑定至你的 D1 实例。
   - 找到 **KV namespace bindings**，添加 `CACHE_KV` 绑定至你的 KV 命名空间。
5. **保存并部署**：
   - 点击 **Save and Deploy**，完成后 Cloudflare 会为你分配一个 `*.pages.dev` 的全球高速 HTTPS 域名。

---

#### 方式 B：Wrangler CLI 命令行本地一键发布

适合开发者在本地终端通过 Cloudflare 官方脚手架 CLI 快速发布：

##### 1. 安装 Wrangler CLI 并登录

```bash
# 全局或本地安装 Wrangler
npm install -g wrangler

# 登录 Cloudflare 账户（浏览器将弹出授权确认窗口）
wrangler login
```

##### 2. 创建 D1 数据库与 KV 命名空间（可选）

```bash
# 1. 创建 D1 数据库实例
wrangler d1 create cloudpulse_uptime_db

# 执行后终端会输出 database_id，例如：
# database_id = "xxxx-xxxx-xxxx-xxxx"

# 2. 创建用于高频热状态缓存的 KV 命名空间
wrangler kv:namespace create "CACHE_KV"

# 3. 初始化 D1 数据表结构（可选）
wrangler d1 execute cloudpulse_uptime_db --command "CREATE TABLE IF NOT EXISTS check_logs (id TEXT PRIMARY KEY, monitor_id TEXT, latency_ms INTEGER, status_code INTEGER, created_at INTEGER);"
```

##### 3. 配置 `wrangler.toml`

复制项目根目录下的配置文件模板：
```bash
cp wrangler.toml.example wrangler.toml
```

根据你的实际资源 ID 修改 `wrangler.toml` 中的 `database_id` 与 `kv_namespaces.id`。

##### 4. 设置安全加密密钥 (Secrets)

```bash
# 安全写入 Gemini API 密钥
wrangler secret put GEMINI_API_KEY

# 安全写入后台管理员主密码
wrangler secret put ADMIN_PASSWORD
```

##### 5. 编译并一键发布

```bash
# 1. 安装依赖并构建前端生产静态资源
npm install
npm run build

# 2. 发布 Pages 站点
npx wrangler pages deploy dist --project-name=cloudpulse-uptime

# 或者作为 Worker 边缘全栈发布：
# npx wrangler deploy
```

---

#### 方式 C：Cloudflare Workers 定时巡检探针 (Cron Triggers)

如果你的主控端部署在外部 VPS，但希望利用 Cloudflare 全球 300+ 边缘机房充当**分布式免费巡检探针**：

1. **新建 Worker 巡检脚本**：
   进入 **Workers & Pages** -> **Create Worker**，命名为 `cloudpulse-edge-probe`。
2. **粘贴探针执行代码**：
   进入 CloudPulse 前台的 **全球节点 (Global Edge POPs)** -> 点击任意节点旁边的 **探针代码** -> 选择 **Cloudflare Worker 脚本** 标签页并复制代码。
3. **设置 Cron 定时触发器**：
   在 Worker 的 **Settings** -> **Triggers** -> **Cron Triggers** 中添加定时规则：
   - `* * * * *` （每 1 分钟自动触发一次全球边缘节点并发心跳回传）
4. 点击 **Save and Deploy**，即可实现全天候无服务器的全球多节点分布式可用性探测！

---

### 方案四：Google Cloud Run / 云原生容器平台一键部署

1. **Google Cloud Run**:
   - 直接连接 GitHub 仓库，选择 Dockerfile 构建；
   - 监听端口设置为 `3000`；
   - 在环境变量中填入 `GEMINI_API_KEY`，点击 **Deploy** 即可获得全球 Anycast HTTPS 访问地址。
2. **Zeabur / Railway / Render**:
   - 导入 GitHub 仓库，系统将自动识别 Node.js / Dockerfile 环境；
   - 填入环境变量后自动触发 CI/CD 并分配独立域名。

---

## 🛰️ 全球测速探针 (Edge Probes) 部署教程

你可以在自己的海外 VPS、家庭 NAS 或边缘 Worker 上部署专属探针，向主控制台实时回传节点延迟与系统资源状态：

### 1. Linux Systemd (一键 Shell 脚本)
在目标 Linux 机器上执行探针生成脚本：
```bash
# 替换为主控端地址与节点专属 Token
curl -fsSL https://<你的主控域名>/probe/install.sh | bash -s -- --endpoint "https://<你的主控域名>" --secret "cp_probe_token_xxxx"
```
脚本将自动注册为 `cloudpulse-probe` systemd 后台服务，每 30 秒上报 CPU、内存负载与网络连通性。

### 2. Docker 探针运行
```bash
docker run -d \
  --name cloudpulse-probe-hkg \
  --restart always \
  -e ENDPOINT="https://<你的主控域名>" \
  -e NODE_CODE="HKG" \
  -e PROBE_SECRET="cp_probe_token_xxxx" \
  cloudpulse/edge-probe:latest
```

### 3. Cloudflare Worker 边缘探针
利用 Cloudflare 定时 Cron 触发器（`* * * * *`），部署无服务器轻量探针代码，全球 300+ 边缘 POP 节点即可自动执行边缘延迟回传。

---

## 🔒 生产环境安全与运维建议

1. **初始设置管理员密码**：
   - 首次部署后，进入 **后台管理中心 (Admin Control Center)**，在「访问控制」中设置主密码。
   - 敏感操作（添加/删除监控、修改探针配置、公开页配置）将受到主密码严格鉴权保护。
2. **敏感 URL 自动脱敏**：
   - 系统自动对监控地址、Webhook 目标 URL 及节点物理 IP 进行掩码脱敏显示，防止屏幕共享与公开演示时敏感资产泄露。
3. **数据库定期维护与日志归档**：
   - 在后台控制中心的「数据库与存储归档」模块中，可开启自动归档或一键清理超期检测历史，保持系统轻盈高速。
4. **配置定期备份**：
   - 在「备份与恢复」标签页可一键下载全站配置 JSON 备份文件，迁移服务器或容灾时可一键还原。

---

## 💻 本地开发与代码指令

```bash
# 启动本地开发服务 (支持前端热更新与后端模拟)
npm run dev

# 生产环境编译打包
npm run build

# TypeScript 语法及严格类型检查
npm run lint

# 本地启动生产编译产物
npm start
```

---

## 📄 开源许可证

本项目基于 [Apache-2.0 License](LICENSE) 协议开源。
欢迎提交 Issue 与 Pull Request 共同改进！
