/**
 * VisionAudit Pro Backend Server
 * Engine: Playwright (Chromium)
 */
const express = require('express');
const { chromium } = require('playwright');
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cors());

function parseFigmaUrl(url) {
  try {
    const fileKeyMatch = url.match(/design\/([^\/]+)/) || url.match(/file\/([^\/]+)/);
    const nodeIdMatch = url.match(/node-id=([^\&]+)/);
    if (!fileKeyMatch) return null;
    return {
      fileKey: fileKeyMatch[1],
      nodeId: nodeIdMatch ? nodeIdMatch[1].replace('-', ':') : null
    };
  } catch (e) { return null; }
}

// 1. Figma 导出接口
app.post('/api/figma', async (req, res) => {
  const { figmaUrl, figmaToken } = req.body;
  try {
    const parsed = parseFigmaUrl(figmaUrl);
    if (!parsed || !parsed.nodeId) throw new Error("无效的 Figma 链接，请确保选中了具体的 Frame。");

    const figmaRes = await axios.get(`https://api.figma.com/v1/images/${parsed.fileKey}?ids=${parsed.nodeId}&format=png&scale=2`, {
      headers: { 'X-Figma-Token': figmaToken }
    });

    const imageUrl = figmaRes.data.images[parsed.nodeId];
    if (!imageUrl) throw new Error("Figma 导出失败，无法获取该节点的图像。");

    const imgBuffer = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const base64 = `data:image/png;base64,${Buffer.from(imgBuffer.data).toString('base64')}`;
    res.json({ image: base64 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Playwright 网页高清截图接口
app.post('/api/preview-screenshot', async (req, res) => {
  const { url } = req.body;
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 }
    });
    const page = await context.newPage();
    
    // 等待网络空闲，确保 SPA 渲染完成
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    
    // 给动画一点缓冲时间
    await page.waitForTimeout(1000);
    
    // 截取全屏图以应对长滚动页面
    const buffer = await page.screenshot({ fullPage: true });
    const base64 = `data:image/png;base64,${buffer.toString('base64')}`;
    res.json({ image: base64 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    if (browser) await browser.close();
  }
});

// 3. Lighthouse 性能审计接口
app.post('/api/preview-performance', async (req, res) => {
  const { url } = req.body;
  let chrome;
  try {
    chrome = await chromeLauncher.launch({ chromeFlags: ['--headless', '--no-sandbox'] });
    const options = { 
      output: 'json', 
      onlyCategories: ['performance'], 
      port: chrome.port 
    };
    
    const runnerResult = await lighthouse(url, options);
    const reportJson = JSON.parse(runnerResult.report);
    const audits = reportJson.audits;
    
    res.json({
      score: Math.round(reportJson.categories.performance.score * 100),
      metrics: {
        fcp: audits['first-contentful-paint'].displayValue,
        lcp: audits['largest-contentful-paint'].displayValue,
        cls: audits['cumulative-layout-shift'].displayValue,
        tbt: audits['total-blocking-time'].displayValue,
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    if (chrome) await chrome.kill();
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`VisionAudit Pro Backend running on http://localhost:${PORT}`));