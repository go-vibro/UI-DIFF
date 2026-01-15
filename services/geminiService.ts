
import { GoogleGenAI, Type } from "@google/genai";
import { AuditReport } from "../types";

export const performUIAudit = async (
  designBase64: string, 
  implementationBase64: string,
  realPerfData?: any // 新增：真实的性能数据
): Promise<AuditReport> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-pro-preview';

  // 将真实数据嵌入 Prompt
  const perfContext = realPerfData 
    ? `【真实性能监测数据】：Lighthouse 得分 ${realPerfData.score}, FCP: ${realPerfData.metrics.fcp}, LCP: ${realPerfData.metrics.lcp}, CLS: ${realPerfData.metrics.cls}。`
    : "尚未获取到真实性能指标，请根据视觉结构进行预估。";

  const prompt = `
    你是一位世界级的 UI 还原度专家和性能调优专家。
    对比“设计稿”（图1）与“前端实现截图”（图2）。
    
    ${perfContext}
    
    任务：
    1. 视觉对比：检测布局偏移、字体偏差、颜色值不一致。
    2. 性能解读：结合提供的真实监测数据和图2的 DOM 复杂度，给出深度技术建议。
    
    输出要求：
    - 使用中文。
    - completionScore: 视觉还原评分。
    - performanceScore: 如果有真实数据，请参考 ${realPerfData?.score || 'AI预估'} 进行评分。
    - performanceSuggestions: 至少3条深度技术建议。
    - 其他字段按 Schema 返回。
  `;

  const response = await ai.models.generateContent({
    model: model,
    contents: {
      parts: [
        { text: prompt },
        { inlineData: { mimeType: 'image/png', data: designBase64.split(',')[1] } },
        { inlineData: { mimeType: 'image/png', data: implementationBase64.split(',')[1] } },
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          completionScore: { type: Type.NUMBER },
          performanceScore: { type: Type.NUMBER },
          performanceSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
          rating: { type: Type.STRING },
          summary: { type: Type.STRING },
          metrics: {
            type: Type.OBJECT,
            properties: {
              layoutAccuracy: { type: Type.NUMBER },
              visualFidelity: { type: Type.NUMBER },
              contentConsistency: { type: Type.NUMBER }
            },
            required: ["layoutAccuracy", "visualFidelity", "contentConsistency"]
          },
          issues: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                severity: { type: Type.STRING },
                description: { type: Type.STRING },
                suggestion: { type: Type.STRING },
                impactScore: { type: Type.NUMBER },
                location: {
                  type: Type.OBJECT,
                  properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } }
                }
              }
            }
          }
        },
        required: ["completionScore", "performanceScore", "performanceSuggestions", "rating", "summary", "metrics", "issues"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("AI 走查失败。");
  
  try {
    const data = JSON.parse(text.trim());
    return {
      ...data,
      totalIssues: (data.issues ?? []).length
    } as AuditReport;
  } catch (e) {
    throw new Error("解析 AI 数据失败。");
  }
};
