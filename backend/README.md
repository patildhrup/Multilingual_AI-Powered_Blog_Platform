# Backend - Multilingual AI-Powered Blog Platform

Express.js backend server providing translation, AI integration, and blog APIs for the multilingual blog platform.

## 🚀 Quick Start

### Install Dependencies

```bash
npm install
```

### Setup Environment Variables

Create a `.env` file:

```env
PORT=3001
LINGO_API_KEY=your_lingo_api_key
XAI_API_KEY=your_xai_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Start Development Server

```bash
npm run dev
```

Server runs on `http://localhost:3001`

## 📦 Dependencies

### Core Dependencies
- **express** - Web framework
- **cors** - Cross-Origin Resource Sharing middleware
- **dotenv** - Environment variable management

### AI & Translation
- **lingo.dev** - Translation service SDK
- **langchain** - AI framework
- **@langchain/core** - Core LangChain utilities
- **@langchain/xai** - xAI/Grok integration

### Development
- **nodemon** - Auto-reload on file changes

## 📋 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 3001) | No |
| `LINGO_API_KEY` | Lingo.dev API key for translations | Yes* |
| `XAI_API_KEY` | xAI/Grok API key for AI features | Yes* |
| `SUPABASE_URL` | Supabase project URL | Optional |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Optional |

*Required if using translation or AI features


### Translation Service

#### POST `/api/translate`

Translate content between languages.

**Request:**
```json
{
  "content": "Hello, world!",
  "sourceLang": "en",
  "targetLang": "es"
}
```

**Response (Success):**
```json
{
  "translatedContent": "¡Hola, mundo!"
}
```

**Response (Error):**
```json
{
  "error": "Missing required parameters: content, sourceLang, targetLang"
}
```

**Status Codes:**
- `200` - Translation successful
- `400` - Missing or invalid parameters
- `500` - Server error or service unavailable

**Notes:**
- Returns original content if source language equals target language
- Requires `LINGO_API_KEY` to be configured

## 📁 Project Structure

```
backend/
├── server.js                # Main Express application
├── package.json            # Node dependencies and scripts
├── .env                    # Environment variables (not in git)
├── .env.example           # Example environment file
├── README.md              # This file
└── supabase/              # Database migrations
    ├── supabase_setup.sql      # Initial schema
    └── add-metadata-column.sql # Additional migrations
```

## 🐍 Available Scripts

### Development
```bash
npm run dev
```
Starts server with Nodemon for auto-reload on file changes.

### Production
```bash
npm start
```
Starts server normally (no auto-reload).

## 🗄️ Database Setup

The backend uses Supabase for data persistence. Run migrations:

1. **Initial Setup** (`supabase_setup.sql`)
   - Creates base tables and schema
   - Sets up authentication

2. **Additional Columns** (`add-metadata-column.sql`)
   - Adds metadata support
   - Extends existing tables

Execute these in Supabase SQL Editor.

## 🔒 Middleware

- **CORS**: Enabled for all origins (configure in production)
- **JSON Parser**: Parses incoming JSON requests
- **Environment Variables**: Loaded from `.env`

## 📚 Services

### Translation Service (Lingo.dev)

The backend integrates with Lingo.dev for content translation:

```javascript
const engine = new LingoDotDevEngine({ apiKey });
const translation = await engine.translateContent(content, sourceLang, targetLang);
```

**Initialization:** Happens per request for optimal reliability

### AI Service (LangChain + xAI)

LangChain provides an interface to xAI's Grok model:

```javascript
import { ChatXAI } from '@langchain/xai';

const model = new ChatXAI({
  apiKey: process.env.XAI_API_KEY
});
```




1. Import from GitHub
2. Set secrets (environment variables)
3. Run with `npm start`

### Environment Variables in Production

Set these on your hosting platform:
- `LINGO_API_KEY`
- `XAI_API_KEY`
- `SUPABASE_URL` (if using Supabase)
- `SUPABASE_ANON_KEY`
- `NODE_ENV=production`


