import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { LingoDotDevEngine } from 'lingo.dev/sdk';
import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { generateBlogContent, improveContent } from './services/aiWriter.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Lingo SDK
const apiKey = process.env.LINGO_API_KEY || process.env.LINGODOTDEV_API_KEY;

// Initialize OpenRouter
const openRouterApiKey = process.env.OPENROUTE_API_KEY;

if (!apiKey) {
    console.error('⚠️  L INGO_API_KEY not found in .env file');
}

// Translation endpoint
app.post('/api/translate', async (req, res) => {
    try {
        const { content, sourceLang, targetLang } = req.body;

        // Validation
        if (!content || !sourceLang || !targetLang) {
            return res.status(400).json({
                error: 'Missing required parameters: content, sourceLang, targetLang'
            });
        }

        if (!apiKey) {
            return res.status(500).json({
                error: 'Translation service not configured'
            });
        }

        // Skip translation if source === target
        if (sourceLang === targetLang) {
            return res.json({ translatedContent: content });
        }

        // Initialize engine for this request
        const engine = new LingoDotDevEngine({ apiKey });

        // Handle string vs object content
        const isString = typeof content === 'string';
        const sourceObj = isString ? { text: content } : content;

        // Translate using Lingo SDK
        const translatedObj = await engine.localizeObject(sourceObj, {
            sourceLocale: sourceLang,
            targetLocale: targetLang,
        });

        const translatedContent = isString ? translatedObj.text : translatedObj;

        res.json({ translatedContent });

    } catch (error) {
        console.error('Translation error:', error);
        res.status(500).json({
            error: 'Translation failed',
            message: error.message
        });
    }
});

// Chat endpoint using LangChain + Grok
app.post('/api/chat', async (req, res) => {
    try {
        const { message, locale, history } = req.body;

        if (!openRouterApiKey) {
            return res.status(500).json({ error: 'Chat service not configured. Set OPENROUTE_API_KEY in .env' });
        }

        const model = new ChatOpenAI({
            apiKey: openRouterApiKey,
            model: 'google/gemini-2.0-flash-001',
            configuration: {
                baseURL: 'https://openrouter.ai/api/v1',
                defaultHeaders: {
                    'HTTP-Referer': 'http://localhost:3000', // Optional, for OpenRouter rankings
                    'X-Title': 'Blogy AI Assistant', // Optional, for OpenRouter rankings
                }
            },
            temperature: 0.7,
        });

        const langName = {
            en: 'English', hi: 'Hindi', ar: 'Arabic',
            fr: 'French', de: 'German', zh: 'Chinese'
        }[locale] || 'English';

        const messages = [
            new SystemMessage(`You are a helpful AI writing assistant for a multilingual blog platform called Blogy. Respond in ${langName}. Keep responses concise.`),
            ...(history || []).map(m =>
                m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
            ),
            new HumanMessage(message)
        ];

        const response = await model.invoke(messages);
        res.json({ response: response.content });

    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({
            error: 'Chat failed',
            message: error.message,
            stack: error.stack
        });
    }
});

app.post('/api/generate-blog', async (req, res) => {
    try {
        const { topic, locale } = req.body;
        console.log('Blog generation request:', { topic, locale });

        if (!openRouterApiKey) {
            return res.status(500).json({ error: 'AI Writing Assistant not configured. Set OPENROUTE_API_KEY in .env' });
        }

        const langName = {
            en: 'English', hi: 'Hindi', ar: 'Arabic',
            fr: 'French', de: 'German', zh: 'Chinese'
        }[locale] || 'English';

        const result = await generateBlogContent(topic, langName);
        res.json(result);

    } catch (error) {
        console.error('AI Generation error:', error);
        res.status(500).json({
            error: 'AI Generation failed',
            message: error.message
        });
    }
});

app.post('/api/improve-writing', async (req, res) => {
    try {
        const { content, locale } = req.body;
        console.log('Writing improvement request:', { locale });

        if (!openRouterApiKey) {
            return res.status(500).json({ error: 'AI Writing Assistant not configured. Set OPENROUTE_API_KEY in .env' });
        }

        const langName = {
            en: 'English', hi: 'Hindi', ar: 'Arabic',
            fr: 'French', de: 'German', zh: 'Chinese'
        }[locale] || 'English';

        const result = await improveContent(content, langName);
        res.json({ improvedContent: result });

    } catch (error) {
        console.error('AI Improvement error:', error);
        res.status(500).json({
            error: 'AI Improvement failed',
            message: error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Translation Backend',
        apiKeyConfigured: !!apiKey,
        chatConfigured: !!openRouterApiKey
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Translation backend running on http://localhost:${PORT}`);
    console.log(`✅ API Key configured: ${apiKey ? 'Yes' : 'No'}`);
});
