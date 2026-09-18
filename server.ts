import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini AI client lazily
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is missing.');
      }
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return aiClient;
  }

  // Health check API
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', app: 'CloudPulse-UPtime', timestamp: Date.now() });
  });

  // Real-time endpoint check proxy API
  app.post('/api/check', async (req, res) => {
    const { url, method = 'GET', headers = {}, timeoutMs = 8000, expectedStatus = 200 } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid target URL parameter.' });
    }

    const startTime = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // Perform live fetch check
      const response = await fetch(url, {
        method: method,
        headers: {
          'User-Agent': 'CloudPulse-UPtime/1.0 EdgeChecker',
          ...headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const endTime = Date.now();
      const latencyMs = endTime - startTime;
      const isExpected = response.status === expectedStatus || (response.status >= 200 && response.status < 400);

      let status: 'operational' | 'degraded' | 'down' = 'operational';
      if (!isExpected) {
        status = 'down';
      } else if (latencyMs > 800) {
        status = 'degraded';
      }

      return res.json({
        ok: isExpected,
        statusCode: response.status,
        statusText: response.statusText,
        latencyMs,
        status,
        url,
        timestamp: Date.now(),
      });
    } catch (err: any) {
      clearTimeout(timeout);
      const endTime = Date.now();
      const latencyMs = endTime - startTime;
      const errorMessage = err.name === 'AbortError' ? 'Timeout exceeded' : err.message || 'Network connection failed';

      return res.json({
        ok: false,
        statusCode: 0,
        statusText: errorMessage,
        latencyMs,
        status: 'down',
        url,
        timestamp: Date.now(),
        error: errorMessage,
      });
    }
  });

  // AI SLA & Outage Diagnosis API using Gemini
  app.post('/api/ai-analyze', async (req, res) => {
    try {
      const { monitorName, monitorType, url, uptime24h, avgLatencyMs, status, history = [], incidents = [] } = req.body;

      const ai = getGeminiClient();

      const prompt = `你是一位顶尖的 Cloudflare 边缘计算与网络 SLA 运维诊断专家。
请根据以下 CloudPulse-UPtime 监控站点的实时 Telemetry 状态数据，生成一份简洁、专业、可读性极高的 SLA 诊断报告与优化建议。

【站点元数据与状态】
- 站点名称: ${monitorName || '未命名服务'}
- 监控类型: ${monitorType || 'HTTP/HTTPS'}
- 目标 URL: ${url || 'N/A'}
- 当前状态: ${status}
- 24小时 SLA 可用率: ${uptime24h}%
- 平均响应延迟: ${avgLatencyMs} ms
- 近期异常记录: ${JSON.stringify(incidents.slice(-3))}
- 近期 10 次 Check 历史: ${JSON.stringify(history.slice(-10))}

请用 JSON 格式输出，Schema 如下：
{
  "summary": "一句精炼的健康度概括",
  "healthScore": 98,
  "statusLevel": "正常" | "注意" | "警告",
  "bottlenecks": ["可能存在的延迟或连接瓶颈点 1", "瓶颈点 2"],
  "rootCauseAnalysis": "针对异常或延迟波动的归因分析（如 Cloudflare CDN 缓存未命中、DNS 解析抖动或 Worker 超时）",
  "recommendations": ["排查建议 1", "排查建议 2"],
  "slaReportText": "一段给团队的 Markdown 简报"
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const jsonText = response.text || '{}';
      const parsedData = JSON.parse(jsonText);

      return res.json({
        success: true,
        report: parsedData,
        timestamp: Date.now(),
      });
    } catch (error: any) {
      console.error('Gemini AI Analysis Error:', error);
      return res.status(500).json({
        error: error.message || 'Failed to generate AI SLA analysis report.',
      });
    }
  });

  // Vite development middleware vs production static server
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CloudPulse-UPtime server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
