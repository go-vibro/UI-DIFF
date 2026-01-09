import { GoogleGenAI, Type } from "@google/genai";
import { AuditReport } from "../types";

export const performUIAudit = async (designBase64: string, implementationBase64: string): Promise<AuditReport> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-pro-preview';

  const prompt = `
    你是一位世界级的 UI/UX 设计评审专家。请对比“设计稿”（图1）与“前端实现截图”（图2）。
    
    任务：
    1. 进行像素级的对齐检查（布局、对齐方式）。
    2. 审查字体系统（粗细、大小、行高、颜色）。
    3. 检查色彩还原度（色值、对比度）。
    4. 检查间距系统（Margin, Padding, 栅格）。
    
    输出要求：
    - 必须使用【中文】返回结果。
    - completionScore: 综合完成度评分 (0-100)。
    - rating: 综合评级 (如 A+, B, C- 等)。
    - metrics: 布局准确度、视觉保真度、内容一致性的分值 (0-100)。
    - summary: 2句以内的简要总结。
    - issues: 发现的差异列表。
      - category: 类别 (布局/字体/颜色/间距/内容)。
      - severity: 严重程度 (致命/严重/次要/优化)。
      - description: 具体的差异描述。
      - suggestion: 具体的修复建议。
      - impactScore: 影响分 (1-10)。
      - location: 该差异在图2（实现图）中的大致中心位置坐标，使用百分比表示 {x: 0-100, y: 0-100}。
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
                  properties: {
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER }
                  }
                }
              }
            }
          }
        },
        required: ["completionScore", "rating", "summary", "metrics", "issues"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("AI 走查失败，请重试。");
  
  try {
    const data = JSON.parse(text.trim());
    return {
      completionScore: data.completionScore ?? 0,
      rating: data.rating ?? 'N/A',
      summary: data.summary ?? '未能生成总结',
      metrics: {
        layoutAccuracy: data.metrics?.layoutAccuracy ?? 0,
        visualFidelity: data.metrics?.visualFidelity ?? 0,
        contentConsistency: data.metrics?.contentConsistency ?? 0,
      },
      issues: data.issues ?? [],
      totalIssues: (data.issues ?? []).length
    } as AuditReport;
  } catch (e) {
    console.error("Failed to parse AI response", e);
    throw new Error("解析 AI 返回数据失败。");
  }
};