
const express = require('express');
const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cors());

/**
 * Parses Figma URL to extract file key and node ID
 * Example: https://www.figma.com/design/ABC123/title?node-id=101-2
 */
function parseFigmaUrl(url) {
  try {
    const fileKeyMatch = url.match(/design\/([^\/]+)/) || url.match(/file\/([^\/]+)/);
    const nodeIdMatch = url.match(/node-id=([^\&]+)/);
    
    if (!fileKeyMatch) return null;
    
    return {
      fileKey: fileKeyMatch[1],
      nodeId: nodeIdMatch ? nodeIdMatch[1].replace('-', ':') : null
    };
  } catch (e) {
    return null;
  }
}

/**
 * Capture screenshot of a preview URL using Puppeteer
 */
async function capturePreview(url) {
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    // Inject a small delay for animations to settle
    await new Promise(r => setTimeout(r, 1000));
    
    const base64 = await page.screenshot({ 
      encoding: 'base64', 
      fullPage: true 
    });
    return `data:image/png;base64,${base64}`;
  } finally {
    await browser.close();
  }
}

/**
 * Run Lighthouse audit for performance metrics
 */
async function runLighthouse(url) {
  let chrome;
  try {
    chrome = await chromeLauncher.launch({ chromeFlags: ['--headless', '--no-sandbox'] });
    const options = { 
      logLevel: 'info', 
      output: 'json', 
      onlyCategories: ['performance'], 
      port: chrome.port 
    };
    
    const runnerResult = await lighthouse(url, options);
    const reportJson = JSON.parse(runnerResult.report);
    const audits = reportJson.audits;
    
    return {
      score: Math.round(reportJson.categories.performance.score * 100),
      metrics: {
        fcp: audits['first-contentful-paint'].displayValue,
        lcp: audits['largest-contentful-paint'].displayValue,
        cls: audits['cumulative-layout-shift'].displayValue,
        tbt: audits['total-blocking-time'].displayValue,
      }
    };
  } finally {
    if (chrome) await chrome.kill();
  }
}

/**
 * Main API endpoint for setup
 */
app.post('/api/audit-setup', async (req, res) => {
  const { figmaUrl, previewUrl, figmaToken } = req.body;
  const results = {
    designImg: null,
    implImg: null,
    perfData: null
  };

  try {
    // 1. Process Figma
    if (figmaUrl && figmaToken) {
      const parsed = parseFigmaUrl(figmaUrl);
      if (!parsed || !parsed.nodeId) {
        throw new Error("无效的 Figma 链接。请确保链接包含具体的节点 ID (选中某个 Frame 后复制链接)。");
      }

      const figmaApiUrl = `https://api.figma.com/v1/images/${parsed.fileKey}?ids=${parsed.nodeId}&format=png&scale=2`;
      const figmaRes = await axios.get(figmaApiUrl, {
        headers: { 'X-Figma-Token': figmaToken }
      });

      const imageUrl = figmaRes.data.images[parsed.nodeId];
      if (!imageUrl) throw new Error("无法从 Figma 导出该节点。");

      const imgBuffer = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      results.designImg = `data:image/png;base64,${Buffer.from(imgBuffer.data).toString('base64')}`;
    }

    // 2. Process Preview URL
    if (previewUrl) {
      // Run capture and lighthouse in parallel for speed
      const [screenshot, performance] = await Promise.allSettled([
        capturePreview(previewUrl),
        runLighthouse(previewUrl)
      ]);

      if (screenshot.status === 'fulfilled') {
        results.implImg = screenshot.value;
      }
      if (performance.status === 'fulfilled') {
        results.perfData = performance.value;
      }
    }

    res.json(results);
  } catch (error) {
    console.error("Audit Setup Error:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`VisionAudit Backend is running on http://localhost:${PORT}`);
});
