const http = require('http');
const https = require('https');
const { URL } = require('url');

class ProxyGateway {
  constructor(options = {}) {
    this.workbuddyEndpoint = options.workbuddyEndpoint || 'http://127.0.0.1:18888';
    this.upstreamProxy = options.upstreamProxy || null;
    this.strategy = options.strategy || 'round_robin'; // round_robin | priority | failover
    this.sourceEdition = options.sourceEdition || 'workbuddy';
    this.promotionProvider = options.promotionProvider || (() => []);

    this.metrics = {
      totalRequests: 0,
      activeStreams: 0,
      failedRequests: 0,
      totalLatencyMs: 0,
      recentLogs: []
    };
  }

  logRequest(entry) {
    this.metrics.totalRequests++;
    if (entry.error) this.metrics.failedRequests++;
    if (entry.durationMs) this.metrics.totalLatencyMs += entry.durationMs;

    this.metrics.recentLogs.unshift({
      id: 'req_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      timestamp: Date.now(),
      model: entry.model || 'auto',
      stream: Boolean(entry.stream),
      durationMs: entry.durationMs || 0,
      status: entry.status || (entry.error ? 500 : 200),
      error: entry.error ? String(entry.error) : null,
      clientIp: entry.clientIp || '127.0.0.1'
    });

    if (this.metrics.recentLogs.length > 50) {
      this.metrics.recentLogs.pop();
    }
  }

  getMetrics() {
    const avgLatency = this.metrics.totalRequests > 0
      ? Math.round(this.metrics.totalLatencyMs / this.metrics.totalRequests)
      : 0;

    return {
      totalRequests: this.metrics.totalRequests,
      activeStreams: this.metrics.activeStreams,
      failedRequests: this.metrics.failedRequests,
      averageLatencyMs: avgLatency,
      recentLogs: this.metrics.recentLogs,
      workbuddyEndpoint: this.workbuddyEndpoint
    };
  }

