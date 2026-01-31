import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useLingo, useLingoLocale, setLingoLocale } from "lingo.dev/react/client";
import { Send, ArrowLeft, Type, AlignLeft, Languages } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BlogEditor() {
    const navigate = useNavigate();
    const { dictionary } = useLingo();
    const locale = useLingoLocale();
    const setLingoLocaleFn = setLingoLocale;
    const { user, loading: authLoading } = useAuth();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [baseLang, setBaseLang] = useState('en');
    const [loading, setLoading] = useState(false);

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/');
        }
    }, [user, authLoading, navigate]);

    const t = (key) => {
        return dictionary && dictionary[key] ? dictionary[key] : key;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            alert('You must be logged in to create a post');
            setLoading(false);
            navigate('/');
            return;
        }

        const { data, error } = await supabase
            .from('posts')
            .insert([
                {
                    title,
                    content,
                    base_lang: baseLang,
                    user_id: user.id,
                    metadata: {}
                }
            ])
            .select();

        if (error) {
            console.error('Error creating post:', error);
            alert('Failed to publish post: ' + error.message);
        } else {
            navigate(`/post/${data[0].id}`);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-[#f8fafc] font-sans">
            <nav className="border-b border-[#1e293b] bg-[#0f172a]/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
                    <button
                        onClick={() => navigate('/')}
                        className="group flex items-center gap-2 text-[#94a3b8] hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium">{t("editor.back")}</span>
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-[#1e293b] px-3 py-1.5 rounded-lg border border-[#334155]">
                            <Languages size={16} className="text-indigo-400" />
                            <select
                                value={baseLang}
                                onChange={(e) => {
                                    setBaseLang(e.target.value);
                                    setLingoLocaleFn(e.target.value);
                                }}
                                className="bg-transparent text-sm font-semibold outline-none cursor-pointer"
                            >
                                <option value="en">English (US)</option>
                                <option value="hi">Hindi (हिंदी)</option>
                                <option value="ja">Japanese (日本語)</option>
                                <option value="fr">French (Français)</option>
                                <option value="es">Spanish (Español)</option>
                            </select>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={loading || !title || !content}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20"
                        >
                            <Send size={18} />
                            {loading ? t("editor.publishing") : t("editor.publish")}
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-6 py-16">
                <form className="space-y-12">
                    <div className="relative group">
                        <Type className="absolute -left-12 top-4 text-[#334155] group-focus-within:text-indigo-500 transition-colors hidden md:block" size={32} />
                        <input
                            type="text"
                            placeholder={t("editor.titlePlaceholder")}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-transparent border-none text-5xl md:text-6xl font-black outline-none placeholder-[#1e293b] focus:placeholder-[#334155] transition-all"
                        />
                    </div>

                    <div className="relative group">
                        <AlignLeft className="absolute -left-12 top-2 text-[#334155] group-focus-within:text-indigo-500 transition-colors hidden md:block" size={32} />
                        <textarea
                            placeholder={t("editor.contentPlaceholder")}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full bg-transparent border-none text-xl md:text-2xl leading-relaxed outline-none min-h-[60vh] resize-none placeholder-[#1e293b] focus:placeholder-[#334155] transition-all"
                        />
                    </div>
                </form>
            </main>

            <div className="fixed bottom-8 right-8 text-[#334155] text-xs font-mono select-none uppercase tracking-[0.2em]">
                Draft saved locally • {baseLang.toUpperCase()} MODE
            </div>
        </div>
    );
}
