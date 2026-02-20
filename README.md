# Multilingual AI-Powered Blog Platform

A modern, full-stack blog platform featuring multilingual support, AI-powered content translation, real-time chat with AI assistants, and secure authentication.

## 🌟 Features

- ✍️ **Blog Management**: Create, edit, and manage blog posts
- 🌍 **Multilingual**: Support for 8+ languages with automatic translation
- 🤖 **AI Integration**: Powered by LangChain and xAI/Grok
- 🔐 **Security**: Authentication and authorization via Supabase
- 💬 **Chat Interface**: Real-time AI chatbot for content suggestions
- 🎨 **Modern UI**: Beautiful interface built with React and Tailwind CSS
- 📱 **Responsive Design**: Works seamlessly on all devices
- ⚡ **Performance**: Fast development with Vite, optimized production builds

## 📋 Prerequisites

Before getting started, ensure you have:

- **Node.js** v18+ and npm/pnpm installed
- **Supabase** account (free tier available)
- **Lingo.dev** API key for translation services
- **xAI** API key for AI/Grok features

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/patildhrup/Multilingual_AI-Powered_Blog_Platform
cd Multilingual_AI-Powered_Blog_Platform
```

### 2. Setup Backend

```bash
cd backend
npm install
```

Create `.env` file:
```env
PORT=3001
LINGO_API_KEY=your_key_here
XAI_API_KEY=your_key_here
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
```

Start the backend:
```bash
npm run dev
```

### 3. Setup Frontend

In a new terminal:

```bash
cd frontend
npm install
```

Create `.env.local` file:
```env
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
VITE_API_BASE_URL=http://localhost:3001
```

Start the frontend:
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📚 Documentation

- **[Frontend README](frontend/README.md)** - Detailed frontend setup, features, and API documentation
- **[Backend README](backend/README.md)** - Backend configuration, endpoints, and deployment

## 🏗️ Project Structure

```
Multilingual_AI-Powered_Blog_Platform/
├── frontend/                    # React + Vite frontend
│   ├── src/
│   │   ├── components/         # Reusable React components
│   │   ├── pages/              # Page components
│   │   ├── context/            # Auth and global state
│   │   ├── lib/                # Utilities and API clients
│   │   ├── locales/            # i18n translation files
│   │   └── lingo/              # Lingo dictionary for translations
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── README.md
│
├── backend/                     # Express.js API server
│   ├── server.js               # Main server file
│   ├── supabase/               # Database migrations
│   ├── package.json
│   └── README.md
│
└── README.md                    # This file
```

## 🛠️ Technology Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19 | UI Framework |
| Vite | 7.2+ | Build tool & dev server |
| Tailwind CSS | 3.4+ | Styling |
| React Router | 7.13+ | Client-side routing |
| Supabase JS | 2.93+ | Authentication & DB |
| Axios | 1.13+ | HTTP client |
| Framer Motion | 12+ | Animations |
| LangChain | Latest | AI integration |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 18+ | Runtime |
| Express | 4.18+ | Web framework |
| Lingo.dev | 0.124+ | Translation service |
| LangChain | 0.3+ | AI chains |
| xAI/Grok | Integration | LLM provider |
| Supabase | SDK | Database & Auth |
| Nodemon | 3.0+ | Development reloading |

## 🌐 Supported Languages

- 🇬🇧 English
- 🇪🇸 Spanish
- 🇫🇷 French
- 🇩🇪 German
- 🇮🇳 Hindi
- 🇯🇵 Japanese
- 🇨🇳 Chinese
- 🇸🇦 Arabic


## 🔌 Environment Configuration

### Backend (.env)
```env
# Server
PORT=3001

# Translation
LINGO_API_KEY=<your_lingo_key>

# AI
XAI_API_KEY=<your_xai_key>

# Database
SUPABASE_URL=<your_supabase_url>
SUPABASE_ANON_KEY=<your_supabase_key>
```

### Frontend (.env.local)
```env
# Supabase
VITE_SUPABASE_URL=<your_supabase_url>
VITE_SUPABASE_ANON_KEY=<your_supabase_key>

# Backend API
VITE_API_BASE_URL=http://localhost:3001
```

## 🗄️ Database Setup

1. Create a Supabase project
2. Run migration files from `backend/supabase/`:
   - `supabase_setup.sql` - Initial schema
   - `add-metadata-column.sql` - Additional columns

3. Save your credentials:
   - Project URL → `SUPABASE_URL`
   - Anon Key → `SUPABASE_ANON_KEY`

## 📦 Installation & Development

### Using npm
```bash
# Backend
cd backend && npm install && npm run dev

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

### Using pnpm
```bash
# Backend
cd backend && pnpm install && pnpm dev

# Frontend (new terminal)
cd frontend && pnpm install && pnpm dev
```

## 🧪 Development Commands

### Frontend
```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

### Backend
```bash
npm run dev      # Start with Nodemon (auto-reload)
npm start        # Start production server
```

## 🚀 Deployment

### Frontend
Build and deploy to any static hosting:
```bash
cd frontend
npm run build
# Deploy dist/ folder to Vercel, Netlify, GitHub Pages, etc.
```

### Backend
Deploy to Node.js hosting (Heroku, Railway, Replit, etc.):
```bash
cd backend
npm install
npm start
```

Update `VITE_API_BASE_URL` in frontend to match your deployed backend URL.





- [Supabase Documentation](https://supabase.com/docs)
- [Lingo.dev Documentation](https://lingo.dev)
- [LangChain Documentation](https://js.langchain.com)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vite.dev)

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request



This project is licensed under the MIT License - see the LICENSE file for details.

## 💬 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review service-specific docs (Supabase, Lingo.dev, etc.)

---

Made with ❤️ for the multilingual community

**Get started now!** 🚀 Follow the [Quick Start](#-quick-start) guide above.
