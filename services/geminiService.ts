import { GoogleGenAI } from "@google/genai";

export const analyzeCanteenData = async (
  metrics: string, 
  trendData: string
): Promise<string> => {
  // Initialize inside the function to avoid top-level crashes if env var is missing during build/init
  if (!process.env.API_KEY) {
    console.warn("API Key not configured.");
    return "API Key not configured. Unable to generate AI insights.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    You are an expert Data Analyst for ACI Limited's Canteen Management System.
    Analyze the following canteen metrics and trend data.
    
    Current Metrics:
    ${metrics}

    Recent Trend Data (JSON):
    ${trendData}

    Please provide a concise Executive Summary (max 150 words) focusing on:
    1. Cost efficiency (Cost Per Head anomalies).
    2. Participation trends.
    3. Actionable recommendations for the Admin Manager to reduce waste or improve operations.
    
    Format the output as a clean text paragraph.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No insights generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to analyze data at this time. Please try again later.";
  }
};