  /**
   * Forward request to local WorkBuddy bridge
   */
  async forwardRequest(req, res, targetPath, body) {
    const startTime = Date.now();
    const targetUrl = new URL(targetPath, this.workbuddyEndpoint);
    const clientIp = req.socket.remoteAddress || '127.0.0.1';
    const isStream = body && Boolean(body.stream);
    const requestedModel = body && body.model ? body.model : 'auto';

    if (isStream) this.metrics.activeStreams++;

    const postData = body ? JSON.stringify(body) : null;
    const options = {
      method: req.method,
      hostname: targetUrl.hostname,
      port: targetUrl.port,
      path: targetUrl.pathname + targetUrl.search,
      headers: {
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
      }
    };

    return new Promise((resolve) => {
      const clientReq = http.request(options, (upstreamRes) => {
        // Forward status and headers
        const forwardHeaders = {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Content-Type': upstreamRes.headers['content-type'] || 'application/json'
        };

        if (isStream) {
          forwardHeaders['Cache-Control'] = 'no-cache';
          forwardHeaders['Connection'] = 'keep-alive';
        }

        res.writeHead(upstreamRes.statusCode, forwardHeaders);

        upstreamRes.on('data', (chunk) => {
          res.write(chunk);
        });

        upstreamRes.on('end', () => {
          res.end();
          if (isStream) this.metrics.activeStreams = Math.max(0, this.metrics.activeStreams - 1);
          const duration = Date.now() - startTime;
          this.logRequest({
            model: requestedModel,
            stream: isStream,
            durationMs: duration,
            status: upstreamRes.statusCode,
            clientIp
          });
          resolve();
        });
      });

      clientReq.on('error', (err) => {
        if (isStream) this.metrics.activeStreams = Math.max(0, this.metrics.activeStreams - 1);
        const duration = Date.now() - startTime;
        this.logRequest({
          model: requestedModel,
          stream: isStream,
          durationMs: duration,
          status: 502,
          error: err.message,
          clientIp
        });

        if (!res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({
            error: {
              message: `Gateway Error: Failed to connect to AI engine at ${this.workbuddyEndpoint}. Details: ${err.message}`,
              type: 'gateway_connection_error'
            }
          }));
        }
        resolve();
      });

      if (postData) {
        clientReq.write(postData);
      }
      clientReq.end();
    });
  }

  /**
   * Enrich model metadata with explicit provider & company info
   */
  enrichModel(model, promotions = []) {
    const id = (model.id || '').toLowerCase();
    let company = '未知厂商';
    let companyShort = 'AI';
    let badgeClass = 'badge-other';

    let vendorId = 'other';
    if (id.includes('deepseek')) {
      company = '深度求索 (DeepSeek)';
      companyShort = '深度求索';
      badgeClass = 'badge-deepseek';
      vendorId = 'deepseek';
    } else if (id.includes('claude') || id === 'default-1.2') {
      company = 'Anthropic (Claude)';
      companyShort = 'Anthropic';
      badgeClass = 'badge-anthropic';
      vendorId = 'anthropic';
    } else if (id.includes('gpt') || id.includes('o1') || id.includes('o3') || id.includes('text-embedding')) {
      company = 'OpenAI (ChatGPT)';
      companyShort = 'OpenAI';
      badgeClass = 'badge-openai';
      vendorId = 'openai';
    } else if (id.includes('hunyuan')) {
      company = '腾讯公司 (Tencent 混元)';
      companyShort = '腾讯混元';
      badgeClass = 'badge-tencent';
      vendorId = 'tencent';
    } else if (id.includes('codewise')) {
      company = '腾讯公司 (Tencent 智算引擎)';
      companyShort = '腾讯智算';
      badgeClass = 'badge-tencent';
      vendorId = 'tencent';
    } else if (id.includes('kling')) {
      company = '快手科技 (Kuaishou 可灵)';
      companyShort = '快手可灵';
      badgeClass = 'badge-kuaishou';
      vendorId = 'kuaishou';
    } else if (id.includes('glm')) {
      company = '智谱 AI (Zhipu GLM)';
      companyShort = '智谱 AI';
      badgeClass = 'badge-zhipu';
      vendorId = 'zhipu';
    } else if (id.includes('kimi') || id.includes('moonshot')) {
      company = '月之暗面 (Moonshot Kimi)';
      companyShort = '月之暗面';
      badgeClass = 'badge-moonshot';
      vendorId = 'moonshot';
    } else if (id.includes('minimax')) {
      company = '稀宇科技 (MiniMax)';
      companyShort = 'MiniMax';
      badgeClass = 'badge-minimax';
      vendorId = 'minimax';
    } else if (id.includes('qwen')) {
      company = '阿里巴巴 (Alibaba 通义千问)';
      companyShort = '阿里通义';
      badgeClass = 'badge-alibaba';
      vendorId = 'alibaba';
    } else if (id.includes('doubao') || id.includes('bytedance')) {
      company = '字节跳动 (ByteDance 豆包)';
      companyShort = '字节跳动';
      badgeClass = 'badge-bytedance';
      vendorId = 'bytedance';
    } else if (model.owned_by === 'workbuddy-custom' || id.startsWith('custom-')) {
      company = '第三方自定义 API';
      companyShort = '自定义';
      badgeClass = 'badge-custom';
      vendorId = 'custom';
    } else {
      company = 'WorkBuddy 官方聚合';
      companyShort = '官方聚合';
      badgeClass = 'badge-official';
      vendorId = 'official';
    }

    // IDE Origin and Target Compatibility
    const isCustom = model.owned_by === 'workbuddy-custom' || id.startsWith('custom-');
    const isInternational = this.sourceEdition === 'workbuddy-ai';
    const sourceIde = isCustom
      ? 'WorkBuddy（国内版，自定义模型）'
      : (isInternational ? 'WorkBuddy AI（国际版官方模型）' : 'WorkBuddy（国内版模型桥接）');
    const sourceIdeId = isCustom ? 'custom' : this.sourceEdition;
    const sourceIdeBadge = isCustom ? 'badge-custom' : (isInternational ? 'ide-badge-wbai' : 'ide-badge-wb');
    const sourceIdeShort = isCustom ? 'WB自定义' : (isInternational ? 'WorkBuddy AI 国际版' : 'WorkBuddy 国内版');
    const targetIdes = ['ByteDance Trae', 'Google Antigravity', '通用 OpenAI API'];
    const traeOptimized = [
      'deepseek-v4-pro',
      'default-1.2',
      'minimax-m3',
      'glm-5.2',
      'kimi-k3-1',
      'glm-5.1',
      'claude-sonnet-5',
      'deepseek-r1-0528',
      'hunyuan-2.0-instruct'
    ].includes(id);

    const promotion = promotions.find(item => item.models?.includes(model.id));
    return {
      ...model,
      catalogId: `${this.sourceEdition}:${model.id}`,
      company,
      companyShort,
      vendorId,
      badgeClass,
      sourceIde,
      sourceIdeId,
      sourceIdeShort,
      sourceIdeBadge,
      targetIdes,
      traeOptimized,
      sourceEdition: this.sourceEdition,
      isFree: Boolean(promotion?.isFree),
      promotion: promotion ? {
        label: promotion.label,
        description: promotion.description,
        discount: promotion.discount,
        isFree: promotion.isFree
      } : null,
      displayName: `【${companyShort}】${model.name || model.id}`
    };
  }

  /**
   * Fetch available models catalog
   */
  async fetchModelsCatalog() {
    return new Promise((resolve) => {
      const targetUrl = new URL('/v1/models', this.workbuddyEndpoint);
      http.get(targetUrl, (res) => {
        let raw = '';
        res.on('data', chunk => raw += chunk);
        res.on('end', () => {
          try {
            const data = JSON.parse(raw);
            const rawList = data.data || [];
            const promotions = this.promotionProvider();
            const enriched = rawList.map(m => this.enrichModel(m, promotions));
            resolve(enriched);
          } catch (e) {
            resolve([]);
          }
        });
      }).on('error', () => resolve([]));
    });
  }

  /**
   * Generate Trae-ready custom model settings JSON
   */
  generateTraeConfig(localPort = 19999) {
    return {
      provider: "OpenAI Compatible",
      apiBaseUrl: `http://127.0.0.1:${localPort}/v1`,
      apiKey: process.env.WORKBUDDY_TRAE_KEY || "local-key",
      recommendedModels: [
        {
          id: "deepseek-v4-pro",
          name: "DeepSeek-V4-Pro (1M 上下文)",
          contextWindow: 1000000
        },
        {
          id: "minimax-m3",
          name: "MiniMax-M3 (512k 多模态与代码)",
          contextWindow: 512000
        },
        {
          id: "glm-5.2",
          name: "GLM-5.2 (1M 旗舰通用)",
          contextWindow: 1000000
        },
        {
          id: "kimi-k3-1",
          name: "Kimi-K3 (1M 超长文本)",
          contextWindow: 1000000
        },
        {
          id: "glm-5.1",
          name: "GLM-5.1 (200k 高速均衡)",
          contextWindow: 200000
        }
      ]
    };
  }

  /**
   * Run a quick test call on a model
   */
  async testModel(modelId, prompt = 'Say OK in one word.', options = {}) {
    const startTime = Date.now();
    let ttftMs = null;
    const timeout = options.timeout || 35000;

    const payload = JSON.stringify({
      model: modelId,
      messages: [{ role: 'user', content: prompt }],
      stream: Boolean(options.stream),
      max_tokens: options.max_tokens || 128,
      temperature: options.temperature !== undefined ? options.temperature : 0.5
    });

    return new Promise((resolve) => {
      let isSettled = false;
      const targetUrl = new URL('/v1/chat/completions', this.workbuddyEndpoint);
      const reqOpts = {
        method: 'POST',
        hostname: targetUrl.hostname,
        port: targetUrl.port,
        path: targetUrl.pathname,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const clientReq = http.request(reqOpts, (upstreamRes) => {
        let raw = '';
        let firstChunk = true;

        upstreamRes.on('data', (chunk) => {
          if (firstChunk) {
            ttftMs = Date.now() - startTime;
            firstChunk = false;
          }
          raw += chunk.toString();
        });

        upstreamRes.on('end', () => {
          clearTimeout(timer);
          if (isSettled) return;
          isSettled = true;
          const durationMs = Date.now() - startTime;

          if (upstreamRes.statusCode >= 200 && upstreamRes.statusCode < 300) {
            try {
              if (options.stream) {
                const lines = raw.split('\n');
                let fullContent = '';
                for (const line of lines) {
                  const trimmed = line.trim();
                  if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
                    try {
                      const parsed = JSON.parse(trimmed.slice(6));
                      const delta = parsed.choices?.[0]?.delta?.content || '';
                      fullContent += delta;
                    } catch (e) {}
                  }
                }
                resolve({
                  success: true,
                  model: modelId,
                  status: upstreamRes.statusCode,
                  durationMs,
                  ttftMs: ttftMs || durationMs,
                  preview: (fullContent || 'OK').trim().slice(0, 120),
                  content: fullContent,
                  rawResponse: fullContent
                });
              } else {
                const data = JSON.parse(raw);
                const content = data.choices?.[0]?.message?.content || '';
                resolve({
                  success: true,
                  model: modelId,
                  status: upstreamRes.statusCode,
                  durationMs,
                  ttftMs: ttftMs || durationMs,
                  preview: content.trim().slice(0, 120),
                  content,
                  usage: data.usage || null,
                  rawResponse: data
                });
              }
            } catch (err) {
              resolve({
                success: false,
                model: modelId,
                status: upstreamRes.statusCode,
                durationMs,
                error: `JSON Parse error: ${err.message}`,
                preview: raw.slice(0, 100)
              });
            }
          } else {
            let errMsg = `HTTP Status ${upstreamRes.statusCode}`;
            try {
              const errData = JSON.parse(raw);
              if (errData.error?.message) errMsg = errData.error.message;
            } catch (e) {}
            resolve({
              success: false,
              model: modelId,
              status: upstreamRes.statusCode,
              durationMs,
              error: errMsg,
              preview: ''
            });
          }
        });
      });

      const timer = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          try { clientReq.destroy(); } catch (e) {}
          resolve({
            success: false,
            model: modelId,
            status: 408,
            durationMs: Date.now() - startTime,
            ttftMs: null,
            error: 'Request Timeout (>35s)',
            preview: ''
          });
        }
      }, timeout);

      clientReq.on('error', (err) => {
        clearTimeout(timer);
        if (isSettled) return;
        isSettled = true;
        resolve({
          success: false,
          model: modelId,
          status: 502,
          durationMs: Date.now() - startTime,
          error: `Gateway Error: ${err.message}`,
          preview: ''
        });
      });

      clientReq.write(payload);
      clientReq.end();
    });
  }

  /**
   * Run batch tests on multiple models with controlled concurrency
   */
  async testBatch(models = [], prompt = 'Say OK in one word.', concurrency = 2) {
    const results = [];
    const queue = [...models];

    const worker = async () => {
      while (queue.length > 0) {
        const modelId = queue.shift();
        const res = await this.testModel(modelId, prompt, { timeout: 30000 });
        results.push(res);
      }
    };

    const workers = [];
    for (let i = 0; i < Math.min(concurrency, models.length); i++) {
      workers.push(worker());
    }
    await Promise.all(workers);

    const passed = results.filter(r => r.success).length;
    const failed = results.length - passed;
    const avgLatency = results.length > 0
      ? Math.round(results.reduce((acc, r) => acc + (r.durationMs || 0), 0) / results.length)
      : 0;

    return {
      summary: {
        total: results.length,
        passed,
        failed,
        passRate: results.length > 0 ? `${Math.round((passed / results.length) * 100)}%` : '0%',
        avgLatencyMs: avgLatency
      },
      results
    };
  }
}

module.exports = ProxyGateway;
