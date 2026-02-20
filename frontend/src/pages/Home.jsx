import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useLingo, useLingoLocale, setLingoLocale } from "lingo.dev/react/client";
import { LANGUAGES } from '../lingo/dictionary';
import { Globe, PenTool, Sparkles, MessageSquare, Languages, ArrowRight, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function Home() {
    const navigate = useNavigate();
    const { dictionary } = useLingo();
    const locale = useLingoLocale();
    const { user } = useAuth();
    const [langOpen, setLangOpen] = useState(false);
    const langRef = useRef(null);

    const t = (key) => dictionary?.[key] || key;

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleGetStarted = () => {
        if (user) {
            navigate('/dashboard');
        } else {
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-[#f8fafc] font-sans">
            <nav className="sticky top-0 z-50 bg-[#0f172a]/80 backdrop-blur-xl border-b border-[#1e293b]">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                            <BookOpen className="text-white" size={22} />
                        </div>
                        <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            Blogy
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative" ref={langRef}>
                            <button
                                onClick={() => setLangOpen(!langOpen)}
                                className="flex items-center gap-2 bg-[#1e293b] hover:bg-[#334155] border border-[#334155] rounded-xl px-4 py-2 text-sm font-medium transition-all"
                            >
                                <Globe size={16} className="text-indigo-400" />
                                {LANGUAGES.find(l => l.code === locale)?.nativeName || 'English'}
                            </button>
                            {langOpen && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-[#1e293b] border border-[#334155] rounded-xl shadow-2xl overflow-hidden z-50">
                                    {LANGUAGES.map(lang => (
                                        <button
                                            key={lang.code}
                                            onClick={() => { setLingoLocale(lang.code); setLangOpen(false); }}
                                            className={`w-full text-left px-4 py-3 text-sm font-medium hover:bg-[#334155] transition-colors flex items-center justify-between ${locale === lang.code ? 'bg-indigo-500/10 text-indigo-400' : 'text-[#e2e8f0]'}`}
                                        >
                                            <span>{lang.nativeName}</span>
                                            <span className="text-[#64748b] text-xs uppercase">{lang.code}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {user ? (
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-semibold transition-all hover:shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                            >
                                {t("nav.dashboard")}
                                <ArrowRight size={16} />
                            </button>
                        ) : (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="text-[#94a3b8] hover:text-white px-4 py-2 rounded-xl font-semibold transition-all"
                                >
                                    {t("nav.login")}
                                </button>
                                <button
                                    onClick={() => navigate('/signup')}
                                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-semibold transition-all hover:shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                                >
                                    {t("nav.signup")}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <header className="relative py-32 text-center overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-indigo-600/10 blur-[150px] rounded-full -z-10"></div>
                <div className="absolute top-20 right-20 w-72 h-72 bg-purple-600/10 blur-[100px] rounded-full -z-10"></div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-5xl mx-auto px-6"
                >
                    <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-5 py-2 mb-8">
                        <Sparkles size={16} className="text-indigo-400" />
                        <span className="text-sm font-semibold text-indigo-300">{t("ai.assistant")}</span>
                    </div>

                    <h2 className="text-5xl md:text-7xl font-black mb-6 tracking-tight leading-tight">
                        {t("hero.title")}
                    </h2>
                    <p className="text-xl md:text-2xl text-[#94a3b8] mb-12 leading-relaxed font-light max-w-3xl mx-auto">
                        {t("hero.subtitle")}
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={handleGetStarted}
                            className="group flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all hover:shadow-[0_0_30px_rgba(79,70,229,0.4)] hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <PenTool size={20} />
                            {t("hero.cta")}
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={() => navigate('/blog')}
                            className="flex items-center gap-2 bg-[#1e293b] hover:bg-[#334155] text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all border border-[#334155]"
                        >
                            <BookOpen size={20} />
                            {t("post.readMore")}
                        </button>
                    </div>
                </motion.div>
            </header>

            <section className="max-w-7xl mx-auto px-6 py-24">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        {
                            icon: <Languages size={28} />,
                            title: "6+ Languages",
                            desc: "Write in your language, readers enjoy it in theirs. AI-powered real-time translation.",
                            gradient: "from-blue-500 to-cyan-500"
                        },
                        {
                            icon: <Sparkles size={28} />,
                            title: "AI Writing Assistant",
                            desc: "Auto-generate titles, SEO descriptions, hashtags, summaries. Switch writing tones instantly.",
                            gradient: "from-indigo-500 to-purple-500"
                        },
                        {
                            icon: <MessageSquare size={28} />,
                            title: "Global Comments",
                            desc: "Engage with readers worldwide. Comments are translated in real-time for everyone.",
                            gradient: "from-purple-500 to-pink-500"
                        }
                    ].map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: i * 0.15 }}
                            className="group bg-[#1e293b]/50 p-8 rounded-3xl border border-[#334155] hover:border-indigo-500/30 transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
                        >
                            <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                            <p className="text-[#94a3b8] leading-relaxed">{feature.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            <section className="max-w-4xl mx-auto px-6 py-16 text-center">
                <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 rounded-3xl p-12">
                    <h3 className="text-3xl font-black mb-4">Ready to start writing?</h3>
                    <p className="text-[#94a3b8] mb-8 text-lg">Join thousands of writers creating content for a global audience.</p>
                    <button
                        onClick={handleGetStarted}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all hover:shadow-[0_0_30px_rgba(79,70,229,0.4)]"
                    >
                        {t("nav.signup")} — It's Free
                    </button>
                </div>
            </section>

            <footer className="bg-[#020617] py-12 border-t border-[#1e293b]">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <BookOpen size={20} className="text-indigo-400" />
                        <span className="text-xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Blogy</span>
                    </div>
                    <p className="text-[#64748b] mb-4">{t("footer.text")}</p>
                    <div className="flex justify-center gap-4 text-xs font-medium text-[#475569]">
                        <span>AI-POWERED</span>
                        <span>•</span>
                        <span>MULTILINGUAL</span>
                        <span>•</span>
                        <span>SUPABASE</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
