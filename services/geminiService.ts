import { GoogleGenAI } from "@google/genai";

export interface AiInsight {
  costEfficiency: string;
  participationTrends: string;
  recommendations: string;
}

export const analyzeCanteenData = async (
  metrics: string, 
  trendData: string
): Promise<AiInsight | null> => {
  // Initialize inside the function to avoid top-level crashes if env var is missing during build/init
  if (!process.env.API_KEY) {
    console.warn("API Key not configured.");
    return null;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    You are an expert Data Analyst for ACI Limited's Canteen Management System.
    Analyze the following canteen metrics and trend data.
    
    Current Metrics:
    ${metrics}

    Recent Trend Data (JSON):
    ${trendData}

    Please provide a structured analysis with 3 distinct sections:
    1. Cost Efficiency (Focus on Cost Per Head anomalies, identifying days with high spending).
    2. Participation Trends (Attendance patterns, peak days, low attendance days).
    3. Recommendations (Actionable steps for the Admin Manager to reduce waste, optimize stock, or improve operations).

    Return the response as a valid JSON object with the following keys:
    - "costEfficiency": A string containing concise bullet points (use • character).
    - "participationTrends": A string containing concise bullet points (use • character).
    - "recommendations": A string containing concise bullet points (use • character).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });
    
    const text = response.text;
    if (!text) return null;
    
    return JSON.parse(text) as AiInsight;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};