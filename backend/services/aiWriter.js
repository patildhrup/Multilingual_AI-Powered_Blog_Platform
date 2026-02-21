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

export async function summarizeDocument(fileUrl, fileName, language = "English", extractedContent = null) {
  const prompt = `
  You are an expert content analyst for a multilingual blog platform. 
  Your task is to analyze and summarize the attached content in ${language}.
  
  CONTEXT:
  - File Name: ${fileName || 'Unknown'}
  - Source: ${fileUrl || 'Direct Upload'}

  EXTRACTED CONTENT/METADATA:
  ---
  ${extractedContent || 'No direct content could be extracted. Please try to infer from the file name and source.'}
  ---

  SUMMARY INSTRUCTIONS:
  1. Provide a concise, high-quality summary (max 200 words) in ${language}.
  2. If it's a PDF/Word doc, summarize the core message and key points.
  3. If it's a YouTube video, summarize the video based on its title and description.
  4. If it's a Link, summarize the website's purpose and key info.
  5. If it's an Image, explain the image details (format, size) and infer context from the filename.
  6. Maintain a helpful, professional AI assistant tone.

  Return ONLY the summary text. No conversational filler like "Here is the summary".
  `;

  const response = await model.invoke(prompt);
  return response.content;
}

export async function summarizeComments(comments, language = "English") {
  const commentTexts = comments.map(c => c.comment_text).join('\n');
  const prompt = `
  You are an expert community manager. Summarize the following reader feedback from a blog post in ${language}.
  Focus on the overall sentiment, common themes, and any specific suggestions or questions mentioned by readers.
  Keep the summary concise and professional (max 100 words).
  Return ONLY the summary, no preamble.

  Comments:
  ${commentTexts}
  `;

  const response = await model.invoke(prompt);
  return response.content;
}