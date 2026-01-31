import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { LingoDotDevEngine } from 'lingo.dev/sdk';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Lingo SDK
const apiKey = process.env.LINGO_API_KEY || process.env.LINGODOTDEV_API_KEY;

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

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Translation Backend',
        apiKeyConfigured: !!apiKey
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Translation backend running on http://localhost:${PORT}`);
    console.log(`✅ API Key configured: ${apiKey ? 'Yes' : 'No'}`);
});
