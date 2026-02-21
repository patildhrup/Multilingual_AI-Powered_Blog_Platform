import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useLingo, useLingoLocale, setLingoLocale } from "lingo.dev/react/client";
import { LANGUAGES } from '../lingo/dictionary';
import { Globe, PenTool, Sparkles, MessageSquare, Languages, ArrowRight, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import LanguageSelector from '../components/LanguageSelector';

export default function Home() {
    const navigate = useNavigate();
    const { dictionary } = useLingo();
    const locale = useLingoLocale();
    const { user } = useAuth();

    const t = (key) => dictionary?.[key] || key;



    const handleGetStarted = () => {
        if (user) {
            navigate('/dashboard');
        } else {
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen bg-[#FAFAF9] text-black font-sans">
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
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
                        <LanguageSelector
                            currentLocale={locale}
                            className="w-48"
                        />

                        {user ? (
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20"
                            >
                                {t("nav.dashboard")}
                                <ArrowRight size={16} />
                            </button>
                        ) : (
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="text-black/50 hover:text-black px-4 py-2 rounded-xl font-bold transition-all"
                                >
                                    {t("nav.login")}
                                </button>
                                <button
                                    onClick={() => navigate('/signup')}
                                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20"
                                >
                                    {t("nav.signup")}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <header className="relative py-32 text-center overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-indigo-600/5 blur-[150px] rounded-full -z-10"></div>
                <div className="absolute top-20 right-20 w-72 h-72 bg-purple-600/5 blur-[100px] rounded-full -z-10"></div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-5xl mx-auto px-6"
                >
                    <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-5 py-2 mb-8 shadow-sm">
                        <Sparkles size={16} className="text-indigo-600" />
                        <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">{t("ai.assistant")}</span>
                    </div>

                    <h2 className="text-5xl md:text-8xl font-black mb-8 tracking-tighter leading-tight text-black">
                        {t("hero.title")}
                    </h2>
                    <p className="text-xl md:text-2xl text-black/50 mb-12 leading-relaxed font-medium max-w-3xl mx-auto italic">
                        {t("hero.subtitle")}
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={handleGetStarted}
                            className="group flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-2xl font-black text-lg transition-all shadow-xl shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest"
                        >
                            <PenTool size={20} />
                            {t("hero.cta")}
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={() => navigate('/blog')}
                            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-black px-10 py-5 rounded-2xl font-black text-lg transition-all border border-slate-200 shadow-sm uppercase tracking-widest"
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
                            className="group relative bg-white p-10 rounded-[2.5rem] border border-slate-100 hover:border-indigo-600/30 transition-all hover:-translate-y-2 shadow-xl shadow-slate-200/50"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-200 via-pink-200 via-blue-200 to-teal-200 opacity-0 group-hover:opacity-100 transition-opacity blur-[100px] -z-10 rounded-[2.5rem]"></div>
                            <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg group-hover:scale-110 transition-transform`}>
                                {feature.icon}
                            </div>
                            <h3 className="text-2xl font-black mb-4 text-black">{feature.title}</h3>
                            <p className="text-black/50 leading-relaxed font-medium">{feature.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            <section className="max-w-5xl mx-auto px-6 py-24 text-center">
                <div className="bg-white border border-slate-200 rounded-[3rem] p-16 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[80px] rounded-full"></div>
                    <h3 className="text-4xl md:text-5xl font-black mb-6 text-black tracking-tight italic">Ready to start writing?</h3>
                    <p className="text-black/50 mb-10 text-xl font-medium max-w-2xl mx-auto">Join thousands of writers creating content for a global audience with AI-powered tools.</p>
                    <button
                        onClick={handleGetStarted}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-[2rem] font-black text-xl transition-all shadow-2xl shadow-indigo-500/40 uppercase tracking-[0.2em]"
                    >
                        {t("nav.signup")} — It's Free
                    </button>
                </div>
            </section>

            <footer className="bg-white py-16 border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                            <BookOpen className="text-white" size={16} />
                        </div>
                        <span className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent italic">Blogy</span>
                    </div>
                    <p className="text-black/40 mb-8 font-bold uppercase tracking-widest text-[10px]">{t("footer.text")}</p>
                    <div className="flex justify-center gap-6 text-[10px] font-black text-black/20 tracking-[0.3em]">
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
