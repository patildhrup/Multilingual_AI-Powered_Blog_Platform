# Multilingual AI-Powered Blog Platform

A full-stack blog platform with support for multiple languages, AI-powered features, and real-time content translation using modern web technologies.

## Features

- 📝 Create and manage blog posts
- 🌍 Multilingual support (English, Spanish, French, German, Hindi, Japanese, Chinese, Arabic)
- 🤖 AI-powered chat interface
- 🔐 Secure authentication with Supabase
- 🎨 Beautiful UI with Tailwind CSS and animations
- 📱 Responsive design
- 🚀 Real-time translation API

## Tech Stack

### Frontend
- **Framework**: React 19 with Vite
- **Styling**: Tailwind CSS with Typography plugin
- **Routing**: React Router v7
- **Authentication**: Supabase
- **HTTP Client**: Axios
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Language**: JavaScript (ESM)

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Translation**: Lingo.dev SDK
- **AI**: LangChain with xAI/Grok
- **Authentication**: Supabase
- **CORS**: Enabled for frontend integration

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** or **pnpm** (v10 or higher recommended)
- A **Supabase** account (for authentication and database)
- **Lingo.dev API Key** (for translation services)
- **xAI API Key** (for Grok AI features)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/patildhrup/Multilingual_AI-Powered_Blog_Platform
cd Multilingual_AI-Powered_Blog_Platform
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

#### Install Dependencies

```bash
npm install
# or
pnpm install
```


Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env  # if available, or create manually
```

Add the following variables to `.env`:

```env
# Server Configuration
PORT=3001

# Translation Service (Lingo.dev)
LINGO_API_KEY=your_lingo_api_key_here

# AI Service (xAI/Grok)
XAI_API_KEY=your_xai_api_key_here

# Database (if needed for backend features)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Run the Backend

**Development Mode** (with auto-reload using Nodemon):

```bash
npm run dev
```

The backend server will start on `http://localhost:3001`

**Production Mode**:

```bash
npm start
```

### 3. Frontend Setup

Navigate to the frontend directory:

```bash
cd ../frontend
```

#### Install Dependencies

```bash
npm install
# or
pnpm install
```


Create a `.env.local` file in the `frontend` directory:

```bash
cp .env.example .env.local  # if available, or create manually
```

Add the following variables to `.env.local`:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend API
VITE_API_BASE_URL=http://localhost:3001
```

#### Run the Frontend

**Development Mode**:

```bash
npm run dev
```

The frontend will typically start on `http://localhost:5173` (Vite default)




## Supabase Setup

### 1. Create a Supabase Project

- Go to [supabase.com](https://supabase.com)
- Create a new project and note your **Project URL** and **Anon Key**



Run the migration files provided in `backend/supabase/`:

- `supabase_setup.sql` - Initial database schema
- `add-metadata-column.sql` - Additional metadata columns

Execute these in your Supabase SQL Editor.


- Enable **Email/Password** authentication in Supabase Auth settings
- (Optional) Enable **Google OAuth** or other providers as needed

## Project Structure

```
.
├── frontend/                 # React + Vite frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── context/         # React context (auth, theme, etc.)
│   │   ├── lib/             # Utility functions and API clients
│   │   ├── locales/         # i18n language files
│   │   ├── lingo/           # Lingo dictionary
│   │   └── App.jsx          # Main App component
│   ├── public/              # Static assets
│   ├── package.json         # Node dependencies
│   ├── vite.config.js       # Vite configuration
│   └── tailwind.config.js   # Tailwind CSS config
│
└── backend/                 # Express.js backend server
    ├── server.js            # Main server file
    ├── supabase/            # Database migrations
    └── package.json         # Node dependencies
```

{
  "translatedContent": "¡Hola, mundo!"
}
```

## Development Workflow

### Running Both Frontend and Backend

Open two terminal windows:

**Terminal 1 - Backend**:
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```

Then open your browser to `http://localhost:5173` (or the port shown by Vite).

## Supported Languages

The platform supports the following languages:
- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Hindi (hi)
- Japanese (ja)
- Chinese (zh)
- Arabic (ar)

## Environment Variables Summary

### Frontend (.env.local)
```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=http://localhost:3001
```

### Backend (.env)
```env
PORT=3001
LINGO_API_KEY=
XAI_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
```
