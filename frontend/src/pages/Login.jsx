import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLingo, useLingoLocale, setLingoLocale } from "lingo.dev/react/client";
import { LANGUAGES } from '../lingo/dictionary';
import { Mail, Lock, Loader2, Github, BookOpen, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import LanguageSelector from '../components/LanguageSelector';

export default function Login() {
    const navigate = useNavigate();
    const { user, signIn, signInWithGoogle, signInWithGithub } = useAuth();
    const { dictionary } = useLingo();
    const locale = useLingoLocale();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const t = (key) => dictionary?.[key] || key;

    useEffect(() => {
        if (user) navigate('/dashboard');
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { error } = await signIn(email, password);
            if (error) throw error;
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOAuth = async (provider) => {
        setLoading(true);
        setError(null);
        try {
            const { error } = provider === 'google'
                ? await signInWithGoogle()
                : await signInWithGithub();
            if (error) throw error;
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FAFAF9] text-black font-sans flex flex-col">
            <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                            <BookOpen className="text-white" size={22} />
                        </div>
                        <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Blogy</h1>
                    </Link>
                    <LanguageSelector
                        currentLocale={locale}
                        className="w-40"
                    />
                </div>
            </nav>

            <div className="flex-1 flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    <Link to="/" className="inline-flex items-center gap-2 text-black/40 hover:text-black mb-8 transition-colors font-bold uppercase tracking-widest text-xs">
                        <ArrowLeft size={18} />
                        <span>{t("editor.back")}</span>
                    </Link>

                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200/50">
                        <h2 className="text-3xl font-black mb-2 text-black">{t("nav.login")}</h2>
                        <p className="text-black/50 mb-8 font-medium">Sign in to access your dashboard.</p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-black/40 ml-1 uppercase tracking-widest">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20" size={20} />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-medium text-black placeholder-black/20"
                                        placeholder="name@example.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-black/40 ml-1 uppercase tracking-widest">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20" size={20} />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-medium text-black placeholder-black/20"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            {error && (
                                <p className="text-red-400 text-sm font-medium bg-red-400/10 p-3 rounded-xl border border-red-400/20">{error}</p>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/30 uppercase tracking-widest text-sm"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : t("nav.login")}
                            </button>
                        </form>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-100"></div>
                            </div>
                            <div className="relative flex justify-center text-[10px] font-black tracking-widest">
                                <span className="px-4 bg-white text-black/20">OR</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => handleOAuth('google')}
                                disabled={loading}
                                className="w-full bg-white hover:bg-slate-50 text-black font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 border border-slate-200 disabled:opacity-50 shadow-sm uppercase tracking-widest text-xs"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continue with Google
                            </button>
                            <button
                                onClick={() => handleOAuth('github')}
                                disabled={loading}
                                className="w-full bg-black hover:bg-black/90 text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 border border-black disabled:opacity-50 shadow-xl shadow-black/10 uppercase tracking-widest text-xs"
                            >
                                <Github size={20} />
                                Continue with GitHub
                            </button>
                        </div>

                        <div className="mt-8 text-center text-black/40">
                            <p className="text-sm font-medium">
                                Don't have an account?{' '}
                                <Link to="/signup" className="text-indigo-600 font-black hover:underline uppercase tracking-widest text-xs">
                                    {t("nav.signup")}
                                </Link>
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
