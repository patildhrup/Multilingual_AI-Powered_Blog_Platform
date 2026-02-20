import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
    apiKey: process.env.OPENROUTE_API_KEY,
    model: "google/gemini-2.0-flash-001",  // or any OpenRouter model
    temperature: 0.7,
    configuration: {
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "Multilingual AI Blog Platform"
        }
    }
});

export async function generateBlogContent(topic, language = "English") {
    const prompt = `
  You are an expert SEO blog assistant.

  Topic: "${topic}"
  Language: ${language}

  Generate:
  1. SEO Optimized Title
  2. SEO Meta Description (150-160 characters)
  3. 8 Trending Hashtags
  4. 120-word Summary

  Return strictly in JSON format:
  {
    "title": "",
    "description": "",
    "hashtags": [],
    "summary": ""
  }
  `;

    const response = await model.invoke(prompt);
    console.log('AI Raw Response:', response.content);

    try {
        return JSON.parse(response.content);
    } catch (e) {
        // If it's wrapped in markdown, try to strip it
        const cleaned = response.content.replace(/```json|```/g, '').trim();
        return JSON.parse(cleaned);
    }
}

export async function improveContent(content, language = "English") {
    const prompt = `
  You are an expert editor. Improve the following text for clarity, grammar, and engagement while maintaining its original meaning.
  Respond in ${language}.
  Return ONLY the improved text, no preamble or extra commentary.

  Text: "${content}"
  `;

    const response = await model.invoke(prompt);
    return response.content;
}